package credit

import (
	"math"

	"github.com/google/uuid"
)

const ScorecardVersion = "RE-CREDIT-2.0"

type criterionDef struct {
	Category   string
	FactorName string
	Weight     float64
}

var criteria = []criterionDef{
	// Category 1: Company Information (5%)
	{"company_info", "business_activity", 0.01},
	{"company_info", "entity_type", 0.01},
	{"company_info", "entity_location", 0.01},
	{"company_info", "years_in_business", 0.01},
	{"company_info", "income_diversification", 0.01},

	// Category 2: Financial Statements (20%)
	{"financial_statements", "audited_financials", 0.02},
	{"financial_statements", "annual_revenue", 0.03},
	{"financial_statements", "ocf_ratio", 0.02},
	{"financial_statements", "net_profit_margin", 0.02},
	{"financial_statements", "operating_profit_margin", 0.03},
	{"financial_statements", "interest_coverage_ratio", 0.03},
	{"financial_statements", "return_on_assets", 0.02},
	{"financial_statements", "current_ratio", 0.03},

	// Category 3: Credit History (20%)
	{"credit_history", "credit_record", 0.02},
	{"credit_history", "payment_behavior", 0.02},
	{"credit_history", "payment_delays", 0.02},
	{"credit_history", "num_delays", 0.01},
	{"credit_history", "delay_ratio", 0.02},
	{"credit_history", "financing_default", 0.02},
	{"credit_history", "num_defaults", 0.01},
	{"credit_history", "default_ratio", 0.02},
	{"credit_history", "bounced_checks", 0.02},
	{"credit_history", "lawsuits", 0.04},

	// Category 4: Project Feasibility (50%)
	{"project_feasibility", "project_location", 0.08},
	{"project_feasibility", "project_plan", 0.03},
	{"project_feasibility", "project_insurance", 0.08},
	{"project_feasibility", "project_type", 0.03},
	{"project_feasibility", "engineering_firm", 0.09},
	{"project_feasibility", "feasibility_study", 0.09},
	{"project_feasibility", "project_profitability", 0.05},
	{"project_feasibility", "previous_projects", 0.05},

	// Category 5: Collateral (5%)
	{"collateral", "property_location", 0.01},
	{"collateral", "property_type", 0.005},
	{"collateral", "property_usage", 0.005},
	{"collateral", "appraisal_difference", 0.01},
	{"collateral", "ltv_ratio", 0.01},
	{"collateral", "deferred_price_ratio", 0.01},
}

func ScoreAssessment(a *Assessment) *Score {
	rawScores := computeRawScores(a)

	var factors []ScoringFactor
	var totalWeighted float64

	for _, cd := range criteria {
		raw := rawScores[cd.FactorName]
		weighted := (float64(raw) / 3.0) * cd.Weight

		factors = append(factors, ScoringFactor{
			ID:            uuid.New(),
			Category:      cd.Category,
			FactorName:    cd.FactorName,
			RawScore:      raw,
			Weight:        cd.Weight,
			WeightedScore: weighted,
		})
		totalWeighted += weighted
	}

	pct := math.Min(totalWeighted*100, 100)
	grade := gradeFromScore(pct)
	rec := recommendationFromGrade(grade)

	return &Score{
		ID:               uuid.New(),
		ScorecardVersion: ScorecardVersion,
		TotalScore:       math.Round(pct*100) / 100,
		RiskGrade:        grade,
		Recommendation:   rec,
		Factors:          factors,
	}
}

func gradeFromScore(pct float64) RiskGrade {
	switch {
	case pct > 95:
		return GradeAA
	case pct >= 90:
		return GradeA
	case pct >= 85:
		return GradeBB
	case pct >= 80:
		return GradeB
	case pct >= 75:
		return GradeCC
	case pct >= 70:
		return GradeC
	default:
		return GradeF
	}
}

func recommendationFromGrade(g RiskGrade) string {
	switch g {
	case GradeAA, GradeA, GradeBB:
		return "approve"
	case GradeB:
		return "approve_with_conditions"
	case GradeCC:
		return "refer"
	case GradeC:
		return "refer_or_decline"
	default:
		return "decline"
	}
}

