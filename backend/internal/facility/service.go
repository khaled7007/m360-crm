package facility

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/CamelLabSA/M360/backend/internal/notification"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Service handles business logic for facilities
type Service struct {
	repo     *Repository
	notifSvc *notification.Service
}

// NewService creates a new facility service
func NewService(pool *pgxpool.Pool, notifSvc *notification.Service) *Service {
	return &Service{
		repo:     NewRepository(pool),
		notifSvc: notifSvc,
	}
}

// Create creates a new facility with auto-generated repayment schedule
func (s *Service) Create(ctx context.Context, req *CreateRequest) (*Facility, error) {
	// Generate reference number: FAC-YYMM-NNNN
	now := time.Now()
	refNumber := fmt.Sprintf("FAC-%02d%02d-%04d", now.Year()%100, now.Month(), uuid.New().ID()%10000)

	// Create facility
	facility := &Facility{
		ID:                uuid.New(),
		ReferenceNumber:   refNumber,
		ApplicationID:     req.ApplicationID,
		OrganizationID:    req.OrganizationID,
		ProductID:         req.ProductID,
		PrincipalAmount:   req.PrincipalAmount,
		ProfitAmount:      req.ProfitAmount,
		TotalAmount:       req.PrincipalAmount + req.ProfitAmount,
		OutstandingBalance: req.PrincipalAmount + req.ProfitAmount,
		ProfitRate:        (req.ProfitAmount / req.PrincipalAmount) * 100,
		TenorMonths:       req.TenorMonths,
		PaymentFrequency:  req.PaymentFrequency,
		DisbursementDate:  req.DisbursementDate,
		MaturityDate:      calculateMaturityDate(req.DisbursementDate, req.TenorMonths),
		Status:            "active",
		Delinquency:       "current",
		AssignedOfficerID: uuid.Nil, // Will be assigned separately
	}

	// Save facility
	if err := s.repo.Create(ctx, facility); err != nil {
		return nil, fmt.Errorf("failed to create facility: %w", err)
	}

	// Generate and save repayment schedule
	scheduleItems := s.generateRepaymentSchedule(facility)
	if err := s.repo.CreateSchedule(ctx, scheduleItems); err != nil {
		return nil, fmt.Errorf("failed to create repayment schedule: %w", err)
	}

	return facility, nil
}

// GetByID retrieves a facility by ID
func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Facility, error) {
	facility, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get facility: %w", err)
	}
	return facility, nil
}

// List retrieves facilities with optional filters
func (s *Service) List(ctx context.Context, params ListParams) ([]*Facility, int64, error) {
	facilities, total, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list facilities: %w", err)
	}
	return facilities, total, nil
}

// GetSchedule retrieves the repayment schedule for a facility
func (s *Service) GetSchedule(ctx context.Context, facilityID uuid.UUID) ([]*RepaymentScheduleItem, error) {
	schedule, err := s.repo.GetSchedule(ctx, facilityID)
	if err != nil {
		return nil, fmt.Errorf("failed to get repayment schedule: %w", err)
	}
	return schedule, nil
}

// RecordPayment records a payment for a facility installment
func (s *Service) RecordPayment(ctx context.Context, facilityID uuid.UUID, req *RecordPaymentRequest) error {
	// Get the facility to ensure it exists
	facility, err := s.repo.GetByID(ctx, facilityID)
	if err != nil {
		return fmt.Errorf("facility not found: %w", err)
	}

	// Verify schedule item exists
	if _, err := s.repo.GetScheduleItem(ctx, facilityID, req.InstallmentNumber); err != nil {
		return fmt.Errorf("schedule item not found: %w", err)
	}

	// Record the payment
	if err := s.repo.RecordPayment(ctx, facilityID, req.InstallmentNumber, req.PaidAmount, req.PaymentDate); err != nil {
		return fmt.Errorf("failed to record payment: %w", err)
	}

	// Update facility's outstanding balance
	newBalance := facility.OutstandingBalance - req.PaidAmount
	if newBalance < 0 {
		newBalance = 0
	}

	if err := s.repo.UpdateOutstandingBalance(ctx, facilityID, newBalance); err != nil {
		return fmt.Errorf("failed to update outstanding balance: %w", err)
	}

	// Check if all installments are paid, if so close the facility
	schedule, err := s.repo.GetSchedule(ctx, facilityID)
	if err != nil {
		return fmt.Errorf("failed to check schedule completion: %w", err)
	}

	allPaid := true
	overdueCount := 0
	now := time.Now()
	for _, schedItem := range schedule {
		if !schedItem.IsPaid {
			allPaid = false
			if schedItem.DueDate.Before(now) {
				overdueCount++
			}
		}
	}

	if allPaid {
		if err := s.repo.UpdateStatus(ctx, facilityID, "closed"); err != nil {
			return fmt.Errorf("failed to update facility status: %w", err)
		}
		// Notify officer that facility is fully paid
		s.sendFacilityNotification(ctx, facility, "Facility Fully Paid",
			fmt.Sprintf("Facility %s has been fully paid and closed", facility.ReferenceNumber),
			"payment_complete")
	} else if overdueCount > 0 {
		// Notify officer about overdue installments
		s.sendFacilityNotification(ctx, facility, "Overdue Payment Alert",
			fmt.Sprintf("Facility %s has %d overdue installment(s)", facility.ReferenceNumber, overdueCount),
			"payment_overdue")
	}

	return nil
}

