package product

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, p *Product) error {
	query := `INSERT INTO products (id, name_en, name_ar, type, min_amount, max_amount,
		min_tenor_months, max_tenor_months, profit_rate, admin_fee_pct, payment_frequency,
		required_documents, is_active)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
		RETURNING created_at, updated_at`
	return r.db.QueryRow(ctx, query, p.ID, p.NameEN, p.NameAR, p.Type, p.MinAmount, p.MaxAmount,
		p.MinTenorMonths, p.MaxTenorMonths, p.ProfitRate, p.AdminFeePct, p.PaymentFrequency,
		p.RequiredDocuments, p.IsActive).Scan(&p.CreatedAt, &p.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Product, error) {
	query := `SELECT id, name_en, name_ar, type, min_amount, max_amount, min_tenor_months,
		max_tenor_months, profit_rate, admin_fee_pct, payment_frequency, eligibility_criteria,
		required_documents, is_active, created_at, updated_at FROM products WHERE id = $1`
	var p Product
	err := r.db.QueryRow(ctx, query, id).Scan(&p.ID, &p.NameEN, &p.NameAR, &p.Type,
		&p.MinAmount, &p.MaxAmount, &p.MinTenorMonths, &p.MaxTenorMonths, &p.ProfitRate,
		&p.AdminFeePct, &p.PaymentFrequency, &p.EligibilityCriteria, &p.RequiredDocuments,
		&p.IsActive, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get product: %w", err)
	}
	return &p, nil
}

func (r *Repository) List(ctx context.Context, activeOnly bool) ([]Product, error) {
	query := `SELECT id, name_en, name_ar, type, min_amount, max_amount, min_tenor_months,
		max_tenor_months, profit_rate, admin_fee_pct, payment_frequency, eligibility_criteria,
		required_documents, is_active, created_at, updated_at FROM products`
	if activeOnly {
		query += " WHERE is_active = true"
	}
	query += " ORDER BY created_at DESC"
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list products: %w", err)
	}
	defer rows.Close()
	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(&p.ID, &p.NameEN, &p.NameAR, &p.Type, &p.MinAmount, &p.MaxAmount,
			&p.MinTenorMonths, &p.MaxTenorMonths, &p.ProfitRate, &p.AdminFeePct,
			&p.PaymentFrequency, &p.EligibilityCriteria, &p.RequiredDocuments, &p.IsActive,
			&p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, fmt.Errorf("scan product: %w", err)
		}
		products = append(products, p)
	}
	return products, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Product, error) {
	if req.IsActive != nil {
		_, err := r.db.Exec(ctx, "UPDATE products SET is_active=$1, updated_at=NOW() WHERE id=$2", *req.IsActive, id)
		if err != nil {
			return nil, fmt.Errorf("update product: %w", err)
		}
	}
	if req.ProfitRate != nil {
		_, err := r.db.Exec(ctx, "UPDATE products SET profit_rate=$1, updated_at=NOW() WHERE id=$2", *req.ProfitRate, id)
		if err != nil {
			return nil, fmt.Errorf("update product: %w", err)
		}
	}
	if req.NameEN != nil {
		_, err := r.db.Exec(ctx, "UPDATE products SET name_en=$1, updated_at=NOW() WHERE id=$2", *req.NameEN, id)
		if err != nil {
			return nil, fmt.Errorf("update product: %w", err)
		}
	}
	return r.GetByID(ctx, id)
}
