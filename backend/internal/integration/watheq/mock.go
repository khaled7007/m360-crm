package watheq

import (
	"fmt"
	"strings"
)

// ---------------------------------------------------------------------------
// Mock implementations — used when Config.UseMock is true (default)
// ---------------------------------------------------------------------------

// mockVerifyCR returns deterministic mock CR data based on the last digit of
// the CR number. CR numbers starting with "ERR" simulate a service error.
func mockVerifyCR(crNumber string) (*CRInfo, error) {
	if strings.HasPrefix(strings.ToUpper(crNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}

	digit := lastDigit(crNumber)

	companiesEN := [10]string{
		"Acme Trading Co", "Gulf Construction LLC", "Saudi Tech Solutions",
		"Al-Madinah Logistics", "Eastern Supplies Ltd", "Riyadh Foods Corp",
		"National Auto Parts", "Jeddah Textiles Co", "Desert Energy Ltd",
		"Peninsula Medical Supplies",
	}
	companiesAR := [10]string{
		"شركة أكمي التجارية", "شركة الخليج للمقاولات", "حلول التقنية السعودية",
		"لوجستيات المدينة", "التوريدات الشرقية المحدودة", "شركة أغذية الرياض",
		"قطع غيار السيارات الوطنية", "شركة جدة للنسيج", "طاقة الصحراء المحدودة",
		"مستلزمات الجزيرة الطبية",
	}
	statuses := [10]string{
		"active", "active", "active", "active", "active",
		"expired", "active", "active", "suspended", "active",
	}
	isActive := [10]bool{true, true, true, true, true, false, true, true, false, true}
	entityTypes := [10]string{
		"LLC", "LLC", "Closed JSC", "LLC", "Limited Partnership",
		"LLC", "Sole Proprietorship", "LLC", "Closed JSC", "LLC",
	}
	expiries := [10]string{
		"2027-12-31", "2028-06-15", "2029-03-01", "2027-09-20", "2028-11-10",
		"2025-01-15", "2028-04-22", "2029-07-18", "2024-08-30", "2028-12-05",
	}
	issues := [10]string{
		"2015-01-10", "2018-06-15", "2010-03-01", "2020-09-20", "2016-11-10",
		"2019-01-15", "2022-04-22", "2012-07-18", "2017-08-30", "2014-12-05",
	}
	activities := [10]string{
		"General Trading", "Construction & Building", "IT Services & Consulting",
		"Transportation & Logistics", "Wholesale Distribution", "Food Manufacturing",
		"Automotive Parts Retail", "Textile Manufacturing", "Oil & Gas Services",
		"Medical Equipment Trading",
	}
	capitals := [10]int{
		5000000, 10000000, 20000000, 1000000, 3000000,
		500000, 750000, 15000000, 8000000, 12000000,
	}

	return &CRInfo{
		CRNumber:      crNumber,
		CompanyNameEN: companiesEN[digit],
		CompanyNameAR: companiesAR[digit],
		Status:        statuses[digit],
		EntityType:    entityTypes[digit],
		ExpiryDate:    expiries[digit],
		IssueDate:     issues[digit],
		Activities:    activities[digit],
		Capital:       capitals[digit],
		IsActive:      isActive[digit],
	}, nil
}

// mockGetFullInfo returns deterministic mock CRFullInfo.
func mockGetFullInfo(crNationalNumber string) (*CRFullInfo, error) {
	if strings.HasPrefix(strings.ToUpper(crNationalNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}

	digit := lastDigit(crNationalNumber)
	names := [10]string{
		"Acme Trading Co", "Gulf Construction LLC", "Saudi Tech Solutions",
		"Al-Madinah Logistics", "Eastern Supplies Ltd", "Riyadh Foods Corp",
		"National Auto Parts", "Jeddah Textiles Co", "Desert Energy Ltd",
		"Peninsula Medical Supplies",
	}
	statusNames := [10]string{
		"Active", "Active", "Active", "Active", "Active",
		"Expired", "Active", "Active", "Suspended", "Active",
	}
	entityTypeNames := [10]string{
		"LLC", "LLC", "Closed JSC", "LLC", "Limited Partnership",
		"LLC", "Sole Proprietorship", "LLC", "Closed JSC", "LLC",
	}
	capitalAmounts := [10]float64{
		5000000, 10000000, 20000000, 1000000, 3000000,
		500000, 750000, 15000000, 8000000, 12000000,
	}

	return &CRFullInfo{
		CRNationalNumber: crNationalNumber,
		CRNumber:         fmt.Sprintf("10%08d", digit),
		Name:             names[digit],
		CRCapital: &CRCapital{
			Total:        capitalAmounts[digit],
			CurrencyName: "SAR",
		},
		Status:     &CRStatusInfo{ID: fmt.Sprintf("%d", digit), Name: statusNames[digit]},
		EntityType: &EntityType{ID: fmt.Sprintf("%d", digit), Name: entityTypeNames[digit]},
		Activities: []Activity{{ID: fmt.Sprintf("%d", digit+1), Name: fmt.Sprintf("Activity %d", digit+1)}},
		Dates: &CRDates{
			IssueDate:  fmt.Sprintf("201%d-01-10", digit%10),
			ExpiryDate: fmt.Sprintf("202%d-12-31", (digit%5)+5),
		},
	}, nil
}

// mockGetBasicInfo returns deterministic mock CRBasicInfo.
func mockGetBasicInfo(crNationalNumber string) (*CRBasicInfo, error) {
	full, err := mockGetFullInfo(crNationalNumber)
	if err != nil {
		return nil, err
	}
	return &CRBasicInfo{
		CRNationalNumber: full.CRNationalNumber,
		CRNumber:         full.CRNumber,
		Name:             full.Name,
		Status:           full.Status.Name,
		EntityType:       full.EntityType,
		Activities:       full.Activities,
		IssueDate:        full.Dates.IssueDate,
	}, nil
}

// mockGetStatus returns deterministic mock CRStatus.
func mockGetStatus(crNationalNumber string) (*CRStatus, error) {
	if strings.HasPrefix(strings.ToUpper(crNationalNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(crNationalNumber)
	statusNames := [10]string{
		"Active", "Active", "Active", "Active", "Active",
		"Expired", "Active", "Active", "Suspended", "Active",
	}
	return &CRStatus{
		ID:   crNationalNumber,
		Name: statusNames[digit],
	}, nil
}

// mockGetOwners returns deterministic mock owners.
func mockGetOwners(crNationalNumber string) ([]Owner, error) {
	if strings.HasPrefix(strings.ToUpper(crNationalNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(crNationalNumber)
	ownerNames := [10]string{
		"Mohammed Al-Rashid", "Abdullah Al-Otaibi", "Khalid Al-Dosari",
		"Faisal Al-Harbi", "Omar Al-Shehri", "Turki Al-Mutairi",
		"Nasser Al-Qahtani", "Saad Al-Ghamdi", "Ibrahim Al-Zahrani",
		"Yusuf Al-Tamimi",
	}
	return []Owner{
		{
			Name:         ownerNames[digit],
			TypeName:     "Individual",
			Identity:     fmt.Sprintf("10%08d", digit),
			Nationality:  "Saudi",
			Partnership:  "Partner",
			PartnerShare: "100",
		},
	}, nil
}

// mockGetManagers returns deterministic mock managers.
func mockGetManagers(crNationalNumber string) ([]Manager, error) {
	if strings.HasPrefix(strings.ToUpper(crNationalNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(crNationalNumber)
	managerNames := [10]string{
		"Ahmed Al-Salem", "Fahd Al-Harbi", "Sultan Al-Dosari",
		"Bader Al-Otaibi", "Hamad Al-Shehri", "Saleh Al-Mutairi",
		"Majed Al-Qahtani", "Rashed Al-Ghamdi", "Nawaf Al-Zahrani",
		"Waleed Al-Tamimi",
	}
	return []Manager{
		{
			Name:        managerNames[digit],
			TypeName:    "Individual",
			IsLicensed:  true,
			Identity:    fmt.Sprintf("10%08d", digit+1),
			Nationality: "Saudi",
			Positions:   []Position{{Name: "General Manager"}},
		},
	}, nil
}

// mockGetBranches returns deterministic mock branches.
func mockGetBranches(crNationalNumber string) ([]Branch, error) {
	if strings.HasPrefix(strings.ToUpper(crNationalNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(crNationalNumber)
	return []Branch{
		{
			CRNationalNumber: crNationalNumber,
			CRNumber:         fmt.Sprintf("10%08d", digit),
			Name:             fmt.Sprintf("Main Branch %d", digit),
			IsMain:           true,
			EntityType:       &EntityType{Name: "LLC"},
		},
	}, nil
}

// mockGetCapital returns deterministic mock capital structure.
func mockGetCapital(crNationalNumber string) (*Capital, error) {
	if strings.HasPrefix(strings.ToUpper(crNationalNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(crNationalNumber)
	amounts := [10]float64{
		5000000, 10000000, 20000000, 1000000, 3000000,
		500000, 750000, 15000000, 8000000, 12000000,
	}
	return &Capital{
		CurrencyID:   "SAR",
		CurrencyName: "Saudi Riyal",
		Total:        amounts[digit],
		ContributionCapital: &ContributionCapital{
			Cash:   amounts[digit],
			InKind: 0,
		},
	}, nil
}

// mockGetRelatedCRs returns deterministic mock related CRs.
func mockGetRelatedCRs(idNumber, _ string) ([]RelatedCR, error) {
	if strings.HasPrefix(strings.ToUpper(idNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(idNumber)
	return []RelatedCR{
		{
			CRNationalNumber: fmt.Sprintf("70%08d", digit),
			CRNumber:         fmt.Sprintf("10%08d", digit),
			Name:             fmt.Sprintf("Company %d", digit),
			Status:           "Active",
		},
	}, nil
}

// mockCheckOwnership returns deterministic mock ownership check.
func mockCheckOwnership(idNumber, _ string) (bool, error) {
	if strings.HasPrefix(strings.ToUpper(idNumber), "ERR") {
		return false, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(idNumber)
	return digit%2 == 0, nil // even digits own a CR
}

// mockGetEmployeeInfo returns deterministic mock employee info.
func mockGetEmployeeInfo(idNumber string) (*EmployeeInfo, error) {
	if strings.HasPrefix(strings.ToUpper(idNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(idNumber)
	names := [10]string{
		"Mohammed Al-Rashid", "Abdullah Al-Otaibi", "Khalid Al-Dosari",
		"Faisal Al-Harbi", "Omar Al-Shehri", "Turki Al-Mutairi",
		"Nasser Al-Qahtani", "Saad Al-Ghamdi", "Ibrahim Al-Zahrani",
		"Yusuf Al-Tamimi",
	}
	employers := [10]string{
		"Saudi Aramco", "SABIC", "STC", "Al Rajhi Bank", "NEOM",
		"Saudi Electricity Co", "Ma'aden", "Almarai", "Mobily", "Zain KSA",
	}
	wages := [10]float64{15000, 12000, 20000, 18000, 25000, 10000, 22000, 16000, 19000, 14000}

	return &EmployeeInfo{
		Name:          names[digit],
		Nationality:   "Saudi",
		WorkingMonths: (digit + 1) * 12,
		EmploymentInfo: []EmploymentRecord{
			{
				Employer: employers[digit],
				Status:   "Active",
				WageDetails: &WageDetails{
					BasicWage:        wages[digit],
					HousingAllowance: wages[digit] * 0.25,
					OtherAllowance:   wages[digit] * 0.10,
					FullWage:         wages[digit] * 1.35,
				},
			},
		},
	}, nil
}

// mockGetNationalAddress returns deterministic mock national addresses.
func mockGetNationalAddress(crNumber string) ([]NationalAddress, error) {
	if strings.HasPrefix(strings.ToUpper(crNumber), "ERR") {
		return nil, fmt.Errorf("Watheq service unavailable")
	}
	digit := lastDigit(crNumber)
	cities := [10]string{"Riyadh", "Jeddah", "Dammam", "Mecca", "Medina", "Khobar", "Tabuk", "Abha", "Hail", "Najran"}
	districts := [10]string{"Al Olaya", "Al Hamra", "Al Faisaliah", "Al Aziziyah", "Al Rawdah", "Al Muruj", "Al Nakheel", "Al Shifa", "Al Naseem", "Al Salam"}
	regions := [10]string{"Riyadh", "Makkah", "Eastern", "Makkah", "Madinah", "Eastern", "Tabuk", "Asir", "Hail", "Najran"}

	return []NationalAddress{
		{
			Title:            fmt.Sprintf("Office %d", digit+1),
			BuildingNumber:   fmt.Sprintf("%d%d%d%d", digit+1, digit+2, digit+3, digit+4),
			Street:           fmt.Sprintf("King Fahd Road %d", digit+1),
			District:         districts[digit],
			City:             cities[digit],
			PostCode:         fmt.Sprintf("%d%d%d%d%d", digit+1, digit+2, digit+3, digit+4, digit+5),
			AdditionalNumber: fmt.Sprintf("%d%d%d%d", digit+6, digit+7, digit+8, digit+9),
			RegionName:       regions[digit],
			IsPrimaryAddress: true,
			Latitude:         24.7136 + float64(digit)*0.1,
			Longitude:        46.6753 + float64(digit)*0.1,
			Status:           "Active",
		},
	}, nil
}

// lastDigit returns the numeric value of the last character of id, or 0 if
// the string is empty or ends with a non-digit.
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