func computeRawScores(a *Assessment) map[string]int {
	m := make(map[string]int, 37)

	m["business_activity"] = scoreBusinessActivity(a.BusinessActivity)
	m["entity_type"] = scoreEntityType(a.EntityType)
	m["entity_location"] = scoreLocation(a.EntityLocation)
	m["years_in_business"] = scoreYearsInBusiness(a.YearsInBusiness)
	m["income_diversification"] = scoreIncomeDiversification(a.IncomeDiversification)

	m["audited_financials"] = scoreBool(a.AuditedFinancials)
	m["annual_revenue"] = scoreAnnualRevenue(a.TotalRevenue)
	m["ocf_ratio"] = scoreOCFRatio(a.OperatingCashFlow, a.CurrentLiabilities)
	m["net_profit_margin"] = scoreNetProfitMargin(a.NetProfit, a.TotalRevenue)
	m["operating_profit_margin"] = scoreOperatingProfitMargin(a.OperatingProfit, a.TotalRevenue)
	m["interest_coverage_ratio"] = scoreInterestCoverage(a.OperatingProfit, a.FinanceCosts)
	m["return_on_assets"] = scoreROA(a.NetProfit, a.TotalAssets)
	m["current_ratio"] = scoreCurrentRatio(a.CurrentAssets, a.CurrentLiabilities)

	m["credit_record"] = scoreCreditRecord(a.CreditRecord)
	m["payment_behavior"] = scorePaymentBehavior(a.PaymentBehavior)
	m["payment_delays"] = scorePaymentDelays(a.PaymentDelays)
	m["num_delays"] = scoreNumDelays(a.NumDelays)
	m["delay_ratio"] = scoreDelayRatio(a.DelayRatio)
	m["financing_default"] = scoreFinancingDefault(a.FinancingDefault)
	m["num_defaults"] = scoreNumDefaults(a.NumDefaults)
	m["default_ratio"] = scoreDefaultRatio(a.DefaultRatio)
	m["bounced_checks"] = scoreBouncedChecks(a.BouncedChecks)
	m["lawsuits"] = scoreLawsuits(a.Lawsuits)

	m["project_location"] = scoreLocation(a.ProjectLocation)
	m["project_plan"] = scoreBool(a.HasProjectPlan)
	m["project_insurance"] = scoreBool(a.HasInsurance)
	m["project_type"] = scoreProjectType(a.ProjectType)
	m["engineering_firm"] = scoreEngineeringFirm(a.EngineeringFirmClass)
	m["feasibility_study"] = scoreFeasibilityStudy(a.FeasibilityStudyQuality)
	m["project_profitability"] = scoreProjectProfitability(a.ProjectNetProfit, a.ProjectTotalCost)
	m["previous_projects"] = scorePreviousProjects(a.PreviousProjectsCount)

	m["property_location"] = scoreLocation(a.PropertyLocation)
	m["property_type"] = scorePropertyType(a.PropertyType)
	m["property_usage"] = scorePropertyUsage(a.PropertyUsage)
	m["appraisal_difference"] = scoreAppraisalDiff(a.Appraisal1, a.Appraisal2)
	m["ltv_ratio"] = scoreLTV(a.FinancingAmount, a.Appraisal1, a.Appraisal2)
	m["deferred_price_ratio"] = scoreDeferredPriceRatio(a.FinancingAmount, a.Appraisal1, a.Appraisal2)

	return m
}

func scoreBusinessActivity(v string) int {
	switch v {
	case "construction", "real_estate":
		return 3
	default:
		return 0
	}
}

func scoreEntityType(v string) int {
	switch v {
	case "public_jsc", "closed_jsc":
		return 3
	case "llc":
		return 2
	case "sole_proprietorship", "single_person", "holding":
		return 1
	default:
		return 0
	}
}

func scoreLocation(v string) int {
	switch v {
	case "riyadh", "jeddah":
		return 3
	case "makkah", "dammam", "khobar":
		return 2
	default:
		return 0
	}
}

func scoreYearsInBusiness(v string) int {
	switch v {
	case "more_than_10":
		return 3
	case "5_to_10":
		return 2
	case "2_to_5":
		return 1
	default:
		return 0
	}
}

func scoreIncomeDiversification(v string) int {
	switch v {
	case "more_than_2":
		return 3
	case "2":
		return 2
	case "1":
		return 1
	default:
		return 0
	}
}

func scoreBool(v bool) int {
	if v {
		return 3
	}
	return 0
}

func scoreAnnualRevenue(revenue float64) int {
	switch {
	case revenue > 40_000_000:
		return 3
	case revenue >= 10_000_000:
		return 2
	case revenue >= 3_000_000:
		return 1
	default:
		return 0
	}
}

func scoreOCFRatio(ocf, currentLiabilities float64) int {
	if currentLiabilities <= 0 {
		return 0
	}
	ratio := (ocf / currentLiabilities) * 100
	switch {
	case ratio > 150:
		return 3
	case ratio >= 100:
		return 2
	case ratio >= 80:
		return 1
	default:
		return 0
	}
}

func scoreNetProfitMargin(netProfit, revenue float64) int {
	if revenue <= 0 {
		return 0
	}
	pct := (netProfit / revenue) * 100
	switch {
	case pct > 20:
		return 3
	case pct >= 10:
		return 2
	case pct >= 0:
		return 1
	default:
		return 0
	}
}

func scoreOperatingProfitMargin(operatingProfit, revenue float64) int {
	if revenue <= 0 {
		return 0
	}
	pct := (operatingProfit / revenue) * 100
	switch {
	case pct > 30:
		return 3
	case pct >= 15:
		return 2
	case pct >= 0:
		return 1
	default:
		return 0
	}
}

func scoreInterestCoverage(operatingProfit, financeCosts float64) int {
	if financeCosts <= 0 {
		return 0
	}
	ratio := operatingProfit / financeCosts
	switch {
	case ratio > 2:
		return 3
	case ratio >= 1.5:
		return 2
	case ratio >= 1:
		return 1
	default:
		return 0
	}
}

