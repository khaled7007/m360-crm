package application

import "testing"

func TestCanTransition_ValidPaths(t *testing.T) {
	cases := []struct {
		name string
		from Status
		to   Status
	}{
		{"draft to submitted", StatusDraft, StatusSubmitted},
		{"submitted to pre_approved", StatusSubmitted, StatusPreApproved},
		{"submitted to rejected", StatusSubmitted, StatusRejected},
		{"pre_approved to docs_collected", StatusPreApproved, StatusDocsCollected},
		{"pre_approved to rejected", StatusPreApproved, StatusRejected},
		{"docs_collected to credit_assessment", StatusDocsCollected, StatusCreditAssessment},
		{"credit_assessment to committee_review", StatusCreditAssessment, StatusCommitteeReview},
		{"committee_review to approved", StatusCommitteeReview, StatusApproved},
		{"committee_review to rejected", StatusCommitteeReview, StatusRejected},
		{"approved to disbursed", StatusApproved, StatusDisbursed},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if !CanTransition(tc.from, tc.to) {
				t.Errorf("expected CanTransition(%q, %q) to be true, got false", tc.from, tc.to)
			}
		})
	}
}

func TestCanTransition_InvalidPaths(t *testing.T) {
	cases := []struct {
		name string
		from Status
		to   Status
	}{
		{"draft to approved", StatusDraft, StatusApproved},
		{"draft to rejected", StatusDraft, StatusRejected},
		{"draft to pre_approved", StatusDraft, StatusPreApproved},
		{"draft to disbursed", StatusDraft, StatusDisbursed},
		{"submitted to docs_collected", StatusSubmitted, StatusDocsCollected},
		{"submitted to credit_assessment", StatusSubmitted, StatusCreditAssessment},
		{"submitted to committee_review", StatusSubmitted, StatusCommitteeReview},
		{"submitted to approved", StatusSubmitted, StatusApproved},
		{"submitted to disbursed", StatusSubmitted, StatusDisbursed},
		{"pre_approved to submitted", StatusPreApproved, StatusSubmitted},
		{"pre_approved to credit_assessment", StatusPreApproved, StatusCreditAssessment},
		{"pre_approved to approved", StatusPreApproved, StatusApproved},
		{"docs_collected to pre_approved", StatusDocsCollected, StatusPreApproved},
		{"docs_collected to rejected", StatusDocsCollected, StatusRejected},
		{"docs_collected to approved", StatusDocsCollected, StatusApproved},
		{"credit_assessment to docs_collected", StatusCreditAssessment, StatusDocsCollected},
		{"credit_assessment to approved", StatusCreditAssessment, StatusApproved},
		{"credit_assessment to rejected", StatusCreditAssessment, StatusRejected},
		{"committee_review to credit_assessment", StatusCommitteeReview, StatusCreditAssessment},
		{"committee_review to disbursed", StatusCommitteeReview, StatusDisbursed},
		{"approved to rejected", StatusApproved, StatusRejected},
		{"approved to submitted", StatusApproved, StatusSubmitted},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if CanTransition(tc.from, tc.to) {
				t.Errorf("expected CanTransition(%q, %q) to be false, got true", tc.from, tc.to)
			}
		})
	}
}

func TestCanTransition_FromTerminalState(t *testing.T) {
	terminalStates := []Status{StatusRejected, StatusDisbursed}
	allStatuses := []Status{
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

	for _, from := range terminalStates {
		for _, to := range allStatuses {
			t.Run(string(from)+"_to_"+string(to), func(t *testing.T) {
				if CanTransition(from, to) {
					t.Errorf("terminal state %q should not transition to %q", from, to)
				}
			})
		}
	}
}
