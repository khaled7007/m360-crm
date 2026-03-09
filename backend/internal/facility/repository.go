package facility

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles database operations for facilities
type Repository struct {
	pool *pgxpool.Pool
}

// NewRepository creates a new facility repository
func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

// Create inserts a new facility into the database
func (r *Repository) Create(ctx context.Context, facility *Facility) error {
	query := `
		INSERT INTO facilities (
			id, reference_number, application_id, organization_id, product_id,
			principal_amount, profit_amount, total_amount, outstanding_balance,
			profit_rate, tenor_months, payment_frequency, disbursement_date,
			maturity_date, status, delinquency, assigned_officer_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
		)
		RETURNING created_at, updated_at
	`

	err := r.pool.QueryRow(ctx, query,
		facility.ID,
		facility.ReferenceNumber,
		facility.ApplicationID,
		facility.OrganizationID,
		facility.ProductID,
		facility.PrincipalAmount,
		facility.ProfitAmount,
		facility.TotalAmount,
		facility.OutstandingBalance,
		facility.ProfitRate,
		facility.TenorMonths,
		facility.PaymentFrequency,
		facility.DisbursementDate,
		facility.MaturityDate,
		facility.Status,
		facility.Delinquency,
		facility.AssignedOfficerID,
		time.Now(),
		time.Now(),
	).Scan(&facility.CreatedAt, &facility.UpdatedAt)

	return err
}

