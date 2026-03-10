package credit

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

func (r *Repository) Create(ctx context.Context, a *Assessment) error {
	query := `
		INSERT INTO credit_assessments (
			id, organization_id, application_id, created_by,
			business_activity, entity_type, entity_location, years_in_business, income_diversification,
			audited_financials, total_revenue, operating_cash_flow, current_liabilities,
			net_profit, operating_profit, finance_costs, total_assets, current_assets,
			credit_record, payment_behavior, payment_delays, num_delays, delay_ratio,
			financing_default, num_defaults, default_ratio, bounced_checks, lawsuits,
			project_location, has_project_plan, has_insurance, project_type,
			engineering_firm_class, feasibility_study_quality, project_net_profit,
			project_total_cost, previous_projects_count,
			property_location, property_type, property_usage,
			appraisal_1, appraisal_2, financing_amount,
			status, notes
		) VALUES (
			$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,
			$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,
			$35,$36,$37,$38,$39,$40,$41,$42,$43,$44,$45
		) RETURNING created_at, updated_at`

	return r.db.QueryRow(ctx, query,
		a.ID, a.OrganizationID, a.ApplicationID, a.CreatedBy,
		a.BusinessActivity, a.EntityType, a.EntityLocation, a.YearsInBusiness, a.IncomeDiversification,
		a.AuditedFinancials, a.TotalRevenue, a.OperatingCashFlow, a.CurrentLiabilities,
		a.NetProfit, a.OperatingProfit, a.FinanceCosts, a.TotalAssets, a.CurrentAssets,
		a.CreditRecord, a.PaymentBehavior, a.PaymentDelays, a.NumDelays, a.DelayRatio,
		a.FinancingDefault, a.NumDefaults, a.DefaultRatio, a.BouncedChecks, a.Lawsuits,
		a.ProjectLocation, a.HasProjectPlan, a.HasInsurance, a.ProjectType,
		a.EngineeringFirmClass, a.FeasibilityStudyQuality, a.ProjectNetProfit,
		a.ProjectTotalCost, a.PreviousProjectsCount,
		a.PropertyLocation, a.PropertyType, a.PropertyUsage,
		a.Appraisal1, a.Appraisal2, a.FinancingAmount,
		a.Status, a.Notes,
	).Scan(&a.CreatedAt, &a.UpdatedAt)
}

const assessmentColumns = `
	ca.id, ca.organization_id, ca.application_id, ca.created_by,
	ca.business_activity, ca.entity_type, ca.entity_location, ca.years_in_business, ca.income_diversification,
	ca.audited_financials, ca.total_revenue, ca.operating_cash_flow, ca.current_liabilities,
	ca.net_profit, ca.operating_profit, ca.finance_costs, ca.total_assets, ca.current_assets,
	ca.credit_record, ca.payment_behavior, ca.payment_delays, ca.num_delays, ca.delay_ratio,
	ca.financing_default, ca.num_defaults, ca.default_ratio, ca.bounced_checks, ca.lawsuits,
	ca.project_location, ca.has_project_plan, ca.has_insurance, ca.project_type,
	ca.engineering_firm_class, ca.feasibility_study_quality, ca.project_net_profit,
	ca.project_total_cost, ca.previous_projects_count,
	ca.property_location, ca.property_type, ca.property_usage,
	ca.appraisal_1, ca.appraisal_2, ca.financing_amount,
	ca.status, ca.notes, ca.created_at, ca.updated_at,
	COALESCE(o.name_ar, o.name_en, '') AS organization_name`

func scanAssessment(row interface{ Scan(dest ...any) error }) (*Assessment, error) {
	var a Assessment
	err := row.Scan(
		&a.ID, &a.OrganizationID, &a.ApplicationID, &a.CreatedBy,
		&a.BusinessActivity, &a.EntityType, &a.EntityLocation, &a.YearsInBusiness, &a.IncomeDiversification,
		&a.AuditedFinancials, &a.TotalRevenue, &a.OperatingCashFlow, &a.CurrentLiabilities,
		&a.NetProfit, &a.OperatingProfit, &a.FinanceCosts, &a.TotalAssets, &a.CurrentAssets,
		&a.CreditRecord, &a.PaymentBehavior, &a.PaymentDelays, &a.NumDelays, &a.DelayRatio,
		&a.FinancingDefault, &a.NumDefaults, &a.DefaultRatio, &a.BouncedChecks, &a.Lawsuits,
		&a.ProjectLocation, &a.HasProjectPlan, &a.HasInsurance, &a.ProjectType,
		&a.EngineeringFirmClass, &a.FeasibilityStudyQuality, &a.ProjectNetProfit,
		&a.ProjectTotalCost, &a.PreviousProjectsCount,
		&a.PropertyLocation, &a.PropertyType, &a.PropertyUsage,
		&a.Appraisal1, &a.Appraisal2, &a.FinancingAmount,
		&a.Status, &a.Notes, &a.CreatedAt, &a.UpdatedAt,
		&a.OrganizationName,
	)
	return &a, err
}

