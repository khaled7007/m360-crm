package collection

import (
	"time"

	"github.com/google/uuid"
)

// CollectionAction represents a collection action on a facility
type CollectionAction struct {
	ID             uuid.UUID  `json:"id"`
	FacilityID     uuid.UUID  `json:"facility_id"`
	OfficerID      uuid.UUID  `json:"officer_id"`
	ActionType     string     `json:"action_type"`
	Description    *string    `json:"description"`
	NextActionDate *time.Time `json:"next_action_date"`
	CreatedAt      time.Time  `json:"created_at"`
}

// CreateRequest represents the request payload for creating a collection action
type CreateRequest struct {
	FacilityID     uuid.UUID `json:"facility_id" validate:"required"`
	ActionType     string    `json:"action_type" validate:"required,oneof=phone_call site_visit letter legal_notice sms_reminder formal_notice restructuring"`
	Description    *string   `json:"description"`
	NextActionDate *string   `json:"next_action_date"`
}

// ListParams represents the parameters for listing collection actions
type ListParams struct {
	FacilityID *uuid.UUID
	OfficerID  *uuid.UUID
	Limit      int
	Offset     int
}

// OverdueFacility represents an overdue facility with collection summary
type OverdueFacility struct {
	ID                  uuid.UUID `json:"id"`
	FacilityNumber      string    `json:"facility_number"`
	BorrowerName        string    `json:"borrower_name"`
	OverdueAmount       float64   `json:"overdue_amount"`
	DaysOverdue         int       `json:"days_overdue"`
	LastCollectionDate  *time.Time `json:"last_collection_date"`
	CollectionCount     int       `json:"collection_count"`
}

// OverdueSummary represents the summary of overdue facilities
type OverdueSummary struct {
	TotalOverdueFacilities int               `json:"total_overdue_facilities"`
	OverdueFacilities      []OverdueFacility `json:"overdue_facilities"`
}
