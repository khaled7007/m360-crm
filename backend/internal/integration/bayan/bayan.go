package bayan

import (
	"fmt"
	"strings"
)

type CreditReport struct {
	Score          int    `json:"score"`
	RiskLevel      string `json:"risk_level"`
	ActiveLoans    int    `json:"active_loans"`
	DefaultCount   int    `json:"default_count"`
	Capital        int    `json:"capital"`
	YearsInBusiness int   `json:"years_in_business"`
	EmployeeCount  int    `json:"employee_count"`
	LastUpdated    string `json:"last_updated"`
}

type Client struct{}

func New() *Client { return &Client{} }

// GetBusinessCreditReport returns a deterministic mock business credit report
// based on the last digit of the CR number. CR numbers starting with "ERR"
// simulate a service error.
func (c *Client) GetBusinessCreditReport(crNumber string) (*CreditReport, error) {
	if strings.HasPrefix(strings.ToUpper(crNumber), "ERR") {
		return nil, fmt.Errorf("Bayan service unavailable")
	}

	digit := lastDigit(crNumber)

	scores := [10]int{700, 580, 820, 650, 760, 550, 690, 730, 610, 780}
	risks := [10]string{"low", "high", "very_low", "medium", "low", "high", "medium", "low", "high", "low"}
	loans := [10]int{2, 6, 0, 4, 1, 8, 3, 1, 5, 2}
	defaults := [10]int{0, 3, 0, 1, 0, 4, 1, 0, 2, 0}
	capitals := [10]int{5000000, 500000, 25000000, 1000000, 10000000, 300000, 2000000, 8000000, 750000, 15000000}
	years := [10]int{12, 2, 25, 5, 15, 1, 7, 18, 3, 20}
	employees := [10]int{50, 8, 200, 15, 80, 3, 25, 120, 10, 150}
	months := [10]string{"01", "02", "03", "04", "05", "06", "07", "08", "09", "10"}

	return &CreditReport{
		Score:          scores[digit],
		RiskLevel:      risks[digit],
		ActiveLoans:    loans[digit],
		DefaultCount:   defaults[digit],
		Capital:        capitals[digit],
		YearsInBusiness: years[digit],
		EmployeeCount:  employees[digit],
		LastUpdated:    "2026-" + months[digit] + "-01",
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
