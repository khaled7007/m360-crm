package credit

import (
	"time"

	"github.com/google/uuid"
)

type RiskGrade string

const (
	GradeAA RiskGrade = "AA"
	GradeA  RiskGrade = "A"
	GradeBB RiskGrade = "BB"
	GradeB  RiskGrade = "B"
	GradeCC RiskGrade = "CC"
	GradeC  RiskGrade = "C"
	GradeF  RiskGrade = "F"
)

type AssessmentStatus string

const (
	StatusDraft    AssessmentStatus = "draft"
	StatusScored   AssessmentStatus = "scored"
	StatusApproved AssessmentStatus = "approved"
	StatusReferred AssessmentStatus = "referred"
	StatusDeclined AssessmentStatus = "declined"
)

type Assessment struct {
	ID               uuid.UUID        `json:"id"`
	OrganizationID   uuid.UUID        `json:"organization_id"`
	OrganizationName string           `json:"organization_name,omitempty"`
	ApplicationID    *uuid.UUID       `json:"application_id"`
	CreatedBy        uuid.UUID        `json:"created_by"`

	// Category 1: Company Information (5%)
	BusinessActivity      string `json:"business_activity"`
	EntityType            string `json:"entity_type"`
	EntityLocation        string `json:"entity_location"`
	YearsInBusiness       string `json:"years_in_business"`
	IncomeDiversification string `json:"income_diversification"`

	// Category 2: Financial Statements (20%)
	AuditedFinancials  bool    `json:"audited_financials"`
	TotalRevenue       float64 `json:"total_revenue"`
	OperatingCashFlow  float64 `json:"operating_cash_flow"`
	CurrentLiabilities float64 `json:"current_liabilities"`
	NetProfit          float64 `json:"net_profit"`
	OperatingProfit    float64 `json:"operating_profit"`
	FinanceCosts       float64 `json:"finance_costs"`
	TotalAssets        float64 `json:"total_assets"`
	CurrentAssets      float64 `json:"current_assets"`

	// Category 3: Credit History (20%)
	CreditRecord     string `json:"credit_record"`
	PaymentBehavior  string `json:"payment_behavior"`
	PaymentDelays    string `json:"payment_delays"`
	NumDelays        string `json:"num_delays"`
	DelayRatio       string `json:"delay_ratio"`
	FinancingDefault string `json:"financing_default"`
	NumDefaults      string `json:"num_defaults"`
	DefaultRatio     string `json:"default_ratio"`
	BouncedChecks    string `json:"bounced_checks"`
	Lawsuits         string `json:"lawsuits"`

	// Category 4: Project Feasibility (50%)
	ProjectLocation         string  `json:"project_location"`
	HasProjectPlan          bool    `json:"has_project_plan"`
	HasInsurance            bool    `json:"has_insurance"`
	ProjectType             string  `json:"project_type"`
	EngineeringFirmClass    string  `json:"engineering_firm_class"`
	FeasibilityStudyQuality string  `json:"feasibility_study_quality"`
	ProjectNetProfit        float64 `json:"project_net_profit"`
	ProjectTotalCost        float64 `json:"project_total_cost"`
	PreviousProjectsCount   string  `json:"previous_projects_count"`

	// Category 5: Collateral (5%)
	PropertyLocation string  `json:"property_location"`
	PropertyType     string  `json:"property_type"`
	PropertyUsage    string  `json:"property_usage"`
	Appraisal1       float64 `json:"appraisal_1"`
	Appraisal2       float64 `json:"appraisal_2"`
	FinancingAmount  float64 `json:"financing_amount"`

	Status    AssessmentStatus `json:"status"`
	Notes     *string          `json:"notes"`
	CreatedAt time.Time        `json:"created_at"`
	UpdatedAt time.Time        `json:"updated_at"`

	Score *Score `json:"score,omitempty"`
}

type Score struct {
	ID               uuid.UUID       `json:"id"`
	AssessmentID     uuid.UUID       `json:"assessment_id"`
	ScorecardVersion string          `json:"scorecard_version"`
	TotalScore       float64         `json:"total_score"`
	RiskGrade        RiskGrade       `json:"risk_grade"`
	Recommendation   string          `json:"recommendation"`
	ScoredAt         time.Time       `json:"scored_at"`
	Factors          []ScoringFactor `json:"factors,omitempty"`
}

type ScoringFactor struct {
	ID            uuid.UUID `json:"id"`
	CreditScoreID uuid.UUID `json:"credit_score_id"`
	Category      string    `json:"category"`
	FactorName    string    `json:"factor_name"`
	RawScore      int       `json:"raw_score"`
	Weight        float64   `json:"weight"`
	WeightedScore float64   `json:"weighted_score"`
}

