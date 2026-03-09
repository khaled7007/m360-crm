package reporting

type DashboardStats struct {
	TotalLeads        int     `json:"total_leads"`
	TotalApplications int     `json:"total_applications"`
	TotalFacilities   int     `json:"total_facilities"`
	TotalDisbursed    float64 `json:"total_disbursed"`
	TotalOutstanding  float64 `json:"total_outstanding"`
	PAR30             float64 `json:"par_30"`
	PAR60             float64 `json:"par_60"`
	PAR90             float64 `json:"par_90"`
}

type PipelineStats struct {
	Draft            int `json:"draft"`
	Submitted        int `json:"submitted"`
	PreApproved      int `json:"pre_approved"`
	DocsCollected    int `json:"documents_collected"`
	CreditAssessment int `json:"credit_assessment"`
	CommitteeReview  int `json:"committee_review"`
	Approved         int `json:"approved"`
	Rejected         int `json:"rejected"`
	Disbursed        int `json:"disbursed"`
}

type OfficerPerformance struct {
	OfficerID      string  `json:"officer_id"`
	OfficerName    string  `json:"officer_name"`
	LeadCount      int     `json:"lead_count"`
	AppCount       int     `json:"app_count"`
	Disbursed      float64 `json:"disbursed"`
	ConversionRate float64 `json:"conversion_rate"`
}
