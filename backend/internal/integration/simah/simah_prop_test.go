package simah

import (
	"strings"
	"testing"

	"pgregory.net/rapid"
)

func TestPropDeterminism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.String().Draw(t, "nationalID")
		client := New()
		r1, err1 := client.GetCreditReport(id)
		r2, err2 := client.GetCreditReport(id)
		if err1 != nil || err2 != nil {
			if (err1 == nil) != (err2 == nil) {
				t.Fatalf("inconsistent error for id %q: %v vs %v", id, err1, err2)
			}
			return
		}
		if *r1 != *r2 {
			t.Fatalf("non-deterministic result for id %q: %+v vs %+v", id, r1, r2)
		}
	})
}

func TestPropScoreRange(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.GetCreditReport(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.Score < 600 || r.Score > 870 {
			t.Fatalf("score %d out of range [600, 870]", r.Score)
		}
	})
}

func TestPropRiskLevelValid(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.GetCreditReport(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		valid := map[string]bool{"very_low": true, "low": true, "medium": true, "high": true}
		if !valid[r.RiskLevel] {
			t.Fatalf("invalid risk level: %q", r.RiskLevel)
		}
	})
}

func TestPropNonNegativeCounts(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.GetCreditReport(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.ActiveLoans < 0 {
			t.Fatalf("ActiveLoans is negative: %d", r.ActiveLoans)
		}
		if r.DefaultCount < 0 {
			t.Fatalf("DefaultCount is negative: %d", r.DefaultCount)
		}
		if r.TotalDebt < 0 {
			t.Fatalf("TotalDebt is negative: %d", r.TotalDebt)
		}
	})
}

func TestPropErrorPrefix(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		suffix := rapid.String().Draw(t, "suffix")
		id := "ERR" + suffix
		client := New()
		_, err := client.GetCreditReport(id)
		if err == nil {
			t.Fatalf("expected error for id %q, got nil", id)
		}
	})
}

func TestPropErrorPrefixCaseInsensitive(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		suffix := rapid.String().Draw(t, "suffix")
		prefix := rapid.SampledFrom([]string{"ERR", "err", "Err", "eRr", "erR"}).Draw(t, "prefix")
		id := prefix + suffix
		client := New()
		_, err := client.GetCreditReport(id)
		if err == nil {
			t.Fatalf("expected error for id %q, got nil", id)
		}
	})
}

func TestPropNonErrorProducesResult(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.String().Draw(t, "nationalID")
		if strings.HasPrefix(strings.ToUpper(id), "ERR") {
			t.Skip()
		}
		client := New()
		r, err := client.GetCreditReport(id)
		if err != nil {
			t.Fatalf("unexpected error for non-ERR id %q: %v", id, err)
		}
		if r == nil {
			t.Fatalf("got nil result for non-ERR id %q", id)
		}
	})
}

func TestPropEmptyStringDoesNotPanic(t *testing.T) {
	client := New()
	r, err := client.GetCreditReport("")
	if err != nil {
		t.Fatalf("unexpected error for empty string: %v", err)
	}
	if r == nil {
		t.Fatal("got nil result for empty string")
	}
}
