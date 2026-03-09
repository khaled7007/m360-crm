package watheq

// ---------------------------------------------------------------------------
// Real Wathq API response types (https://developer.wathq.sa)
// ---------------------------------------------------------------------------

// APIError represents the standard error response from the Wathq API.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func (e *APIError) Error() string {
	return "wathq: " + e.Code + ": " + e.Message
}

// ---------------------------------------------------------------------------
// Commercial Registration API — https://api.wathq.sa/commercial-registration
// ---------------------------------------------------------------------------

// CRFullInfo is the response from GET /fullinfo/{id}.
type CRFullInfo struct {
	CRNationalNumber string        `json:"crNationalNumber"`
	CRNumber         string        `json:"crNumber"`
	Name             string        `json:"name"`
	CRCapital        *CRCapital    `json:"crCapital,omitempty"`
	Status           *CRStatusInfo `json:"status,omitempty"`
	EntityType       *EntityType   `json:"entityType,omitempty"`
	Parties          []Party       `json:"parties,omitempty"`
	Management       []Manager     `json:"management,omitempty"`
	Activities       []Activity    `json:"activities,omitempty"`
	ContactInfo      *ContactInfo  `json:"contactInfo,omitempty"`
	ECommerce        *ECommerce    `json:"eCommerce,omitempty"`
	FiscalYear       *FiscalYear   `json:"fiscalYear,omitempty"`
	Dates            *CRDates      `json:"dates,omitempty"`
}

// CRBasicInfo is the response from GET /info/{id}.
type CRBasicInfo struct {
	CRNationalNumber string      `json:"crNationalNumber"`
	CRNumber         string      `json:"crNumber"`
	Name             string      `json:"name"`
	Status           string      `json:"status,omitempty"`
	EntityType       *EntityType `json:"entityType,omitempty"`
	Activities       []Activity  `json:"activities,omitempty"`
	Headquarter      string      `json:"headquarter,omitempty"`
	IssueDate        string      `json:"issueDate,omitempty"`
	IssueDateHijri   string      `json:"issueDateHijri,omitempty"`
}

// CRStatus is the response from GET /status/{id}.
type CRStatus struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	ConfirmationDate string `json:"confirmationDate,omitempty"`
	SuspensionDate   string `json:"suspensionDate,omitempty"`
	DeletionDate     string `json:"deletionDate,omitempty"`
}

// CRStatusInfo is the nested status object within CRFullInfo.
type CRStatusInfo struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

// EntityType describes the legal entity form.
type EntityType struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

// Party represents an owner/partner from GET /owners/{id}.
type Party struct {
	Name          string `json:"name"`
	TypeID        string `json:"typeId,omitempty"`
	TypeName      string `json:"typeName,omitempty"`
	Identity      string `json:"identity,omitempty"`
	Nationality   string `json:"nationality,omitempty"`
	Partnership   string `json:"partnership,omitempty"`
	PartnerShare  string `json:"partnerShare,omitempty"`
}

// Owner is an alias for Party, used by GetOwners.
type Owner = Party

// Manager represents a manager/board member from GET /managers/{id}.
type Manager struct {
	Name        string     `json:"name"`
	TypeID      string     `json:"typeId,omitempty"`
	TypeName    string     `json:"typeName,omitempty"`
	IsLicensed  bool       `json:"isLicensed,omitempty"`
	Identity    string     `json:"identity,omitempty"`
	Nationality string     `json:"nationality,omitempty"`
	Positions   []Position `json:"positions,omitempty"`
}

// Position represents a management position held by a manager.
type Position struct {
	Name string `json:"name,omitempty"`
}

// Branch represents a branch CR from GET /branches/{id}.
type Branch struct {
	CRNationalNumber string      `json:"crNationalNumber"`
	CRNumber         string      `json:"crNumber"`
	Name             string      `json:"name"`
	IsMain           bool        `json:"isMain,omitempty"`
	EntityType       *EntityType `json:"entityType,omitempty"`
}

// Capital represents the capital structure from GET /capital/{id}.
type Capital struct {
	CurrencyID          string               `json:"currencyId,omitempty"`
	CurrencyName        string               `json:"currencyName,omitempty"`
	Total               float64              `json:"total,omitempty"`
	ContributionCapital *ContributionCapital `json:"contributionCapital,omitempty"`
	StockCapital        *StockCapital        `json:"stockCapital,omitempty"`
}

// ContributionCapital breaks down contribution capital into cash and in-kind.
type ContributionCapital struct {
	Cash   float64 `json:"cash,omitempty"`
	InKind float64 `json:"inKind,omitempty"`
}

// StockCapital holds stock capital details.
type StockCapital struct {
	Total float64 `json:"total,omitempty"`
}

// CRCapital is the capital section within CRFullInfo.
type CRCapital struct {
	Total        float64 `json:"total,omitempty"`
	CurrencyName string  `json:"currencyName,omitempty"`
}

