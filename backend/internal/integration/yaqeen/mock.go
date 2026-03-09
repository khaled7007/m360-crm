package yaqeen

import (
	"fmt"
	"strings"
)

// IdentityInfo is the legacy mock response type preserved for backward
// compatibility with existing code that calls GetPersonInfo.
type IdentityInfo struct {
	NationalID    string `json:"national_id"`
	FullNameEN    string `json:"full_name_en"`
	FullNameAR    string `json:"full_name_ar"`
	DateOfBirth   string `json:"date_of_birth"`
	Age           int    `json:"age"`
	Gender        string `json:"gender"`
	Nationality   string `json:"nationality"`
	IDExpiryDate  string `json:"id_expiry_date"`
	MaritalStatus string `json:"marital_status"`
	Verified      bool   `json:"verified"`
}

// mockGetPersonInfo returns deterministic mock person data based on the last
// digit of the national ID. IDs starting with "ERR" simulate a service error.
func mockGetPersonInfo(nationalID string) (*IdentityInfo, error) {
	if strings.HasPrefix(strings.ToUpper(nationalID), "ERR") {
		return nil, fmt.Errorf("Yaqeen service unavailable")
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
	ages := [10]int{40, 35, 47, 31, 43, 37, 50, 33, 45, 28}
	genders := [10]string{"male", "male", "male", "male", "male", "male", "male", "male", "male", "male"}
	nationalities := [10]string{
		"Saudi", "Saudi", "Saudi", "Saudi", "Saudi",
		"Saudi", "Bahraini", "Saudi", "Kuwaiti", "Saudi",
	}
	expiries := [10]string{
		"2028-06-15", "2027-03-22", "2029-11-08", "2027-01-30", "2028-09-12",
		"2026-07-04", "2029-12-19", "2027-05-25", "2028-02-14", "2030-08-01",
	}
	marital := [10]string{
		"married", "single", "married", "single", "married",
		"divorced", "married", "single", "married", "single",
	}

	return &IdentityInfo{
		NationalID:    nationalID,
		FullNameEN:    namesEN[digit],
		FullNameAR:    namesAR[digit],
		DateOfBirth:   dobs[digit],
		Age:           ages[digit],
		Gender:        genders[digit],
		Nationality:   nationalities[digit],
		IDExpiryDate:  expiries[digit],
		MaritalStatus: marital[digit],
		Verified:      true,
	}, nil
}

// mockGetSaudiByNin returns deterministic mock PersonInfo for a Saudi NIN.
func mockGetSaudiByNin(nin, hijriDOB string) (*PersonInfo, error) {
	if strings.HasPrefix(strings.ToUpper(nin), "ERR") {
		return nil, fmt.Errorf("Yaqeen service unavailable")
	}
	digit := lastDigit(nin)
	return mockPersonInfo(nin, "", digit), nil
}

// mockGetNonSaudiByIqama returns deterministic mock PersonInfo for an iqama.
func mockGetNonSaudiByIqama(iqama, birthDateG string) (*PersonInfo, error) {
	if strings.HasPrefix(strings.ToUpper(iqama), "ERR") {
		return nil, fmt.Errorf("Yaqeen service unavailable")
	}
	digit := lastDigit(iqama)
	return mockPersonInfo("", iqama, digit), nil
}

// mockGetAddresses returns a single deterministic mock address.
func mockGetAddresses(id string) ([]Address, error) {
	if strings.HasPrefix(strings.ToUpper(id), "ERR") {
		return nil, fmt.Errorf("Yaqeen service unavailable")
	}
	digit := lastDigit(id)
	cities := [10]string{"Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar", "Tabuk", "Abha", "Hail", "Najran"}
	districts := [10]string{"Al Olaya", "Al Hamra", "Al Faisaliah", "Al Aziziyah", "Al Rawdah", "Al Muruj", "Al Nakheel", "Al Shifa", "Al Naseem", "Al Salam"}
	return []Address{
		{
			BuildingNumber:   fmt.Sprintf("%d%d%d%d", digit+1, digit+2, digit+3, digit+4),
			StreetName:       fmt.Sprintf("King Fahd Road %d", digit+1),
			District:         districts[digit],
			City:             cities[digit],
			PostCode:         fmt.Sprintf("%d%d%d%d%d", digit+1, digit+2, digit+3, digit+4, digit+5),
			AdditionalNumber: fmt.Sprintf("%d%d%d%d", digit+6, digit+7, digit+8, digit+9),
			IsPrimary:        true,
		},
	}, nil
}

// mockGetDependents returns deterministic mock dependents.
func mockGetDependents(id string) ([]Dependent, error) {
	if strings.HasPrefix(strings.ToUpper(id), "ERR") {
		return nil, fmt.Errorf("Yaqeen service unavailable")
	}
	digit := lastDigit(id)
	if digit%3 == 0 {
		return []Dependent{}, nil // no dependents
	}
	return []Dependent{
		{
			Name:         fmt.Sprintf("Dependent %d", digit),
			DateOfBirthG: fmt.Sprintf("201%d-01-15", digit%10),
			Gender:       "male",
			Relationship: "son",
		},
	}, nil
}

func mockPersonInfo(nin, iqama string, digit int) *PersonInfo {
	firstNamesAR := [10]string{"محمد", "عبدالله", "خالد", "فيصل", "عمر", "تركي", "ناصر", "سعد", "ابراهيم", "يوسف"}
	fatherNamesAR := [10]string{"أحمد", "سعيد", "علي", "حسن", "يوسف", "سالم", "فهد", "ماجد", "ابراهيم", "عادل"}
	familyNamesAR := [10]string{"الراشد", "العتيبي", "الدوسري", "الحربي", "الشهري", "المطيري", "القحطاني", "الغامدي", "الزهراني", "التميمي"}

	firstNamesEN := [10]string{"Mohammed", "Abdullah", "Khalid", "Faisal", "Omar", "Turki", "Nasser", "Saad", "Ibrahim", "Yusuf"}
	fatherNamesEN := [10]string{"Ahmed", "Saeed", "Ali", "Hassan", "Yusuf", "Salem", "Fahd", "Majed", "Ibrahim", "Adel"}
	familyNamesEN := [10]string{"Al-Rashid", "Al-Otaibi", "Al-Dosari", "Al-Harbi", "Al-Shehri", "Al-Mutairi", "Al-Qahtani", "Al-Ghamdi", "Al-Zahrani", "Al-Tamimi"}

	dobsG := [10]string{"1985-06-15", "1990-03-22", "1978-11-08", "1995-01-30", "1982-09-12", "1988-07-04", "1975-12-19", "1992-05-25", "1980-02-14", "1997-08-01"}
	dobsH := [10]string{"1405-10-26", "1410-08-25", "1398-12-07", "1415-08-19", "1402-11-18", "1408-11-15", "1395-12-16", "1412-11-21", "1400-03-28", "1417-03-23"}
	expiryG := [10]string{"2028-06-15", "2027-03-22", "2029-11-08", "2027-01-30", "2028-09-12", "2026-07-04", "2029-12-19", "2027-05-25", "2028-02-14", "2030-08-01"}
	expiryH := [10]string{"1450-01-10", "1449-09-05", "1452-07-22", "1449-08-01", "1450-05-28", "1448-01-08", "1452-09-08", "1449-12-02", "1450-09-27", "1453-03-10"}
	nationalities := [10]string{"Saudi", "Saudi", "Saudi", "Saudi", "Saudi", "Saudi", "Bahraini", "Saudi", "Kuwaiti", "Saudi"}
	marital := [10]string{"married", "single", "married", "single", "married", "divorced", "married", "single", "married", "single"}
	deps := [10]int{3, 0, 2, 0, 4, 1, 2, 0, 3, 0}

	return &PersonInfo{
		NIN:                    nin,
		Iqama:                  iqama,
		FirstName:              firstNamesAR[digit],
		FatherName:             fatherNamesAR[digit],
		GrandFatherName:        "",
		FamilyName:             familyNamesAR[digit],
		EnglishFirstName:       firstNamesEN[digit],
		EnglishFatherName:      fatherNamesEN[digit],
		EnglishGrandFatherName: "",
		EnglishFamilyName:      familyNamesEN[digit],
		Gender:                 "male",
		Nationality:            nationalities[digit],
		DateOfBirthG:           dobsG[digit],
		DateOfBirthH:           dobsH[digit],
		IDExpiryDateG:          expiryG[digit],
		IDExpiryDateH:          expiryH[digit],
		MaritalStatus:          marital[digit],
		NumberOfDependents:     deps[digit],
		Occupation:             "Private Sector Employee",
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
