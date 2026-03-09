package organization

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type repository interface {
	Create(ctx context.Context, o *Organization) error
	GetByID(ctx context.Context, id uuid.UUID) (*Organization, error)
	List(ctx context.Context, params ListParams) ([]Organization, int, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Organization, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type Service struct {
	repo repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest, officerID uuid.UUID) (*Organization, error) {
	org := &Organization{
		ID:                uuid.New(),
		NameEN:            req.NameEN,
		NameAR:            req.NameAR,
		CRNumber:          req.CRNumber,
		TaxID:             req.TaxID,
		Industry:          req.Industry,
		LegalStructure:    req.LegalStructure,
		AddressEN:         req.AddressEN,
		AddressAR:         req.AddressAR,
		City:              req.City,
		Phone:             req.Phone,
		Email:             req.Email,
		Website:           req.Website,
		AssignedOfficerID: &officerID,
	}

	if err := s.repo.Create(ctx, org); err != nil {
		return nil, fmt.Errorf("create organization: %w", err)
	}

	return org, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Organization, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]Organization, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Organization, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
