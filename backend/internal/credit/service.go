package credit

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type repository interface {
	Create(ctx context.Context, a *Assessment) error
	GetByID(ctx context.Context, id uuid.UUID) (*Assessment, error)
	List(ctx context.Context, params ListParams) ([]Assessment, int, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Assessment, error)
	Delete(ctx context.Context, id uuid.UUID) error
	SaveScore(ctx context.Context, assessmentID uuid.UUID, s *Score) error
}

type Service struct {
	repo repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest, userID uuid.UUID) (*Assessment, error) {
	a := &Assessment{
		ID:             uuid.New(),
		OrganizationID: req.OrganizationID,
		ApplicationID:  req.ApplicationID,
		CreatedBy:      userID,

		BusinessActivity:      req.BusinessActivity,
		EntityType:            req.EntityType,
		EntityLocation:        req.EntityLocation,
		YearsInBusiness:       req.YearsInBusiness,
		IncomeDiversification: req.IncomeDiversification,

		AuditedFinancials:  req.AuditedFinancials,
		TotalRevenue:       req.TotalRevenue,
		OperatingCashFlow:  req.OperatingCashFlow,
		CurrentLiabilities: req.CurrentLiabilities,
		NetProfit:          req.NetProfit,
		OperatingProfit:    req.OperatingProfit,
		FinanceCosts:       req.FinanceCosts,
		TotalAssets:        req.TotalAssets,
		CurrentAssets:      req.CurrentAssets,

		CreditRecord:     req.CreditRecord,
		PaymentBehavior:  req.PaymentBehavior,
		PaymentDelays:    req.PaymentDelays,
		NumDelays:        req.NumDelays,
		DelayRatio:       req.DelayRatio,
		FinancingDefault: req.FinancingDefault,
		NumDefaults:      req.NumDefaults,
		DefaultRatio:     req.DefaultRatio,
		BouncedChecks:    req.BouncedChecks,
		Lawsuits:         req.Lawsuits,

		ProjectLocation:         req.ProjectLocation,
		HasProjectPlan:          req.HasProjectPlan,
		HasInsurance:            req.HasInsurance,
		ProjectType:             req.ProjectType,
		EngineeringFirmClass:    req.EngineeringFirmClass,
		FeasibilityStudyQuality: req.FeasibilityStudyQuality,
		ProjectNetProfit:        req.ProjectNetProfit,
		ProjectTotalCost:        req.ProjectTotalCost,
		PreviousProjectsCount:   req.PreviousProjectsCount,

		PropertyLocation: req.PropertyLocation,
		PropertyType:     req.PropertyType,
		PropertyUsage:    req.PropertyUsage,
		Appraisal1:       req.Appraisal1,
		Appraisal2:       req.Appraisal2,
		FinancingAmount:  req.FinancingAmount,

		Status: StatusDraft,
		Notes:  req.Notes,
	}

	if err := s.repo.Create(ctx, a); err != nil {
		return nil, fmt.Errorf("create credit assessment: %w", err)
	}
	return a, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Assessment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]Assessment, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Assessment, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

// RunScoring fetches the assessment, runs the scorecard, and persists the results.
func (s *Service) RunScoring(ctx context.Context, id uuid.UUID) (*Assessment, error) {
	a, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("get assessment for scoring: %w", err)
	}

	score := ScoreAssessment(a)

	if err := s.repo.SaveScore(ctx, a.ID, score); err != nil {
		return nil, fmt.Errorf("save score: %w", err)
	}

	return s.repo.GetByID(ctx, a.ID)
}
