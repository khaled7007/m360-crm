package nafath

import (
	"fmt"
	"strings"
)

// MockClient provides deterministic mock responses for testing and development.
// It implements the same interface as the real Nafath client but returns
// canned data based on the last digit of the national ID.
type MockClient struct{}

// NewMock creates a new mock Nafath client.
func NewMock() *MockClient { return &MockClient{} }

// VerifyIdentity returns a deterministic mock identity verification based on
// the last digit of the national ID. IDs starting with "ERR" simulate a
// service error.
func (m *MockClient) VerifyIdentity(nationalID string) (*IdentityInfo, error) {
	if strings.HasPrefix(strings.ToUpper(nationalID), "ERR") {
		return nil, fmt.Errorf("Nafath service unavailable")
	}

	digit := lastDigit(nationalID)

	namesEN := [10]string{
		"Mohammed Al-Rashid", "Abdullah Al-Otaibi", "Khalid Al-Dosari",
		"Faisal Al-Harbi", "Omar Al-Shehri", "Turki Al-Mutairi",
		"Nasser Al-Qahtani", "Saad Al-Ghamdi", "Ibrahim Al-Zahrani",
		"Yusuf Al-Tamimi",
	}
	namesAR := [10]string{
		"محمد الراشد", "عبدالله العتيبي", "خالد الدوسري",
		"فيصل الحربي", "عمر الشهري", "تركي المطيري",
		"ناصر القحطاني", "سعد الغامدي", "ابراهيم الزهراني",
		"يوسف التميمي",
	}
	dobs := [10]string{
		"1985-06-15", "1990-03-22", "1978-11-08", "1995-01-30", "1982-09-12",
		"1988-07-04", "1975-12-19", "1992-05-25", "1980-02-14", "1997-08-01",
	}
	// Digit 5 simulates a failed verification
	verified := [10]bool{true, true, true, true, true, false, true, true, true, true}
	confidence := [10]float64{0.99, 0.95, 0.98, 0.92, 0.97, 0.35, 0.96, 0.93, 0.99, 0.91}
	methods := [10]string{
		"fingerprint", "facial_recognition", "fingerprint", "otp",
		"facial_recognition", "otp", "fingerprint", "facial_recognition",
		"fingerprint", "otp",
	}

	// Build the rich Person data matching the real Nafath API
	person := mockPerson(nationalID, digit)

	return &IdentityInfo{
		NationalID:         nationalID,
		FullNameEN:         namesEN[digit],
		FullNameAR:         namesAR[digit],
		DateOfBirth:        dobs[digit],
		Nationality:        "Saudi",
		Verified:           verified[digit],
		ConfidenceLevel:    confidence[digit],
		VerificationMethod: methods[digit],
		Person:             person,
	}, nil
}

// StartVerification simulates initiating the async MFA flow.
// Returns a mock transId and random number immediately.
func (m *MockClient) StartVerification(nationalID, service string) (*MFAResponse, error) {
	if strings.HasPrefix(strings.ToUpper(nationalID), "ERR") {
		return nil, fmt.Errorf("Nafath service unavailable")
	}

	return &MFAResponse{
		TransID: fmt.Sprintf("mock-trans-%s", nationalID),
		Random:  fmt.Sprintf("%02d", lastDigit(nationalID)*11%100),
	}, nil
}

// CheckStatus simulates polling the MFA status.
// Always returns COMPLETED with person data for the mock.
func (m *MockClient) CheckStatus(nationalID, transID, random string) (*StatusResponse, error) {
	if strings.HasPrefix(strings.ToUpper(nationalID), "ERR") {
		return nil, fmt.Errorf("Nafath service unavailable")
	}

	digit := lastDigit(nationalID)

	// Digit 5 simulates a rejected verification
	if digit == 5 {
		return &StatusResponse{
			Status: StatusRejected,
		}, nil
	}

	return &StatusResponse{
		Status: StatusCompleted,
		Person: mockPerson(nationalID, digit),
	}, nil
}

// GetJWK returns a mock JWK response.
func (m *MockClient) GetJWK() (*JWKResponse, error) {
	return &JWKResponse{
		Keys: []JWK{
			{
				Kty: "RSA",
				Use: "sig",
				Kid: "mock-kid-1",
				N:   "mock-modulus",
				E:   "AQAB",
				Alg: "RS256",
			},
		},
	}, nil
}

