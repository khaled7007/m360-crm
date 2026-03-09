package contact

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, c *Contact) error {
	query := `
		INSERT INTO contacts (id, organization_id, name_en, name_ar, national_id, role, phone, email, is_guarantor)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		c.ID, c.OrganizationID, c.NameEN, c.NameAR, c.NationalID, c.Role, c.Phone, c.Email, c.IsGuarantor,
	).Scan(&c.CreatedAt, &c.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Contact, error) {
	query := `
		SELECT id, organization_id, name_en, name_ar, national_id, role, phone, email,
			nafath_verified, simah_score, is_guarantor, created_at, updated_at
		FROM contacts WHERE id = $1`

	var c Contact
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.OrganizationID, &c.NameEN, &c.NameAR, &c.NationalID, &c.Role, &c.Phone, &c.Email,
		&c.NafathVerified, &c.SIMAHScore, &c.IsGuarantor, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get contact: %w", err)
	}
	return &c, nil
}

func (r *Repository) List(ctx context.Context, limit, offset int, search string) ([]Contact, int, error) {
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	if offset < 0 {
		offset = 0
	}

	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if search != "" {
		where = append(where, fmt.Sprintf("(name_en ILIKE $%d OR name_ar ILIKE $%d OR email ILIKE $%d OR phone ILIKE $%d)", argIdx, argIdx, argIdx, argIdx))
		args = append(args, "%"+search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM contacts WHERE %s", whereClause)
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count contacts: %w", err)
	}

	query := fmt.Sprintf(`
		SELECT id, organization_id, name_en, name_ar, national_id, role, phone, email,
			nafath_verified, simah_score, is_guarantor, created_at, updated_at
		FROM contacts WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list contacts: %w", err)
	}
	defer rows.Close()

	var contacts []Contact
	for rows.Next() {
		var c Contact
		if err := rows.Scan(
			&c.ID, &c.OrganizationID, &c.NameEN, &c.NameAR, &c.NationalID, &c.Role, &c.Phone, &c.Email,
			&c.NafathVerified, &c.SIMAHScore, &c.IsGuarantor, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan contact: %w", err)
		}
		contacts = append(contacts, c)
	}
	return contacts, total, rows.Err()
}

func (r *Repository) ListByOrganization(ctx context.Context, orgID uuid.UUID) ([]Contact, error) {
	query := `
		SELECT id, organization_id, name_en, name_ar, national_id, role, phone, email,
			nafath_verified, simah_score, is_guarantor, created_at, updated_at
		FROM contacts WHERE organization_id = $1
		ORDER BY created_at ASC`

	rows, err := r.db.Query(ctx, query, orgID)
	if err != nil {
		return nil, fmt.Errorf("list contacts: %w", err)
	}
	defer rows.Close()

	var contacts []Contact
	for rows.Next() {
		var c Contact
		if err := rows.Scan(
			&c.ID, &c.OrganizationID, &c.NameEN, &c.NameAR, &c.NationalID, &c.Role, &c.Phone, &c.Email,
			&c.NafathVerified, &c.SIMAHScore, &c.IsGuarantor, &c.CreatedAt, &c.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan contact: %w", err)
		}
		contacts = append(contacts, c)
	}
	return contacts, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Contact, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.NameEN != nil {
		sets = append(sets, fmt.Sprintf("name_en = $%d", argIdx))
		args = append(args, *req.NameEN)
		argIdx++
	}
	if req.NameAR != nil {
		sets = append(sets, fmt.Sprintf("name_ar = $%d", argIdx))
		args = append(args, *req.NameAR)
		argIdx++
	}
	if req.NationalID != nil {
		sets = append(sets, fmt.Sprintf("national_id = $%d", argIdx))
		args = append(args, *req.NationalID)
		argIdx++
	}
	if req.Role != nil {
		sets = append(sets, fmt.Sprintf("role = $%d", argIdx))
		args = append(args, *req.Role)
		argIdx++
	}
	if req.Phone != nil {
		sets = append(sets, fmt.Sprintf("phone = $%d", argIdx))
		args = append(args, *req.Phone)
		argIdx++
	}
	if req.Email != nil {
		sets = append(sets, fmt.Sprintf("email = $%d", argIdx))
		args = append(args, *req.Email)
		argIdx++
	}
	if req.IsGuarantor != nil {
		sets = append(sets, fmt.Sprintf("is_guarantor = $%d", argIdx))
		args = append(args, *req.IsGuarantor)
		argIdx++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE contacts SET %s WHERE id = $%d", strings.Join(sets, ", "), argIdx)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update contact: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM contacts WHERE id = $1", id)
	return err
}
