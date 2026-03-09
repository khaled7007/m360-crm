from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime, date


class Pagination(BaseModel):
    total: int
    limit: int
    offset: int


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str
    name_en: str
    name_ar: str = ""
    role: str = "loan_officer"

class RefreshRequest(BaseModel):
    refresh_token: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class UserOut(BaseModel):
    id: str
    email: str
    name_en: str
    name_ar: str
    role: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    token: str
    refresh_token: str
    user: UserOut


# ── Organization ─────────────────────────────────────────────────────────────

class OrganizationCreate(BaseModel):
    name_en: str
    name_ar: str = ""
    cr_number: Optional[str] = None
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    legal_structure: Optional[str] = None
    founding_date: Optional[date] = None
    address_en: Optional[str] = None
    address_ar: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class OrganizationUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    cr_number: Optional[str] = None
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    legal_structure: Optional[str] = None
    founding_date: Optional[date] = None
    address_en: Optional[str] = None
    address_ar: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None

class OrganizationOut(BaseModel):
    id: str
    name_en: str
    name_ar: str
    cr_number: Optional[str] = None
    cr_verified: bool
    tax_id: Optional[str] = None
    industry: Optional[str] = None
    legal_structure: Optional[str] = None
    founding_date: Optional[date] = None
    address_en: Optional[str] = None
    address_ar: Optional[str] = None
    city: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Contact ──────────────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    organization_id: str
    name_en: str
    name_ar: str = ""
    national_id: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_guarantor: bool = False

class ContactUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    national_id: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_guarantor: Optional[bool] = None

class ContactOut(BaseModel):
    id: str
    organization_id: str
    name_en: str
    name_ar: str
    national_id: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    nafath_verified: bool
    simah_score: Optional[int] = None
    is_guarantor: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Lead ─────────────────────────────────────────────────────────────────────

class LeadCreate(BaseModel):
    contact_name: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    company_name: Optional[str] = None
    source: str = "walk_in"
    estimated_amount: Optional[float] = None
    notes: Optional[str] = None

class LeadUpdate(BaseModel):
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    company_name: Optional[str] = None
    source: Optional[str] = None
    status: Optional[str] = None
    estimated_amount: Optional[float] = None
    notes: Optional[str] = None

class LeadOut(BaseModel):
    id: str
    organization_id: Optional[str] = None
    contact_name: str
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    company_name: Optional[str] = None
    source: str
    status: str
    estimated_amount: Optional[float] = None
    notes: Optional[str] = None
    assigned_officer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Product ──────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name_en: str
    name_ar: str = ""
    type: str = "murabaha"
    min_amount: float = 0
    max_amount: float = 0
    min_tenor_months: int = 1
    max_tenor_months: int = 60
    profit_rate: float = 0
    admin_fee_pct: float = 0
    payment_frequency: str = "monthly"
    required_documents: list = []

class ProductUpdate(BaseModel):
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    profit_rate: Optional[float] = None
    admin_fee_pct: Optional[float] = None
    is_active: Optional[bool] = None

class ProductOut(BaseModel):
    id: str
    name_en: str
    name_ar: str
    type: str
    min_amount: float
    max_amount: float
    min_tenor_months: int
    max_tenor_months: int
    profit_rate: float
    admin_fee_pct: float
    payment_frequency: str
    eligibility_criteria: Optional[dict] = None
    required_documents: Optional[list] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Application ──────────────────────────────────────────────────────────────

class ApplicationCreate(BaseModel):
    organization_id: str
    product_id: str
    requested_amount: float
    tenor_months: int
    purpose: Optional[str] = None

class ApplicationStatusUpdate(BaseModel):
    status: str
    approved_amount: Optional[float] = None
    profit_rate: Optional[float] = None
    rejection_reason: Optional[str] = None

class ApplicationOut(BaseModel):
    id: str
    reference_number: str
    organization_id: str
    product_id: str
    requested_amount: float
    approved_amount: Optional[float] = None
    tenor_months: int
    profit_rate: Optional[float] = None
    purpose: Optional[str] = None
    status: str
    assigned_officer_id: Optional[str] = None
    credit_analyst_id: Optional[str] = None
    compliance_officer_id: Optional[str] = None
    pre_approval_date: Optional[datetime] = None
    approval_date: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Committee ────────────────────────────────────────────────────────────────

class PackageCreate(BaseModel):
    application_id: str
    risk_score: Optional[int] = None
    recommendation: Optional[str] = None
    quorum_required: int = 3

class VoteCreate(BaseModel):
    decision: str
    comments: Optional[str] = None

class VoteOut(BaseModel):
    id: str
    package_id: str
    voter_id: str
    decision: str
    comments: Optional[str] = None
    voted_at: datetime
    model_config = {"from_attributes": True}

class PackageOut(BaseModel):
    id: str
    application_id: str
    prepared_by: str
    risk_score: Optional[int] = None
    recommendation: Optional[str] = None
    financial_analysis: Optional[dict] = None
    decision: str
    decision_date: Optional[datetime] = None
    conditions: Optional[str] = None
    quorum_required: int
    votes: list[VoteOut] = []
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Facility ─────────────────────────────────────────────────────────────────

class FacilityCreate(BaseModel):
    application_id: str
    organization_id: str
    product_id: str
    principal_amount: float
    profit_amount: float
    tenor_months: int
    payment_frequency: str = "monthly"
    disbursement_date: date

class PaymentRecord(BaseModel):
    installment_number: int
    paid_amount: float
    payment_date: date

class RepaymentOut(BaseModel):
    id: str
    facility_id: str
    installment_number: int
    due_date: date
    principal_amount: float
    profit_amount: float
    total_amount: float
    paid_amount: float
    paid_date: Optional[date] = None
    is_paid: bool
    is_overdue: bool
    created_at: datetime
    model_config = {"from_attributes": True}

class FacilityOut(BaseModel):
    id: str
    reference_number: str
    application_id: str
    organization_id: str
    product_id: str
    principal_amount: float
    profit_amount: float
    total_amount: float
    outstanding_balance: float
    profit_rate: float
    tenor_months: int
    payment_frequency: str
    disbursement_date: date
    maturity_date: date
    status: str
    delinquency: str
    assigned_officer_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Collection ───────────────────────────────────────────────────────────────

class CollectionCreate(BaseModel):
    facility_id: str
    action_type: str
    description: Optional[str] = None
    next_action_date: Optional[date] = None

class CollectionOut(BaseModel):
    id: str
    facility_id: str
    officer_id: str
    action_type: str
    description: Optional[str] = None
    next_action_date: Optional[date] = None
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Activity ─────────────────────────────────────────────────────────────────

class ActivityCreate(BaseModel):
    entity_type: str
    entity_id: str
    action: str
    description: Optional[str] = None
    metadata: Optional[dict] = None

class ActivityOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    user_id: str
    action: str
    description: Optional[str] = None
    metadata_: Optional[dict] = None
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Notification ─────────────────────────────────────────────────────────────

class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    body: Optional[str] = None
    type: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Document ─────────────────────────────────────────────────────────────────

class DocumentOut(BaseModel):
    id: str
    entity_type: str
    entity_id: str
    name: str
    file_path: str
    file_size: int
    mime_type: str
    category: Optional[str] = None
    uploaded_by: str
    created_at: datetime
    model_config = {"from_attributes": True}
