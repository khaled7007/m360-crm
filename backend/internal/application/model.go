package application

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusDraft              Status = "draft"
	StatusSubmitted          Status = "submitted"
	StatusPreApproved        Status = "pre_approved"
	StatusDocsCollected      Status = "documents_collected"
	StatusCreditAssessment   Status = "credit_assessment"
	StatusCommitteeReview    Status = "committee_review"
	StatusApproved           Status = "approved"
	StatusRejected           Status = "rejected"
	StatusDisbursed          Status = "disbursed"
)

var validTransitions = map[Status][]Status{
	StatusDraft:            {StatusSubmitted},
	StatusSubmitted:        {StatusPreApproved, StatusRejected},
	StatusPreApproved:      {StatusDocsCollected, StatusRejected},
	StatusDocsCollected:    {StatusCreditAssessment},
	StatusCreditAssessment: {StatusCommitteeReview},
	StatusCommitteeReview:  {StatusApproved, StatusRejected},
	StatusApproved:         {StatusDisbursed},
}

func CanTransition(from, to Status) bool {
	targets, ok := validTransitions[from]
	if !ok {
		return false
	}
	for _, t := range targets {
		if t == to {
			return true
		}
	}
	return false
}

type Application struct {
	ID                uuid.UUID  `json:"id"`
	ReferenceNumber   string     `json:"reference_number"`
	OrganizationID    uuid.UUID  `json:"organization_id"`
	ProductID         uuid.UUID  `json:"product_id"`
	RequestedAmount   float64    `json:"requested_amount"`
	ApprovedAmount    *float64   `json:"approved_amount"`
	TenorMonths       int        `json:"tenor_months"`
	ProfitRate        *float64   `json:"profit_rate"`
	Purpose           *string    `json:"purpose"`
	Status            Status     `json:"status"`
	AssignedOfficerID *uuid.UUID `json:"assigned_officer_id"`
	CreditAnalystID   *uuid.UUID `json:"credit_analyst_id"`
	ComplianceOfficerID *uuid.UUID `json:"compliance_officer_id"`
	PreApprovalDate   *time.Time `json:"pre_approval_date"`
	ApprovalDate      *time.Time `json:"approval_date"`
	RejectionReason   *string    `json:"rejection_reason"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type CreateRequest struct {
	OrganizationID  uuid.UUID `json:"organization_id" validate:"required"`
	ProductID       uuid.UUID `json:"product_id" validate:"required"`
	RequestedAmount float64   `json:"requested_amount" validate:"required"`
	TenorMonths     int       `json:"tenor_months" validate:"required"`
	Purpose         *string   `json:"purpose"`
}

type UpdateStatusRequest struct {
	Status          Status   `json:"status" validate:"required"`
	ApprovedAmount  *float64 `json:"approved_amount"`
	ProfitRate      *float64 `json:"profit_rate"`
	RejectionReason *string  `json:"rejection_reason"`
}

type ListParams struct {
	Status          *Status
	OrganizationID  *uuid.UUID
	AssignedOfficer *uuid.UUID
	Search          string
	Limit           int
	Offset          int
}
