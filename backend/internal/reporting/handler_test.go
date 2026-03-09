package reporting

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

// mockRepo satisfies the repository interface defined in service.go.
type mockRepo struct {
	getDashboardStatsFn    func(ctx context.Context) (*DashboardStats, error)
	getPipelineStatsFn     func(ctx context.Context) (*PipelineStats, error)
	getOfficerPerformanceFn func(ctx context.Context) ([]OfficerPerformance, error)
	getPortfolioAtRiskFn   func(ctx context.Context) (map[string]interface{}, error)
}

func (m *mockRepo) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	if m.getDashboardStatsFn != nil {
		return m.getDashboardStatsFn(ctx)
	}
	return &DashboardStats{}, nil
}

func (m *mockRepo) GetPipelineStats(ctx context.Context) (*PipelineStats, error) {
	if m.getPipelineStatsFn != nil {
		return m.getPipelineStatsFn(ctx)
	}
	return &PipelineStats{}, nil
}

func (m *mockRepo) GetOfficerPerformance(ctx context.Context) ([]OfficerPerformance, error) {
	if m.getOfficerPerformanceFn != nil {
		return m.getOfficerPerformanceFn(ctx)
	}
	return nil, nil
}

func (m *mockRepo) GetPortfolioAtRisk(ctx context.Context) (map[string]interface{}, error) {
	if m.getPortfolioAtRiskFn != nil {
		return m.getPortfolioAtRiskFn(ctx)
	}
	return map[string]interface{}{}, nil
}

func newReportingHandler(repo repository) *Handler {
	svc := &Service{repo: repo}
	return NewHandler(svc)
}

// --- GetDashboard tests ---

