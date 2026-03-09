package activity

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, activity *Activity) error {
	query := `
		INSERT INTO activities (id, entity_type, entity_id, user_id, action, description, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`
	_, err := r.db.Exec(ctx, query,
		activity.ID,
		activity.EntityType,
		activity.EntityID,
		activity.UserID,
		activity.Action,
		activity.Description,
		activity.Metadata,
		activity.CreatedAt,
	)
	return err
}

func (r *Repository) ListByEntity(ctx context.Context, entityType string, entityID uuid.UUID, limit, offset int) ([]Activity, int, error) {
	var total int
	countQuery := `SELECT COUNT(*) FROM activities WHERE entity_type = $1 AND entity_id = $2`
	if err := r.db.QueryRow(ctx, countQuery, entityType, entityID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, entity_type, entity_id, user_id, action, description, metadata, created_at
		FROM activities
		WHERE entity_type = $1 AND entity_id = $2
		ORDER BY created_at DESC
		LIMIT $3 OFFSET $4
	`
	rows, err := r.db.Query(ctx, query, entityType, entityID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	activities := make([]Activity, 0)
	for rows.Next() {
		var a Activity
		if err := rows.Scan(&a.ID, &a.EntityType, &a.EntityID, &a.UserID, &a.Action, &a.Description, &a.Metadata, &a.CreatedAt); err != nil {
			return nil, 0, err
		}
		activities = append(activities, a)
	}

	return activities, total, rows.Err()
}

func (r *Repository) ListByUser(ctx context.Context, userID uuid.UUID, limit, offset int) ([]Activity, int, error) {
	var total int
	countQuery := `SELECT COUNT(*) FROM activities WHERE user_id = $1`
	if err := r.db.QueryRow(ctx, countQuery, userID).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `
		SELECT id, entity_type, entity_id, user_id, action, description, metadata, created_at
		FROM activities
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`
	rows, err := r.db.Query(ctx, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	activities := make([]Activity, 0)
	for rows.Next() {
		var a Activity
		if err := rows.Scan(&a.ID, &a.EntityType, &a.EntityID, &a.UserID, &a.Action, &a.Description, &a.Metadata, &a.CreatedAt); err != nil {
			return nil, 0, err
		}
		activities = append(activities, a)
	}

	return activities, total, rows.Err()
}
