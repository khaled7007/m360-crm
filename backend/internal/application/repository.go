package application

import (
	"context"
	"fmt"
	"math/rand"
	"strings"
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

func generateRefNumber() string {
	return fmt.Sprintf("APP-%s-%04d", time.Now().Format("0601"), rand.Intn(10000))
}

func (r *Repository) Create(ctx context.Context, a *Application) error {
	a.ReferenceNumber = generateRefNumber()
	query := `INSERT INTO applications (id, reference_number, organization_id, product_id,
		requested_amount, tenor_months, purpose, status, assigned_officer_id)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING created_at, updated_at`
	return r.db.QueryRow(ctx, query, a.ID, a.ReferenceNumber, a.OrganizationID, a.ProductID,
		a.RequestedAmount, a.TenorMonths, a.Purpose, a.Status, a.AssignedOfficerID,
	).Scan(&a.CreatedAt, &a.UpdatedAt)
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Application, error) {
	query := `SELECT id, reference_number, organization_id, product_id, requested_amount,
		approved_amount, tenor_months, profit_rate, purpose, status, assigned_officer_id,
		credit_analyst_id, compliance_officer_id, pre_approval_date, approval_date,
		rejection_reason, created_at, updated_at FROM applications WHERE id = $1`
	var a Application
	err := r.db.QueryRow(ctx, query, id).Scan(&a.ID, &a.ReferenceNumber, &a.OrganizationID,
		&a.ProductID, &a.RequestedAmount, &a.ApprovedAmount, &a.TenorMonths, &a.ProfitRate,
		&a.Purpose, &a.Status, &a.AssignedOfficerID, &a.CreditAnalystID,
		&a.ComplianceOfficerID, &a.PreApprovalDate, &a.ApprovalDate, &a.RejectionReason,
		&a.CreatedAt, &a.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("get application: %w", err)
	}
	return &a, nil
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Application, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	idx := 1

	if params.Status != nil {
		where = append(where, fmt.Sprintf("status = $%d", idx))
		args = append(args, *params.Status)
		idx++
	}
	if params.OrganizationID != nil {
		where = append(where, fmt.Sprintf("organization_id = $%d", idx))
		args = append(args, *params.OrganizationID)
		idx++
	}
	if params.AssignedOfficer != nil {
		where = append(where, fmt.Sprintf("assigned_officer_id = $%d", idx))
		args = append(args, *params.AssignedOfficer)
		idx++
	}
	if params.Search != "" {
		where = append(where, fmt.Sprintf("reference_number ILIKE $%d", idx))
		args = append(args, "%"+params.Search+"%")
		idx++
	}

	wc := strings.Join(where, " AND ")
	var total int
	if err := r.db.QueryRow(ctx, "SELECT COUNT(*) FROM applications WHERE "+wc, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	if params.Limit == 0 {
		params.Limit = 20
	}
	query := fmt.Sprintf(`SELECT id, reference_number, organization_id, product_id, requested_amount,
		approved_amount, tenor_months, profit_rate, purpose, status, assigned_officer_id,
		credit_analyst_id, compliance_officer_id, pre_approval_date, approval_date,
		rejection_reason, created_at, updated_at FROM applications WHERE %s
		ORDER BY created_at DESC LIMIT $%d OFFSET $%d`, wc, idx, idx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var apps []Application
	for rows.Next() {
		var a Application
		if err := rows.Scan(&a.ID, &a.ReferenceNumber, &a.OrganizationID, &a.ProductID,
			&a.RequestedAmount, &a.ApprovedAmount, &a.TenorMonths, &a.ProfitRate, &a.Purpose,
			&a.Status, &a.AssignedOfficerID, &a.CreditAnalystID, &a.ComplianceOfficerID,
			&a.PreApprovalDate, &a.ApprovalDate, &a.RejectionReason, &a.CreatedAt, &a.UpdatedAt); err != nil {
			return nil, 0, err
		}
		apps = append(apps, a)
	}
	return apps, total, nil
}

func (r *Repository) UpdateStatus(ctx context.Context, id uuid.UUID, req UpdateStatusRequest) (*Application, error) {
	sets := []string{fmt.Sprintf("status = $1")}
	args := []interface{}{req.Status}
	idx := 2

	if req.ApprovedAmount != nil {
		sets = append(sets, fmt.Sprintf("approved_amount = $%d", idx))
		args = append(args, *req.ApprovedAmount)
		idx++
	}
	if req.ProfitRate != nil {
		sets = append(sets, fmt.Sprintf("profit_rate = $%d", idx))
		args = append(args, *req.ProfitRate)
		idx++
	}
	if req.RejectionReason != nil {
		sets = append(sets, fmt.Sprintf("rejection_reason = $%d", idx))
		args = append(args, *req.RejectionReason)
		idx++
	}
	if req.Status == StatusPreApproved {
		sets = append(sets, fmt.Sprintf("pre_approval_date = $%d", idx))
		args = append(args, time.Now())
		idx++
	}
	if req.Status == StatusApproved {
		sets = append(sets, fmt.Sprintf("approval_date = $%d", idx))
		args = append(args, time.Now())
		idx++
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE applications SET %s WHERE id = $%d", strings.Join(sets, ", "), idx)
	args = append(args, id)
	_, err := r.db.Exec(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("update application status: %w", err)
	}
	return r.GetByID(ctx, id)
}
