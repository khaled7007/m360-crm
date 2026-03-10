-- Credit Assessment module: assessments, scores, and scoring factors

CREATE TYPE credit_risk_grade AS ENUM ('AA', 'A', 'BB', 'B', 'CC', 'C', 'F');
CREATE TYPE credit_assessment_status AS ENUM ('draft', 'scored', 'approved', 'referred', 'declined');

CREATE TABLE credit_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    application_id UUID REFERENCES applications(id),
    created_by UUID NOT NULL REFERENCES users(id),

    -- Category 1: Company Information (5%)
    business_activity VARCHAR(100) NOT NULL DEFAULT '',
    entity_type VARCHAR(100) NOT NULL DEFAULT '',
    entity_location VARCHAR(100) NOT NULL DEFAULT '',
    years_in_business VARCHAR(50) NOT NULL DEFAULT '',
    income_diversification VARCHAR(50) NOT NULL DEFAULT '',

    -- Category 2: Financial Statements (20%) — raw numeric inputs
    audited_financials BOOLEAN NOT NULL DEFAULT false,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    operating_cash_flow DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_liabilities DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
    operating_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
    finance_costs DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_assets DECIMAL(15,2) NOT NULL DEFAULT 0,
    current_assets DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Category 3: Credit History (20%)
    credit_record VARCHAR(50) NOT NULL DEFAULT '',
    payment_behavior VARCHAR(50) NOT NULL DEFAULT '',
    payment_delays VARCHAR(50) NOT NULL DEFAULT '',
    num_delays VARCHAR(50) NOT NULL DEFAULT '',
    delay_ratio VARCHAR(50) NOT NULL DEFAULT '',
    financing_default VARCHAR(50) NOT NULL DEFAULT '',
    num_defaults VARCHAR(50) NOT NULL DEFAULT '',
    default_ratio VARCHAR(50) NOT NULL DEFAULT '',
    bounced_checks VARCHAR(50) NOT NULL DEFAULT '',
    lawsuits VARCHAR(50) NOT NULL DEFAULT '',

    -- Category 4: Project Feasibility (50%)
    project_location VARCHAR(100) NOT NULL DEFAULT '',
    has_project_plan BOOLEAN NOT NULL DEFAULT false,
    has_insurance BOOLEAN NOT NULL DEFAULT false,
    project_type VARCHAR(50) NOT NULL DEFAULT '',
    engineering_firm_class VARCHAR(50) NOT NULL DEFAULT '',
    feasibility_study_quality VARCHAR(50) NOT NULL DEFAULT '',
    project_net_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
    project_total_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
    previous_projects_count VARCHAR(50) NOT NULL DEFAULT '',

    -- Category 5: Collateral (5%)
    property_location VARCHAR(100) NOT NULL DEFAULT '',
    property_type VARCHAR(100) NOT NULL DEFAULT '',
    property_usage VARCHAR(100) NOT NULL DEFAULT '',
    appraisal_1 DECIMAL(15,2) NOT NULL DEFAULT 0,
    appraisal_2 DECIMAL(15,2) NOT NULL DEFAULT 0,
    financing_amount DECIMAL(15,2) NOT NULL DEFAULT 0,

    status credit_assessment_status NOT NULL DEFAULT 'draft',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE credit_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES credit_assessments(id) ON DELETE CASCADE,
    scorecard_version VARCHAR(20) NOT NULL DEFAULT 'RE-CREDIT-2.0',
    total_score DECIMAL(6,2) NOT NULL DEFAULT 0,
    risk_grade credit_risk_grade NOT NULL DEFAULT 'F',
    recommendation VARCHAR(50) NOT NULL DEFAULT '',
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scoring_factors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credit_score_id UUID NOT NULL REFERENCES credit_scores(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    factor_name VARCHAR(100) NOT NULL,
    raw_score INTEGER NOT NULL DEFAULT 0,
    weight DECIMAL(5,4) NOT NULL DEFAULT 0,
    weighted_score DECIMAL(6,4) NOT NULL DEFAULT 0
);

CREATE INDEX idx_credit_assessments_org ON credit_assessments(organization_id);
CREATE INDEX idx_credit_assessments_app ON credit_assessments(application_id);
CREATE INDEX idx_credit_assessments_status ON credit_assessments(status);
CREATE INDEX idx_credit_scores_assessment ON credit_scores(assessment_id);
CREATE INDEX idx_scoring_factors_score ON scoring_factors(credit_score_id);
