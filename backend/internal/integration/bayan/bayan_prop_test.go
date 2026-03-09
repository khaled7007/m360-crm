package bayan

import (
	"strings"
	"testing"

	"pgregory.net/rapid"
)

func TestPropDeterminism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.String().Draw(t, "crNumber")
		client := New()
		r1, err1 := client.GetBusinessCreditReport(cr)
		r2, err2 := client.GetBusinessCreditReport(cr)
		if err1 != nil || err2 != nil {
			if (err1 == nil) != (err2 == nil) {
				t.Fatalf("inconsistent error for cr %q: %v vs %v", cr, err1, err2)
			}
			return
		}
		if *r1 != *r2 {
			t.Fatalf("non-deterministic result for cr %q: %+v vs %+v", cr, r1, r2)
		}
	})
}

func TestPropErrorPrefix(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		suffix := rapid.String().Draw(t, "suffix")
		prefix := rapid.SampledFrom([]string{"ERR", "err", "Err"}).Draw(t, "prefix")
		cr := prefix + suffix
		client := New()
		_, err := client.GetBusinessCreditReport(cr)
		if err == nil {
			t.Fatalf("expected error for cr %q, got nil", cr)
		}
	})
}

func TestPropScoreRange(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.StringMatching(`[0-9]{10}`).Draw(t, "crNumber")
		client := New()
		r, err := client.GetBusinessCreditReport(cr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		// Scores from the source: 550-820
		if r.Score < 550 || r.Score > 820 {
			t.Fatalf("score %d out of range [550, 820]", r.Score)
		}
	})
}

func TestPropNonNegativeValues(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.StringMatching(`[0-9]{10}`).Draw(t, "crNumber")
		client := New()
		r, err := client.GetBusinessCreditReport(cr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.Capital < 0 {
			t.Fatalf("Capital is negative: %d", r.Capital)
		}
		if r.YearsInBusiness < 0 {
			t.Fatalf("YearsInBusiness is negative: %d", r.YearsInBusiness)
		}
		if r.EmployeeCount < 0 {
			t.Fatalf("EmployeeCount is negative: %d", r.EmployeeCount)
		}
	})
}

func TestPropRiskLevelValid(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.StringMatching(`[0-9]{10}`).Draw(t, "crNumber")
		client := New()
		r, err := client.GetBusinessCreditReport(cr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		valid := map[string]bool{"very_low": true, "low": true, "medium": true, "high": true}
		if !valid[r.RiskLevel] {
			t.Fatalf("invalid risk level: %q", r.RiskLevel)
		}
	})
}

func TestPropNonErrorProducesResult(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.String().Draw(t, "crNumber")
		if strings.HasPrefix(strings.ToUpper(cr), "ERR") {
			t.Skip()
		}
		client := New()
		r, err := client.GetBusinessCreditReport(cr)
		if err != nil {
			t.Fatalf("unexpected error for non-ERR cr %q: %v", cr, err)
		}
		if r == nil {
			t.Fatalf("got nil result for non-ERR cr %q", cr)
		}
	})
}
