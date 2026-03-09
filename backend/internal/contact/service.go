package contact

import (
	"context"
	"fmt"

	"github.com/google/uuid"
)

type repository interface {
	Create(ctx context.Context, c *Contact) error
	GetByID(ctx context.Context, id uuid.UUID) (*Contact, error)
	List(ctx context.Context, limit, offset int, search string) ([]Contact, int, error)
	ListByOrganization(ctx context.Context, orgID uuid.UUID) ([]Contact, error)
	Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Contact, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type Service struct {
	repo repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (*Contact, error) {
	c := &Contact{
		ID:             uuid.New(),
		OrganizationID: req.OrganizationID,
		NameEN:         req.NameEN,
		NameAR:         req.NameAR,
		NationalID:     req.NationalID,
		Role:           req.Role,
		Phone:          req.Phone,
		Email:          req.Email,
		IsGuarantor:    req.IsGuarantor,
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, fmt.Errorf("create contact: %w", err)
	}
	return c, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Contact, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, limit, offset int, search string) ([]Contact, int, error) {
	return s.repo.List(ctx, limit, offset, search)
}

func (s *Service) ListByOrganization(ctx context.Context, orgID uuid.UUID) ([]Contact, error) {
	return s.repo.ListByOrganization(ctx, orgID)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Contact, error) {
	return s.repo.Update(ctx, id, req)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