func TestHandler_GetDashboard_Success(t *testing.T) {
	repo := &mockRepo{
		getDashboardStatsFn: func(ctx context.Context) (*DashboardStats, error) {
			return &DashboardStats{
				TotalLeads:        42,
				TotalApplications: 15,
				TotalFacilities:   8,
				TotalDisbursed:    5000000,
				TotalOutstanding:  3200000,
				PAR30:             12.5,
				PAR60:             5.0,
				PAR90:             2.5,
			}, nil
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/dashboard", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.GetDashboard(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result DashboardStats
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.TotalLeads != 42 {
		t.Errorf("expected TotalLeads 42, got %d", result.TotalLeads)
	}
	if result.TotalApplications != 15 {
		t.Errorf("expected TotalApplications 15, got %d", result.TotalApplications)
	}
	if result.TotalFacilities != 8 {
		t.Errorf("expected TotalFacilities 8, got %d", result.TotalFacilities)
	}
	if result.TotalDisbursed != 5000000 {
		t.Errorf("expected TotalDisbursed 5000000, got %f", result.TotalDisbursed)
	}
	if result.PAR30 != 12.5 {
		t.Errorf("expected PAR30 12.5, got %f", result.PAR30)
	}
}

func TestHandler_GetDashboard_ServiceError(t *testing.T) {
	repo := &mockRepo{
		getDashboardStatsFn: func(ctx context.Context) (*DashboardStats, error) {
			return nil, errors.New("database connection failed")
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/dashboard", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.GetDashboard(c)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", he.Code)
	}
}

// --- GetPipeline tests ---

func TestHandler_GetPipeline_Success(t *testing.T) {
	repo := &mockRepo{
		getPipelineStatsFn: func(ctx context.Context) (*PipelineStats, error) {
			return &PipelineStats{
				Draft:            5,
				Submitted:        3,
				PreApproved:      2,
				DocsCollected:    1,
				CreditAssessment: 2,
				CommitteeReview:  1,
				Approved:         4,
				Rejected:         2,
				Disbursed:        8,
			}, nil
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/pipeline", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.GetPipeline(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result PipelineStats
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result.Draft != 5 {
		t.Errorf("expected Draft 5, got %d", result.Draft)
	}
	if result.Approved != 4 {
		t.Errorf("expected Approved 4, got %d", result.Approved)
	}
	if result.Disbursed != 8 {
		t.Errorf("expected Disbursed 8, got %d", result.Disbursed)
	}
}

func TestHandler_GetPipeline_ServiceError(t *testing.T) {
	repo := &mockRepo{
		getPipelineStatsFn: func(ctx context.Context) (*PipelineStats, error) {
			return nil, errors.New("query timeout")
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/pipeline", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.GetPipeline(c)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", he.Code)
	}
}

// --- GetOfficers tests ---

func TestHandler_GetOfficers_Success(t *testing.T) {
	repo := &mockRepo{
		getOfficerPerformanceFn: func(ctx context.Context) ([]OfficerPerformance, error) {
			return []OfficerPerformance{
				{
					OfficerID:      "officer-1",
					OfficerName:    "Ahmed Al-Rashid",
					LeadCount:      20,
					AppCount:       10,
					Disbursed:      1500000,
					ConversionRate: 50.0,
				},
				{
					OfficerID:      "officer-2",
					OfficerName:    "Fatima Al-Zahrani",
					LeadCount:      15,
					AppCount:       12,
					Disbursed:      2000000,
					ConversionRate: 80.0,
				},
			}, nil
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/officers", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.GetOfficers(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result []OfficerPerformance
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if len(result) != 2 {
		t.Fatalf("expected 2 officers, got %d", len(result))
	}
	if result[0].OfficerName != "Ahmed Al-Rashid" {
		t.Errorf("expected first officer 'Ahmed Al-Rashid', got %q", result[0].OfficerName)
	}
	if result[1].ConversionRate != 80.0 {
		t.Errorf("expected second officer conversion rate 80.0, got %f", result[1].ConversionRate)
	}
}

func TestHandler_GetOfficers_EmptyList(t *testing.T) {
	repo := &mockRepo{
		getOfficerPerformanceFn: func(ctx context.Context) ([]OfficerPerformance, error) {
			return nil, nil
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/officers", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.GetOfficers(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	// Handler should return empty array, not null
	var result []OfficerPerformance
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if result == nil {
		t.Error("expected empty array, got null")
	}
	if len(result) != 0 {
		t.Errorf("expected 0 officers, got %d", len(result))
	}
}

func TestHandler_GetOfficers_ServiceError(t *testing.T) {
	repo := &mockRepo{
		getOfficerPerformanceFn: func(ctx context.Context) ([]OfficerPerformance, error) {
			return nil, errors.New("database error")
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/officers", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.GetOfficers(c)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", he.Code)
	}
}

// --- GetPortfolioAtRisk tests ---

func TestHandler_GetPortfolioAtRisk_Success(t *testing.T) {
	repo := &mockRepo{
		getPortfolioAtRiskFn: func(ctx context.Context) (map[string]interface{}, error) {
			return map[string]interface{}{
				"total_active_facilities": 100,
				"total_active_amount":     25000000.0,
				"total_par_ratio":         15.0,
				"breakdown": map[string]interface{}{
					"current": map[string]interface{}{
						"count":  85,
						"amount": 20000000.0,
					},
					"par_30": map[string]interface{}{
						"count":  10,
						"amount": 3000000.0,
					},
					"par_90": map[string]interface{}{
						"count":  5,
						"amount": 2000000.0,
					},
				},
			}, nil
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/par", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	if err := h.GetPortfolioAtRisk(c); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if rec.Code != http.StatusOK {
		t.Errorf("expected 200, got %d", rec.Code)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if _, ok := result["total_active_facilities"]; !ok {
		t.Error("response missing 'total_active_facilities' key")
	}
	if _, ok := result["total_par_ratio"]; !ok {
		t.Error("response missing 'total_par_ratio' key")
	}
	if _, ok := result["breakdown"]; !ok {
		t.Error("response missing 'breakdown' key")
	}

	parRatio, ok := result["total_par_ratio"].(float64)
	if !ok {
		t.Fatalf("total_par_ratio is not a number, got %T", result["total_par_ratio"])
	}
	if parRatio != 15.0 {
		t.Errorf("expected total_par_ratio 15.0, got %f", parRatio)
	}
}

func TestHandler_GetPortfolioAtRisk_ServiceError(t *testing.T) {
	repo := &mockRepo{
		getPortfolioAtRiskFn: func(ctx context.Context) (map[string]interface{}, error) {
			return nil, errors.New("database unreachable")
		},
	}
	h := newReportingHandler(repo)

	e := echo.New()
	req := httptest.NewRequest(http.MethodGet, "/reports/par", nil)
	rec := httptest.NewRecorder()
	c := e.NewContext(req, rec)

	err := h.GetPortfolioAtRisk(c)
	if err == nil {
		t.Fatal("expected error, got nil")
	}
	he, ok := err.(*echo.HTTPError)
	if !ok {
		t.Fatalf("expected *echo.HTTPError, got %T", err)
	}
	if he.Code != http.StatusInternalServerError {
		t.Errorf("expected 500, got %d", he.Code)
	}
}
