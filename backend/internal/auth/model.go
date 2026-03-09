package auth

import (
	"time"

	"github.com/google/uuid"
)

type Role string

const (
	RoleAdmin              Role = "admin"
	RoleManager            Role = "manager"
	RoleLoanOfficer        Role = "loan_officer"
	RoleCreditAnalyst      Role = "credit_analyst"
	RoleComplianceOfficer  Role = "compliance_officer"
	RoleCollectionsOfficer Role = "collections_officer"
	RoleDataEntry          Role = "data_entry"
)

type User struct {
	ID           uuid.UUID `json:"id"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	NameEN       string    `json:"name_en"`
	NameAR       string    `json:"name_ar"`
	Role         Role      `json:"role"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginResponse struct {
	Token string `json:"token"`
	User  User   `json:"user"`
}

type CreateUserRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	NameEN   string `json:"name_en" validate:"required"`
	NameAR   string `json:"name_ar"`
	Role     Role   `json:"role" validate:"required"`
}

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   Role      `json:"role"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type TokenResponse struct {
	Token        string `json:"token"`
	RefreshToken string `json:"refresh_token"`
	User         User   `json:"user"`
}

type ForgotPasswordRequest struct {
	Email string `json:"email" validate:"required,email"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" validate:"required"`
	NewPassword string `json:"new_password" validate:"required,min=8"`
}
