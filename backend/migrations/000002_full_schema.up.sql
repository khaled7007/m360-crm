-- Phase 2: Products, Applications, Documents
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL DEFAULT '',
    type VARCHAR(50) NOT NULL DEFAULT 'murabaha',
    min_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    max_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    min_tenor_months INTEGER NOT NULL DEFAULT 1,
    max_tenor_months INTEGER NOT NULL DEFAULT 60,
    profit_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    admin_fee_pct DECIMAL(5,4) NOT NULL DEFAULT 0,
    payment_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
    eligibility_criteria JSONB DEFAULT '{}',
    required_documents JSONB DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    requested_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    tenor_months INTEGER NOT NULL,
    profit_rate DECIMAL(5,4),
    purpose TEXT,
    status application_status NOT NULL DEFAULT 'draft',
    assigned_officer_id UUID REFERENCES users(id),
    credit_analyst_id UUID REFERENCES users(id),
    compliance_officer_id UUID REFERENCES users(id),
    pre_approval_date TIMESTAMPTZ,
    approval_date TIMESTAMPTZ,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    mime_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phase 4: Credit Committee
CREATE TYPE committee_decision AS ENUM ('pending', 'approved', 'rejected', 'approved_with_conditions');
CREATE TYPE vote_decision AS ENUM ('approve', 'reject', 'approve_with_conditions');

CREATE TABLE committee_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id),
    prepared_by UUID NOT NULL REFERENCES users(id),
    risk_score INTEGER,
    recommendation TEXT,
    financial_analysis JSONB DEFAULT '{}',
    decision committee_decision NOT NULL DEFAULT 'pending',
    decision_date TIMESTAMPTZ,
    conditions TEXT,
    quorum_required INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE committee_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES committee_packages(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES users(id),
    decision vote_decision NOT NULL,
    comments TEXT,
    voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(package_id, voter_id)
);

-- Phase 5: Facilities & Collections
CREATE TABLE facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR(20) NOT NULL UNIQUE,
    application_id UUID NOT NULL REFERENCES applications(id),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    product_id UUID NOT NULL REFERENCES products(id),
    principal_amount DECIMAL(15,2) NOT NULL,
    profit_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    profit_rate DECIMAL(5,4) NOT NULL,
    tenor_months INTEGER NOT NULL,
    payment_frequency VARCHAR(20) NOT NULL DEFAULT 'monthly',
    disbursement_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    status facility_status NOT NULL DEFAULT 'active',
    delinquency delinquency_status NOT NULL DEFAULT 'current',
    assigned_officer_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE repayment_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    due_date DATE NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    profit_amount DECIMAL(15,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    paid_date DATE,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    is_overdue BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE collection_actions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id UUID NOT NULL REFERENCES facilities(id),
    officer_id UUID NOT NULL REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    next_action_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Phase 6: Activities & Notifications
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    entity_type VARCHAR(50),
    entity_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_org ON applications(organization_id);
CREATE INDEX idx_applications_officer ON applications(assigned_officer_id);
CREATE INDEX idx_applications_ref ON applications(reference_number);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_committee_packages_app ON committee_packages(application_id);
CREATE INDEX idx_committee_votes_pkg ON committee_votes(package_id);
CREATE INDEX idx_facilities_status ON facilities(status);
CREATE INDEX idx_facilities_org ON facilities(organization_id);
CREATE INDEX idx_facilities_delinquency ON facilities(delinquency);
CREATE INDEX idx_facilities_ref ON facilities(reference_number);
CREATE INDEX idx_repayment_facility ON repayment_schedule(facility_id);
CREATE INDEX idx_repayment_due ON repayment_schedule(due_date) WHERE NOT is_paid;
CREATE INDEX idx_collection_facility ON collection_actions(facility_id);
CREATE INDEX idx_activities_entity ON activities(entity_type, entity_id);
CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id) WHERE NOT is_read;
