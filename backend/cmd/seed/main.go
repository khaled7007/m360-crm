package main

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgres://m360:m360@localhost:5432/m360?sslmode=disable"
	}

	ctx := context.Background()
	pool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("failed to connect: %v", err)
	}
	defer pool.Close()

	hash, _ := bcrypt.GenerateFromPassword([]byte("admin123!"), bcrypt.DefaultCost)
	adminID := uuid.New()

	_, err = pool.Exec(ctx, `
		INSERT INTO users (id, email, password_hash, name_en, name_ar, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (email) DO NOTHING`,
		adminID, "admin@m360.sa", string(hash), "Admin User", "مدير النظام", "admin", true,
	)
	if err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	officerHash, _ := bcrypt.GenerateFromPassword([]byte("officer123!"), bcrypt.DefaultCost)
	officerID := uuid.New()

	_, err = pool.Exec(ctx, `
		INSERT INTO users (id, email, password_hash, name_en, name_ar, role, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (email) DO NOTHING`,
		officerID, "officer@m360.sa", string(officerHash), "Ahmed Al-Rashid", "أحمد الراشد", "loan_officer", true,
	)
	if err != nil {
		log.Fatalf("seed officer: %v", err)
	}

	fmt.Println("seed data created successfully")
	fmt.Printf("admin:   admin@m360.sa / admin123!\n")
	fmt.Printf("officer: officer@m360.sa / officer123!\n")
}
