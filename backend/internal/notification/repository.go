package notification

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

func (r *Repository) Create(ctx context.Context, req *CreateRequest) (*Notification, error) {
	notification := &Notification{
		ID:         uuid.New(),
		UserID:     req.UserID,
		Title:      req.Title,
		Body:       req.Body,
		Type:       req.Type,
		EntityType: req.EntityType,
		EntityID:   req.EntityID,
		IsRead:     false,
	}

	query := `
		INSERT INTO notifications (id, user_id, title, body, type, entity_type, entity_id, is_read, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
		RETURNING created_at
	`

	err := r.db.QueryRow(ctx, query,
		notification.ID,
		notification.UserID,
		notification.Title,
		notification.Body,
		notification.Type,
		notification.EntityType,
		notification.EntityID,
		notification.IsRead,
	).Scan(&notification.CreatedAt)

	if err != nil {
		return nil, err
	}

	return notification, nil
}

func (r *Repository) ListByUser(ctx context.Context, userID uuid.UUID, unreadOnly bool, limit, offset int) ([]*Notification, error) {
	query := `
		SELECT id, user_id, title, body, type, entity_type, entity_id, is_read, created_at
		FROM notifications
		WHERE user_id = $1
	`

	args := []interface{}{userID}

	if unreadOnly {
		query += ` AND is_read = false`
	}

	query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []*Notification
	for rows.Next() {
		var n Notification
		err := rows.Scan(
			&n.ID,
			&n.UserID,
			&n.Title,
			&n.Body,
			&n.Type,
			&n.EntityType,
			&n.EntityID,
			&n.IsRead,
			&n.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		notifications = append(notifications, &n)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return notifications, nil
}

func (r *Repository) MarkAsRead(ctx context.Context, id uuid.UUID) error {
	query := `UPDATE notifications SET is_read = true WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	return err
}

func (r *Repository) MarkAllRead(ctx context.Context, userID uuid.UUID) error {
	query := `UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false`
	_, err := r.db.Exec(ctx, query, userID)
	return err
}

func (r *Repository) CountUnread(ctx context.Context, userID uuid.UUID) (int, error) {
	query := `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`
	var count int
	err := r.db.QueryRow(ctx, query, userID).Scan(&count)
	return count, err
}
