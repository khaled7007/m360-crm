package reporting

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetDashboardStats retrieves overall dashboard statistics
func (r *Repository) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	stats := &DashboardStats{}

	// Get total leads
	err := r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM leads
	`).Scan(&stats.TotalLeads)
	if err != nil {
		return nil, fmt.Errorf("failed to get total leads: %w", err)
	}

	// Get total applications
	err = r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM applications
	`).Scan(&stats.TotalApplications)
	if err != nil {
		return nil, fmt.Errorf("failed to get total applications: %w", err)
	}

	// Get total facilities and financial metrics
	err = r.db.QueryRow(ctx, `
		SELECT
			COUNT(*),
			COALESCE(SUM(principal_amount), 0),
			COALESCE(SUM(outstanding_balance), 0)
		FROM facilities
		WHERE status = 'active'
	`).Scan(&stats.TotalFacilities, &stats.TotalDisbursed, &stats.TotalOutstanding)
	if err != nil {
		return nil, fmt.Errorf("failed to get facility metrics: %w", err)
	}

	// Get PAR (Portfolio at Risk) metrics
	var totalFacilities int
	err = r.db.QueryRow(ctx, `
		SELECT COUNT(*) FROM facilities WHERE status = 'active'
	`).Scan(&totalFacilities)
	if err != nil {
		return nil, fmt.Errorf("failed to get total active facilities: %w", err)
	}

	if totalFacilities > 0 {
		// PAR30 - facilities 30+ days overdue
		var par30Count int
		err = r.db.QueryRow(ctx, `
			SELECT COUNT(*) FROM facilities
			WHERE status = 'active'
			AND delinquency IN ('par_30', 'par_60', 'par_90', 'par_180', 'write_off')
		`).Scan(&par30Count)
		if err != nil {
			return nil, fmt.Errorf("failed to get PAR30: %w", err)
		}
		stats.PAR30 = (float64(par30Count) / float64(totalFacilities)) * 100

		// PAR60 - facilities 60+ days overdue
		var par60Count int
		err = r.db.QueryRow(ctx, `
			SELECT COUNT(*) FROM facilities
			WHERE status = 'active'
			AND delinquency IN ('par_60', 'par_90', 'par_180', 'write_off')
		`).Scan(&par60Count)
		if err != nil {
			return nil, fmt.Errorf("failed to get PAR60: %w", err)
		}
		stats.PAR60 = (float64(par60Count) / float64(totalFacilities)) * 100

		// PAR90 - facilities 90+ days overdue
		var par90Count int
		err = r.db.QueryRow(ctx, `
			SELECT COUNT(*) FROM facilities
			WHERE status = 'active'
			AND delinquency IN ('par_90', 'par_180', 'write_off')
		`).Scan(&par90Count)
		if err != nil {
			return nil, fmt.Errorf("failed to get PAR90: %w", err)
		}
		stats.PAR90 = (float64(par90Count) / float64(totalFacilities)) * 100
	}

	return stats, nil
}

// GetPipelineStats retrieves application pipeline statistics grouped by status
func (r *Repository) GetPipelineStats(ctx context.Context) (*PipelineStats, error) {
	stats := &PipelineStats{}

	rows, err := r.db.Query(ctx, `
		SELECT status, COUNT(*) FROM applications
		GROUP BY status
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query pipeline stats: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			return nil, fmt.Errorf("failed to scan pipeline row: %w", err)
		}

		switch status {
		case "draft":
			stats.Draft = count
		case "submitted":
			stats.Submitted = count
		case "pre_approved":
			stats.PreApproved = count
		case "documents_collected":
			stats.DocsCollected = count
		case "credit_assessment":
			stats.CreditAssessment = count
		case "committee_review":
			stats.CommitteeReview = count
		case "approved":
			stats.Approved = count
		case "rejected":
			stats.Rejected = count
		case "disbursed":
			stats.Disbursed = count
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating pipeline rows: %w", err)
	}

	return stats, nil
}

// GetOfficerPerformance retrieves performance metrics for all loan officers
func (r *Repository) GetOfficerPerformance(ctx context.Context) ([]OfficerPerformance, error) {
	var officers []OfficerPerformance

	rows, err := r.db.Query(ctx, `
		SELECT
			u.id,
			u.full_name,
			COALESCE(COUNT(DISTINCT l.id), 0) as lead_count,
			COALESCE(COUNT(DISTINCT a.id), 0) as app_count,
			COALESCE(SUM(f.principal_amount), 0) as disbursed
		FROM users u
		LEFT JOIN leads l ON u.id = l.officer_id AND l.status = 'qualified'
		LEFT JOIN applications a ON u.id = a.officer_id
		LEFT JOIN facilities f ON a.id = f.application_id AND f.status = 'active'
		WHERE u.role = 'loan_officer'
		GROUP BY u.id, u.full_name
		ORDER BY u.full_name
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query officer performance: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var officer OfficerPerformance
		if err := rows.Scan(&officer.OfficerID, &officer.OfficerName, &officer.LeadCount, &officer.AppCount, &officer.Disbursed); err != nil {
			return nil, fmt.Errorf("failed to scan officer row: %w", err)
		}

		// Calculate conversion rate (applications / leads)
		if officer.LeadCount > 0 {
			officer.ConversionRate = (float64(officer.AppCount) / float64(officer.LeadCount)) * 100
		}

		officers = append(officers, officer)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating officer rows: %w", err)
	}

	return officers, nil
}

// GetPortfolioAtRisk retrieves portfolio at risk analysis
func (r *Repository) GetPortfolioAtRisk(ctx context.Context) (map[string]interface{}, error) {
	result := make(map[string]interface{})

	// Get delinquency breakdown
	type delinquencyBucket struct {
		Status string
		Count  int
		Amount float64
	}

	rows, err := r.db.Query(ctx, `
		SELECT
			delinquency::text as status,
			COUNT(*) as count,
			COALESCE(SUM(outstanding_balance), 0) as amount
		FROM facilities
		WHERE status = 'active'
		GROUP BY delinquency
	`)
	if err != nil {
		return nil, fmt.Errorf("failed to query portfolio at risk: %w", err)
	}
	defer rows.Close()

	portfolioBreakdown := make(map[string]interface{})
	var totalActiveAmount float64
	var totalActiveFacilities int

	for rows.Next() {
		var status string
		var count int
		var amount float64
		if err := rows.Scan(&status, &count, &amount); err != nil {
			return nil, fmt.Errorf("failed to scan portfolio row: %w", err)
		}

		portfolioBreakdown[status] = map[string]interface{}{
			"count":  count,
			"amount": amount,
		}
		totalActiveFacilities += count
		totalActiveAmount += amount
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating portfolio rows: %w", err)
	}

	result["breakdown"] = portfolioBreakdown
	result["total_active_facilities"] = totalActiveFacilities
	result["total_active_amount"] = totalActiveAmount

	// Calculate overall PAR (all non-current facilities)
	if totalActiveFacilities > 0 {
		parCount := 0
		for _, status := range []string{"par_30", "par_60", "par_90", "par_180", "write_off"} {
			if bucket, ok := portfolioBreakdown[status].(map[string]interface{}); ok {
				parCount += bucket["count"].(int)
			}
		}

		result["total_par_ratio"] = (float64(parCount) / float64(totalActiveFacilities)) * 100
	} else {
		result["total_par_ratio"] = 0.0
	}

	return result, nil
}
