package nafath

import (
	"strings"
	"testing"

	"pgregory.net/rapid"
)

// Tests use New() (which defaults to mock mode) to ensure backward compatibility.

func TestPropDeterminism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.String().Draw(t, "nationalID")
		client := New()
		r1, err1 := client.VerifyIdentity(id)
		r2, err2 := client.VerifyIdentity(id)
		if err1 != nil || err2 != nil {
			if (err1 == nil) != (err2 == nil) {
				t.Fatalf("inconsistent error for id %q: %v vs %v", id, err1, err2)
			}
			return
		}
		if r1.NationalID != r2.NationalID || r1.FullNameEN != r2.FullNameEN ||
			r1.FullNameAR != r2.FullNameAR || r1.DateOfBirth != r2.DateOfBirth ||
			r1.Nationality != r2.Nationality || r1.Verified != r2.Verified ||
			r1.ConfidenceLevel != r2.ConfidenceLevel || r1.VerificationMethod != r2.VerificationMethod {
			t.Fatalf("non-deterministic result for id %q: %+v vs %+v", id, r1, r2)
		}
	})
}

func TestPropConfidenceRange(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.VerifyIdentity(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.ConfidenceLevel < 0.0 || r.ConfidenceLevel > 1.0 {
			t.Fatalf("confidence %f out of range [0.0, 1.0]", r.ConfidenceLevel)
		}
	})
}

func TestPropVerifiedImpliesHighConfidence(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.VerifyIdentity(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.Verified && r.ConfidenceLevel < 0.9 {
			t.Fatalf("verified=true but confidence=%f < 0.9 for id %q", r.ConfidenceLevel, id)
		}
	})
}

func TestPropMethodValid(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.VerifyIdentity(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		valid := map[string]bool{"fingerprint": true, "facial_recognition": true, "otp": true}
		if !valid[r.VerificationMethod] {
			t.Fatalf("invalid verification method: %q", r.VerificationMethod)
		}
	})
}

func TestPropNationalIDPreserved(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.StringMatching(`[0-9]{10}`).Draw(t, "nationalID")
		client := New()
		r, err := client.VerifyIdentity(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.NationalID != id {
			t.Fatalf("NationalID mismatch: got %q, want %q", r.NationalID, id)
		}
	})
}

func TestPropErrorPrefix(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		suffix := rapid.String().Draw(t, "suffix")
		prefix := rapid.SampledFrom([]string{"ERR", "err", "Err"}).Draw(t, "prefix")
		id := prefix + suffix
		client := New()
		_, err := client.VerifyIdentity(id)
		if err == nil {
			t.Fatalf("expected error for id %q, got nil", id)
		}
	})
}

func TestPropNamesNonEmpty(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		id := rapid.String().Draw(t, "nationalID")
		if strings.HasPrefix(strings.ToUpper(id), "ERR") {
			t.Skip()
		}
		client := New()
		r, err := client.VerifyIdentity(id)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if r.FullNameEN == "" {
			t.Fatal("FullNameEN is empty")
		}
		if r.FullNameAR == "" {
			t.Fatal("FullNameAR is empty")
		}
	})
}

// New tests for the async API mock behavior

func TestStartVerificationMock(t *testing.T) {
	client := New()
	resp, err := client.StartVerification("1234567890", ServicePersonalLoan)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.TransID == "" {
		t.Fatal("TransID is empty")
	}
	if resp.Random == "" {
		t.Fatal("Random is empty")
	}
}

func TestStartVerificationMockError(t *testing.T) {
	client := New()
	_, err := client.StartVerification("ERR123", ServiceLogin)
	if err == nil {
		t.Fatal("expected error for ERR prefix")
	}
}

func TestCheckStatusMockCompleted(t *testing.T) {
	client := New()
	resp, err := client.CheckStatus("1234567890", "mock-trans", "42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != StatusCompleted {
		t.Fatalf("expected COMPLETED, got %s", resp.Status)
	}
	if resp.Person == nil {
		t.Fatal("Person is nil for COMPLETED status")
	}
	if resp.Person.NIN != "1234567890" {
		t.Fatalf("NIN mismatch: got %q", resp.Person.NIN)
	}
	if resp.Person.EnglishFirstName == "" {
		t.Fatal("EnglishFirstName is empty")
	}
	if resp.Person.FirstName == "" {
		t.Fatal("FirstName (Arabic) is empty")
	}
	if resp.Person.City == "" {
		t.Fatal("City is empty")
	}
}

func TestCheckStatusMockRejected(t *testing.T) {
	// Digit 5 simulates rejection
	client := New()
	resp, err := client.CheckStatus("1234567895", "mock-trans", "42")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if resp.Status != StatusRejected {
		t.Fatalf("expected REJECTED for digit-5, got %s", resp.Status)
	}
}

func TestGetJWKMock(t *testing.T) {
	client := New()
	resp, err := client.GetJWK()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(resp.Keys) == 0 {
		t.Fatal("JWK keys are empty")
	}
	if resp.Keys[0].Kty != "RSA" {
		t.Fatalf("expected RSA key type, got %s", resp.Keys[0].Kty)
	}
}

func TestVerifyIdentityIncludesPerson(t *testing.T) {
	client := New()
	r, err := client.VerifyIdentity("1234567890")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if r.Person == nil {
		t.Fatal("Person is nil")
	}
	if r.Person.EnglishFirstName == "" {
		t.Fatal("EnglishFirstName is empty")
	}
	if r.Person.FamilyName == "" {
		t.Fatal("FamilyName (Arabic) is empty")
	}
	if r.Person.PostCode == "" {
		t.Fatal("PostCode is empty")
	}
}