// mockPerson generates deterministic Person data based on the last digit.
func mockPerson(nationalID string, digit int) *Person {
	firstNamesEN := [10]string{
		"Mohammed", "Abdullah", "Khalid", "Faisal", "Omar",
		"Turki", "Nasser", "Saad", "Ibrahim", "Yusuf",
	}
	secondNamesEN := [10]string{
		"Ahmed", "Salem", "Fahad", "Nawaf", "Bandar",
		"Majed", "Hamad", "Rashed", "Talal", "Waleed",
	}
	thirdNamesEN := [10]string{
		"Saud", "Nayef", "Badr", "Sultan", "Mishaal",
		"Mansour", "Muqrin", "Salman", "Abdulaziz", "Fawaz",
	}
	lastNamesEN := [10]string{
		"Al-Rashid", "Al-Otaibi", "Al-Dosari", "Al-Harbi", "Al-Shehri",
		"Al-Mutairi", "Al-Qahtani", "Al-Ghamdi", "Al-Zahrani", "Al-Tamimi",
	}

	firstNamesAR := [10]string{
		"محمد", "عبدالله", "خالد", "فيصل", "عمر",
		"تركي", "ناصر", "سعد", "ابراهيم", "يوسف",
	}
	fatherNamesAR := [10]string{
		"أحمد", "سالم", "فهد", "نواف", "بندر",
		"ماجد", "حمد", "راشد", "طلال", "وليد",
	}
	grandFatherNamesAR := [10]string{
		"سعود", "نايف", "بدر", "سلطان", "مشعل",
		"منصور", "مقرن", "سلمان", "عبدالعزيز", "فواز",
	}
	familyNamesAR := [10]string{
		"الراشد", "العتيبي", "الدوسري", "الحربي", "الشهري",
		"المطيري", "القحطاني", "الغامدي", "الزهراني", "التميمي",
	}

	genders := [10]string{"M", "M", "M", "M", "M", "M", "M", "M", "M", "M"}
	maritalStatuses := [10]string{
		"متزوج", "أعزب", "متزوج", "أعزب", "متزوج",
		"أعزب", "متزوج", "متزوج", "أعزب", "متزوج",
	}
	occupations := [10]string{
		"موظف حكومي", "مهندس", "طبيب", "محاسب", "معلم",
		"مهندس", "ضابط", "تاجر", "موظف حكومي", "مهندس",
	}
	educationLevels := [10]string{
		"بكالوريوس", "ماجستير", "دكتوراه", "بكالوريوس", "ماجستير",
		"بكالوريوس", "بكالوريوس", "دبلوم", "ماجستير", "بكالوريوس",
	}
	cities := [10]string{
		"الرياض", "جدة", "الدمام", "المدينة المنورة", "مكة المكرمة",
		"بريدة", "تبوك", "الطائف", "خميس مشيط", "حائل",
	}
	districts := [10]string{
		"العليا", "الروضة", "الشاطئ", "العزيزية", "الصفا",
		"السلامة", "المروج", "النسيم", "الحمراء", "الملز",
	}

	return &Person{
		EnglishFirstName:  firstNamesEN[digit],
		EnglishSecondName: secondNamesEN[digit],
		EnglishThirdName:  thirdNamesEN[digit],
		EnglishLastName:   lastNamesEN[digit],

		FirstName:       firstNamesAR[digit],
		FatherName:      fatherNamesAR[digit],
		GrandFatherName: grandFatherNamesAR[digit],
		FamilyName:      familyNamesAR[digit],

		NIN:             nationalID,
		IDExpiryDateG:   "2030-06-15",
		DateOfBirthG:    [10]string{"1985-06-15", "1990-03-22", "1978-11-08", "1995-01-30", "1982-09-12", "1988-07-04", "1975-12-19", "1992-05-25", "1980-02-14", "1997-08-01"}[digit],
		Gender:          genders[digit],
		Nationality:     "Saudi",
		NationalityCode: "SA",

		MaritalStatusDescAr:  maritalStatuses[digit],
		OccupationDescAr:     occupations[digit],
		EducationLevelDescAr: educationLevels[digit],

		BuildingNo:   fmt.Sprintf("%d%d%d%d", digit+1, digit+2, digit+3, digit+4),
		StreetName:   fmt.Sprintf("شارع الملك فهد %d", digit+1),
		District:     districts[digit],
		City:         cities[digit],
		PostCode:     fmt.Sprintf("%d%d%d%d%d", digit+1, digit+2, digit+3, digit+4, digit+5),
		AdditionalNo: fmt.Sprintf("%d%d%d%d", digit+9, digit+8, digit+7, digit+6),
	}
}

func lastDigit(id string) int {
	if len(id) == 0 {
		return 0
	}
	d := id[len(id)-1]
	if d >= '0' && d <= '9' {
		return int(d - '0')
	}
	return 0
}
