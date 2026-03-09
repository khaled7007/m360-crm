package committee

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func makeVote(decision VoteDecision) Vote {
	return Vote{
		ID:        uuid.New(),
		PackageID: uuid.New(),
		VoterID:   uuid.New(),
		Decision:  decision,
	}
}

func TestCheckQuorumAndDecide_NotEnoughVotes(t *testing.T) {
	svc := &Service{}
	pkg := &Package{
		ID:             uuid.New(),
		QuorumRequired: 3,
		Decision:       DecisionPending,
		Votes: []Vote{
			makeVote(VoteApprove),
			makeVote(VoteApprove),
		},
	}

	decided := svc.checkQuorumAndDecide(context.Background(), pkg)

	if decided {
		t.Error("expected checkQuorumAndDecide to return false when votes < quorum")
	}
	if pkg.Decision != DecisionPending {
		t.Errorf("expected decision to remain pending, got %q", pkg.Decision)
	}
}

func TestCheckQuorumAndDecide_MajorityApprove(t *testing.T) {
	svc := &Service{}
	pkg := &Package{
		ID:             uuid.New(),
		QuorumRequired: 3,
		Decision:       DecisionPending,
		Votes: []Vote{
			makeVote(VoteApprove),
			makeVote(VoteApprove),
			makeVote(VoteReject),
		},
	}

	decided := svc.checkQuorumAndDecide(context.Background(), pkg)

	if !decided {
		t.Error("expected checkQuorumAndDecide to return true when quorum met with majority approve")
	}
	if pkg.Decision != DecisionApproved {
		t.Errorf("expected decision to be approved, got %q", pkg.Decision)
	}
}

func TestCheckQuorumAndDecide_MajorityReject(t *testing.T) {
	svc := &Service{}
	pkg := &Package{
		ID:             uuid.New(),
		QuorumRequired: 3,
		Decision:       DecisionPending,
		Votes: []Vote{
			makeVote(VoteReject),
			makeVote(VoteReject),
			makeVote(VoteApprove),
		},
	}

	decided := svc.checkQuorumAndDecide(context.Background(), pkg)

	if !decided {
		t.Error("expected checkQuorumAndDecide to return true when quorum met with majority reject")
	}
	if pkg.Decision != DecisionRejected {
		t.Errorf("expected decision to be rejected, got %q", pkg.Decision)
	}
}

func TestCheckQuorumAndDecide_ApproveWithConditions(t *testing.T) {
	svc := &Service{}
	pkg := &Package{
		ID:             uuid.New(),
		QuorumRequired: 3,
		Decision:       DecisionPending,
		Votes: []Vote{
			makeVote(VoteApprove),
			makeVote(VoteApproveWithConditions),
			makeVote(VoteReject),
		},
	}

	decided := svc.checkQuorumAndDecide(context.Background(), pkg)

	if !decided {
		t.Error("expected checkQuorumAndDecide to return true when quorum met with approve_with_conditions")
	}
	if pkg.Decision != DecisionApprovedWithConditions {
		t.Errorf("expected decision to be approved_with_conditions, got %q", pkg.Decision)
	}
}

func TestCheckQuorumAndDecide_ExactQuorumAllApprove(t *testing.T) {
	svc := &Service{}
	pkg := &Package{
		ID:             uuid.New(),
		QuorumRequired: 2,
		Decision:       DecisionPending,
		Votes: []Vote{
			makeVote(VoteApprove),
			makeVote(VoteApprove),
		},
	}

	decided := svc.checkQuorumAndDecide(context.Background(), pkg)

	if !decided {
		t.Error("expected checkQuorumAndDecide to return true at exact quorum with all approve")
	}
	if pkg.Decision != DecisionApproved {
		t.Errorf("expected decision to be approved, got %q", pkg.Decision)
	}
}

func TestCheckQuorumAndDecide_TiedVotesNoDecision(t *testing.T) {
	svc := &Service{}
	// 2 approve, 2 reject — neither side has strict majority (> totalVotes/2 = > 2)
	pkg := &Package{
		ID:             uuid.New(),
		QuorumRequired: 4,
		Decision:       DecisionPending,
		Votes: []Vote{
			makeVote(VoteApprove),
			makeVote(VoteApprove),
			makeVote(VoteReject),
			makeVote(VoteReject),
		},
	}

	decided := svc.checkQuorumAndDecide(context.Background(), pkg)

	if decided {
		t.Error("expected checkQuorumAndDecide to return false on a tied vote")
	}
	if pkg.Decision != DecisionPending {
		t.Errorf("expected decision to remain pending on tie, got %q", pkg.Decision)
	}
}
