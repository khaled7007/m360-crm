package lead

import (
	"time"

	"github.com/google/uuid"
)

type Status string

const (
	StatusNew         Status = "new"
	StatusContacted   Status = "contacted"
	StatusQualified   Status = "qualified"
	StatusUnqualified Status = "unqualified"
	StatusConverted   Status = "converted"
)

type Lead struct {
	ID                uuid.UUID  `json:"id"`
	OrganizationID    *uuid.UUID `json:"organization_id"`
	ContactName       string     `json:"contact_name"`
	ContactPhone      *string    `json:"contact_phone"`
	ContactEmail      *string    `json:"contact_email"`
	CompanyName       *string    `json:"company_name"`
	Source            string     `json:"source"`
	Status            Status     `json:"status"`
	EstimatedAmount   *float64   `json:"estimated_amount"`
	Notes             *string    `json:"notes"`
	AssignedOfficerID *uuid.UUID `json:"assigned_officer_id"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type CreateRequest struct {
	ContactName     string   `json:"contact_name" validate:"required"`
	ContactPhone    *string  `json:"contact_phone"`
	ContactEmail    *string  `json:"contact_email"`
	CompanyName     *string  `json:"company_name"`
	Source          string   `json:"source" validate:"required"`
	EstimatedAmount *float64 `json:"estimated_amount"`
	Notes           *string  `json:"notes"`
}

type UpdateRequest struct {
	ContactName     *string    `json:"contact_name"`
	ContactPhone    *string    `json:"contact_phone"`
	ContactEmail    *string    `json:"contact_email"`
	CompanyName     *string    `json:"company_name"`
	Source          *string    `json:"source"`
	Status          *Status    `json:"status"`
	EstimatedAmount *float64   `json:"estimated_amount"`
	Notes           *string    `json:"notes"`
	OrganizationID  *uuid.UUID `json:"organization_id"`
}

type ListParams struct {
	Status          *Status
	AssignedOfficer *uuid.UUID
	Search          string
	Limit           int
	Offset          int
}
