package collection

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles database operations for collection actions
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new collection repository
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// Create inserts a new collection action into the database
func (r *Repository) Create(ctx context.Context, action *CollectionAction) error {
	query := `
		INSERT INTO collection_actions (id, facility_id, officer_id, action_type, description, next_action_date, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, facility_id, officer_id, action_type, description, next_action_date, created_at
	`

	var nextActionDate *time.Time
	if action.NextActionDate != nil {
		nextActionDate = action.NextActionDate
	}

	err := r.db.QueryRow(ctx, query,
		action.ID,
		action.FacilityID,
		action.OfficerID,
		action.ActionType,
		action.Description,
		nextActionDate,
		action.CreatedAt,
	).Scan(
		&action.ID,
		&action.FacilityID,
		&action.OfficerID,
		&action.ActionType,
		&action.Description,
		&action.NextActionDate,
		&action.CreatedAt,
	)

	return err
}

// ListByFacility retrieves all collection actions for a specific facility
func (r *Repository) ListByFacility(ctx context.Context, facilityID uuid.UUID, limit, offset int) ([]CollectionAction, error) {
	query := `
		SELECT id, facility_id, officer_id, action_type, description, next_action_date, created_at
		FROM collection_actions
		WHERE facility_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, facilityID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var actions []CollectionAction
	for rows.Next() {
		var action CollectionAction
		err := rows.Scan(
			&action.ID,
			&action.FacilityID,
			&action.OfficerID,
			&action.ActionType,
			&action.Description,
			&action.NextActionDate,
			&action.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		actions = append(actions, action)
	}

	return actions, rows.Err()
}

// List retrieves all collection actions with optional facility filter, pagination
func (r *Repository) List(ctx context.Context, facilityID *uuid.UUID, limit, offset int) ([]CollectionAction, int, error) {
	where := "1=1"
	args := []interface{}{}
	argIdx := 1

	if facilityID != nil {
		where += fmt.Sprintf(" AND facility_id = $%d", argIdx)
		args = append(args, *facilityID)
		argIdx++
	}

	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM collection_actions WHERE %s", where)
	var total int
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := fmt.Sprintf(`
		SELECT id, facility_id, officer_id, action_type, description, next_action_date, created_at
		FROM collection_actions
		WHERE %s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, where, argIdx, argIdx+1)
	args = append(args, limit, offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var actions []CollectionAction
	for rows.Next() {
		var action CollectionAction
		err := rows.Scan(
			&action.ID,
			&action.FacilityID,
			&action.OfficerID,
			&action.ActionType,
			&action.Description,
			&action.NextActionDate,
			&action.CreatedAt,
		)
		if err != nil {
			return nil, 0, err
		}
		actions = append(actions, action)
	}

	return actions, total, rows.Err()
}

// ListByOfficer retrieves all collection actions for a specific officer
func (r *Repository) ListByOfficer(ctx context.Context, officerID uuid.UUID, limit, offset int) ([]CollectionAction, error) {
	query := `
		SELECT id, facility_id, officer_id, action_type, description, next_action_date, created_at
		FROM collection_actions
		WHERE officer_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`

	rows, err := r.db.Query(ctx, query, officerID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var actions []CollectionAction
	for rows.Next() {
		var action CollectionAction
		err := rows.Scan(
			&action.ID,
			&action.FacilityID,
			&action.OfficerID,
			&action.ActionType,
			&action.Description,
			&action.NextActionDate,
			&action.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		actions = append(actions, action)
	}

	return actions, rows.Err()
}

// GetOverdueFacilities retrieves all facilities with overdue payments
func (r *Repository) GetOverdueFacilities(ctx context.Context) ([]OverdueFacility, error) {
	query := `
		SELECT
			f.id,
			f.reference_number,
			o.name_en as borrower_name,
			COALESCE(rs.total_amount - rs.paid_amount, 0) as overdue_amount,
			EXTRACT(DAY FROM NOW() - rs.due_date)::int as days_overdue,
			MAX(ca.created_at) as last_collection_date,
			COUNT(ca.id)::int as collection_count
		FROM facilities f
		JOIN organizations o ON f.organization_id = o.id
		JOIN repayment_schedule rs ON f.id = rs.facility_id
		LEFT JOIN collection_actions ca ON f.id = ca.facility_id
		WHERE rs.is_overdue = true
		GROUP BY f.id, f.reference_number, o.name_en, rs.total_amount, rs.paid_amount, rs.due_date
		ORDER BY rs.due_date ASC
	`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []OverdueFacility
	for rows.Next() {
		var facility OverdueFacility
		var lastCollectionDate *time.Time

		err := rows.Scan(
			&facility.ID,
			&facility.FacilityNumber,
			&facility.BorrowerName,
			&facility.OverdueAmount,
			&facility.DaysOverdue,
			&lastCollectionDate,
			&facility.CollectionCount,
		)
		if err != nil {
			return nil, err
		}

		facility.LastCollectionDate = lastCollectionDate
		facilities = append(facilities, facility)
	}

	return facilities, rows.Err()
}
