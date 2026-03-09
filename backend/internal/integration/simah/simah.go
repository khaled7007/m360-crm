package simah

import (
	"fmt"
	"strings"
)

type CreditReport struct {
	Score        int    `json:"score"`
	RiskLevel    string `json:"risk_level"`
	ActiveLoans  int    `json:"active_loans"`
	DefaultCount int    `json:"default_count"`
	TotalDebt    int    `json:"total_debt"`
	LastUpdated  string `json:"last_updated"`
}

type Client struct{}

func New() *Client { return &Client{} }

// GetCreditReport returns a deterministic mock credit report based on the last
// digit of the national ID. IDs starting with "ERR" simulate a service error.
func (c *Client) GetCreditReport(nationalID string) (*CreditReport, error) {
	if strings.HasPrefix(strings.ToUpper(nationalID), "ERR") {
		return nil, fmt.Errorf("SIMAH service unavailable")
	}

	digit := lastDigit(nationalID)

	// Scores: 600-870, spread across the last digit (0-9)
	scores := [10]int{750, 620, 810, 680, 870, 600, 730, 660, 790, 710}
	risks := [10]string{"low", "high", "very_low", "medium", "very_low", "high", "low", "medium", "low", "medium"}
	loans := [10]int{1, 5, 0, 3, 0, 7, 2, 4, 1, 3}
	defaults := [10]int{0, 2, 0, 1, 0, 3, 0, 1, 0, 0}
	debts := [10]int{50000, 320000, 0, 180000, 0, 540000, 95000, 250000, 45000, 150000}
	months := [10]string{"01", "02", "03", "04", "05", "06", "07", "08", "09", "10"}

	return &CreditReport{
		Score:        scores[digit],
		RiskLevel:    risks[digit],
		ActiveLoans:  loans[digit],
		DefaultCount: defaults[digit],
		TotalDebt:    debts[digit],
		LastUpdated:  "2026-" + months[digit] + "-01",
	}, nil
}

func lastDigit(id string) int {
	if len(id) == 0 {
		return 0
	}
	d := id[len(id)-1]
	if d >= '0' && d <= '9' {
		return int(d - '0')
	}
	return 0
}
