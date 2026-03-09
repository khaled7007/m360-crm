package organization

import (
	"time"

	"github.com/google/uuid"
)

type Organization struct {
	ID                uuid.UUID  `json:"id"`
	NameEN            string     `json:"name_en"`
	NameAR            string     `json:"name_ar"`
	CRNumber          *string    `json:"cr_number"`
	CRVerified        bool       `json:"cr_verified"`
	TaxID             *string    `json:"tax_id"`
	Industry          *string    `json:"industry"`
	LegalStructure    *string    `json:"legal_structure"`
	FoundingDate      *time.Time `json:"founding_date"`
	AddressEN         *string    `json:"address_en"`
	AddressAR         *string    `json:"address_ar"`
	City              *string    `json:"city"`
	Phone             *string    `json:"phone"`
	Email             *string    `json:"email"`
	Website           *string    `json:"website"`
	AssignedOfficerID *uuid.UUID `json:"assigned_officer_id"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

type CreateRequest struct {
	NameEN         string  `json:"name_en" validate:"required"`
	NameAR         string  `json:"name_ar"`
	CRNumber       *string `json:"cr_number"`
	TaxID          *string `json:"tax_id"`
	Industry       *string `json:"industry"`
	LegalStructure *string `json:"legal_structure"`
	AddressEN      *string `json:"address_en"`
	AddressAR      *string `json:"address_ar"`
	City           *string `json:"city"`
	Phone          *string `json:"phone"`
	Email          *string `json:"email"`
	Website        *string `json:"website"`
}

type UpdateRequest struct {
	NameEN         *string `json:"name_en"`
	NameAR         *string `json:"name_ar"`
	CRNumber       *string `json:"cr_number"`
	TaxID          *string `json:"tax_id"`
	Industry       *string `json:"industry"`
	LegalStructure *string `json:"legal_structure"`
	AddressEN      *string `json:"address_en"`
	AddressAR      *string `json:"address_ar"`
	City           *string `json:"city"`
	Phone          *string `json:"phone"`
	Email          *string `json:"email"`
	Website        *string `json:"website"`
}

type ListParams struct {
	Search          string
	AssignedOfficer *uuid.UUID
	Limit           int
	Offset          int
}
