package integration

type CreditReport struct {
	Score        int    `json:"score"`
	RiskLevel    string `json:"risk_level"`
	ActiveLoans  int    `json:"active_loans"`
	DefaultCount int    `json:"default_count"`
	LastUpdated  string `json:"last_updated"`
}

type IdentityInfo struct {
	NationalID  string `json:"national_id"`
	FullNameEN  string `json:"full_name_en"`
	FullNameAR  string `json:"full_name_ar"`
	DateOfBirth string `json:"date_of_birth"`
	Nationality string `json:"nationality"`
	Verified    bool   `json:"verified"`
}

type CRInfo struct {
	CRNumber      string `json:"cr_number"`
	CompanyNameEN string `json:"company_name_en"`
	CompanyNameAR string `json:"company_name_ar"`
	Status        string `json:"status"`
	ExpiryDate    string `json:"expiry_date"`
	Activities    string `json:"activities"`
	IsActive      bool   `json:"is_active"`
}
