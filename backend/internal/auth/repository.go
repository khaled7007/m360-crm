package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) CreateUser(ctx context.Context, u *User) error {
	query := `
		INSERT INTO users (id, email, password_hash, name_en, name_ar, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`

	_, err := r.db.Exec(ctx, query, u.ID, u.Email, u.PasswordHash, u.NameEN, u.NameAR, u.Role, u.IsActive)
	if err != nil {
		return fmt.Errorf("create user: %w", err)
	}
	return nil
}

func (r *Repository) GetByEmail(ctx context.Context, email string) (*User, error) {
	query := `
		SELECT id, email, password_hash, name_en, name_ar, role, is_active, created_at, updated_at
		FROM users WHERE email = $1`

	var u User
	err := r.db.QueryRow(ctx, query, email).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.NameEN, &u.NameAR, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get user by email: %w", err)
	}
	return &u, nil
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*User, error) {
	query := `
		SELECT id, email, password_hash, name_en, name_ar, role, is_active, created_at, updated_at
		FROM users WHERE id = $1`

	var u User
	err := r.db.QueryRow(ctx, query, id).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.NameEN, &u.NameAR, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get user by id: %w", err)
	}
	return &u, nil
}

func (r *Repository) SetResetToken(ctx context.Context, email, token string, expires time.Time) error {
	query := `UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE email = $3`
	result, err := r.db.Exec(ctx, query, token, expires, email)
	if err != nil {
		return fmt.Errorf("set reset token: %w", err)
	}
	if result.RowsAffected() == 0 {
		return fmt.Errorf("user not found")
	}
	return nil
}

func (r *Repository) GetByResetToken(ctx context.Context, token string) (*User, error) {
	query := `
		SELECT id, email, password_hash, name_en, name_ar, role, is_active, created_at, updated_at
		FROM users WHERE password_reset_token = $1 AND password_reset_expires > NOW()`
	var u User
	err := r.db.QueryRow(ctx, query, token).Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.NameEN, &u.NameAR, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("invalid or expired reset token")
	}
	return &u, nil
}

func (r *Repository) UpdatePassword(ctx context.Context, userID uuid.UUID, passwordHash string) error {
	query := `UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expires = NULL, updated_at = NOW() WHERE id = $2`
	_, err := r.db.Exec(ctx, query, passwordHash, userID)
	return err
}

func (r *Repository) ListUsers(ctx context.Context, limit, offset int, search string) ([]User, int, error) {
	where := "WHERE 1=1"
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		where += fmt.Sprintf(" AND (email ILIKE $%d OR name_en ILIKE $%d OR name_ar ILIKE $%d)", argIdx, argIdx, argIdx)
		args = append(args, "%"+search+"%")
		argIdx++
	}

	countQuery := "SELECT COUNT(*) FROM users " + where
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	query := `
		SELECT id, email, password_hash, name_en, name_ar, role, is_active, created_at, updated_at
		FROM users ` + where + ` ORDER BY created_at DESC LIMIT $` + fmt.Sprint(argIdx) + ` OFFSET $` + fmt.Sprint(argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []User
	for rows.Next() {
		var u User
		if err := rows.Scan(&u.ID, &u.Email, &u.PasswordHash, &u.NameEN, &u.NameAR, &u.Role, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		u.PasswordHash = ""
		users = append(users, u)
	}
	return users, total, rows.Err()
}
