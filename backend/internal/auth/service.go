package auth

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo      *Repository
	jwtSecret string
}

func NewService(repo *Repository, jwtSecret string) *Service {
	return &Service{repo: repo, jwtSecret: jwtSecret}
}

func (s *Service) Register(ctx context.Context, req CreateUserRequest) (*User, error) {
	hash, err := s.hashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := &User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: hash,
		NameEN:       req.NameEN,
		NameAR:       req.NameAR,
		Role:         req.Role,
		IsActive:     true,
	}

	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, err
	}

	return user, nil
}

func (s *Service) Login(ctx context.Context, req LoginRequest) (*TokenResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	if !user.IsActive {
		return nil, fmt.Errorf("account is disabled")
	}

	if !s.verifyPassword(user.PasswordHash, req.Password) {
		return nil, fmt.Errorf("invalid credentials")
	}

	token, err := s.generateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate token: %w", err)
	}

	refreshToken, err := s.generateRefreshToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, fmt.Errorf("generate refresh token: %w", err)
	}

	return &TokenResponse{Token: token, RefreshToken: refreshToken, User: *user}, nil
}

func (s *Service) ParseToken(tokenStr string) (*Claims, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("parse token: %w", err)
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	userID, err := uuid.Parse(mapClaims["user_id"].(string))
	if err != nil {
		return nil, fmt.Errorf("parse user_id: %w", err)
	}

	return &Claims{
		UserID: userID,
		Email:  mapClaims["email"].(string),
		Role:   Role(mapClaims["role"].(string)),
	}, nil
}

func (s *Service) hashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

func (s *Service) verifyPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}

func (s *Service) generateToken(userID uuid.UUID, email string, role Role) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"email":   email,
		"role":    string(role),
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *Service) generateRefreshToken(userID uuid.UUID, email string, role Role) (string, error) {
	claims := jwt.MapClaims{
		"user_id": userID.String(),
		"email":   email,
		"role":    string(role),
		"type":    "refresh",
		"exp":     time.Now().Add(7 * 24 * time.Hour).Unix(),
		"iat":     time.Now().Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}

func (s *Service) RefreshToken(ctx context.Context, refreshTokenStr string) (*TokenResponse, error) {
	token, err := jwt.Parse(refreshTokenStr, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method")
		}
		return []byte(s.jwtSecret), nil
	})
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token")
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	tokenType, _ := mapClaims["type"].(string)
	if tokenType != "refresh" {
		return nil, fmt.Errorf("not a refresh token")
	}

	userID, err := uuid.Parse(mapClaims["user_id"].(string))
	if err != nil {
		return nil, fmt.Errorf("invalid user id in token")
	}

	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	if !user.IsActive {
		return nil, fmt.Errorf("account is disabled")
	}

	accessToken, err := s.generateToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	newRefresh, err := s.generateRefreshToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, err
	}

	return &TokenResponse{
		Token:        accessToken,
		RefreshToken: newRefresh,
		User:         *user,
	}, nil
}

func (s *Service) ForgotPassword(ctx context.Context, email string) error {
	token := uuid.New().String()
	expires := time.Now().Add(1 * time.Hour)

	if err := s.repo.SetResetToken(ctx, email, token, expires); err != nil {
		// Don't reveal if email exists
		return nil
	}

	// Mock email: log to console
	log.Printf("[PASSWORD RESET] Token for %s: %s", email, token)
	return nil
}

func (s *Service) ResetPassword(ctx context.Context, token, newPassword string) error {
	user, err := s.repo.GetByResetToken(ctx, token)
	if err != nil {
		return fmt.Errorf("invalid or expired reset token")
	}

	hash, err := s.hashPassword(newPassword)
	if err != nil {
		return fmt.Errorf("hash password: %w", err)
	}

	return s.repo.UpdatePassword(ctx, user.ID, hash)
}