// Activity describes a business activity.
type Activity struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
}

// ContactInfo holds CR contact details.
type ContactInfo struct {
	Phone string `json:"phone,omitempty"`
	Email string `json:"email,omitempty"`
	Fax   string `json:"fax,omitempty"`
}

// ECommerce holds e-commerce registration info.
type ECommerce struct {
	URL    string `json:"url,omitempty"`
	Status string `json:"status,omitempty"`
}

// FiscalYear holds fiscal year details.
type FiscalYear struct {
	StartDate string `json:"startDate,omitempty"`
	EndDate   string `json:"endDate,omitempty"`
}

// CRDates holds various CR dates in Gregorian and Hijri formats.
type CRDates struct {
	IssueDate          string `json:"issueDate,omitempty"`
	IssueDateHijri     string `json:"issueDateHijri,omitempty"`
	ExpiryDate         string `json:"expiryDate,omitempty"`
	ExpiryDateHijri    string `json:"expiryDateHijri,omitempty"`
	ConfirmationDate   string `json:"confirmationDate,omitempty"`
}

// RelatedCR represents a CR linked to an identity via GET /v2/related.
type RelatedCR struct {
	CRNationalNumber string `json:"crNationalNumber"`
	CRNumber         string `json:"crNumber"`
	Name             string `json:"name"`
	Status           string `json:"status,omitempty"`
}

// Beneficiary represents a real beneficiary from GET /beneficiary/{id}.
type Beneficiary struct {
	Name       string `json:"name,omitempty"`
	Identity   string `json:"identity,omitempty"`
	Percentage string `json:"percentage,omitempty"`
}

// BeneficiaryResponse is the response from GET /beneficiary/{id}.
type BeneficiaryResponse struct {
	Exemption     bool          `json:"exemption"`
	Beneficiaries []Beneficiary `json:"beneficiaries,omitempty"`
}

// ---------------------------------------------------------------------------
// Employee Information API — https://api.wathq.sa/masdr/employee
// ---------------------------------------------------------------------------

// EmployeeInfo is the response from GET /v2/info.
type EmployeeInfo struct {
	Name           string             `json:"name"`
	Nationality    string             `json:"nationality,omitempty"`
	WorkingMonths  int                `json:"workingMonths,omitempty"`
	EmploymentInfo []EmploymentRecord `json:"employmentInfo,omitempty"`
}

// EmploymentRecord represents a single employment entry.
type EmploymentRecord struct {
	Employer    string       `json:"employer,omitempty"`
	Status      string       `json:"status,omitempty"`
	WageDetails *WageDetails `json:"wageDetails,omitempty"`
}

// WageDetails breaks down salary components.
type WageDetails struct {
	BasicWage        float64 `json:"basicWage,omitempty"`
	HousingAllowance float64 `json:"housingAllowance,omitempty"`
	OtherAllowance   float64 `json:"otherAllowance,omitempty"`
	FullWage         float64 `json:"fullWage,omitempty"`
}

// ---------------------------------------------------------------------------
// National Address API — https://api.wathq.sa/spl/national/address
// ---------------------------------------------------------------------------

// NationalAddress is a single address from GET /info/{crNumber}.
type NationalAddress struct {
	Title            string  `json:"title,omitempty"`
	Address          string  `json:"address,omitempty"`
	Address2         string  `json:"address2,omitempty"`
	Latitude         float64 `json:"latitude,omitempty"`
	Longitude        float64 `json:"longitude,omitempty"`
	BuildingNumber   string  `json:"buildingNumber,omitempty"`
	Street           string  `json:"street,omitempty"`
	District         string  `json:"district,omitempty"`
	DistrictID       string  `json:"districtId,omitempty"`
	City             string  `json:"city,omitempty"`
	CityID           string  `json:"cityId,omitempty"`
	PostCode         string  `json:"postCode,omitempty"`
	AdditionalNumber string  `json:"additionalNumber,omitempty"`
	RegionName       string  `json:"regionName,omitempty"`
	RegionID         string  `json:"regionId,omitempty"`
	IsPrimaryAddress bool    `json:"isPrimaryAddress,omitempty"`
	UnitNumber       string  `json:"unitNumber,omitempty"`
	Status           string  `json:"status,omitempty"`
}

// ---------------------------------------------------------------------------
// Legacy type — preserved for backward compatibility
// ---------------------------------------------------------------------------

// CRInfo is the legacy response type returned by VerifyCR. It is kept for
// backward compatibility with existing callers.
type CRInfo struct {
	CRNumber      string `json:"cr_number"`
	CompanyNameEN string `json:"company_name_en"`
	CompanyNameAR string `json:"company_name_ar"`
	Status        string `json:"status"`
	EntityType    string `json:"entity_type"`
	ExpiryDate    string `json:"expiry_date"`
	IssueDate     string `json:"issue_date"`
	Activities    string `json:"activities"`
	Capital       int    `json:"capital"`
	IsActive      bool   `json:"is_active"`
}
