package contact

import (
	"time"

	"github.com/google/uuid"
)

type Contact struct {
	ID             uuid.UUID `json:"id"`
	OrganizationID uuid.UUID `json:"organization_id"`
	NameEN         string    `json:"name_en"`
	NameAR         string    `json:"name_ar"`
	NationalID     *string   `json:"national_id"`
	Role           *string   `json:"role"`
	Phone          *string   `json:"phone"`
	Email          *string   `json:"email"`
	NafathVerified bool      `json:"nafath_verified"`
	SIMAHScore     *int      `json:"simah_score"`
	IsGuarantor    bool      `json:"is_guarantor"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type CreateRequest struct {
	OrganizationID uuid.UUID `json:"organization_id" validate:"required"`
	NameEN         string    `json:"name_en" validate:"required"`
	NameAR         string    `json:"name_ar"`
	NationalID     *string   `json:"national_id"`
	Role           *string   `json:"role"`
	Phone          *string   `json:"phone"`
	Email          *string   `json:"email"`
	IsGuarantor    bool      `json:"is_guarantor"`
}

type UpdateRequest struct {
	NameEN      *string `json:"name_en"`
	NameAR      *string `json:"name_ar"`
	NationalID  *string `json:"national_id"`
	Role        *string `json:"role"`
	Phone       *string `json:"phone"`
	Email       *string `json:"email"`
	IsGuarantor *bool   `json:"is_guarantor"`
}
