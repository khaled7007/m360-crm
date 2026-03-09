package product

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req CreateRequest) (*Product, error) {
	docs := req.RequiredDocuments
	if docs == nil {
		docs = json.RawMessage("[]")
	}
	p := &Product{
		ID: uuid.New(), NameEN: req.NameEN, NameAR: req.NameAR, Type: "murabaha",
		MinAmount: req.MinAmount, MaxAmount: req.MaxAmount, MinTenorMonths: req.MinTenorMonths,
		MaxTenorMonths: req.MaxTenorMonths, ProfitRate: req.ProfitRate, AdminFeePct: req.AdminFeePct,
		PaymentFrequency: req.PaymentFrequency, RequiredDocuments: docs, IsActive: true,
	}
	if err := s.repo.Create(ctx, p); err != nil {
		return nil, fmt.Errorf("create product: %w", err)
	}
	return p, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Product, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, activeOnly bool) ([]Product, error) {
	return s.repo.List(ctx, activeOnly)
}

func (s *Service) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Product, error) {
	return s.repo.Update(ctx, id, req)
}
