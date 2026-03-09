package committee

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) CreatePackage(ctx context.Context, req *CreatePackageRequest, preparedByID uuid.UUID) (*Package, error) {
	pkg := &Package{
		ID:             uuid.New(),
		ApplicationID:  req.ApplicationID,
		PreparedBy:     preparedByID,
		RiskScore:      req.RiskScore,
		Recommendation: req.Recommendation,
		Decision:       DecisionPending,
		QuorumRequired: req.QuorumRequired,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	err := s.repo.CreatePackage(ctx, pkg)
	if err != nil {
		return nil, err
	}

	return pkg, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Package, error) {
	return s.repo.GetPackageByID(ctx, id)
}

func (s *Service) GetByApplicationID(ctx context.Context, applicationID uuid.UUID) (*Package, error) {
	return s.repo.GetByApplicationID(ctx, applicationID)
}

func (s *Service) ListPackages(ctx context.Context, limit, offset int) ([]PackageListItem, error) {
	return s.repo.ListAll(ctx, limit, offset)
}

func (s *Service) CastVote(ctx context.Context, packageID uuid.UUID, voterID uuid.UUID, req *CastVoteRequest) (*Package, error) {
	vote := &Vote{
		ID:        uuid.New(),
		PackageID: packageID,
		VoterID:   voterID,
		Decision:  req.Decision,
		Comments:  req.Comments,
		VotedAt:   time.Now(),
	}

	err := s.repo.CastVote(ctx, vote)
	if err != nil {
		return nil, err
	}

	pkg, err := s.repo.GetPackageByID(ctx, packageID)
	if err != nil {
		return nil, err
	}

	if s.checkQuorumAndDecide(ctx, pkg) {
		err = s.repo.UpdateDecision(ctx, pkg.ID, pkg.Decision, pkg.Conditions)
		if err != nil {
			return nil, err
		}
		pkg, err = s.repo.GetPackageByID(ctx, packageID)
		if err != nil {
			return nil, err
		}
	}

	return pkg, nil
}

func (s *Service) checkQuorumAndDecide(ctx context.Context, pkg *Package) bool {
	if len(pkg.Votes) < pkg.QuorumRequired {
		return false
	}

	approveCount := 0
	rejectCount := 0
	conditionsCount := 0

	for _, vote := range pkg.Votes {
		switch vote.Decision {
		case VoteApprove:
			approveCount++
		case VoteReject:
			rejectCount++
		case VoteApproveWithConditions:
			conditionsCount++
		}
	}

	totalVotes := len(pkg.Votes)

	if rejectCount > totalVotes/2 {
		pkg.Decision = DecisionRejected
		return true
	}

	if approveCount+conditionsCount > totalVotes/2 {
		if conditionsCount > 0 {
			pkg.Decision = DecisionApprovedWithConditions
		} else {
			pkg.Decision = DecisionApproved
		}
		return true
	}

	return false
}
