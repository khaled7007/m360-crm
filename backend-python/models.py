import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, Text, DateTime, Date,
    ForeignKey, JSON, BigInteger, UniqueConstraint,
)
from sqlalchemy.orm import relationship
from database import Base


def new_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=new_uuid)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False, default="")
    role = Column(String(50), nullable=False, default="loan_officer")
    is_active = Column(Boolean, nullable=False, default=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Organization(Base):
    __tablename__ = "organizations"
    id = Column(String, primary_key=True, default=new_uuid)
    name_en = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False, default="")
    cr_number = Column(String(20), unique=True, nullable=True)
    cr_verified = Column(Boolean, nullable=False, default=False)
    tax_id = Column(String(20), nullable=True)
    industry = Column(String(100), nullable=True)
    legal_structure = Column(String(100), nullable=True)
    founding_date = Column(Date, nullable=True)
    address_en = Column(Text, nullable=True)
    address_ar = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    website = Column(String(255), nullable=True)
    assigned_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Contact(Base):
    __tablename__ = "contacts"
    id = Column(String, primary_key=True, default=new_uuid)
    organization_id = Column(String, ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name_en = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False, default="")
    national_id = Column(String(20), nullable=True)
    role = Column(String(100), nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    nafath_verified = Column(Boolean, nullable=False, default=False)
    simah_score = Column(Integer, nullable=True)
    is_guarantor = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Lead(Base):
    __tablename__ = "leads"
    id = Column(String, primary_key=True, default=new_uuid)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=True)
    contact_name = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    contact_email = Column(String(255), nullable=True)
    company_name = Column(String(255), nullable=True)
    source = Column(String(50), nullable=False, default="walk_in")
    status = Column(String(20), nullable=False, default="new")
    estimated_amount = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)
    assigned_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, default=new_uuid)
    name_en = Column(String(255), nullable=False)
    name_ar = Column(String(255), nullable=False, default="")
    type = Column(String(50), nullable=False, default="murabaha")
    min_amount = Column(Float, nullable=False, default=0)
    max_amount = Column(Float, nullable=False, default=0)
    min_tenor_months = Column(Integer, nullable=False, default=1)
    max_tenor_months = Column(Integer, nullable=False, default=60)
    profit_rate = Column(Float, nullable=False, default=0)
    admin_fee_pct = Column(Float, nullable=False, default=0)
    payment_frequency = Column(String(20), nullable=False, default="monthly")
    eligibility_criteria = Column(JSON, default=dict)
    required_documents = Column(JSON, default=list)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Application(Base):
    __tablename__ = "applications"
    id = Column(String, primary_key=True, default=new_uuid)
    reference_number = Column(String(20), unique=True, nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    requested_amount = Column(Float, nullable=False)
    approved_amount = Column(Float, nullable=True)
    tenor_months = Column(Integer, nullable=False)
    profit_rate = Column(Float, nullable=True)
    purpose = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="draft")
    assigned_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    credit_analyst_id = Column(String, ForeignKey("users.id"), nullable=True)
    compliance_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    pre_approval_date = Column(DateTime, nullable=True)
    approval_date = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True, default=new_uuid)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String, nullable=False)
    name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger, nullable=False, default=0)
    mime_type = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    uploaded_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CommitteePackage(Base):
    __tablename__ = "committee_packages"
    id = Column(String, primary_key=True, default=new_uuid)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    prepared_by = Column(String, ForeignKey("users.id"), nullable=False)
    risk_score = Column(Integer, nullable=True)
    recommendation = Column(Text, nullable=True)
    financial_analysis = Column(JSON, default=dict)
    decision = Column(String(30), nullable=False, default="pending")
    decision_date = Column(DateTime, nullable=True)
    conditions = Column(Text, nullable=True)
    quorum_required = Column(Integer, nullable=False, default=3)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    votes = relationship("CommitteeVote", back_populates="package", cascade="all, delete-orphan")


class CommitteeVote(Base):
    __tablename__ = "committee_votes"
    id = Column(String, primary_key=True, default=new_uuid)
    package_id = Column(String, ForeignKey("committee_packages.id", ondelete="CASCADE"), nullable=False)
    voter_id = Column(String, ForeignKey("users.id"), nullable=False)
    decision = Column(String(30), nullable=False)
    comments = Column(Text, nullable=True)
    voted_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    package = relationship("CommitteePackage", back_populates="votes")
    __table_args__ = (UniqueConstraint("package_id", "voter_id"),)


class Facility(Base):
    __tablename__ = "facilities"
    id = Column(String, primary_key=True, default=new_uuid)
    reference_number = Column(String(20), unique=True, nullable=False)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    organization_id = Column(String, ForeignKey("organizations.id"), nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    principal_amount = Column(Float, nullable=False)
    profit_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    outstanding_balance = Column(Float, nullable=False)
    profit_rate = Column(Float, nullable=False)
    tenor_months = Column(Integer, nullable=False)
    payment_frequency = Column(String(20), nullable=False, default="monthly")
    disbursement_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="active")
    delinquency = Column(String(20), nullable=False, default="current")
    assigned_officer_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class RepaymentSchedule(Base):
    __tablename__ = "repayment_schedule"
    id = Column(String, primary_key=True, default=new_uuid)
    facility_id = Column(String, ForeignKey("facilities.id", ondelete="CASCADE"), nullable=False)
    installment_number = Column(Integer, nullable=False)
    due_date = Column(Date, nullable=False)
    principal_amount = Column(Float, nullable=False)
    profit_amount = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=False, default=0)
    paid_date = Column(Date, nullable=True)
    is_paid = Column(Boolean, nullable=False, default=False)
    is_overdue = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class CollectionAction(Base):
    __tablename__ = "collection_actions"
    id = Column(String, primary_key=True, default=new_uuid)
    facility_id = Column(String, ForeignKey("facilities.id"), nullable=False)
    officer_id = Column(String, ForeignKey("users.id"), nullable=False)
    action_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    next_action_date = Column(Date, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Activity(Base):
    __tablename__ = "activities"
    id = Column(String, primary_key=True, default=new_uuid)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(String, nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    action = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSON, default=dict)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True, default=new_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=True)
    type = Column(String(50), nullable=False, default="info")
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(String, nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
