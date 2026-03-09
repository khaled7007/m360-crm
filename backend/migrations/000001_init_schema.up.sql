CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE user_role AS ENUM (
    'admin',
    'manager',
    'loan_officer',
    'credit_analyst',
    'compliance_officer',
    'collections_officer',
    'data_entry'
);

CREATE TYPE lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'unqualified',
    'converted'
);

CREATE TYPE application_status AS ENUM (
    'draft',
    'submitted',
    'pre_approved',
    'documents_collected',
    'credit_assessment',
    'committee_review',
    'approved',
    'rejected',
    'disbursed'
);

CREATE TYPE facility_status AS ENUM (
    'active',
    'closed',
    'defaulted',
    'restructured'
);

CREATE TYPE delinquency_status AS ENUM (
    'current',
    'par_30',
    'par_60',
    'par_90',
    'par_180',
    'write_off'
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL DEFAULT '',
    role user_role NOT NULL DEFAULT 'loan_officer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Organizations (SME borrowers)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL DEFAULT '',
    cr_number VARCHAR(20) UNIQUE,
    cr_verified BOOLEAN NOT NULL DEFAULT false,
    tax_id VARCHAR(20),
    industry VARCHAR(100),
    legal_structure VARCHAR(100),
    founding_date DATE,
    address_en TEXT,
    address_ar TEXT,
    city VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    assigned_officer_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Contacts (people linked to organizations)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name_en VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL DEFAULT '',
    national_id VARCHAR(20),
    role VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    nafath_verified BOOLEAN NOT NULL DEFAULT false,
    simah_score INTEGER,
    is_guarantor BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id),
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    company_name VARCHAR(255),
    source VARCHAR(50) NOT NULL DEFAULT 'walk_in',
    status lead_status NOT NULL DEFAULT 'new',
    estimated_amount DECIMAL(15,2),
    notes TEXT,
    assigned_officer_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_organizations_cr_number ON organizations(cr_number);
CREATE INDEX idx_organizations_assigned_officer ON organizations(assigned_officer_id);
CREATE INDEX idx_contacts_organization ON contacts(organization_id);
CREATE INDEX idx_contacts_national_id ON contacts(national_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_officer ON leads(assigned_officer_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
