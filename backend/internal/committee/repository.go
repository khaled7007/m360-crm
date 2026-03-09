package committee

import (
	"context"
	"encoding/json"
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

func (r *Repository) CreatePackage(ctx context.Context, pkg *Package) error {
	query := `
		INSERT INTO committee_packages (id, application_id, prepared_by, risk_score, recommendation, financial_analysis, decision, quorum_required, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`

	financialAnalysis := pkg.FinancialAnalysis
	if financialAnalysis == nil {
		financialAnalysis = json.RawMessage("null")
	}

	err := r.db.QueryRow(ctx, query,
		pkg.ID,
		pkg.ApplicationID,
		pkg.PreparedBy,
		pkg.RiskScore,
		pkg.Recommendation,
		financialAnalysis,
		pkg.Decision,
		pkg.QuorumRequired,
		pkg.CreatedAt,
		pkg.UpdatedAt,
	).Scan()

	if err != nil {
		return err
	}

	return nil
}

func (r *Repository) GetPackageByID(ctx context.Context, id uuid.UUID) (*Package, error) {
	query := `
		SELECT
			p.id, p.application_id, p.prepared_by, p.risk_score, p.recommendation,
			p.financial_analysis, p.decision, p.decision_date, p.conditions,
			p.quorum_required, p.created_at, p.updated_at
		FROM committee_packages p
		WHERE p.id = $1
	`

	pkg := &Package{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&pkg.ID,
		&pkg.ApplicationID,
		&pkg.PreparedBy,
		&pkg.RiskScore,
		&pkg.Recommendation,
		&pkg.FinancialAnalysis,
		&pkg.Decision,
		&pkg.DecisionDate,
		&pkg.Conditions,
		&pkg.QuorumRequired,
		&pkg.CreatedAt,
		&pkg.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	votes, err := r.getVotesByPackageID(ctx, id)
	if err != nil {
		return nil, err
	}

	pkg.Votes = votes

	return pkg, nil
}

func (r *Repository) GetByApplicationID(ctx context.Context, applicationID uuid.UUID) (*Package, error) {
	query := `
		SELECT
			p.id, p.application_id, p.prepared_by, p.risk_score, p.recommendation,
			p.financial_analysis, p.decision, p.decision_date, p.conditions,
			p.quorum_required, p.created_at, p.updated_at
		FROM committee_packages p
		WHERE p.application_id = $1
		ORDER BY p.created_at DESC
		LIMIT 1
	`

	pkg := &Package{}
	err := r.db.QueryRow(ctx, query, applicationID).Scan(
		&pkg.ID,
		&pkg.ApplicationID,
		&pkg.PreparedBy,
		&pkg.RiskScore,
		&pkg.Recommendation,
		&pkg.FinancialAnalysis,
		&pkg.Decision,
		&pkg.DecisionDate,
		&pkg.Conditions,
		&pkg.QuorumRequired,
		&pkg.CreatedAt,
		&pkg.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	votes, err := r.getVotesByPackageID(ctx, pkg.ID)
	if err != nil {
		return nil, err
	}

	pkg.Votes = votes

	return pkg, nil
}

func (r *Repository) getVotesByPackageID(ctx context.Context, packageID uuid.UUID) ([]Vote, error) {
	query := `
		SELECT id, package_id, voter_id, decision, comments, voted_at
		FROM committee_votes
		WHERE package_id = $1
		ORDER BY voted_at ASC
	`

	rows, err := r.db.Query(ctx, query, packageID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var votes []Vote
	for rows.Next() {
		var vote Vote
		err := rows.Scan(
			&vote.ID,
			&vote.PackageID,
			&vote.VoterID,
			&vote.Decision,
			&vote.Comments,
			&vote.VotedAt,
		)
		if err != nil {
			return nil, err
		}
		votes = append(votes, vote)
	}

	return votes, rows.Err()
}

func (r *Repository) CastVote(ctx context.Context, vote *Vote) error {
	query := `
		INSERT INTO committee_votes (id, package_id, voter_id, decision, comments, voted_at)
		VALUES ($1, $2, $3, $4, $5, $6)
	`

	err := r.db.QueryRow(ctx, query,
		vote.ID,
		vote.PackageID,
		vote.VoterID,
		vote.Decision,
		vote.Comments,
		vote.VotedAt,
	).Scan()

	if err != nil {
		return err
	}

	return nil
}

func (r *Repository) UpdateDecision(ctx context.Context, packageID uuid.UUID, decision Decision, conditions *string) error {
	query := `
		UPDATE committee_packages
		SET decision = $1, conditions = $2, decision_date = NOW(), updated_at = NOW()
		WHERE id = $3
	`

	_, err := r.db.Exec(ctx, query, decision, conditions, packageID)
	return err
}

// PackageListItem is a lightweight package for list view
type PackageListItem struct {
	ID             uuid.UUID `json:"id"`
	ApplicationID  uuid.UUID `json:"application_id"`
	Status         string    `json:"status"`
	QuorumRequired int       `json:"quorum_required"`
	VotesFor       int       `json:"votes_for"`
	VotesAgainst   int       `json:"votes_against"`
	CreatedAt      time.Time `json:"created_at"`
}

func (r *Repository) ListAll(ctx context.Context, limit, offset int) ([]PackageListItem, error) {
	query := `
		SELECT
			p.id, p.application_id, p.decision::text, p.quorum_required, p.created_at,
			COALESCE(SUM(CASE WHEN v.decision IN ('approve','approve_with_conditions') THEN 1 ELSE 0 END), 0)::int as votes_for,
			COALESCE(SUM(CASE WHEN v.decision = 'reject' THEN 1 ELSE 0 END), 0)::int as votes_against
		FROM committee_packages p
		LEFT JOIN committee_votes v ON p.id = v.package_id
		GROUP BY p.id, p.application_id, p.decision, p.quorum_required, p.created_at
		ORDER BY p.created_at DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []PackageListItem
	for rows.Next() {
		var item PackageListItem
		err := rows.Scan(
			&item.ID,
			&item.ApplicationID,
			&item.Status,
			&item.QuorumRequired,
			&item.CreatedAt,
			&item.VotesFor,
			&item.VotesAgainst,
		)
		if err != nil {
			return nil, err
		}
		list = append(list, item)
	}
	return list, rows.Err()
}
