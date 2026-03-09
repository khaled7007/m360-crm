package lead

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

func (r *Repository) Create(ctx context.Context, l *Lead) error {
	query := `
		INSERT INTO leads (id, organization_id, contact_name, contact_phone, contact_email,
			company_name, source, status, estimated_amount, notes, assigned_officer_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		l.ID, l.OrganizationID, l.ContactName, l.ContactPhone, l.ContactEmail,
		l.CompanyName, l.Source, l.Status, l.EstimatedAmount, l.Notes, l.AssignedOfficerID,
	).Scan(&l.CreatedAt, &l.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Lead, error) {
	query := `
		SELECT id, organization_id, contact_name, contact_phone, contact_email, company_name,
			source, status, estimated_amount, notes, assigned_officer_id, created_at, updated_at
		FROM leads WHERE id = $1`

	var l Lead
	err := r.db.QueryRow(ctx, query, id).Scan(
		&l.ID, &l.OrganizationID, &l.ContactName, &l.ContactPhone, &l.ContactEmail, &l.CompanyName,
		&l.Source, &l.Status, &l.EstimatedAmount, &l.Notes, &l.AssignedOfficerID, &l.CreatedAt, &l.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get lead: %w", err)
	}
	return &l, nil
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Lead, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if params.Status != nil {
		where = append(where, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *params.Status)
		argIdx++
	}

	if params.AssignedOfficer != nil {
		where = append(where, fmt.Sprintf("assigned_officer_id = $%d", argIdx))
		args = append(args, *params.AssignedOfficer)
		argIdx++
	}

	if params.Search != "" {
		where = append(where, fmt.Sprintf("(contact_name ILIKE $%d OR company_name ILIKE $%d)", argIdx, argIdx))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM leads WHERE %s", whereClause)
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count leads: %w", err)
	}

	if params.Limit == 0 {
		params.Limit = 20
	}

	query := fmt.Sprintf(`
		SELECT id, organization_id, contact_name, contact_phone, contact_email, company_name,
			source, status, estimated_amount, notes, assigned_officer_id, created_at, updated_at
		FROM leads WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list leads: %w", err)
	}
	defer rows.Close()

	var leads []Lead
	for rows.Next() {
		var l Lead
		if err := rows.Scan(
			&l.ID, &l.OrganizationID, &l.ContactName, &l.ContactPhone, &l.ContactEmail, &l.CompanyName,
			&l.Source, &l.Status, &l.EstimatedAmount, &l.Notes, &l.AssignedOfficerID, &l.CreatedAt, &l.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan lead: %w", err)
		}
		leads = append(leads, l)
	}

	return leads, total, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Lead, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.ContactName != nil {
		sets = append(sets, fmt.Sprintf("contact_name = $%d", argIdx))
		args = append(args, *req.ContactName)
		argIdx++
	}
	if req.ContactPhone != nil {
		sets = append(sets, fmt.Sprintf("contact_phone = $%d", argIdx))
		args = append(args, *req.ContactPhone)
		argIdx++
	}
	if req.ContactEmail != nil {
		sets = append(sets, fmt.Sprintf("contact_email = $%d", argIdx))
		args = append(args, *req.ContactEmail)
		argIdx++
	}
	if req.CompanyName != nil {
		sets = append(sets, fmt.Sprintf("company_name = $%d", argIdx))
		args = append(args, *req.CompanyName)
		argIdx++
	}
	if req.Source != nil {
		sets = append(sets, fmt.Sprintf("source = $%d", argIdx))
		args = append(args, *req.Source)
		argIdx++
	}
	if req.Status != nil {
		sets = append(sets, fmt.Sprintf("status = $%d", argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.EstimatedAmount != nil {
		sets = append(sets, fmt.Sprintf("estimated_amount = $%d", argIdx))
		args = append(args, *req.EstimatedAmount)
		argIdx++
	}
	if req.Notes != nil {
		sets = append(sets, fmt.Sprintf("notes = $%d", argIdx))
		args = append(args, *req.Notes)
		argIdx++
	}
	if req.OrganizationID != nil {
		sets = append(sets, fmt.Sprintf("organization_id = $%d", argIdx))
		args = append(args, *req.OrganizationID)
		argIdx++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE leads SET %s WHERE id = $%d", strings.Join(sets, ", "), argIdx)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update lead: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM leads WHERE id = $1", id)
	return err
}