type CreateRequest struct {
	OrganizationID uuid.UUID  `json:"organization_id" validate:"required"`
	ApplicationID  *uuid.UUID `json:"application_id"`

	BusinessActivity      string `json:"business_activity"`
	EntityType            string `json:"entity_type"`
	EntityLocation        string `json:"entity_location"`
	YearsInBusiness       string `json:"years_in_business"`
	IncomeDiversification string `json:"income_diversification"`

	AuditedFinancials  bool    `json:"audited_financials"`
	TotalRevenue       float64 `json:"total_revenue"`
	OperatingCashFlow  float64 `json:"operating_cash_flow"`
	CurrentLiabilities float64 `json:"current_liabilities"`
	NetProfit          float64 `json:"net_profit"`
	OperatingProfit    float64 `json:"operating_profit"`
	FinanceCosts       float64 `json:"finance_costs"`
	TotalAssets        float64 `json:"total_assets"`
	CurrentAssets      float64 `json:"current_assets"`

	CreditRecord     string `json:"credit_record"`
	PaymentBehavior  string `json:"payment_behavior"`
	PaymentDelays    string `json:"payment_delays"`
	NumDelays        string `json:"num_delays"`
	DelayRatio       string `json:"delay_ratio"`
	FinancingDefault string `json:"financing_default"`
	NumDefaults      string `json:"num_defaults"`
	DefaultRatio     string `json:"default_ratio"`
	BouncedChecks    string `json:"bounced_checks"`
	Lawsuits         string `json:"lawsuits"`

	ProjectLocation         string  `json:"project_location"`
	HasProjectPlan          bool    `json:"has_project_plan"`
	HasInsurance            bool    `json:"has_insurance"`
	ProjectType             string  `json:"project_type"`
	EngineeringFirmClass    string  `json:"engineering_firm_class"`
	FeasibilityStudyQuality string  `json:"feasibility_study_quality"`
	ProjectNetProfit        float64 `json:"project_net_profit"`
	ProjectTotalCost        float64 `json:"project_total_cost"`
	PreviousProjectsCount   string  `json:"previous_projects_count"`

	PropertyLocation string  `json:"property_location"`
	PropertyType     string  `json:"property_type"`
	PropertyUsage    string  `json:"property_usage"`
	Appraisal1       float64 `json:"appraisal_1"`
	Appraisal2       float64 `json:"appraisal_2"`
	FinancingAmount  float64 `json:"financing_amount"`

	Notes *string `json:"notes"`
}

type UpdateRequest struct {
	BusinessActivity      *string `json:"business_activity"`
	EntityType            *string `json:"entity_type"`
	EntityLocation        *string `json:"entity_location"`
	YearsInBusiness       *string `json:"years_in_business"`
	IncomeDiversification *string `json:"income_diversification"`

	AuditedFinancials  *bool    `json:"audited_financials"`
	TotalRevenue       *float64 `json:"total_revenue"`
	OperatingCashFlow  *float64 `json:"operating_cash_flow"`
	CurrentLiabilities *float64 `json:"current_liabilities"`
	NetProfit          *float64 `json:"net_profit"`
	OperatingProfit    *float64 `json:"operating_profit"`
	FinanceCosts       *float64 `json:"finance_costs"`
	TotalAssets        *float64 `json:"total_assets"`
	CurrentAssets      *float64 `json:"current_assets"`

	CreditRecord     *string `json:"credit_record"`
	PaymentBehavior  *string `json:"payment_behavior"`
	PaymentDelays    *string `json:"payment_delays"`
	NumDelays        *string `json:"num_delays"`
	DelayRatio       *string `json:"delay_ratio"`
	FinancingDefault *string `json:"financing_default"`
	NumDefaults      *string `json:"num_defaults"`
	DefaultRatio     *string `json:"default_ratio"`
	BouncedChecks    *string `json:"bounced_checks"`
	Lawsuits         *string `json:"lawsuits"`

	ProjectLocation         *string  `json:"project_location"`
	HasProjectPlan          *bool    `json:"has_project_plan"`
	HasInsurance            *bool    `json:"has_insurance"`
	ProjectType             *string  `json:"project_type"`
	EngineeringFirmClass    *string  `json:"engineering_firm_class"`
	FeasibilityStudyQuality *string  `json:"feasibility_study_quality"`
	ProjectNetProfit        *float64 `json:"project_net_profit"`
	ProjectTotalCost        *float64 `json:"project_total_cost"`
	PreviousProjectsCount   *string  `json:"previous_projects_count"`

	PropertyLocation *string  `json:"property_location"`
	PropertyType     *string  `json:"property_type"`
	PropertyUsage    *string  `json:"property_usage"`
	Appraisal1       *float64 `json:"appraisal_1"`
	Appraisal2       *float64 `json:"appraisal_2"`
	FinancingAmount  *float64 `json:"financing_amount"`

	Notes *string `json:"notes"`
}

type ListParams struct {
	OrganizationID *uuid.UUID
	ApplicationID  *uuid.UUID
	Status         *AssessmentStatus
	Search         string
	Limit          int
	Offset         int
}
