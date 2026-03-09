package lead

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type repository interface {
	Create(ctx context.Context, l *Lead) error
	GetByID(ctx context.Context, id uuid.UUID) (*Lead, error)
	List(ctx context.Context, params ListParams) ([]Lead, int, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Lead, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type Service struct {
	repo repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest, officerID uuid.UUID) (*Lead, error) {
	l := &Lead{
		ID:                uuid.New(),
		ContactName:       req.ContactName,
		ContactPhone:      req.ContactPhone,
		ContactEmail:      req.ContactEmail,
		CompanyName:       req.CompanyName,
		Source:            req.Source,
		Status:            StatusNew,
		EstimatedAmount:   req.EstimatedAmount,
		Notes:             req.Notes,
		AssignedOfficerID: &officerID,
	}

	if err := s.repo.Create(ctx, l); err != nil {
		return nil, fmt.Errorf("create lead: %w", err)
	}
	return l, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Lead, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]Lead, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Lead, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
