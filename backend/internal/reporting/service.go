package reporting

import (
	"context"
)

type repository interface {
	GetDashboardStats(ctx context.Context) (*DashboardStats, error)
	GetPipelineStats(ctx context.Context) (*PipelineStats, error)
	GetOfficerPerformance(ctx context.Context) ([]OfficerPerformance, error)
	GetPortfolioAtRisk(ctx context.Context) (map[string]interface{}, error)
}

type Service struct {
	repo repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// GetDashboardStats retrieves dashboard statistics
func (s *Service) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	return s.repo.GetDashboardStats(ctx)
}

// GetPipelineStats retrieves pipeline statistics
func (s *Service) GetPipelineStats(ctx context.Context) (*PipelineStats, error) {
	return s.repo.GetPipelineStats(ctx)
}

// GetOfficerPerformance retrieves officer performance metrics
func (s *Service) GetOfficerPerformance(ctx context.Context) ([]OfficerPerformance, error) {
	return s.repo.GetOfficerPerformance(ctx)
}

// GetPortfolioAtRisk retrieves portfolio at risk analysis
func (s *Service) GetPortfolioAtRisk(ctx context.Context) (map[string]interface{}, error) {
	return s.repo.GetPortfolioAtRisk(ctx)
}
