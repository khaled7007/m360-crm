package application

import (
	"context"
	"fmt"
	"log"

	"github.com/CamelLabSA/M360/backend/internal/committee"
	"github.com/CamelLabSA/M360/backend/internal/document"
	"github.com/CamelLabSA/M360/backend/internal/notification"
	"github.com/google/uuid"
)

type Service struct {
	repo         *Repository
	notifSvc     *notification.Service
	docSvc       *document.Service
	committeeSvc *committee.Service
}

func NewService(repo *Repository, notifSvc *notification.Service, docSvc *document.Service, committeeSvc *committee.Service) *Service {
	return &Service{repo: repo, notifSvc: notifSvc, docSvc: docSvc, committeeSvc: committeeSvc}
}

func (s *Service) Create(ctx context.Context, req CreateRequest, officerID uuid.UUID) (*Application, error) {
	a := &Application{
		ID: uuid.New(), OrganizationID: req.OrganizationID, ProductID: req.ProductID,
		RequestedAmount: req.RequestedAmount, TenorMonths: req.TenorMonths,
		Purpose: req.Purpose, Status: StatusDraft, AssignedOfficerID: &officerID,
	}
	if err := s.repo.Create(ctx, a); err != nil {
		return nil, fmt.Errorf("create application: %w", err)
	}
	return a, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Application, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) List(ctx context.Context, params ListParams) ([]Application, int, error) {
	return s.repo.List(ctx, params)
}

func (s *Service) UpdateStatus(ctx context.Context, id uuid.UUID, req UpdateStatusRequest) (*Application, error) {
	app, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !CanTransition(app.Status, req.Status) {
		return nil, fmt.Errorf("invalid transition from %s to %s", app.Status, req.Status)
	}

	// Business rule prerequisites
	if req.Status == StatusCreditAssessment {
		if s.docSvc == nil {
			return nil, fmt.Errorf("document service not configured")
		}
		docs, err := s.docSvc.ListByEntity(ctx, "application", id)
		if err != nil {
			return nil, fmt.Errorf("checking documents: %w", err)
		}
		if len(docs) == 0 {
			return nil, fmt.Errorf("cannot transition to credit_assessment: at least one document must be uploaded for this application")
		}
	}

	if req.Status == StatusCommitteeReview {
		if s.committeeSvc == nil {
			return nil, fmt.Errorf("committee service not configured")
		}
		_, err := s.committeeSvc.GetByApplicationID(ctx, id)
		if err != nil {
			return nil, fmt.Errorf("cannot transition to committee_review: a committee package must exist for this application")
		}
	}

	updated, err := s.repo.UpdateStatus(ctx, id, req)
	if err != nil {
		return nil, err
	}

	// Send notification to the assigned officer about the status change
	if s.notifSvc != nil && app.AssignedOfficerID != nil {
		body := fmt.Sprintf("Application %s status changed from %s to %s", app.ReferenceNumber, app.Status, req.Status)
		entityType := "application"
		notifReq := &notification.CreateRequest{
			UserID:     *app.AssignedOfficerID,
			Title:      "Application Status Updated",
			Body:       &body,
			Type:       "status_change",
			EntityType: &entityType,
			EntityID:   &app.ID,
		}
		if _, err := s.notifSvc.Send(ctx, notifReq); err != nil {
			log.Printf("failed to send status change notification for application %s: %v", app.ID, err)
		}
	}

	return updated, nil
}
