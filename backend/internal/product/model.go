package product

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Product struct {
	ID                  uuid.UUID       `json:"id"`
	NameEN              string          `json:"name_en"`
	NameAR              string          `json:"name_ar"`
	Type                string          `json:"type"`
	MinAmount           float64         `json:"min_amount"`
	MaxAmount           float64         `json:"max_amount"`
	MinTenorMonths      int             `json:"min_tenor_months"`
	MaxTenorMonths      int             `json:"max_tenor_months"`
	ProfitRate          float64         `json:"profit_rate"`
	AdminFeePct         float64         `json:"admin_fee_pct"`
	PaymentFrequency    string          `json:"payment_frequency"`
	EligibilityCriteria json.RawMessage `json:"eligibility_criteria"`
	RequiredDocuments   json.RawMessage `json:"required_documents"`
	IsActive            bool            `json:"is_active"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
}

type CreateRequest struct {
	NameEN           string          `json:"name_en" validate:"required"`
	NameAR           string          `json:"name_ar"`
	Type             string          `json:"type"`
	MinAmount        float64         `json:"min_amount"`
	MaxAmount        float64         `json:"max_amount"`
	MinTenorMonths   int             `json:"min_tenor_months"`
	MaxTenorMonths   int             `json:"max_tenor_months"`
	ProfitRate       float64         `json:"profit_rate"`
	AdminFeePct      float64         `json:"admin_fee_pct"`
	PaymentFrequency string          `json:"payment_frequency"`
	RequiredDocuments json.RawMessage `json:"required_documents"`
}

type UpdateRequest struct {
	NameEN           *string  `json:"name_en"`
	NameAR           *string  `json:"name_ar"`
	MinAmount        *float64 `json:"min_amount"`
	MaxAmount        *float64 `json:"max_amount"`
	ProfitRate       *float64 `json:"profit_rate"`
	AdminFeePct      *float64 `json:"admin_fee_pct"`
	IsActive         *bool    `json:"is_active"`
}
