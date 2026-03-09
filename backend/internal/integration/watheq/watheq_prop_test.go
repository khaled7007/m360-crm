package watheq

import (
	"strings"
	"testing"

	"pgregory.net/rapid"
)

func TestPropDeterminism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.String().Draw(t, "crNumber")
		client := New()
		r1, err1 := client.VerifyCR(cr)
		r2, err2 := client.VerifyCR(cr)
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
		_, err := client.VerifyCR(cr)
		if err == nil {
			t.Fatalf("expected error for cr %q, got nil", cr)
		}
	})
}

func TestPropCRNumberPreserved(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.StringMatching(`[0-9]{10}`).Draw(t, "crNumber")
		client := New()
		r, err := client.VerifyCR(cr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.CRNumber != cr {
			t.Fatalf("CRNumber mismatch: got %q, want %q", r.CRNumber, cr)
		}
	})
}

func TestPropCapitalNonNegative(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.StringMatching(`[0-9]{10}`).Draw(t, "crNumber")
		client := New()
		r, err := client.VerifyCR(cr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.Capital < 0 {
			t.Fatalf("Capital is negative: %d", r.Capital)
		}
	})
}

func TestPropEntityTypeValid(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		cr := rapid.StringMatching(`[0-9]{10}`).Draw(t, "crNumber")
		client := New()
		r, err := client.VerifyCR(cr)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		valid := map[string]bool{
			"LLC":                true,
			"Closed JSC":        true,
			"Limited Partnership": true,
			"Sole Proprietorship": true,
		}
		if !valid[r.EntityType] {
			t.Fatalf("invalid entity type: %q", r.EntityType)
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
		r, err := client.VerifyCR(cr)
		if err != nil {
			t.Fatalf("unexpected error for non-ERR cr %q: %v", cr, err)
		}
		if r == nil {
			t.Fatalf("got nil result for non-ERR cr %q", cr)
		}
	})
}
