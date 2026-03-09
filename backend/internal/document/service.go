package document

import (
	"context"
	"fmt"
	"path/filepath"
	"time"

	"github.com/google/uuid"
)

type repository interface {
	Create(ctx context.Context, doc *Document) error
	GetByID(ctx context.Context, id uuid.UUID) (*Document, error)
	ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*Document, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

type Service struct {
	repo repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, req *UploadRequest, uploadedBy uuid.UUID, fileSize int64, mimeType string) (*Document, error) {
	id := uuid.New()
	filePath := fmt.Sprintf("uploads/%s/%s/%s_%s", req.EntityType, req.EntityID.String(), id.String(), req.Name)

	doc := &Document{
		ID:         id,
		EntityType: req.EntityType,
		EntityID:   req.EntityID,
		Name:       filepath.Base(req.Name),
		FilePath:   filePath,
		FileSize:   fileSize,
		MimeType:   mimeType,
		Category:   req.Category,
		UploadedBy: uploadedBy,
		CreatedAt:  time.Now().UTC(),
	}

	err := s.repo.Create(ctx, doc)
	if err != nil {
		return nil, err
	}

	return doc, nil
}

func (s *Service) GetByID(ctx context.Context, id uuid.UUID) (*Document, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*Document, error) {
	return s.repo.ListByEntity(ctx, entityType, entityID)
}

func (s *Service) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}
