package application

import (
	"testing"

	"pgregory.net/rapid"
)

var allStatuses = []Status{
	StatusDraft,
	StatusSubmitted,
	StatusPreApproved,
	StatusDocsCollected,
	StatusCreditAssessment,
	StatusCommitteeReview,
	StatusApproved,
	StatusRejected,
	StatusDisbursed,
}

func statusGen() *rapid.Generator[Status] {
	return rapid.Custom(func(t *rapid.T) Status {
		return allStatuses[rapid.IntRange(0, len(allStatuses)-1).Draw(t, "statusIndex")]
	})
}

// Property 1: CanTransition is deterministic — same inputs always produce the same result.
func TestPropDeterminism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		from := statusGen().Draw(t, "from")
		to := statusGen().Draw(t, "to")
		r1 := CanTransition(from, to)
		r2 := CanTransition(from, to)
		if r1 != r2 {
			t.Fatalf("CanTransition(%q, %q) returned %v then %v", from, to, r1, r2)
		}
	})
}

// Property 2: No status can transition to itself.
func TestPropNoSelfTransitions(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		s := statusGen().Draw(t, "status")
		if CanTransition(s, s) {
			t.Fatalf("CanTransition(%q, %q) should be false (no self-transitions)", s, s)
		}
	})
}

// Property 3: Rejected is a terminal state — no transitions out.
func TestPropRejectedIsTerminal(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		to := statusGen().Draw(t, "to")
		if CanTransition(StatusRejected, to) {
			t.Fatalf("CanTransition(%q, %q) should be false (rejected is terminal)", StatusRejected, to)
		}
	})
}

// Property 4: Disbursed is a terminal state — no transitions out.
func TestPropDisbursedIsTerminal(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		to := statusGen().Draw(t, "to")
		if CanTransition(StatusDisbursed, to) {
			t.Fatalf("CanTransition(%q, %q) should be false (disbursed is terminal)", StatusDisbursed, to)
		}
	})
}

// Property 5: Draft is the only start — no status can transition TO Draft.
func TestPropDraftIsOnlyStart(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		from := statusGen().Draw(t, "from")
		if CanTransition(from, StatusDraft) {
			t.Fatalf("CanTransition(%q, %q) should be false (nothing transitions to draft)", from, StatusDraft)
		}
	})
}

// Property 6: A valid happy path from Draft to Disbursed exists.
func TestPropValidPathDraftToDisbursed(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		happyPath := []Status{
			StatusDraft,
			StatusSubmitted,
			StatusPreApproved,
			StatusDocsCollected,
			StatusCreditAssessment,
			StatusCommitteeReview,
			StatusApproved,
			StatusDisbursed,
		}
		for i := 0; i < len(happyPath)-1; i++ {
			from, to := happyPath[i], happyPath[i+1]
			if !CanTransition(from, to) {
				t.Fatalf("happy path broken: CanTransition(%q, %q) returned false", from, to)
			}
		}
	})
}

// Property 7: The transition graph is acyclic (excluding rejection).
// Following valid transitions from any non-rejected status never revisits a state.
func TestPropGraphIsAcyclic(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		start := statusGen().Draw(t, "start")
		visited := map[Status]bool{start: true}
		current := start

		for {
			targets := validTransitions[current]
			if len(targets) == 0 {
				break
			}

			// Filter out StatusRejected to test the non-rejection subgraph.
			var nonRejected []Status
			for _, s := range targets {
				if s != StatusRejected {
					nonRejected = append(nonRejected, s)
				}
			}
			if len(nonRejected) == 0 {
				break
			}

			// Pick a random non-rejected successor.
			next := nonRejected[rapid.IntRange(0, len(nonRejected)-1).Draw(t, "nextIdx")]
			if visited[next] {
				t.Fatalf("cycle detected: revisited %q starting from %q", next, start)
			}
			visited[next] = true
			current = next
		}
	})
}

// Property 8: Random pairs not in validTransitions return false.
func TestPropInvalidTransitionsReturnFalse(t *testing.T) {
	// Build a set of valid (from, to) pairs for fast lookup.
	type pair struct{ from, to Status }
	validSet := make(map[pair]bool)
	for from, targets := range validTransitions {
		for _, to := range targets {
			validSet[pair{from, to}] = true
		}
	}

	rapid.Check(t, func(t *rapid.T) {
		from := statusGen().Draw(t, "from")
		to := statusGen().Draw(t, "to")
		p := pair{from, to}
		if !validSet[p] && CanTransition(from, to) {
			t.Fatalf("CanTransition(%q, %q) should be false (not in validTransitions)", from, to)
		}
	})
}

// Property 9: Inverse asymmetry — if A->B is valid, then B->A is not.
func TestPropInverseAsymmetry(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		from := statusGen().Draw(t, "from")
		to := statusGen().Draw(t, "to")
		if CanTransition(from, to) && CanTransition(to, from) {
			t.Fatalf("bidirectional transition detected: %q <-> %q", from, to)
		}
	})
}
