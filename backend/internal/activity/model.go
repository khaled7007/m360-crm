package activity

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Activity struct {
	ID          uuid.UUID       `json:"id"`
	EntityType  string          `json:"entity_type"`
	EntityID    uuid.UUID       `json:"entity_id"`
	UserID      uuid.UUID       `json:"user_id"`
	Action      string          `json:"action"`
	Description *string         `json:"description"`
	Metadata    json.RawMessage `json:"metadata"`
	CreatedAt   time.Time       `json:"created_at"`
}

type CreateRequest struct {
	EntityType  string          `json:"entity_type" validate:"required"`
	EntityID    uuid.UUID       `json:"entity_id" validate:"required"`
	Action      string          `json:"action" validate:"required"`
	Description *string         `json:"description"`
	Metadata    json.RawMessage `json:"metadata"`
}
