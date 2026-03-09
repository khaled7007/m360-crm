package config

import (
	"fmt"
	"os"
	"strconv"
)

type Config struct {
	Port        int
	DatabaseURL string
	RedisURL    string
	JWTSecret   string
	Environment string
	FrontendURL string
}

func Load() (*Config, error) {
	port, _ := strconv.Atoi(getEnv("PORT", "8080"))
	dbURL := getEnv("DATABASE_URL", "")
	if dbURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	env := getEnv("ENVIRONMENT", "development")
	jwtSecret := getEnv("JWT_SECRET", "")

	if env == "production" && jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET must be set in production")
	}
	if jwtSecret == "" {
		jwtSecret = "dev-secret-do-not-use-in-production"
	}

	return &Config{
		Port:        port,
		DatabaseURL: dbURL,
		RedisURL:    getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:   jwtSecret,
		Environment: env,
		FrontendURL: getEnv("FRONTEND_URL", "http://localhost:3000"),
	}, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
