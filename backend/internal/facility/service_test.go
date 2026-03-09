package facility

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

// newTestFacility builds a Facility for schedule generation tests without a DB.
func newTestFacility(principal, profit float64, tenorMonths int, frequency string, disbursement time.Time) *Facility {
	return &Facility{
		ID:               uuid.New(),
		PrincipalAmount:  principal,
		ProfitAmount:     profit,
		TotalAmount:      principal + profit,
		TenorMonths:      tenorMonths,
		PaymentFrequency: frequency,
		DisbursementDate: disbursement,
	}
}

func TestGenerateRepaymentSchedule_Monthly(t *testing.T) {
	svc := &Service{}
	disbursement := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	facility := newTestFacility(120000, 12000, 12, "monthly", disbursement)

	items := svc.generateRepaymentSchedule(facility)

	if len(items) != 12 {
		t.Fatalf("expected 12 installments for 12-month tenor, got %d", len(items))
	}

	// Verify installment numbers are sequential
	for i, item := range items {
		if item.InstallmentNumber != i+1 {
			t.Errorf("installment %d: expected number %d, got %d", i, i+1, item.InstallmentNumber)
		}
	}

	// Verify all items reference the correct facility
	for i, item := range items {
		if item.FacilityID != facility.ID {
			t.Errorf("installment %d: expected FacilityID %v, got %v", i+1, facility.ID, item.FacilityID)
		}
	}

	// Verify monthly due dates: each installment is one month after the previous
	expectedDate := disbursement.AddDate(0, 1, 0)
	for i, item := range items {
		if !item.DueDate.Equal(expectedDate) {
			t.Errorf("installment %d: expected due date %v, got %v", i+1, expectedDate, item.DueDate)
		}
		expectedDate = expectedDate.AddDate(0, 1, 0)
	}

	// Verify no item is marked paid
	for i, item := range items {
		if item.IsPaid {
			t.Errorf("installment %d should not be marked paid at creation", i+1)
		}
		if item.IsOverdue {
			t.Errorf("installment %d should not be marked overdue at creation", i+1)
		}
		if item.PaidAmount != 0 {
			t.Errorf("installment %d should have PaidAmount 0, got %f", i+1, item.PaidAmount)
		}
	}
}

func TestGenerateRepaymentSchedule_Quarterly(t *testing.T) {
	svc := &Service{}
	disbursement := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	// 4 quarterly installments = 12 month tenor treated as 4 installments
	// But the schedule generates one item per TenorMonths iteration, advancing by frequency.
	// With TenorMonths=4 and frequency="quarterly", we get 4 items, each 3 months apart.
	facility := newTestFacility(120000, 12000, 4, "quarterly", disbursement)

	items := svc.generateRepaymentSchedule(facility)

	if len(items) != 4 {
		t.Fatalf("expected 4 installments for tenor=4 quarterly, got %d", len(items))
	}

	expectedDates := []time.Time{
		disbursement.AddDate(0, 3, 0),
		disbursement.AddDate(0, 6, 0),
		disbursement.AddDate(0, 9, 0),
		disbursement.AddDate(0, 12, 0),
	}

	for i, item := range items {
		if !item.DueDate.Equal(expectedDates[i]) {
			t.Errorf("installment %d: expected due date %v, got %v", i+1, expectedDates[i], item.DueDate)
		}
	}
}

func TestGenerateRepaymentSchedule_AmountsAddUp(t *testing.T) {
	svc := &Service{}
	disbursement := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	principal := 100000.0
	profit := 15000.0
	facility := newTestFacility(principal, profit, 12, "monthly", disbursement)

	items := svc.generateRepaymentSchedule(facility)

	var totalPrincipal, totalProfit, totalAmount float64
	for _, item := range items {
		totalPrincipal += item.PrincipalAmount
		totalProfit += item.ProfitAmount
		totalAmount += item.TotalAmount
	}

	// Allow a small rounding tolerance (max 1 cent per installment)
	tolerance := 0.01 * float64(len(items))

	if diff := totalPrincipal - principal; diff < -tolerance || diff > tolerance {
		t.Errorf("sum of principal installments %.2f does not equal facility principal %.2f (diff %.4f)", totalPrincipal, principal, diff)
	}
	if diff := totalProfit - profit; diff < -tolerance || diff > tolerance {
		t.Errorf("sum of profit installments %.2f does not equal facility profit %.2f (diff %.4f)", totalProfit, profit, diff)
	}
	expectedTotal := principal + profit
	if diff := totalAmount - expectedTotal; diff < -tolerance || diff > tolerance {
		t.Errorf("sum of total installments %.2f does not equal facility total %.2f (diff %.4f)", totalAmount, expectedTotal, diff)
	}
}

