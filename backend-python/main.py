import os
import uuid
import random
import string
from datetime import datetime, timedelta, date
from typing import Optional

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
import bcrypt
from jose import jwt, JWTError

from database import engine, Base, get_db
import models
import schemas

JWT_SECRET = os.getenv("JWT_SECRET", "dev-secret-do-not-use-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE = timedelta(hours=24)
REFRESH_TOKEN_EXPIRE = timedelta(days=7)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

Base.metadata.create_all(bind=engine)

app = FastAPI(title="M360 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail, "code": exc.status_code})


# ── Helpers ──────────────────────────────────────────────────────────────────

def create_token(user: models.User, token_type: str = "access") -> str:
    expire = datetime.utcnow() + (REFRESH_TOKEN_EXPIRE if token_type == "refresh" else ACCESS_TOKEN_EXPIRE)
    payload = {"user_id": user.id, "email": user.email, "role": user.role, "exp": expire, "iat": datetime.utcnow()}
    if token_type == "refresh":
        payload["type"] = "refresh"
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> models.User:
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(401, "missing or invalid authorization header")
    token = auth_header[7:]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(401, "invalid or expired token")
    user = db.query(models.User).filter(models.User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(401, "user not found")
    return user


def get_optional_user(request: Request, db: Session = Depends(get_db)) -> Optional[models.User]:
    try:
        return get_current_user(request, db)
    except HTTPException:
        return None


def paginated_response(data, total, limit, offset):
    return {"data": data, "total": total, "pagination": {"total": total, "limit": limit, "offset": offset}}


def gen_ref(prefix: str) -> str:
    return f"{prefix}-{datetime.utcnow().strftime('%y%m')}-{''.join(random.choices(string.digits, k=4))}"


# ── Seed admin on startup ───────────────────────────────────────────────────

@app.on_event("startup")
def seed_admin():
    db = next(get_db())
    try:
        if not db.query(models.User).filter(models.User.email == "admin@m360.sa").first():
            admin = models.User(
                email="admin@m360.sa",
                password_hash=hash_password("admin123!"),
                name_en="Admin User",
                name_ar="مدير النظام",
                role="admin",
            )
            db.add(admin)
            db.commit()
            print("Seeded admin: admin@m360.sa / admin123!")
        if not db.query(models.User).filter(models.User.email == "officer@m360.sa").first():
            officer = models.User(
                email="officer@m360.sa",
                password_hash=hash_password("officer123!"),
                name_en="Ahmed Al-Rashid",
                name_ar="أحمد الراشد",
                role="loan_officer",
            )
            db.add(officer)
            db.commit()
            print("Seeded officer: officer@m360.sa / officer123!")
    finally:
        db.close()


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/ready")
def ready():
    return {"status": "ready", "checks": {"database": "ok"}}


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTH
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/auth/login")
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(401, "invalid email or password")
    if not user.is_active:
        raise HTTPException(403, "account is deactivated")
    return schemas.TokenResponse(
        token=create_token(user),
        refresh_token=create_token(user, "refresh"),
        user=schemas.UserOut.model_validate(user),
    )

@app.post("/api/v1/auth/register", status_code=201)
def register(req: schemas.CreateUserRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(409, "email already registered")
    user = models.User(email=req.email, password_hash=hash_password(req.password), name_en=req.name_en, name_ar=req.name_ar, role=req.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserOut.model_validate(user)

@app.post("/api/v1/auth/refresh")
def refresh(req: schemas.RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(req.refresh_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(401, "invalid refresh token")
    if payload.get("type") != "refresh":
        raise HTTPException(401, "not a refresh token")
    user = db.query(models.User).filter(models.User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(401, "user not found")
    return schemas.TokenResponse(
        token=create_token(user),
        refresh_token=create_token(user, "refresh"),
        user=schemas.UserOut.model_validate(user),
    )

@app.post("/api/v1/auth/forgot-password")
def forgot_password(req: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if user:
        token = str(uuid.uuid4())
        user.password_reset_token = token
        user.password_reset_expires = datetime.utcnow() + timedelta(hours=1)
        db.commit()
        print(f"Password reset token for {req.email}: {token}")
    return {"message": "if the email exists, a reset link has been sent"}

@app.post("/api/v1/auth/reset-password")
def reset_password(req: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.password_reset_token == req.token,
        models.User.password_reset_expires > datetime.utcnow(),
    ).first()
    if not user:
        raise HTTPException(400, "invalid or expired reset token")
    user.password_hash = hash_password(req.new_password)
    user.password_reset_token = None
    user.password_reset_expires = None
    db.commit()
    return {"message": "password reset successfully"}

@app.get("/api/v1/auth/me")
def me(current_user: models.User = Depends(get_current_user)):
    return schemas.UserOut.model_validate(current_user)

@app.get("/api/v1/auth/users")
def list_users(limit: int = Query(20, le=100), offset: int = 0, search: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.User)
    if search:
        q = q.filter(or_(models.User.name_en.ilike(f"%{search}%"), models.User.email.ilike(f"%{search}%")))
    total = q.count()
    users = q.offset(offset).limit(limit).all()
    return paginated_response([schemas.UserOut.model_validate(u) for u in users], total, limit, offset)

@app.post("/api/v1/auth/users", status_code=201)
def create_user(req: schemas.CreateUserRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(409, "email already registered")
    user = models.User(email=req.email, password_hash=hash_password(req.password), name_en=req.name_en, name_ar=req.name_ar, role=req.role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return schemas.UserOut.model_validate(user)


# ═══════════════════════════════════════════════════════════════════════════════
#  ORGANIZATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/organizations", status_code=201)
def create_organization(req: schemas.OrganizationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    org = models.Organization(**req.model_dump(), assigned_officer_id=current_user.id)
    db.add(org)
    db.commit()
    db.refresh(org)
    return schemas.OrganizationOut.model_validate(org)

@app.get("/api/v1/organizations")
def list_organizations(limit: int = Query(20, le=100), offset: int = 0, search: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Organization)
    if search:
        q = q.filter(or_(models.Organization.name_en.ilike(f"%{search}%"), models.Organization.cr_number.ilike(f"%{search}%")))
    total = q.count()
    orgs = q.order_by(models.Organization.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.OrganizationOut.model_validate(o) for o in orgs], total, limit, offset)

@app.get("/api/v1/organizations/{id}")
def get_organization(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(404, "organization not found")
    return schemas.OrganizationOut.model_validate(org)

@app.put("/api/v1/organizations/{id}")
def update_organization(id: str, req: schemas.OrganizationUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(404, "organization not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(org, k, v)
    org.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(org)
    return schemas.OrganizationOut.model_validate(org)

@app.delete("/api/v1/organizations/{id}", status_code=204)
def delete_organization(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    org = db.query(models.Organization).filter(models.Organization.id == id).first()
    if not org:
        raise HTTPException(404, "organization not found")
    db.delete(org)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
#  CONTACTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/contacts", status_code=201)
def create_contact(req: schemas.ContactCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contact = models.Contact(**req.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return schemas.ContactOut.model_validate(contact)

@app.get("/api/v1/contacts")
def list_contacts(limit: int = Query(20, le=100), offset: int = 0, search: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Contact)
    if search:
        q = q.filter(or_(models.Contact.name_en.ilike(f"%{search}%"), models.Contact.email.ilike(f"%{search}%")))
    total = q.count()
    contacts = q.order_by(models.Contact.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.ContactOut.model_validate(c) for c in contacts], total, limit, offset)

@app.get("/api/v1/contacts/organization/{org_id}")
def list_contacts_by_org(org_id: str, limit: int = Query(20, le=100), offset: int = 0, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Contact).filter(models.Contact.organization_id == org_id)
    total = q.count()
    contacts = q.offset(offset).limit(limit).all()
    return paginated_response([schemas.ContactOut.model_validate(c) for c in contacts], total, limit, offset)

@app.get("/api/v1/contacts/{id}")
def get_contact(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contact = db.query(models.Contact).filter(models.Contact.id == id).first()
    if not contact:
        raise HTTPException(404, "contact not found")
    return schemas.ContactOut.model_validate(contact)

@app.put("/api/v1/contacts/{id}")
def update_contact(id: str, req: schemas.ContactUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contact = db.query(models.Contact).filter(models.Contact.id == id).first()
    if not contact:
        raise HTTPException(404, "contact not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(contact, k, v)
    contact.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contact)
    return schemas.ContactOut.model_validate(contact)

@app.delete("/api/v1/contacts/{id}", status_code=204)
def delete_contact(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    contact = db.query(models.Contact).filter(models.Contact.id == id).first()
    if not contact:
        raise HTTPException(404, "contact not found")
    db.delete(contact)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
#  LEADS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/leads", status_code=201)
def create_lead(req: schemas.LeadCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    lead = models.Lead(**req.model_dump(), assigned_officer_id=current_user.id)
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return schemas.LeadOut.model_validate(lead)

@app.get("/api/v1/leads")
def list_leads(limit: int = Query(20, le=100), offset: int = 0, search: str = "", status: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Lead)
    if search:
        q = q.filter(or_(models.Lead.contact_name.ilike(f"%{search}%"), models.Lead.company_name.ilike(f"%{search}%")))
    if status:
        q = q.filter(models.Lead.status == status)
    total = q.count()
    leads = q.order_by(models.Lead.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.LeadOut.model_validate(l) for l in leads], total, limit, offset)

@app.get("/api/v1/leads/{id}")
def get_lead(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(404, "lead not found")
    return schemas.LeadOut.model_validate(lead)

@app.put("/api/v1/leads/{id}")
def update_lead(id: str, req: schemas.LeadUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(404, "lead not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(lead, k, v)
    lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(lead)
    return schemas.LeadOut.model_validate(lead)

@app.delete("/api/v1/leads/{id}", status_code=204)
def delete_lead(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    lead = db.query(models.Lead).filter(models.Lead.id == id).first()
    if not lead:
        raise HTTPException(404, "lead not found")
    db.delete(lead)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
#  PRODUCTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/products", status_code=201)
def create_product(req: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = models.Product(**req.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return schemas.ProductOut.model_validate(product)

@app.get("/api/v1/products")
def list_products(active: Optional[bool] = None, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Product)
    if active is not None:
        q = q.filter(models.Product.is_active == active)
    products = q.all()
    return [schemas.ProductOut.model_validate(p) for p in products]

@app.get("/api/v1/products/{id}")
def get_product(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(404, "product not found")
    return schemas.ProductOut.model_validate(product)

@app.put("/api/v1/products/{id}")
def update_product(id: str, req: schemas.ProductUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == id).first()
    if not product:
        raise HTTPException(404, "product not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(product, k, v)
    product.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(product)
    return schemas.ProductOut.model_validate(product)


# ═══════════════════════════════════════════════════════════════════════════════
#  APPLICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/applications", status_code=201)
def create_application(req: schemas.ApplicationCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    app_obj = models.Application(
        **req.model_dump(),
        reference_number=gen_ref("APP"),
        assigned_officer_id=current_user.id,
    )
    db.add(app_obj)
    db.commit()
    db.refresh(app_obj)
    return schemas.ApplicationOut.model_validate(app_obj)

@app.get("/api/v1/applications")
def list_applications(limit: int = Query(20, le=100), offset: int = 0, search: str = "", status: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Application)
    if search:
        q = q.filter(models.Application.reference_number.ilike(f"%{search}%"))
    if status:
        q = q.filter(models.Application.status == status)
    total = q.count()
    apps = q.order_by(models.Application.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.ApplicationOut.model_validate(a) for a in apps], total, limit, offset)

@app.get("/api/v1/applications/{id}")
def get_application(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    app_obj = db.query(models.Application).filter(models.Application.id == id).first()
    if not app_obj:
        raise HTTPException(404, "application not found")
    return schemas.ApplicationOut.model_validate(app_obj)

@app.put("/api/v1/applications/{id}/status")
def update_application_status(id: str, req: schemas.ApplicationStatusUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    app_obj = db.query(models.Application).filter(models.Application.id == id).first()
    if not app_obj:
        raise HTTPException(404, "application not found")
    app_obj.status = req.status
    if req.approved_amount is not None:
        app_obj.approved_amount = req.approved_amount
    if req.profit_rate is not None:
        app_obj.profit_rate = req.profit_rate
    if req.rejection_reason is not None:
        app_obj.rejection_reason = req.rejection_reason
    if req.status == "pre_approved":
        app_obj.pre_approval_date = datetime.utcnow()
    if req.status in ("approved", "rejected"):
        app_obj.approval_date = datetime.utcnow()
    app_obj.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(app_obj)
    return schemas.ApplicationOut.model_validate(app_obj)


# ═══════════════════════════════════════════════════════════════════════════════
#  COMMITTEE PACKAGES
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/packages", status_code=201)
def create_package(req: schemas.PackageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    pkg = models.CommitteePackage(**req.model_dump(), prepared_by=current_user.id)
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return schemas.PackageOut.model_validate(pkg)

@app.get("/api/v1/packages")
def list_packages(limit: int = Query(20, le=100), offset: int = 0, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.CommitteePackage)
    total = q.count()
    pkgs = q.order_by(models.CommitteePackage.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.PackageOut.model_validate(p) for p in pkgs], total, limit, offset)

@app.get("/api/v1/packages/{id}")
def get_package(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    pkg = db.query(models.CommitteePackage).filter(models.CommitteePackage.id == id).first()
    if not pkg:
        raise HTTPException(404, "package not found")
    return schemas.PackageOut.model_validate(pkg)

@app.get("/api/v1/packages/application/{app_id}")
def get_package_by_application(app_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    pkg = db.query(models.CommitteePackage).filter(models.CommitteePackage.application_id == app_id).first()
    if not pkg:
        raise HTTPException(404, "package not found for application")
    return schemas.PackageOut.model_validate(pkg)

@app.post("/api/v1/packages/{id}/vote", status_code=201)
def cast_vote(id: str, req: schemas.VoteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    pkg = db.query(models.CommitteePackage).filter(models.CommitteePackage.id == id).first()
    if not pkg:
        raise HTTPException(404, "package not found")
    existing = db.query(models.CommitteeVote).filter(
        models.CommitteeVote.package_id == id, models.CommitteeVote.voter_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(409, "already voted")
    vote = models.CommitteeVote(package_id=id, voter_id=current_user.id, decision=req.decision, comments=req.comments)
    db.add(vote)
    votes = db.query(models.CommitteeVote).filter(models.CommitteeVote.package_id == id).all()
    if len(votes) + 1 >= pkg.quorum_required:
        approvals = sum(1 for v in votes if v.decision == "approve") + (1 if req.decision == "approve" else 0)
        if approvals > (len(votes) + 1) / 2:
            pkg.decision = "approved"
        else:
            pkg.decision = "rejected"
        pkg.decision_date = datetime.utcnow()
    db.commit()
    db.refresh(vote)
    return schemas.VoteOut.model_validate(vote)


# ═══════════════════════════════════════════════════════════════════════════════
#  FACILITIES
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/facilities", status_code=201)
def create_facility(req: schemas.FacilityCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_amount = req.principal_amount + req.profit_amount
    maturity = req.disbursement_date + timedelta(days=30 * req.tenor_months)
    fac = models.Facility(
        reference_number=gen_ref("FAC"),
        application_id=req.application_id,
        organization_id=req.organization_id,
        product_id=req.product_id,
        principal_amount=req.principal_amount,
        profit_amount=req.profit_amount,
        total_amount=total_amount,
        outstanding_balance=total_amount,
        profit_rate=round(req.profit_amount / req.principal_amount, 4) if req.principal_amount else 0,
        tenor_months=req.tenor_months,
        payment_frequency=req.payment_frequency,
        disbursement_date=req.disbursement_date,
        maturity_date=maturity,
        assigned_officer_id=current_user.id,
    )
    db.add(fac)
    db.flush()
    monthly_principal = req.principal_amount / req.tenor_months
    monthly_profit = req.profit_amount / req.tenor_months
    for i in range(1, req.tenor_months + 1):
        sched = models.RepaymentSchedule(
            facility_id=fac.id,
            installment_number=i,
            due_date=req.disbursement_date + timedelta(days=30 * i),
            principal_amount=round(monthly_principal, 2),
            profit_amount=round(monthly_profit, 2),
            total_amount=round(monthly_principal + monthly_profit, 2),
        )
        db.add(sched)
    db.commit()
    db.refresh(fac)
    return schemas.FacilityOut.model_validate(fac)

@app.get("/api/v1/facilities")
def list_facilities(status: str = "", organization_id: str = "", delinquency: str = "", limit: int = Query(20, le=100), offset: int = 0, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Facility)
    if status:
        q = q.filter(models.Facility.status == status)
    if organization_id:
        q = q.filter(models.Facility.organization_id == organization_id)
    if delinquency:
        q = q.filter(models.Facility.delinquency == delinquency)
    total = q.count()
    facs = q.order_by(models.Facility.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.FacilityOut.model_validate(f) for f in facs], total, limit, offset)

@app.get("/api/v1/facilities/{id}")
def get_facility(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    fac = db.query(models.Facility).filter(models.Facility.id == id).first()
    if not fac:
        raise HTTPException(404, "facility not found")
    return schemas.FacilityOut.model_validate(fac)

@app.get("/api/v1/facilities/{id}/schedule")
def get_schedule(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    items = db.query(models.RepaymentSchedule).filter(models.RepaymentSchedule.facility_id == id).order_by(models.RepaymentSchedule.installment_number).all()
    return [schemas.RepaymentOut.model_validate(i) for i in items]

@app.post("/api/v1/facilities/{id}/payments")
def record_payment(id: str, req: schemas.PaymentRecord, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.RepaymentSchedule).filter(
        models.RepaymentSchedule.facility_id == id,
        models.RepaymentSchedule.installment_number == req.installment_number,
    ).first()
    if not item:
        raise HTTPException(404, "installment not found")
    item.paid_amount = req.paid_amount
    item.paid_date = req.payment_date
    item.is_paid = req.paid_amount >= item.total_amount
    fac = db.query(models.Facility).filter(models.Facility.id == id).first()
    if fac:
        fac.outstanding_balance = max(0, fac.outstanding_balance - req.paid_amount)
    db.commit()
    db.refresh(item)
    return schemas.RepaymentOut.model_validate(item)


# ═══════════════════════════════════════════════════════════════════════════════
#  COLLECTIONS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/collections", status_code=201)
def create_collection(req: schemas.CollectionCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    action = models.CollectionAction(**req.model_dump(), officer_id=current_user.id)
    db.add(action)
    db.commit()
    db.refresh(action)
    return schemas.CollectionOut.model_validate(action)

@app.get("/api/v1/collections")
def list_collections(limit: int = Query(20, le=100), offset: int = 0, facility_id: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.CollectionAction)
    if facility_id:
        q = q.filter(models.CollectionAction.facility_id == facility_id)
    total = q.count()
    actions = q.order_by(models.CollectionAction.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.CollectionOut.model_validate(a) for a in actions], total, limit, offset)

@app.get("/api/v1/collections/overdue")
def get_overdue(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    overdue_facs = db.query(models.Facility).filter(models.Facility.delinquency != "current").all()
    facilities = []
    for f in overdue_facs:
        overdue_items = db.query(models.RepaymentSchedule).filter(
            models.RepaymentSchedule.facility_id == f.id,
            models.RepaymentSchedule.is_paid == False,
            models.RepaymentSchedule.due_date < date.today(),
        ).all()
        overdue_amount = sum(i.total_amount - i.paid_amount for i in overdue_items)
        days = (date.today() - min(i.due_date for i in overdue_items)).days if overdue_items else 0
        actions_count = db.query(models.CollectionAction).filter(models.CollectionAction.facility_id == f.id).count()
        org = db.query(models.Organization).filter(models.Organization.id == f.organization_id).first()
        facilities.append({
            "id": f.id, "facility_number": f.reference_number,
            "borrower_name": org.name_en if org else "", "overdue_amount": overdue_amount,
            "days_overdue": days, "last_collection_date": None, "collection_count": actions_count,
        })
    return {"total_overdue_facilities": len(facilities), "overdue_facilities": facilities}

@app.get("/api/v1/collections/facility/{id}")
def list_collections_by_facility(id: str, limit: int = Query(20, le=100), offset: int = 0, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.CollectionAction).filter(models.CollectionAction.facility_id == id)
    total = q.count()
    actions = q.order_by(models.CollectionAction.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.CollectionOut.model_validate(a) for a in actions], total, limit, offset)


# ═══════════════════════════════════════════════════════════════════════════════
#  ACTIVITIES
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/v1/activities", status_code=201)
def create_activity(req: schemas.ActivityCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    act = models.Activity(
        entity_type=req.entity_type, entity_id=req.entity_id,
        user_id=current_user.id, action=req.action,
        description=req.description, metadata_=req.metadata or {},
    )
    db.add(act)
    db.commit()
    db.refresh(act)
    return schemas.ActivityOut.model_validate(act)

@app.get("/api/v1/activities/entity/{entity_type}/{entity_id}")
def list_activities_by_entity(entity_type: str, entity_id: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(models.Activity).filter(models.Activity.entity_type == entity_type, models.Activity.entity_id == entity_id)
    total = q.count()
    acts = q.order_by(models.Activity.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.ActivityOut.model_validate(a) for a in acts], total, limit, offset)

@app.get("/api/v1/activities/user/{user_id}")
def list_activities_by_user(user_id: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db)):
    q = db.query(models.Activity).filter(models.Activity.user_id == user_id)
    total = q.count()
    acts = q.order_by(models.Activity.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.ActivityOut.model_validate(a) for a in acts], total, limit, offset)


# ═══════════════════════════════════════════════════════════════════════════════
#  NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/notifications")
def list_notifications(unread: bool = False, limit: int = 50, offset: int = 0, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    q = db.query(models.Notification).filter(models.Notification.user_id == current_user.id)
    if unread:
        q = q.filter(models.Notification.is_read == False)
    total = q.count()
    notifs = q.order_by(models.Notification.created_at.desc()).offset(offset).limit(limit).all()
    return paginated_response([schemas.NotificationOut.model_validate(n) for n in notifs], total, limit, offset)

@app.put("/api/v1/notifications/{id}/read")
def mark_read(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == id, models.Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(404, "notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "marked as read"}

@app.put("/api/v1/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id, models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "all marked as read"}

@app.get("/api/v1/notifications/count")
def count_unread(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id, models.Notification.is_read == False
    ).count()
    return {"count": count}


# ═══════════════════════════════════════════════════════════════════════════════
#  DOCUMENTS
# ═══════════════════════════════════════════════════════════════════════════════

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/v1/documents", status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    entity_type: str = Form(...),
    entity_id: str = Form(...),
    name: str = Form(""),
    category: str = Form(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(400, "file too large (max 10MB)")
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1]
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    doc = models.Document(
        entity_type=entity_type, entity_id=entity_id,
        name=name or file.filename or "unnamed",
        file_path=file_path, file_size=len(content),
        mime_type=file.content_type or "application/octet-stream",
        category=category or None, uploaded_by=current_user.id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return schemas.DocumentOut.model_validate(doc)

@app.get("/api/v1/documents/entity/{entity_type}/{entity_id}")
def list_documents_by_entity(entity_type: str, entity_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    docs = db.query(models.Document).filter(
        models.Document.entity_type == entity_type, models.Document.entity_id == entity_id
    ).all()
    return [schemas.DocumentOut.model_validate(d) for d in docs]

@app.get("/api/v1/documents/{id}")
def get_document(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == id).first()
    if not doc:
        raise HTTPException(404, "document not found")
    return schemas.DocumentOut.model_validate(doc)

@app.delete("/api/v1/documents/{id}", status_code=204)
def delete_document(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    doc = db.query(models.Document).filter(models.Document.id == id).first()
    if not doc:
        raise HTTPException(404, "document not found")
    if os.path.exists(doc.file_path):
        os.remove(doc.file_path)
    db.delete(doc)
    db.commit()


# ═══════════════════════════════════════════════════════════════════════════════
#  INTEGRATIONS (mock Saudi APIs)
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/integrations/simah/{national_id}")
def simah_report(national_id: str, current_user: models.User = Depends(get_current_user)):
    return {"national_id": national_id, "score": 720, "status": "good", "existing_liabilities": 2, "total_exposure": 150000, "report_date": datetime.utcnow().isoformat()}

@app.get("/api/v1/integrations/bayan/{cr_number}")
def bayan_report(cr_number: str, current_user: models.User = Depends(get_current_user)):
    return {"cr_number": cr_number, "company_name": "Sample Company", "status": "active", "capital": 1000000, "employees": 25, "founded": "2015-01-01"}

@app.get("/api/v1/integrations/nafath/{national_id}")
def nafath_verify(national_id: str, current_user: models.User = Depends(get_current_user)):
    return {"national_id": national_id, "verified": True, "name": "محمد أحمد", "verification_date": datetime.utcnow().isoformat()}

@app.get("/api/v1/integrations/yaqeen/{national_id}")
def yaqeen_info(national_id: str, current_user: models.User = Depends(get_current_user)):
    return {"national_id": national_id, "full_name_ar": "محمد أحمد الغامدي", "full_name_en": "Mohammed Ahmed Al-Ghamdi", "date_of_birth": "1990-01-15", "gender": "male", "nationality": "Saudi"}

@app.get("/api/v1/integrations/watheq/{cr_number}")
def watheq_verify(cr_number: str, current_user: models.User = Depends(get_current_user)):
    return {"cr_number": cr_number, "valid": True, "company_name": "Sample Company LLC", "expiry_date": "2027-06-15"}

@app.get("/api/v1/integrations/watheq/{cr_number}/full")
def watheq_full(cr_number: str, current_user: models.User = Depends(get_current_user)):
    return {"cr_number": cr_number, "company_name": "Sample Company LLC", "legal_structure": "LLC", "capital": 500000, "activities": ["trading", "services"], "partners": [{"name": "Partner A", "share": 60}, {"name": "Partner B", "share": 40}]}


# ═══════════════════════════════════════════════════════════════════════════════
#  REPORTING
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/api/v1/reports/dashboard")
def dashboard(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return {
        "total_leads": db.query(models.Lead).count(),
        "total_applications": db.query(models.Application).count(),
        "total_facilities": db.query(models.Facility).count(),
        "total_disbursed": db.query(func.coalesce(func.sum(models.Facility.total_amount), 0)).scalar(),
        "total_outstanding": db.query(func.coalesce(func.sum(models.Facility.outstanding_balance), 0)).scalar(),
        "par_30": db.query(models.Facility).filter(models.Facility.delinquency == "par_30").count(),
        "par_60": db.query(models.Facility).filter(models.Facility.delinquency == "par_60").count(),
        "par_90": db.query(models.Facility).filter(models.Facility.delinquency == "par_90").count(),
    }

@app.get("/api/v1/reports/pipeline")
def pipeline(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    statuses = ["draft", "submitted", "pre_approved", "documents_collected", "credit_assessment", "committee_review", "approved", "rejected", "disbursed"]
    result = {}
    for s in statuses:
        result[s] = db.query(models.Application).filter(models.Application.status == s).count()
    return result

@app.get("/api/v1/reports/officers")
def officers_report(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    officers = db.query(models.User).filter(models.User.role == "loan_officer").all()
    result = []
    for o in officers:
        leads = db.query(models.Lead).filter(models.Lead.assigned_officer_id == o.id).count()
        apps = db.query(models.Application).filter(models.Application.assigned_officer_id == o.id).count()
        disbursed = db.query(func.coalesce(func.sum(models.Facility.total_amount), 0)).filter(models.Facility.assigned_officer_id == o.id).scalar()
        result.append({
            "officer_id": o.id, "officer_name": o.name_en,
            "lead_count": leads, "app_count": apps,
            "disbursed": float(disbursed), "conversion_rate": round(apps / leads * 100, 1) if leads > 0 else 0,
        })
    return result

@app.get("/api/v1/reports/par")
def par_report(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    total_facilities = db.query(models.Facility).filter(models.Facility.status == "active").count()
    total_outstanding = db.query(func.coalesce(func.sum(models.Facility.outstanding_balance), 0)).filter(models.Facility.status == "active").scalar()
    buckets = {}
    for d in ["current", "par_30", "par_60", "par_90", "par_180", "write_off"]:
        count = db.query(models.Facility).filter(models.Facility.delinquency == d).count()
        amount = db.query(func.coalesce(func.sum(models.Facility.outstanding_balance), 0)).filter(models.Facility.delinquency == d).scalar()
        buckets[d] = {"count": count, "amount": float(amount)}
    return {"total_facilities": total_facilities, "total_outstanding": float(total_outstanding), "buckets": buckets}


# ═══════════════════════════════════════════════════════════════════════════════
#  RUN
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8080"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
