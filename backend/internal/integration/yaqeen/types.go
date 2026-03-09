package yaqeen

// LoginResponse represents the response from the Yakeen login endpoint.
type LoginResponse struct {
	Token     string `json:"token"`
	ExpiresIn int    `json:"expiresIn,omitempty"`
}

// PersonInfo represents the full person data returned by the SaudiByNin
// and NonSaudiByIqama services from the Yakeen (Awaed V6) API.
type PersonInfo struct {
	// Arabic name parts
	FirstName       string `json:"firstName"`
	FatherName      string `json:"fatherName"`
	GrandFatherName string `json:"grandFatherName"`
	FamilyName      string `json:"familyName"`

	// English name parts
	EnglishFirstName       string `json:"englishFirstName"`
	EnglishFatherName      string `json:"englishFatherName"`
	EnglishGrandFatherName string `json:"englishGrandFatherName"`
	EnglishFamilyName      string `json:"englishFamilyName"`

	// Identity
	NIN         string `json:"nin,omitempty"`
	Iqama       string `json:"iqama,omitempty"`
	Gender      string `json:"gender"`
	Nationality string `json:"nationality"`

	// Dates
	DateOfBirthG string `json:"dateOfBirthG"` // Gregorian
	DateOfBirthH string `json:"dateOfBirthH"` // Hijri
	IDExpiryDateG string `json:"idExpiryDateG"`
	IDExpiryDateH string `json:"idExpiryDateH"`

	// Additional personal data
	PassportNumber    string `json:"passportNumber,omitempty"`
	Occupation        string `json:"occupation,omitempty"`
	OccupationCode    string `json:"occupationCode,omitempty"`
	MaritalStatus     string `json:"maritalStatus,omitempty"`
	MaritalStatusCode string `json:"maritalStatusCode,omitempty"`
	NumberOfDependents int   `json:"numberOfDependents,omitempty"`

	// Sponsor (for non-Saudi / iqama holders)
	SponsorName   string `json:"sponsorName,omitempty"`
	SponsorNumber string `json:"sponsorNumber,omitempty"`

	// Status
	IDStatus     string `json:"idStatus,omitempty"`
	IDStatusCode string `json:"idStatusCode,omitempty"`

	// Social status
	SocialStatusCode string `json:"socialStatusCode,omitempty"`
	LifeStatus       string `json:"lifeStatus,omitempty"`
}

// FullNameAR returns the concatenated Arabic full name.
func (p *PersonInfo) FullNameAR() string {
	return joinNonEmpty(" ", p.FirstName, p.FatherName, p.GrandFatherName, p.FamilyName)
}

// FullNameEN returns the concatenated English full name.
func (p *PersonInfo) FullNameEN() string {
	return joinNonEmpty(" ", p.EnglishFirstName, p.EnglishFatherName, p.EnglishGrandFatherName, p.EnglishFamilyName)
}

// Address represents a Saudi address returned by the AddressByNin and
// AddressByIqama services.
type Address struct {
	BuildingNumber      string `json:"buildingNumber"`
	StreetName          string `json:"streetName"`
	District            string `json:"district"`
	City                string `json:"city"`
	PostCode            string `json:"postCode"`
	AdditionalNumber    string `json:"additionalNumber"`
	UnitNumber          string `json:"unitNumber,omitempty"`
	LocationCoordinates string `json:"locationCoordinates,omitempty"`
	IsPrimary           bool   `json:"isPrimaryAddress,omitempty"`
}

// Dependent represents a dependent returned by the DependentsByNin and
// DependentsByIqama services.
type Dependent struct {
	Name         string `json:"name"`
	EnglishName  string `json:"englishName,omitempty"`
	DateOfBirthG string `json:"dateOfBirthG"`
	DateOfBirthH string `json:"dateOfBirthH,omitempty"`
	Gender       string `json:"gender"`
	Relationship string `json:"relationship"`
	IDNumber     string `json:"idNumber,omitempty"`
}

// DataResponse is the generic wrapper returned by the Yakeen data endpoint.
// The actual payload varies by service and is unmarshalled from Body.
type DataResponse struct {
	Success    bool   `json:"success"`
	StatusCode int    `json:"statusCode"`
	Message    string `json:"message,omitempty"`
}

// PersonDataResponse wraps the data endpoint response for person lookups.
type PersonDataResponse struct {
	DataResponse
	Result PersonInfo `json:"result"`
}

// AddressDataResponse wraps the data endpoint response for address lookups.
type AddressDataResponse struct {
	DataResponse
	Result []Address `json:"result"`
}

// DependentDataResponse wraps the data endpoint response for dependent lookups.
type DependentDataResponse struct {
	DataResponse
	Result []Dependent `json:"result"`
}

func joinNonEmpty(sep string, parts ...string) string {
	var out string
	for _, p := range parts {
		if p == "" {
			continue
		}
		if out != "" {
			out += sep
		}
		out += p
	}
	return out
}