func scoreROA(netProfit, totalAssets float64) int {
	if totalAssets <= 0 {
		return 0
	}
	pct := (netProfit / totalAssets) * 100
	switch {
	case pct > 15:
		return 3
	case pct >= 10:
		return 2
	case pct >= 0:
		return 1
	default:
		return 0
	}
}

func scoreCurrentRatio(currentAssets, currentLiabilities float64) int {
	if currentLiabilities <= 0 {
		return 0
	}
	ratio := currentAssets / currentLiabilities
	switch {
	case ratio > 2:
		return 3
	case ratio >= 1:
		return 2
	case ratio >= 0:
		return 1
	default:
		return 0
	}
}

func scoreCreditRecord(v string) int {
	switch v {
	case "excellent":
		return 3
	case "not_applicable":
		return 2
	case "satisfactory":
		return 1
	default:
		return 0
	}
}

func scorePaymentBehavior(v string) int {
	switch v {
	case "excellent":
		return 3
	case "satisfactory":
		return 2
	case "poor":
		return 1
	default:
		return 0
	}
}

func scorePaymentDelays(v string) int {
	switch v {
	case "none":
		return 3
	case "30_to_60":
		return 2
	case "60_to_90":
		return 1
	default:
		return 0
	}
}

func scoreNumDelays(v string) int {
	switch v {
	case "none":
		return 3
	case "1":
		return 2
	case "up_to_3":
		return 1
	default:
		return 0
	}
}

func scoreDelayRatio(v string) int {
	switch v {
	case "0":
		return 3
	case "up_to_20":
		return 1
	default:
		return 0
	}
}

func scoreFinancingDefault(v string) int {
	switch v {
	case "none":
		return 3
	case "settled":
		return 1
	default:
		return 0
	}
}

func scoreNumDefaults(v string) int {
	switch v {
	case "none":
		return 3
	case "1":
		return 1
	default:
		return 0
	}
}

func scoreDefaultRatio(v string) int {
	switch v {
	case "0":
		return 3
	case "up_to_20":
		return 1
	default:
		return 0
	}
}

func scoreBouncedChecks(v string) int {
	switch v {
	case "none":
		return 3
	case "settled":
		return 1
	default:
		return 0
	}
}

func scoreLawsuits(v string) int {
	switch v {
	case "none":
		return 3
	case "settled":
		return 1
	default:
		return 0
	}
}

func scoreProjectType(v string) int {
	switch v {
	case "commercial":
		return 3
	case "residential", "mixed":
		return 2
	default:
		return 0
	}
}

func scoreEngineeringFirm(v string) int {
	switch v {
	case "class_1_2":
		return 3
	case "class_3_5":
		return 2
	case "unclassified":
		return 1
	default:
		return 0
	}
}

func scoreFeasibilityStudy(v string) int {
	switch v {
	case "excellent":
		return 3
	case "average":
		return 2
	case "acceptable":
		return 1
	default:
		return 0
	}
}

func scoreProjectProfitability(netProfit, totalCost float64) int {
	if totalCost <= 0 {
		return 0
	}
	pct := (netProfit / totalCost) * 100
	switch {
	case pct > 20:
		return 3
	case pct >= 15:
		return 2
	default:
		return 1
	}
}

func scorePreviousProjects(v string) int {
	switch v {
	case "more_than_3":
		return 3
	case "1_to_3":
		return 2
	default:
		return 0
	}
}

func scorePropertyType(v string) int {
	switch v {
	case "commercial_building":
		return 3
	case "residential_building", "residential_land", "commercial_land", "apartment":
		return 2
	case "raw_land":
		return 1
	default:
		return 0
	}
}

func scorePropertyUsage(v string) int {
	switch v {
	case "rented":
		return 3
	case "not_applicable":
		return 2
	case "owner_occupied":
		return 1
	default:
		return 0
	}
}

func scoreAppraisalDiff(a1, a2 float64) int {
	if a1 <= 0 || a2 <= 0 {
		return 0
	}
	minVal := math.Min(a1, a2)
	diff := math.Abs(a1-a2) / minVal * 100
	switch {
	case diff < 5:
		return 3
	case diff < 10:
		return 2
	default:
		return 0
	}
}

func scoreLTV(financingAmount, a1, a2 float64) int {
	if a1 <= 0 && a2 <= 0 {
		return 0
	}
	appraisal := math.Min(a1, a2)
	if appraisal <= 0 {
		appraisal = math.Max(a1, a2)
	}
	ltv := (financingAmount / appraisal) * 100
	switch {
	case ltv < 30:
		return 3
	case ltv < 60:
		return 2
	case ltv < 70:
		return 1
	default:
		return 0
	}
}

func scoreDeferredPriceRatio(financingAmount, a1, a2 float64) int {
	if a1 <= 0 && a2 <= 0 {
		return 0
	}
	appraisal := math.Min(a1, a2)
	if appraisal <= 0 {
		appraisal = math.Max(a1, a2)
	}
	ratio := (financingAmount / appraisal) * 100
	switch {
	case ratio < 40:
		return 3
	case ratio < 70:
		return 2
	case ratio < 90:
		return 1
	default:
		return 0
	}
}
