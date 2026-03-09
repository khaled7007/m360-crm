package document

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, doc *Document) error {
	query := `
		INSERT INTO documents (id, entity_type, entity_id, name, file_path, file_size, mime_type, category, uploaded_by, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	err := r.db.QueryRow(
		ctx,
		query,
		doc.ID,
		doc.EntityType,
		doc.EntityID,
		doc.Name,
		doc.FilePath,
		doc.FileSize,
		doc.MimeType,
		doc.Category,
		doc.UploadedBy,
		doc.CreatedAt,
	).Scan()

	if err != nil {
		return err
	}

	return nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Document, error) {
	query := `
		SELECT id, entity_type, entity_id, name, file_path, file_size, mime_type, category, uploaded_by, created_at
		FROM documents
		WHERE id = $1
	`

	doc := &Document{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&doc.ID,
		&doc.EntityType,
		&doc.EntityID,
		&doc.Name,
		&doc.FilePath,
		&doc.FileSize,
		&doc.MimeType,
		&doc.Category,
		&doc.UploadedBy,
		&doc.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return doc, nil
}

func (r *Repository) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID) ([]*Document, error) {
	query := `
		SELECT id, entity_type, entity_id, name, file_path, file_size, mime_type, category, uploaded_by, created_at
		FROM documents
		WHERE entity_type = $1 AND entity_id = $2
		ORDER BY created_at DESC
	`

	rows, err := r.db.Query(ctx, query, entityType, entityID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var documents []*Document
	for rows.Next() {
		doc := &Document{}
		err := rows.Scan(
			&doc.ID,
			&doc.EntityType,
			&doc.EntityID,
			&doc.Name,
			&doc.FilePath,
			&doc.FileSize,
			&doc.MimeType,
			&doc.Category,
			&doc.UploadedBy,
			&doc.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		documents = append(documents, doc)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return documents, nil
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM documents WHERE id = $1`

	result, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return err
	}

	if result.RowsAffected() == 0 {
		return errors.New("document not found")
	}

	return nil
}