func (r *Repository) GetByID(ctx context.Context, id uuid.UUID) (*Assessment, error) {
	query := fmt.Sprintf(`SELECT %s FROM credit_assessments ca
		LEFT JOIN organizations o ON o.id = ca.organization_id
		WHERE ca.id = $1`, assessmentColumns)
	a, err := scanAssessment(r.db.QueryRow(ctx, query, id))
	if err != nil {
		return nil, fmt.Errorf("get credit assessment: %w", err)
	}

	score, err := r.getLatestScore(ctx, id)
	if err == nil && score != nil {
		a.Score = score
	}
	return a, nil
}

func (r *Repository) List(ctx context.Context, params ListParams) ([]Assessment, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}
	argIdx := 1

	if params.OrganizationID != nil {
		where = append(where, fmt.Sprintf("ca.organization_id = $%d", argIdx))
		args = append(args, *params.OrganizationID)
		argIdx++
	}
	if params.ApplicationID != nil {
		where = append(where, fmt.Sprintf("ca.application_id = $%d", argIdx))
		args = append(args, *params.ApplicationID)
		argIdx++
	}
	if params.Status != nil {
		where = append(where, fmt.Sprintf("ca.status = $%d", argIdx))
		args = append(args, *params.Status)
		argIdx++
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM credit_assessments ca WHERE %s", whereClause)
	if err := r.db.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("count credit assessments: %w", err)
	}

	if params.Limit == 0 {
		params.Limit = 20
	}

	query := fmt.Sprintf(`SELECT %s FROM credit_assessments ca
		LEFT JOIN organizations o ON o.id = ca.organization_id
		WHERE %s ORDER BY ca.created_at DESC LIMIT $%d OFFSET $%d`,
		assessmentColumns, whereClause, argIdx, argIdx+1)
	args = append(args, params.Limit, params.Offset)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("list credit assessments: %w", err)
	}
	defer rows.Close()

	var assessments []Assessment
	for rows.Next() {
		a, err := scanAssessment(rows)
		if err != nil {
			return nil, 0, fmt.Errorf("scan credit assessment: %w", err)
		}
		score, scoreErr := r.getLatestScore(ctx, a.ID)
		if scoreErr == nil && score != nil {
			a.Score = score
		}
		assessments = append(assessments, *a)
	}

	return assessments, total, nil
}

func (r *Repository) Update(ctx context.Context, id uuid.UUID, req UpdateRequest) (*Assessment, error) {
	sets := []string{}
	args := []interface{}{}
	argIdx := 1

	addStringField := func(field string, val *string) {
		if val != nil {
			sets = append(sets, fmt.Sprintf("%s = $%d", field, argIdx))
			args = append(args, *val)
			argIdx++
		}
	}
	addFloat64Field := func(field string, val *float64) {
		if val != nil {
			sets = append(sets, fmt.Sprintf("%s = $%d", field, argIdx))
			args = append(args, *val)
			argIdx++
		}
	}
	addBoolField := func(field string, val *bool) {
		if val != nil {
			sets = append(sets, fmt.Sprintf("%s = $%d", field, argIdx))
			args = append(args, *val)
			argIdx++
		}
	}

	addStringField("business_activity", req.BusinessActivity)
	addStringField("entity_type", req.EntityType)
	addStringField("entity_location", req.EntityLocation)
	addStringField("years_in_business", req.YearsInBusiness)
	addStringField("income_diversification", req.IncomeDiversification)

	addBoolField("audited_financials", req.AuditedFinancials)
	addFloat64Field("total_revenue", req.TotalRevenue)
	addFloat64Field("operating_cash_flow", req.OperatingCashFlow)
	addFloat64Field("current_liabilities", req.CurrentLiabilities)
	addFloat64Field("net_profit", req.NetProfit)
	addFloat64Field("operating_profit", req.OperatingProfit)
	addFloat64Field("finance_costs", req.FinanceCosts)
	addFloat64Field("total_assets", req.TotalAssets)
	addFloat64Field("current_assets", req.CurrentAssets)

	addStringField("credit_record", req.CreditRecord)
	addStringField("payment_behavior", req.PaymentBehavior)
	addStringField("payment_delays", req.PaymentDelays)
	addStringField("num_delays", req.NumDelays)
	addStringField("delay_ratio", req.DelayRatio)
	addStringField("financing_default", req.FinancingDefault)
	addStringField("num_defaults", req.NumDefaults)
	addStringField("default_ratio", req.DefaultRatio)
	addStringField("bounced_checks", req.BouncedChecks)
	addStringField("lawsuits", req.Lawsuits)

	addStringField("project_location", req.ProjectLocation)
	addBoolField("has_project_plan", req.HasProjectPlan)
	addBoolField("has_insurance", req.HasInsurance)
	addStringField("project_type", req.ProjectType)
	addStringField("engineering_firm_class", req.EngineeringFirmClass)
	addStringField("feasibility_study_quality", req.FeasibilityStudyQuality)
	addFloat64Field("project_net_profit", req.ProjectNetProfit)
	addFloat64Field("project_total_cost", req.ProjectTotalCost)
	addStringField("previous_projects_count", req.PreviousProjectsCount)

	addStringField("property_location", req.PropertyLocation)
	addStringField("property_type", req.PropertyType)
	addStringField("property_usage", req.PropertyUsage)
	addFloat64Field("appraisal_1", req.Appraisal1)
	addFloat64Field("appraisal_2", req.Appraisal2)
	addFloat64Field("financing_amount", req.FinancingAmount)

	addStringField("notes", req.Notes)

	if len(sets) == 0 {
		return r.GetByID(ctx, id)
	}

	sets = append(sets, "updated_at = NOW()")
	query := fmt.Sprintf("UPDATE credit_assessments SET %s WHERE id = $%d", strings.Join(sets, ", "), argIdx)
	args = append(args, id)

	if _, err := r.db.Exec(ctx, query, args...); err != nil {
		return nil, fmt.Errorf("update credit assessment: %w", err)
	}
	return r.GetByID(ctx, id)
}

