package notification

import (
	"time"

	"github.com/google/uuid"
)

type Notification struct {
	ID         uuid.UUID  `json:"id"`
	UserID     uuid.UUID  `json:"user_id"`
	Title      string     `json:"title"`
	Body       *string    `json:"body"`
	Type       string     `json:"type"`
	EntityType *string    `json:"entity_type"`
	EntityID   *uuid.UUID `json:"entity_id"`
	IsRead     bool       `json:"is_read"`
	CreatedAt  time.Time  `json:"created_at"`
}

type CreateRequest struct {
	UserID     uuid.UUID  `json:"user_id" validate:"required"`
	Title      string     `json:"title" validate:"required"`
	Body       *string    `json:"body"`
	Type       string     `json:"type"`
	EntityType *string    `json:"entity_type"`
	EntityID   *uuid.UUID `json:"entity_id"`
}
