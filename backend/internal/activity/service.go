package activity

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type repository interface {
	Create(ctx context.Context, activity *Activity) error
	ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]Activity, int, error)
	ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Activity, int, error)
}

type Service struct {
	repo repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, userID uuid.UUID, req CreateRequest) (*Activity, error) {
	activity := &Activity{
		ID:          uuid.New(),
		EntityType:  req.EntityType,
		EntityID:    req.EntityID,
		UserID:      userID,
		Action:      req.Action,
		Description: req.Description,
		Metadata:    req.Metadata,
		CreatedAt:   time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, activity); err != nil {
		return nil, err
	}

	return activity, nil
}

func (s *Service) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]Activity, int, error) {
	return s.repo.ListByEntity(ctx, entityType, entityID, limit, offset)
}

func (s *Service) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Activity, int, error) {
	return s.repo.ListByUser(ctx, userID, limit, offset)
}
