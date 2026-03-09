package organization

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

func (r *Repository) Create(ctx context.Context, o *Organization) error {
	query := `
		INSERT INTO organizations (id, name_en, name_ar, cr_number, tax_id, industry, legal_structure,
			address_en, address_ar, city, phone, email, website, assigned_officer_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
		RETURNING created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		o.ID, o.NameEN, o.NameAR, o.CRNumber, o.TaxID, o.Industry, o.LegalStructure,
		o.AddressEN, o.AddressAR, o.City, o.Phone, o.Email, o.Website, o.AssignedOfficerID,
	).Scan(&o.CreatedAt, &o.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Organization, error) {
	query := `
		SELECT id, name_en, name_ar, cr_number, cr_verified, tax_id, industry, legal_structure,
			founding_date, address_en, address_ar, city, phone, email, website, assigned_officer_id,
			created_at, updated_at
		FROM organizations WHERE id = $1`

	var o Organization
	err := r.db.QueryRow(ctx, query, id).Scan(
		&o.ID, &o.NameEN, &o.NameAR, &o.CRNumber, &o.CRVerified, &o.TaxID, &o.Industry,
		&o.LegalStructure, &o.FoundingDate, &o.AddressEN, &o.AddressAR, &o.City, &o.Phone,
		&o.Email, &o.Website, &o.AssignedOfficerID, &o.CreatedAt, &o.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("get organization: %w", err)
	}
	return &o, nil
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Organization, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if params.Search != "" {
		where = append(where, fmt.Sprintf("(name_en ILIKE $%d OR name_ar ILIKE $%d OR cr_number ILIKE $%d)", argIdx, argIdx, argIdx))
		args = append(args, "%"+params.Search+"%")
		argIdx++
	}

	if params.AssignedOfficer != nil {
		where = append(where, fmt.Sprintf("assigned_officer_id = $%d", argIdx))
		args = append(args, *params.AssignedOfficer)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM organizations WHERE %s", whereClause)
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count organizations: %w", err)
	}

	if params.Limit == 0 {
		params.Limit = 20
	}

	query := fmt.Sprintf(`
		SELECT id, name_en, name_ar, cr_number, cr_verified, tax_id, industry, legal_structure,
			founding_date, address_en, address_ar, city, phone, email, website, assigned_officer_id,
			created_at, updated_at
		FROM organizations WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d`, whereClause, argIdx, argIdx+1)

	args = append(args, params.Limit, params.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list organizations: %w", err)
	}
	defer rows.Close()

	var orgs []Organization
	for rows.Next() {
		var o Organization
		if err := rows.Scan(
			&o.ID, &o.NameEN, &o.NameAR, &o.CRNumber, &o.CRVerified, &o.TaxID, &o.Industry,
			&o.LegalStructure, &o.FoundingDate, &o.AddressEN, &o.AddressAR, &o.City, &o.Phone,
			&o.Email, &o.Website, &o.AssignedOfficerID, &o.CreatedAt, &o.UpdatedAt,
		); err != nil {
			return nil, 0, fmt.Errorf("scan organization: %w", err)
		}
		orgs = append(orgs, o)
	}

	return orgs, total, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Organization, error) {
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
	if req.CRNumber != nil {
		sets = append(sets, fmt.Sprintf("cr_number = $%d", argIdx))
		args = append(args, *req.CRNumber)
		argIdx++
	}
	if req.TaxID != nil {
		sets = append(sets, fmt.Sprintf("tax_id = $%d", argIdx))
		args = append(args, *req.TaxID)
		argIdx++
	}
	if req.Industry != nil {
		sets = append(sets, fmt.Sprintf("industry = $%d", argIdx))
		args = append(args, *req.Industry)
		argIdx++
	}
	if req.LegalStructure != nil {
		sets = append(sets, fmt.Sprintf("legal_structure = $%d", argIdx))
		args = append(args, *req.LegalStructure)
		argIdx++
	}
	if req.AddressEN != nil {
		sets = append(sets, fmt.Sprintf("address_en = $%d", argIdx))
		args = append(args, *req.AddressEN)
		argIdx++
	}
	if req.AddressAR != nil {
		sets = append(sets, fmt.Sprintf("address_ar = $%d", argIdx))
		args = append(args, *req.AddressAR)
		argIdx++
	}
	if req.City != nil {
		sets = append(sets, fmt.Sprintf("city = $%d", argIdx))
		args = append(args, *req.City)
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
	if req.Website != nil {
		sets = append(sets, fmt.Sprintf("website = $%d", argIdx))
		args = append(args, *req.Website)
		argIdx++
	}

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	setClause := strings.Join(sets, ", ")

	query := fmt.Sprintf("UPDATE organizations SET %s WHERE id = $%d", setClause, argIdx)
	args = append(args, id)

	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update organization: %w", err)
	}

	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM organizations WHERE id = $1", id)
	return err
}
