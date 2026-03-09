package document

import (
	"time"

	"github.com/google/uuid"
)

type Document struct {
	ID         uuid.UUID `json:"id"`
	EntityType string    `json:"entity_type"`
	EntityID   uuid.UUID `json:"entity_id"`
	Name       string    `json:"name"`
	FilePath   string    `json:"file_path"`
	FileSize   int64     `json:"file_size"`
	MimeType   string    `json:"mime_type"`
	Category   *string   `json:"category"`
	UploadedBy uuid.UUID `json:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type UploadRequest struct {
	EntityType string  `json:"entity_type" validate:"required"`
	EntityID   uuid.UUID `json:"entity_id" validate:"required"`
	Name       string  `json:"name" validate:"required"`
	Category   *string `json:"category"`
}
