package reporting

import (
	"testing"

	"pgregory.net/rapid"
)

// DelinquencyStatus represents the delinquency classification of a facility.
type DelinquencyStatus string

const (
	DelinqCurrent  DelinquencyStatus = "current"
	DelinqPAR30    DelinquencyStatus = "par_30"
	DelinqPAR60    DelinquencyStatus = "par_60"
	DelinqPAR90    DelinquencyStatus = "par_90"
	DelinqPAR180   DelinquencyStatus = "par_180"
	DelinqWriteOff DelinquencyStatus = "write_off"
)

var allStatuses = []DelinquencyStatus{
	DelinqCurrent,
	DelinqPAR30,
	DelinqPAR60,
	DelinqPAR90,
	DelinqPAR180,
	DelinqWriteOff,
}

// isInPAR30 returns true if the status counts toward PAR30 (30+ days overdue).
// PAR30 = par_30 + par_60 + par_90 + par_180 + write_off
func isInPAR30(s DelinquencyStatus) bool {
	return s == DelinqPAR30 || s == DelinqPAR60 || s == DelinqPAR90 || s == DelinqPAR180 || s == DelinqWriteOff
}

// isInPAR60 returns true if the status counts toward PAR60 (60+ days overdue).
// PAR60 = par_60 + par_90 + par_180 + write_off
func isInPAR60(s DelinquencyStatus) bool {
	return s == DelinqPAR60 || s == DelinqPAR90 || s == DelinqPAR180 || s == DelinqWriteOff
}

// isInPAR90 returns true if the status counts toward PAR90 (90+ days overdue).
// PAR90 = par_90 + par_180 + write_off
func isInPAR90(s DelinquencyStatus) bool {
	return s == DelinqPAR90 || s == DelinqPAR180 || s == DelinqWriteOff
}

// genDelinquencyStatus generates a random DelinquencyStatus using rapid.
func genDelinquencyStatus() *rapid.Generator[DelinquencyStatus] {
	return rapid.SampledFrom(allStatuses)
}

// genDelinquencySlice generates a non-empty slice of DelinquencyStatus values.
func genDelinquencySlice() *rapid.Generator[[]DelinquencyStatus] {
	return rapid.SliceOfN(genDelinquencyStatus(), 1, 200)
}

// --- Property 1: Cumulative inclusion ---
// If a status is in PAR90, it must be in PAR60. If in PAR60, it must be in PAR30.
func TestProp_CumulativeInclusion(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		s := genDelinquencyStatus().Draw(t, "status")

		if isInPAR90(s) && !isInPAR60(s) {
			t.Fatalf("status %q is in PAR90 but not PAR60", s)
		}
		if isInPAR60(s) && !isInPAR30(s) {
			t.Fatalf("status %q is in PAR60 but not PAR30", s)
		}
	})
}

// --- Property 2: Current is never PAR ---
func TestProp_CurrentIsNeverPAR(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		// We always check "current" — the rapid draw is just for consistency
		// with the property-based framework, but the property is deterministic.
		_ = genDelinquencyStatus().Draw(t, "ignored")

		if isInPAR30(DelinqCurrent) {
			t.Fatal("current should never be in PAR30")
		}
		if isInPAR60(DelinqCurrent) {
			t.Fatal("current should never be in PAR60")
		}
		if isInPAR90(DelinqCurrent) {
			t.Fatal("current should never be in PAR90")
		}
	})
}

// --- Property 3: Write-off is always PAR ---
func TestProp_WriteOffIsAlwaysPAR(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		_ = genDelinquencyStatus().Draw(t, "ignored")

		if !isInPAR30(DelinqWriteOff) {
			t.Fatal("write_off should always be in PAR30")
		}
		if !isInPAR60(DelinqWriteOff) {
			t.Fatal("write_off should always be in PAR60")
		}
		if !isInPAR90(DelinqWriteOff) {
			t.Fatal("write_off should always be in PAR90")
		}
	})
}

// --- Property 4: PAR30 is superset of PAR60 ---
// For any status, isInPAR60(s) implies isInPAR30(s).
func TestProp_PAR30SupersetOfPAR60(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		s := genDelinquencyStatus().Draw(t, "status")

		if isInPAR60(s) && !isInPAR30(s) {
			t.Fatalf("status %q is in PAR60 but not PAR30 — PAR30 must be a superset of PAR60", s)
		}
	})
}

// --- Property 5: PAR60 is superset of PAR90 ---
// For any status, isInPAR90(s) implies isInPAR60(s).
func TestProp_PAR60SupersetOfPAR90(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		s := genDelinquencyStatus().Draw(t, "status")

		if isInPAR90(s) && !isInPAR60(s) {
			t.Fatalf("status %q is in PAR90 but not PAR60 — PAR60 must be a superset of PAR90", s)
		}
	})
}

// --- Property 6: Partition completeness ---
// Every delinquency status is either "current" or in PAR30.
func TestProp_PartitionCompleteness(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		s := genDelinquencyStatus().Draw(t, "status")

		isCurrent := s == DelinqCurrent
		inPAR30 := isInPAR30(s)

		if !isCurrent && !inPAR30 {
			t.Fatalf("status %q is neither current nor in PAR30 — violates partition completeness", s)
		}
		if isCurrent && inPAR30 {
			t.Fatalf("status %q is both current and in PAR30 — violates partition exclusivity", s)
		}
	})
}

// --- Property 7: Determinism ---
// Same status always produces the same classification.
func TestProp_Determinism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		s := genDelinquencyStatus().Draw(t, "status")

		r30a := isInPAR30(s)
		r30b := isInPAR30(s)
		r60a := isInPAR60(s)
		r60b := isInPAR60(s)
		r90a := isInPAR90(s)
		r90b := isInPAR90(s)

		if r30a != r30b {
			t.Fatalf("isInPAR30(%q) returned different results: %v vs %v", s, r30a, r30b)
		}
		if r60a != r60b {
			t.Fatalf("isInPAR60(%q) returned different results: %v vs %v", s, r60a, r60b)
		}
		if r90a != r90b {
			t.Fatalf("isInPAR90(%q) returned different results: %v vs %v", s, r90a, r90b)
		}
	})
}

// --- Property 8: Strictness ordering ---
// For any collection of facilities, PAR30 count >= PAR60 count >= PAR90 count.
func TestProp_StrictnessOrdering(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		statuses := genDelinquencySlice().Draw(t, "statuses")

		par30Count := 0
		par60Count := 0
		par90Count := 0

		for _, s := range statuses {
			if isInPAR30(s) {
				par30Count++
			}
			if isInPAR60(s) {
				par60Count++
			}
			if isInPAR90(s) {
				par90Count++
			}
		}

		if par30Count < par60Count {
			t.Fatalf("PAR30 count (%d) < PAR60 count (%d) for %d facilities — violates ordering",
				par30Count, par60Count, len(statuses))
		}
		if par60Count < par90Count {
			t.Fatalf("PAR60 count (%d) < PAR90 count (%d) for %d facilities — violates ordering",
				par60Count, par90Count, len(statuses))
		}
	})
}
