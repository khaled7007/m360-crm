package yaqeen

import (
	"strings"
	"testing"

	"pgregory.net/rapid"
)

func TestPropDeterminism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.String().Draw(t, "nationalID")
		client := New()
		r1, err1 := client.GetPersonInfo(id)
		r2, err2 := client.GetPersonInfo(id)
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

func TestPropErrorPrefix(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		suffix := rapid.String().Draw(t, "suffix")
		prefix := rapid.SampledFrom([]string{"ERR", "err", "Err"}).Draw(t, "prefix")
		id := prefix + suffix
		client := New()
		_, err := client.GetPersonInfo(id)
		if err == nil {
			t.Fatalf("expected error for id %q, got nil", id)
		}
	})
}

func TestPropAgeRange(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.GetPersonInfo(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.Age < 18 || r.Age > 100 {
			t.Fatalf("age %d out of range [18, 100]", r.Age)
		}
	})
}

func TestPropGenderValid(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.GetPersonInfo(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.Gender != "male" && r.Gender != "female" {
			t.Fatalf("invalid gender: %q", r.Gender)
		}
	})
}

func TestPropNationalIDPreserved(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.GetPersonInfo(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.NationalID != id {
			t.Fatalf("NationalID mismatch: got %q, want %q", r.NationalID, id)
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
		r, err := client.GetPersonInfo(id)
		if err != nil {
			t.Fatalf("unexpected error for non-ERR id %q: %v", id, err)
		}
		if r == nil {
			t.Fatalf("got nil result for non-ERR id %q", id)
		}
	})
}
