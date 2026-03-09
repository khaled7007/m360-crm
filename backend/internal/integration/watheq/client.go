package watheq

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

const (
	defaultCRBaseURL       = "https://api.wathq.sa/commercial-registration"
	defaultEmployeeBaseURL = "https://api.wathq.sa/masdr/employee"
	defaultAddressBaseURL  = "https://api.wathq.sa/spl/national/address"
)

// Config holds settings for the Wathq API client.
type Config struct {
	APIKey          string `json:"api_key"`
	CRBaseURL       string `json:"cr_base_url"`
	EmployeeBaseURL string `json:"employee_base_url"`
	AddressBaseURL  string `json:"address_base_url"`
	Language        string `json:"language"` // "ar" or "en"
	UseMock         bool   `json:"use_mock"`
}

// Client provides access to the Wathq API suite (Commercial Registration,
// Employee Information, and National Address). When UseMock is true (the
// default), all methods return deterministic mock data.
type Client struct {
	cfg        Config
	httpClient *http.Client
}

// New creates a new Wathq client. When called with no arguments the client
// runs in mock-only mode, preserving full backward compatibility.
func New(cfgs ...Config) *Client {
	if len(cfgs) == 0 {
		return &Client{cfg: Config{UseMock: true}}
	}
	cfg := cfgs[0]
	if cfg.CRBaseURL == "" {
		cfg.CRBaseURL = defaultCRBaseURL
	}
	if cfg.EmployeeBaseURL == "" {
		cfg.EmployeeBaseURL = defaultEmployeeBaseURL
	}
	if cfg.AddressBaseURL == "" {
		cfg.AddressBaseURL = defaultAddressBaseURL
	}
	if cfg.Language == "" {
		cfg.Language = "en"
	}
	return &Client{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// ---------------------------------------------------------------------------
// Legacy API — backward compatible
// ---------------------------------------------------------------------------

// VerifyCR returns deterministic mock CR data. This is the original method
// preserved for backward compatibility.
func (c *Client) VerifyCR(crNumber string) (*CRInfo, error) {
	return mockVerifyCR(crNumber)
}

// ---------------------------------------------------------------------------
// Commercial Registration API
// ---------------------------------------------------------------------------

// GetFullInfo returns comprehensive CR data for the given CR national number.
func (c *Client) GetFullInfo(crNationalNumber string) (*CRFullInfo, error) {
	if c.cfg.UseMock {
		return mockGetFullInfo(crNationalNumber)
	}
	var result CRFullInfo
	err := c.get(c.cfg.CRBaseURL+"/fullinfo/"+crNationalNumber, map[string]string{"language": c.cfg.Language}, nil, &result)
	return &result, err
}

// GetInfo returns basic CR info for the given CR national number.
func (c *Client) GetInfo(crNationalNumber string) (*CRBasicInfo, error) {
	if c.cfg.UseMock {
		return mockGetBasicInfo(crNationalNumber)
	}
	var result CRBasicInfo
	err := c.get(c.cfg.CRBaseURL+"/info/"+crNationalNumber, map[string]string{"language": c.cfg.Language}, nil, &result)
	return &result, err
}

// GetStatus returns the CR status with optional date details.
func (c *Client) GetStatus(crNationalNumber string) (*CRStatus, error) {
	if c.cfg.UseMock {
		return mockGetStatus(crNationalNumber)
	}
	var result CRStatus
	err := c.get(c.cfg.CRBaseURL+"/status/"+crNationalNumber, map[string]string{
		"language":     c.cfg.Language,
		"includeDates": "true",
	}, nil, &result)
	return &result, err
}

// GetOwners returns the owners/partners of a CR.
func (c *Client) GetOwners(crNationalNumber string) ([]Owner, error) {
	if c.cfg.UseMock {
		return mockGetOwners(crNationalNumber)
	}
	var result []Owner
	err := c.get(c.cfg.CRBaseURL+"/owners/"+crNationalNumber, nil, nil, &result)
	return result, err
}

// GetManagers returns the managers/board members of a CR.
func (c *Client) GetManagers(crNationalNumber string) ([]Manager, error) {
	if c.cfg.UseMock {
		return mockGetManagers(crNationalNumber)
	}
	var result []Manager
	err := c.get(c.cfg.CRBaseURL+"/managers/"+crNationalNumber, nil, nil, &result)
	return result, err
}

// GetBranches returns all branch CRs.
func (c *Client) GetBranches(crNationalNumber string) ([]Branch, error) {
	if c.cfg.UseMock {
		return mockGetBranches(crNationalNumber)
	}
	var result []Branch
	err := c.get(c.cfg.CRBaseURL+"/branches/"+crNationalNumber, nil, nil, &result)
	return result, err
}

// GetCapital returns the capital structure of a CR.
func (c *Client) GetCapital(crNationalNumber string) (*Capital, error) {
	if c.cfg.UseMock {
		return mockGetCapital(crNationalNumber)
	}
	var result Capital
	err := c.get(c.cfg.CRBaseURL+"/capital/"+crNationalNumber, nil, nil, &result)
	return &result, err
}

// GetRelatedCRs returns CRs linked to the given identity.
// idType must be one of: National_ID, Resident_ID, etc.
func (c *Client) GetRelatedCRs(idNumber, idType string) ([]RelatedCR, error) {
	if c.cfg.UseMock {
		return mockGetRelatedCRs(idNumber, idType)
	}
	headers := map[string]string{"id": idNumber, "idType": idType}
	var result []RelatedCR
	err := c.get(c.cfg.CRBaseURL+"/v2/related", map[string]string{"language": c.cfg.Language}, headers, &result)
	return result, err
}

// CheckOwnership checks whether the given identity owns any CR.
func (c *Client) CheckOwnership(idNumber, idType string) (bool, error) {
	if c.cfg.UseMock {
		return mockCheckOwnership(idNumber, idType)
	}
	headers := map[string]string{"id": idNumber, "idType": idType}
	var result struct {
		OwnsCR bool `json:"ownsCr"`
	}
	err := c.get(c.cfg.CRBaseURL+"/v2/owns", nil, headers, &result)
	return result.OwnsCR, err
}

// ---------------------------------------------------------------------------
// Employee Information API
// ---------------------------------------------------------------------------

// GetEmployeeInfo returns employee/salary information for the given ID number.
func (c *Client) GetEmployeeInfo(idNumber string) (*EmployeeInfo, error) {
	if c.cfg.UseMock {
		return mockGetEmployeeInfo(idNumber)
	}
	headers := map[string]string{"id": idNumber}
	var result EmployeeInfo
	err := c.get(c.cfg.EmployeeBaseURL+"/v2/info", nil, headers, &result)
	return &result, err
}

// ---------------------------------------------------------------------------
// National Address API
// ---------------------------------------------------------------------------

// GetNationalAddress returns national addresses registered for a CR number.
func (c *Client) GetNationalAddress(crNumber string) ([]NationalAddress, error) {
	if c.cfg.UseMock {
		return mockGetNationalAddress(crNumber)
	}
	var result []NationalAddress
	err := c.get(c.cfg.AddressBaseURL+"/info/"+crNumber, nil, nil, &result)
	return result, err
}

// ---------------------------------------------------------------------------
// Internal HTTP helper
// ---------------------------------------------------------------------------

// get performs an authenticated GET request, decodes the JSON response into
// dest, and returns an *APIError on non-2xx responses when possible.
func (c *Client) get(url string, queryParams map[string]string, extraHeaders map[string]string, dest interface{}) error {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("wathq: build request: %w", err)
	}

	// Authentication
	req.Header.Set("apiKey", c.cfg.APIKey)

	// Extra headers (used by /v2/related, /v2/owns, employee API)
	for k, v := range extraHeaders {
		req.Header.Set(k, v)
	}

	// Query parameters
	if len(queryParams) > 0 {
		q := req.URL.Query()
		for k, v := range queryParams {
			q.Set(k, v)
		}
		req.URL.RawQuery = q.Encode()
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("wathq: request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("wathq: read response body: %w", err)
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var apiErr APIError
		if json.Unmarshal(body, &apiErr) == nil && apiErr.Code != "" {
			return &apiErr
		}
		return fmt.Errorf("wathq: API returned %d: %s", resp.StatusCode, string(body))
	}

	if err := json.Unmarshal(body, dest); err != nil {
		return fmt.Errorf("wathq: decode response: %w", err)
	}
	return nil
}
