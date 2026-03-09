package collection

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Service handles business logic for collection operations
type Service struct {
	repo *Repository
}

// NewService creates a new collection service
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// Create creates a new collection action
func (s *Service) Create(ctx context.Context, officerID uuid.UUID, req *CreateRequest) (*CollectionAction, error) {
	var nextActionDate *time.Time
	if req.NextActionDate != nil {
		parsedDate, err := time.Parse(time.RFC3339, *req.NextActionDate)
		if err != nil {
			return nil, fmt.Errorf("invalid next_action_date format: %w", err)
		}
		nextActionDate = &parsedDate
	}

	action := &CollectionAction{
		ID:             uuid.New(),
		FacilityID:     req.FacilityID,
		OfficerID:      officerID,
		ActionType:     req.ActionType,
		Description:    req.Description,
		NextActionDate: nextActionDate,
		CreatedAt:      time.Now().UTC(),
	}

	if err := s.repo.Create(ctx, action); err != nil {
		return nil, fmt.Errorf("failed to create collection action: %w", err)
	}

	return action, nil
}

// ListByFacility lists all collection actions for a specific facility
func (s *Service) ListByFacility(ctx context.Context, facilityID uuid.UUID, limit, offset int) ([]CollectionAction, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	actions, err := s.repo.ListByFacility(ctx, facilityID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list collection actions by facility: %w", err)
	}

	if actions == nil {
		actions = []CollectionAction{}
	}

	return actions, nil
}

// List lists all collection actions with optional facility filter
func (s *Service) List(ctx context.Context, facilityID *uuid.UUID, limit, offset int) ([]CollectionAction, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	actions, total, err := s.repo.List(ctx, facilityID, limit, offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list collection actions: %w", err)
	}

	if actions == nil {
		actions = []CollectionAction{}
	}

	return actions, total, nil
}

// ListByOfficer lists all collection actions for a specific officer
func (s *Service) ListByOfficer(ctx context.Context, officerID uuid.UUID, limit, offset int) ([]CollectionAction, error) {
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	actions, err := s.repo.ListByOfficer(ctx, officerID, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list collection actions by officer: %w", err)
	}

	if actions == nil {
		actions = []CollectionAction{}
	}

	return actions, nil
}

// GetOverdueSummary retrieves a summary of overdue facilities
func (s *Service) GetOverdueSummary(ctx context.Context) (*OverdueSummary, error) {
	facilities, err := s.repo.GetOverdueFacilities(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get overdue facilities: %w", err)
	}

	if facilities == nil {
		facilities = []OverdueFacility{}
	}

	summary := &OverdueSummary{
		TotalOverdueFacilities: len(facilities),
		OverdueFacilities:      facilities,
	}

	return summary, nil
}
