package nafath

// Service types supported by Nafath MFA.
const (
	ServiceLogin        = "Login"         // 60s timeout
	ServicePersonalLoan = "PersonalLoan"  // 180s timeout
	ServiceOpenAccount  = "OpenBankAccount"
)

// MFA verification statuses returned by the status endpoint.
const (
	StatusWaiting   = "WAITING"
	StatusExpired   = "EXPIRED"
	StatusRejected  = "REJECTED"
	StatusCompleted = "COMPLETED"
)

// MFARequest is the body sent to POST /api/v1/mfa/request.
type MFARequest struct {
	NationalID string `json:"nationalId"`
	Service    string `json:"service"`
}

// MFAResponse is returned by POST /api/v1/mfa/request.
// The Random number must be displayed to the user so they can confirm in the Nafath app.
type MFAResponse struct {
	TransID string `json:"transId"`
	Random  string `json:"random"`
}

// StatusRequest is the body sent to POST /api/v1/mfa/request/status.
type StatusRequest struct {
	NationalID string `json:"nationalId"`
	TransID    string `json:"transId"`
	Random     string `json:"random"`
}

// StatusResponse is returned by POST /api/v1/mfa/request/status.
type StatusResponse struct {
	Status string  `json:"status"`
	Person *Person `json:"person,omitempty"`
}

// Person contains the 28+ identity attributes returned by Nafath on COMPLETED status.
type Person struct {
	// English name fields
	EnglishFirstName  string `json:"englishFirstName"`
	EnglishSecondName string `json:"englishSecondName"`
	EnglishThirdName  string `json:"englishThirdName"`
	EnglishLastName   string `json:"englishLastName"`

	// Arabic name fields
	FirstName       string `json:"firstName"`
	FatherName      string `json:"fatherName"`
	GrandFatherName string `json:"grandFatherName"`
	FamilyName      string `json:"familyName"`

	// Identity
	NIN             string `json:"nin"`
	IDExpiryDateG   string `json:"idExpiryDateG"`
	DateOfBirthG    string `json:"dateOfBirthG"`
	Gender          string `json:"gender"`
	Nationality     string `json:"nationality"`
	NationalityCode string `json:"nationalityCode"`

	// Personal details (Arabic descriptions)
	MaritalStatusDescAr  string `json:"maritalStatusDescAr"`
	OccupationDescAr     string `json:"occupationDescAr"`
	EducationLevelDescAr string `json:"educationLevelDescAr"`

	// Address
	BuildingNo   string `json:"buildingNo"`
	StreetName   string `json:"streetName"`
	District     string `json:"district"`
	City         string `json:"city"`
	PostCode     string `json:"postCode"`
	AdditionalNo string `json:"additionalNo"`
}

// JWK represents a single JSON Web Key from the Nafath JWK endpoint.
type JWK struct {
	Kty string `json:"kty"`
	Use string `json:"use"`
	Kid string `json:"kid"`
	N   string `json:"n"`
	E   string `json:"e"`
	Alg string `json:"alg"`
}

// JWKResponse is returned by GET /api/v1/mfa/jwk.
type JWKResponse struct {
	Keys []JWK `json:"keys"`
}

// IdentityInfo is the legacy mock response type. Kept for backward compatibility
// with the existing synchronous VerifyIdentity mock endpoint.
type IdentityInfo struct {
	NationalID         string  `json:"national_id"`
	FullNameEN         string  `json:"full_name_en"`
	FullNameAR         string  `json:"full_name_ar"`
	DateOfBirth        string  `json:"date_of_birth"`
	Nationality        string  `json:"nationality"`
	Verified           bool    `json:"verified"`
	ConfidenceLevel    float64 `json:"confidence_level"`
	VerificationMethod string  `json:"verification_method"`
	// Extended person data matching the real Nafath API fields
	Person *Person `json:"person,omitempty"`
}