func (r *Repository) Delete(ctx context.Context, id uuid.UUID) error {
	_, err := r.db.Exec(ctx, "DELETE FROM credit_assessments WHERE id = $1", id)
	return err
}

// SaveScore persists a Score and its ScoringFactors within a transaction.
func (r *Repository) SaveScore(ctx context.Context, assessmentID uuid.UUID, s *Score) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Delete old scores for this assessment
	_, err = tx.Exec(ctx, "DELETE FROM credit_scores WHERE assessment_id = $1", assessmentID)
	if err != nil {
		return fmt.Errorf("delete old scores: %w", err)
	}

	s.AssessmentID = assessmentID
	_, err = tx.Exec(ctx, `
		INSERT INTO credit_scores (id, assessment_id, scorecard_version, total_score, risk_grade, recommendation, scored_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
		s.ID, assessmentID, s.ScorecardVersion, s.TotalScore, s.RiskGrade, s.Recommendation)
	if err != nil {
		return fmt.Errorf("insert credit score: %w", err)
	}

	for i := range s.Factors {
		f := &s.Factors[i]
		f.CreditScoreID = s.ID
		_, err = tx.Exec(ctx, `
			INSERT INTO scoring_factors (id, credit_score_id, category, factor_name, raw_score, weight, weighted_score)
			VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			f.ID, s.ID, f.Category, f.FactorName, f.RawScore, f.Weight, f.WeightedScore)
		if err != nil {
			return fmt.Errorf("insert scoring factor: %w", err)
		}
	}

	// Update assessment status
	_, err = tx.Exec(ctx, "UPDATE credit_assessments SET status = 'scored', updated_at = NOW() WHERE id = $1", assessmentID)
	if err != nil {
		return fmt.Errorf("update assessment status: %w", err)
	}

	return tx.Commit(ctx)
}

func (r *Repository) getLatestScore(ctx context.Context, assessmentID uuid.UUID) (*Score, error) {
	var s Score
	err := r.db.QueryRow(ctx, `
		SELECT id, assessment_id, scorecard_version, total_score, risk_grade, recommendation, scored_at
		FROM credit_scores WHERE assessment_id = $1 ORDER BY scored_at DESC LIMIT 1`,
		assessmentID,
	).Scan(&s.ID, &s.AssessmentID, &s.ScorecardVersion, &s.TotalScore, &s.RiskGrade, &s.Recommendation, &s.ScoredAt)
	if err != nil {
		return nil, err
	}

	rows, err := r.db.Query(ctx, `
		SELECT id, credit_score_id, category, factor_name, raw_score, weight, weighted_score
		FROM scoring_factors WHERE credit_score_id = $1 ORDER BY category, factor_name`,
		s.ID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var f ScoringFactor
		if err := rows.Scan(&f.ID, &f.CreditScoreID, &f.Category, &f.FactorName, &f.RawScore, &f.Weight, &f.WeightedScore); err != nil {
			return nil, err
		}
		s.Factors = append(s.Factors, f)
	}

	return &s, nil
}