// sendFacilityNotification sends a notification to the facility's assigned officer
func (s *Service) sendFacilityNotification(ctx context.Context, facility *Facility, title, body, notifType string) {
	if s.notifSvc == nil || facility.AssignedOfficerID == uuid.Nil {
		return
	}
	entityType := "facility"
	facilityID := facility.ID
	notifReq := &notification.CreateRequest{
		UserID:     facility.AssignedOfficerID,
		Title:      title,
		Body:       &body,
		Type:       notifType,
		EntityType: &entityType,
		EntityID:   &facilityID,
	}
	if _, err := s.notifSvc.Send(ctx, notifReq); err != nil {
		log.Printf("failed to send facility notification for %s: %v", facility.ID, err)
	}
}

// generateRepaymentSchedule generates equal installment repayment schedule
func (s *Service) generateRepaymentSchedule(facility *Facility) []*RepaymentScheduleItem {
	items := make([]*RepaymentScheduleItem, 0, facility.TenorMonths)

	// Calculate equal installment amounts
	principalPerInstallment := facility.PrincipalAmount / float64(facility.TenorMonths)
	profitPerInstallment := facility.ProfitAmount / float64(facility.TenorMonths)
	totalPerInstallment := principalPerInstallment + profitPerInstallment

	// Generate installment dates based on payment frequency
	currentDate := facility.DisbursementDate

	for i := 1; i <= facility.TenorMonths; i++ {
		dueDate := getNextDueDate(currentDate, facility.PaymentFrequency)

		// Adjust for last installment to account for rounding
		principal := principalPerInstallment
		profit := profitPerInstallment
		total := totalPerInstallment

		if i == facility.TenorMonths {
			// Last installment gets any remainder
			principal = facility.PrincipalAmount - (principalPerInstallment * float64(i-1))
			profit = facility.ProfitAmount - (profitPerInstallment * float64(i-1))
			total = principal + profit
		}

		item := &RepaymentScheduleItem{
			ID:                uuid.New(),
			FacilityID:        facility.ID,
			InstallmentNumber: i,
			DueDate:           dueDate,
			PrincipalAmount:   roundToTwoDecimals(principal),
			ProfitAmount:      roundToTwoDecimals(profit),
			TotalAmount:       roundToTwoDecimals(total),
			PaidAmount:        0,
			PaidDate:          nil,
			IsPaid:            false,
			IsOverdue:         false,
		}

		items = append(items, item)
		currentDate = dueDate
	}

	return items
}

// calculateMaturityDate calculates the maturity date based on tenor months
func calculateMaturityDate(startDate time.Time, tenorMonths int) time.Time {
	return startDate.AddDate(0, tenorMonths, 0)
}

// getNextDueDate calculates the next due date based on payment frequency
func getNextDueDate(currentDate time.Time, frequency string) time.Time {
	switch frequency {
	case "monthly":
		return currentDate.AddDate(0, 1, 0)
	case "quarterly":
		return currentDate.AddDate(0, 3, 0)
	case "semi-annual":
		return currentDate.AddDate(0, 6, 0)
	case "annual":
		return currentDate.AddDate(1, 0, 0)
	default:
		return currentDate.AddDate(0, 1, 0) // default to monthly
	}
}

// roundToTwoDecimals rounds a float to 2 decimal places
func roundToTwoDecimals(value float64) float64 {
	return math.Round(value*100) / 100
}
