package facility

import (
	"time"

	"github.com/google/uuid"
)

// Facility represents a post-disbursement facility
type Facility struct {
	ID                 uuid.UUID `json:"id"`
	ReferenceNumber    string    `json:"reference_number"`
	ApplicationID      uuid.UUID `json:"application_id"`
	OrganizationID     uuid.UUID `json:"organization_id"`
	ProductID          uuid.UUID `json:"product_id"`
	PrincipalAmount    float64   `json:"principal_amount"`
	ProfitAmount       float64   `json:"profit_amount"`
	TotalAmount        float64   `json:"total_amount"`
	OutstandingBalance float64   `json:"outstanding_balance"`
	ProfitRate         float64   `json:"profit_rate"`
	TenorMonths        int       `json:"tenor_months"`
	PaymentFrequency   string    `json:"payment_frequency"` // monthly, quarterly, etc.
	DisbursementDate   time.Time `json:"disbursement_date"`
	MaturityDate       time.Time `json:"maturity_date"`
	Status             string    `json:"status"`             // active, closed, defaulted, restructured
	Delinquency        string    `json:"delinquency"`        // current, par_30, par_60, par_90, par_180, write_off
	AssignedOfficerID  uuid.UUID `json:"assigned_officer_id"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// RepaymentScheduleItem represents a single repayment installment
type RepaymentScheduleItem struct {
	ID               uuid.UUID `json:"id"`
	FacilityID       uuid.UUID `json:"facility_id"`
	InstallmentNumber int       `json:"installment_number"`
	DueDate          time.Time `json:"due_date"`
	PrincipalAmount  float64   `json:"principal_amount"`
	ProfitAmount     float64   `json:"profit_amount"`
	TotalAmount      float64   `json:"total_amount"`
	PaidAmount       float64   `json:"paid_amount"`
	PaidDate         *time.Time `json:"paid_date"`
	IsPaid           bool      `json:"is_paid"`
	IsOverdue        bool      `json:"is_overdue"`
	CreatedAt        time.Time `json:"created_at"`
}

// CreateRequest represents the request to create a new facility
type CreateRequest struct {
	ApplicationID    uuid.UUID `json:"application_id" validate:"required"`
	OrganizationID   uuid.UUID `json:"organization_id" validate:"required"`
	ProductID        uuid.UUID `json:"product_id" validate:"required"`
	PrincipalAmount  float64   `json:"principal_amount" validate:"required,gt=0"`
	ProfitAmount     float64   `json:"profit_amount" validate:"required,gte=0"`
	TenorMonths      int       `json:"tenor_months" validate:"required,gt=0"`
	PaymentFrequency string    `json:"payment_frequency" validate:"required"`
	DisbursementDate time.Time `json:"disbursement_date" validate:"required"`
}

// ListParams represents parameters for listing facilities
type ListParams struct {
	Status         string `query:"status"`
	OrganizationID uuid.UUID `query:"organization_id"`
	Delinquency    string `query:"delinquency"`
	Limit          int    `query:"limit"`
	Offset         int    `query:"offset"`
}

// RecordPaymentRequest represents a payment recording request
type RecordPaymentRequest struct {
	InstallmentNumber int       `json:"installment_number" validate:"required,gt=0"`
	PaidAmount        float64   `json:"paid_amount" validate:"required,gt=0"`
	PaymentDate       time.Time `json:"payment_date" validate:"required"`
}
