package notification

import (
	"context"

	"github.com/google/uuid"
)

type repository interface {
	Create(ctx context.Context, req *CreateRequest) (*Notification, error)
	ListByUser(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error)
	MarkAsRead(ctx context.Context, id uuid.UUID) error
	MarkAllRead(ctx context.Context, userID uuid.UUID) error
	CountUnread(ctx context.Context, userID uuid.UUID) (int, error)
}

type Service struct {
	repo repository
	hub  *Hub
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// SetHub attaches a WebSocket hub so new notifications are pushed in real time.
func (s *Service) SetHub(hub *Hub) {
	s.hub = hub
}

func (s *Service) Send(ctx context.Context, req *CreateRequest) (*Notification, error) {
	notif, err := s.repo.Create(ctx, req)
	if err != nil {
		return nil, err
	}
	// Push via WebSocket if hub is available
	if s.hub != nil {
		s.hub.Notify(notif.UserID, notif)
	}
	return notif, nil
}

func (s *Service) ListByUser(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error) {
	return s.repo.ListByUser(ctx, userID, unreadOnly, limit, offset)
}

func (s *Service) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	return s.repo.MarkAsRead(ctx, id)
}

func (s *Service) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	return s.repo.MarkAllRead(ctx, userID)
}

func (s *Service) CountUnread(ctx context.Context, userID uuid.UUID) (int, error) {
	return s.repo.CountUnread(ctx, userID)
}