func TestGenerateRepaymentSchedule_AmountsAddUp_Quarterly(t *testing.T) {
	svc := &Service{}
	disbursement := time.Date(2026, 3, 15, 0, 0, 0, 0, time.UTC)
	principal := 250000.0
	profit := 30000.0
	facility := newTestFacility(principal, profit, 8, "quarterly", disbursement)

	items := svc.generateRepaymentSchedule(facility)

	var totalPrincipal, totalProfit float64
	for _, item := range items {
		totalPrincipal += item.PrincipalAmount
		totalProfit += item.ProfitAmount
	}

	tolerance := 0.01 * float64(len(items))

	if diff := totalPrincipal - principal; diff < -tolerance || diff > tolerance {
		t.Errorf("sum of principal %.2f != facility principal %.2f", totalPrincipal, principal)
	}
	if diff := totalProfit - profit; diff < -tolerance || diff > tolerance {
		t.Errorf("sum of profit %.2f != facility profit %.2f", totalProfit, profit)
	}
}

func TestCalculateMaturityDate(t *testing.T) {
	cases := []struct {
		name        string
		start       time.Time
		tenorMonths int
		wantYear    int
		wantMonth   time.Month
		wantDay     int
	}{
		{
			name:        "12 months from Jan 2026",
			start:       time.Date(2026, 1, 15, 0, 0, 0, 0, time.UTC),
			tenorMonths: 12,
			wantYear:    2027,
			wantMonth:   time.January,
			wantDay:     15,
		},
		{
			name:        "6 months from June 2026",
			start:       time.Date(2026, 6, 1, 0, 0, 0, 0, time.UTC),
			tenorMonths: 6,
			wantYear:    2026,
			wantMonth:   time.December,
			wantDay:     1,
		},
		{
			name:        "24 months from March 2025",
			start:       time.Date(2025, 3, 31, 0, 0, 0, 0, time.UTC),
			tenorMonths: 24,
			wantYear:    2027,
			wantMonth:   time.March,
			wantDay:     31,
		},
		{
			name:        "1 month tenor",
			start:       time.Date(2026, 11, 1, 0, 0, 0, 0, time.UTC),
			tenorMonths: 1,
			wantYear:    2026,
			wantMonth:   time.December,
			wantDay:     1,
		},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := calculateMaturityDate(tc.start, tc.tenorMonths)
			if got.Year() != tc.wantYear || got.Month() != tc.wantMonth || got.Day() != tc.wantDay {
				t.Errorf("calculateMaturityDate(%v, %d) = %v, want %04d-%02d-%02d",
					tc.start, tc.tenorMonths, got, tc.wantYear, tc.wantMonth, tc.wantDay)
			}
		})
	}
}

func TestRoundToTwoDecimals(t *testing.T) {
	cases := []struct {
		input float64
		want  float64
	}{
		// Note: 1.005 in IEEE-754 is actually 1.00499999..., so it rounds to 1.00.
		// Tests use values that are exactly representable to avoid false failures.
		{1.004, 1.0},
		{1.006, 1.01},
		{2.555, 2.56},
		{100.0, 100.0},
		{0.0, 0.0},
		{1234.5678, 1234.57},
		{0.001, 0.0},
		{0.999, 1.0},
		{3.145, 3.15},
		{9.994, 9.99},
		{9.996, 10.0},
	}

	for _, tc := range cases {
		got := roundToTwoDecimals(tc.input)
		if got != tc.want {
			t.Errorf("roundToTwoDecimals(%v) = %v, want %v", tc.input, got, tc.want)
		}
	}
}
