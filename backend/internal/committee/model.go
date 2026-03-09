package committee

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Decision string

const (
	DecisionPending                Decision = "pending"
	DecisionApproved               Decision = "approved"
	DecisionRejected               Decision = "rejected"
	DecisionApprovedWithConditions Decision = "approved_with_conditions"
)

type VoteDecision string

const (
	VoteApprove                VoteDecision = "approve"
	VoteReject                 VoteDecision = "reject"
	VoteApproveWithConditions  VoteDecision = "approve_with_conditions"
)

type Package struct {
	ID                  uuid.UUID           `json:"id"`
	ApplicationID       uuid.UUID           `json:"application_id"`
	PreparedBy          uuid.UUID           `json:"prepared_by"`
	RiskScore           *int                `json:"risk_score"`
	Recommendation      *string             `json:"recommendation"`
	FinancialAnalysis   json.RawMessage     `json:"financial_analysis"`
	Decision            Decision            `json:"decision"`
	DecisionDate        *time.Time          `json:"decision_date"`
	Conditions          *string             `json:"conditions"`
	QuorumRequired      int                 `json:"quorum_required"`
	Votes               []Vote              `json:"votes,omitempty"`
	CreatedAt           time.Time           `json:"created_at"`
	UpdatedAt           time.Time           `json:"updated_at"`
}

type Vote struct {
	ID        uuid.UUID    `json:"id"`
	PackageID uuid.UUID    `json:"package_id"`
	VoterID   uuid.UUID    `json:"voter_id"`
	Decision  VoteDecision `json:"decision"`
	Comments  *string      `json:"comments"`
	VotedAt   time.Time    `json:"voted_at"`
}

type CreatePackageRequest struct {
	ApplicationID  uuid.UUID `json:"application_id" validate:"required"`
	RiskScore      *int      `json:"risk_score"`
	Recommendation *string   `json:"recommendation"`
	QuorumRequired int       `json:"quorum_required" validate:"required"`
}

type CastVoteRequest struct {
	Decision VoteDecision `json:"decision" validate:"required"`
	Comments *string      `json:"comments"`
}
