package auth

import (
	"testing"

	"github.com/google/uuid"
)

func TestHashAndVerifyPassword(t *testing.T) {
	svc := &Service{jwtSecret: "test-secret"}

	hash, err := svc.hashPassword("mypassword123")
	if err != nil {
		t.Fatalf("hashPassword failed: %v", err)
	}

	if !svc.verifyPassword(hash, "mypassword123") {
		t.Fatal("verifyPassword should return true for correct password")
	}

	if svc.verifyPassword(hash, "wrongpassword") {
		t.Fatal("verifyPassword should return false for wrong password")
	}
}

func TestGenerateAndParseToken(t *testing.T) {
	svc := &Service{jwtSecret: "test-secret-key-at-least-32-chars!!"}

	userID := uuid.New()
	token, err := svc.generateToken(userID, "test@example.com", RoleLoanOfficer)
	if err != nil {
		t.Fatalf("generateToken failed: %v", err)
	}

	claims, err := svc.ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected userID %s, got %s", userID, claims.UserID)
	}
	if claims.Email != "test@example.com" {
		t.Errorf("expected email test@example.com, got %s", claims.Email)
	}
	if claims.Role != RoleLoanOfficer {
		t.Errorf("expected role loan_officer, got %s", claims.Role)
	}
}

func TestParseTokenInvalid(t *testing.T) {
	svc := &Service{jwtSecret: "test-secret-key-at-least-32-chars!!"}

	_, err := svc.ParseToken("invalid-token")
	if err == nil {
		t.Fatal("ParseToken should fail for invalid token")
	}
}