// GetByID retrieves a facility by its ID
func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Facility, error) {
	query := `
		SELECT id, reference_number, application_id, organization_id, product_id,
			principal_amount, profit_amount, total_amount, outstanding_balance,
			profit_rate, tenor_months, payment_frequency, disbursement_date,
			maturity_date, status, delinquency, assigned_officer_id, created_at, updated_at
		FROM facilities
		WHERE id = $1
	`

	facility := &Facility{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&facility.ID,
		&facility.ReferenceNumber,
		&facility.ApplicationID,
		&facility.OrganizationID,
		&facility.ProductID,
		&facility.PrincipalAmount,
		&facility.ProfitAmount,
		&facility.TotalAmount,
		&facility.OutstandingBalance,
		&facility.ProfitRate,
		&facility.TenorMonths,
		&facility.PaymentFrequency,
		&facility.DisbursementDate,
		&facility.MaturityDate,
		&facility.Status,
		&facility.Delinquency,
		&facility.AssignedOfficerID,
		&facility.CreatedAt,
		&facility.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return facility, nil
}

// List retrieves facilities with optional filters
func (r *Repository) List(ctx context.Context, params ListParams) ([]*Facility, int64, error) {
	// Build the WHERE clause dynamically
	query := "SELECT id, reference_number, application_id, organization_id, product_id, principal_amount, profit_amount, total_amount, outstanding_balance, profit_rate, tenor_months, payment_frequency, disbursement_date, maturity_date, status, delinquency, assigned_officer_id, created_at, updated_at FROM facilities WHERE 1=1"
	countQuery := "SELECT COUNT(*) FROM facilities WHERE 1=1"
	args := []interface{}{}
	countArgs := []interface{}{}
	argCount := 1

	if params.Status != "" {
		query += fmt.Sprintf(" AND status = $%d", argCount)
		countQuery += fmt.Sprintf(" AND status = $%d", argCount)
		args = append(args, params.Status)
		countArgs = append(countArgs, params.Status)
		argCount++
	}

	if params.OrganizationID != uuid.Nil {
		query += fmt.Sprintf(" AND organization_id = $%d", argCount)
		countQuery += fmt.Sprintf(" AND organization_id = $%d", argCount)
		args = append(args, params.OrganizationID)
		countArgs = append(countArgs, params.OrganizationID)
		argCount++
	}

	if params.Delinquency != "" {
		query += fmt.Sprintf(" AND delinquency = $%d", argCount)
		countQuery += fmt.Sprintf(" AND delinquency = $%d", argCount)
		args = append(args, params.Delinquency)
		countArgs = append(countArgs, params.Delinquency)
		argCount++
	}

	// Get total count
	var totalCount int64
	err := r.pool.QueryRow(ctx, countQuery, countArgs...).Scan(&totalCount)
	if err != nil {
		return nil, 0, err
	}

	// Add ordering and pagination
	query += " ORDER BY created_at DESC"
	if params.Limit == 0 {
		params.Limit = 20 // default limit
	}
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argCount, argCount+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	facilities := []*Facility{}
	for rows.Next() {
		facility := &Facility{}
		err := rows.Scan(
			&facility.ID,
			&facility.ReferenceNumber,
			&facility.ApplicationID,
			&facility.OrganizationID,
			&facility.ProductID,
			&facility.PrincipalAmount,
			&facility.ProfitAmount,
			&facility.TotalAmount,
			&facility.OutstandingBalance,
			&facility.ProfitRate,
			&facility.TenorMonths,
			&facility.PaymentFrequency,
			&facility.DisbursementDate,
			&facility.MaturityDate,
			&facility.Status,
			&facility.Delinquency,
			&facility.AssignedOfficerID,
			&facility.CreatedAt,
			&facility.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		facilities = append(facilities, facility)
	}

	return facilities, totalCount, rows.Err()
}

// CreateSchedule creates repayment schedule items in batch
func (r *Repository) CreateSchedule(ctx context.Context, items []*RepaymentScheduleItem) error {
	if len(items) == 0 {
		return nil
	}

	query := `
		INSERT INTO repayment_schedule_items (
			id, facility_id, installment_number, due_date, principal_amount,
			profit_amount, total_amount, paid_amount, paid_date, is_paid, is_overdue, created_at
		) VALUES
	`

	args := []interface{}{}
	for i, item := range items {
		if i > 0 {
			query += ", "
		}
		query += fmt.Sprintf("($%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d, $%d)",
			i*12+1, i*12+2, i*12+3, i*12+4, i*12+5, i*12+6, i*12+7, i*12+8, i*12+9, i*12+10, i*12+11, i*12+12,
		)
		args = append(args,
			item.ID,
			item.FacilityID,
			item.InstallmentNumber,
			item.DueDate,
			item.PrincipalAmount,
			item.ProfitAmount,
			item.TotalAmount,
			item.PaidAmount,
			item.PaidDate,
			item.IsPaid,
			item.IsOverdue,
			time.Now(),
		)
	}

	_, err := r.pool.Exec(ctx, query, args...)
	return err
}

// GetSchedule retrieves the repayment schedule for a facility
func (r *Repository) GetSchedule(ctx context.Context, facilityID uuid.UUID) ([]*RepaymentScheduleItem, error) {
	query := `
		SELECT id, facility_id, installment_number, due_date, principal_amount,
			profit_amount, total_amount, paid_amount, paid_date, is_paid, is_overdue, created_at
		FROM repayment_schedule_items
		WHERE facility_id = $1
		ORDER BY installment_number ASC
	`

	rows, err := r.pool.Query(ctx, query, facilityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []*RepaymentScheduleItem{}
	for rows.Next() {
		item := &RepaymentScheduleItem{}
		err := rows.Scan(
			&item.ID,
			&item.FacilityID,
			&item.InstallmentNumber,
			&item.DueDate,
			&item.PrincipalAmount,
			&item.ProfitAmount,
			&item.TotalAmount,
			&item.PaidAmount,
			&item.PaidDate,
			&item.IsPaid,
			&item.IsOverdue,
			&item.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	return items, rows.Err()
}

// GetScheduleItem retrieves a single repayment schedule item
func (r *Repository) GetScheduleItem(ctx context.Context, facilityID uuid.UUID, installmentNumber int) (*RepaymentScheduleItem, error) {
	query := `
		SELECT id, facility_id, installment_number, due_date, principal_amount,
			profit_amount, total_amount, paid_amount, paid_date, is_paid, is_overdue, created_at
		FROM repayment_schedule_items
		WHERE facility_id = $1 AND installment_number = $2
	`

	item := &RepaymentScheduleItem{}
	err := r.pool.QueryRow(ctx, query, facilityID, installmentNumber).Scan(
		&item.ID,
		&item.FacilityID,
		&item.InstallmentNumber,
		&item.DueDate,
		&item.PrincipalAmount,
		&item.ProfitAmount,
		&item.TotalAmount,
		&item.PaidAmount,
		&item.PaidDate,
		&item.IsPaid,
		&item.IsOverdue,
		&item.CreatedAt,
	)

	return item, err
}

// RecordPayment updates a repayment item with payment information
func (r *Repository) RecordPayment(ctx context.Context, facilityID uuid.UUID, installmentNumber int, paidAmount float64, paidDate time.Time) error {
	query := `
		UPDATE repayment_schedule_items
		SET paid_amount = $1, paid_date = $2, is_paid = true, is_overdue = false
		WHERE facility_id = $3 AND installment_number = $4
	`

	_, err := r.pool.Exec(ctx, query, paidAmount, paidDate, facilityID, installmentNumber)
	return err
}

// UpdateOutstandingBalance updates the outstanding balance for a facility
func (r *Repository) UpdateOutstandingBalance(ctx context.Context, facilityID uuid.UUID, newBalance float64) error {
	query := `
		UPDATE facilities
		SET outstanding_balance = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := r.pool.Exec(ctx, query, newBalance, time.Now(), facilityID)
	return err
}

// UpdateStatus updates the status of a facility
func (r *Repository) UpdateStatus(ctx context.Context, facilityID uuid.UUID, status string) error {
	query := `
		UPDATE facilities
		SET status = $1, updated_at = $2
		WHERE id = $3
	`

	_, err := r.pool.Exec(ctx, query, status, time.Now(), facilityID)
	return err
}
