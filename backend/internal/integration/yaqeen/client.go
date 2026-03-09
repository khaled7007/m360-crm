package yaqeen

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"
)

// Service identifiers from the Elm Yakeen (Awaed V6) integration guide.
const (
	ServiceSaudiByNin      = "9e5f2100-0000-0000-0000-000000000000"
	ServiceAddressByNin    = "702dc05c-0000-0000-0000-000000000000"
	ServiceNonSaudiByIqama = "0a64cfe4-0000-0000-0000-000000000000"
	ServiceAddressByIqama  = "d028950a-0000-0000-0000-000000000000"
	ServiceDependentsByNin   = "d4e12c57-0000-0000-0000-000000000000"
	ServiceDependentsByIqama = "9c6bfede-0000-0000-0000-000000000000"

	defaultBaseURL    = "https://yakeencore.api.elm.sa"
	loginPath         = "/api/v2/yakeen/login"
	dataPath          = "/api/v1/yakeen/data"
	tokenRefreshMargin = 5 * time.Minute
)

// Config holds credentials and settings for the Yakeen API client.
type Config struct {
	BaseURL    string `json:"base_url"`
	AppID      string `json:"app_id"`
	AppKey     string `json:"app_key"`
	Username   string `json:"username"`
	Password   string `json:"password"`
	UsageCode  string `json:"usage_code"`
	OperatorID string `json:"operator_id"`
	UseMock    bool   `json:"use_mock"`
}

// Client provides access to the Yakeen (Awaed V6) API from Elm, with
// automatic JWT management and mock fallback for development/testing.
type Client struct {
	cfg        Config
	httpClient *http.Client

	mu         sync.Mutex
	token      string
	tokenExp   time.Time
}

// New creates a new Yakeen client. When cfg is nil the client runs in
// mock-only mode, preserving full backward compatibility with existing code.
func New(cfgs ...Config) *Client {
	if len(cfgs) == 0 {
		return &Client{cfg: Config{UseMock: true}}
	}
	cfg := cfgs[0]
	if cfg.BaseURL == "" {
		cfg.BaseURL = defaultBaseURL
	}
	return &Client{
		cfg:        cfg,
		httpClient: &http.Client{Timeout: 30 * time.Second},
	}
}

// ---------------------------------------------------------------------------
// Legacy mock API — preserves backward compatibility
// ---------------------------------------------------------------------------

// GetPersonInfo returns deterministic mock person data. This is the original
// method signature kept for backward compatibility.
func (c *Client) GetPersonInfo(nationalID string) (*IdentityInfo, error) {
	return mockGetPersonInfo(nationalID)
}

// ---------------------------------------------------------------------------
// Real Yakeen API methods
// ---------------------------------------------------------------------------

// Login authenticates with the Yakeen API and caches the JWT token. It is
// called automatically by the data methods but can be called explicitly to
// pre-warm the token.
func (c *Client) Login() error {
	if c.cfg.UseMock {
		return nil
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	return c.loginLocked()
}

func (c *Client) loginLocked() error {
	url := c.cfg.BaseURL + loginPath

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("yaqeen: build login request: %w", err)
	}
	req.Header.Set("app-id", c.cfg.AppID)
	req.Header.Set("app-key", c.cfg.AppKey)
	req.Header.Set("Username", c.cfg.Username)
	req.Header.Set("Password", c.cfg.Password)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("yaqeen: login request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("yaqeen: login returned %d: %s", resp.StatusCode, string(body))
	}

	var loginResp LoginResponse
	if err := json.NewDecoder(resp.Body).Decode(&loginResp); err != nil {
		return fmt.Errorf("yaqeen: decode login response: %w", err)
	}
	if loginResp.Token == "" {
		return fmt.Errorf("yaqeen: login returned empty token")
	}

	c.token = loginResp.Token
	// Elm tokens are valid for 24h; we refresh 5 minutes early.
	c.tokenExp = time.Now().Add(24*time.Hour - tokenRefreshMargin)
	return nil
}

// ensureToken refreshes the JWT if it is missing or close to expiry.
func (c *Client) ensureToken() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.token != "" && time.Now().Before(c.tokenExp) {
		return nil
	}
	return c.loginLocked()
}

// GetSaudiByNin looks up a Saudi citizen by NIN and Hijri date of birth.
func (c *Client) GetSaudiByNin(nin, hijriDOB string) (*PersonInfo, error) {
	if c.cfg.UseMock {
		return mockGetSaudiByNin(nin, hijriDOB)
	}
	params := map[string]string{"nin": nin, "dateString": hijriDOB}
	var resp PersonDataResponse
	if err := c.callData(ServiceSaudiByNin, params, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// GetNonSaudiByIqama looks up a non-Saudi resident by iqama number and
// Gregorian date of birth.
func (c *Client) GetNonSaudiByIqama(iqama, birthDateG string) (*PersonInfo, error) {
	if c.cfg.UseMock {
		return mockGetNonSaudiByIqama(iqama, birthDateG)
	}
	params := map[string]string{"iqama": iqama, "birthDateG": birthDateG}
	var resp PersonDataResponse
	if err := c.callData(ServiceNonSaudiByIqama, params, &resp); err != nil {
		return nil, err
	}
	return &resp.Result, nil
}

// GetAddressByNin returns addresses for a Saudi citizen by NIN.
func (c *Client) GetAddressByNin(nin, birthDateG string) ([]Address, error) {
	if c.cfg.UseMock {
		return mockGetAddresses(nin)
	}
	params := map[string]string{"nin": nin, "birthDateG": birthDateG}
	var resp AddressDataResponse
	if err := c.callData(ServiceAddressByNin, params, &resp); err != nil {
		return nil, err
	}
	return resp.Result, nil
}

// GetAddressByIqama returns addresses for an iqama holder.
func (c *Client) GetAddressByIqama(iqama, birthDateG string) ([]Address, error) {
	if c.cfg.UseMock {
		return mockGetAddresses(iqama)
	}
	params := map[string]string{"iqama": iqama, "birthDateG": birthDateG}
	var resp AddressDataResponse
	if err := c.callData(ServiceAddressByIqama, params, &resp); err != nil {
		return nil, err
	}
	return resp.Result, nil
}

// GetDependentsByNin returns dependents for a Saudi citizen by NIN.
func (c *Client) GetDependentsByNin(nin, birthDateG string) ([]Dependent, error) {
	if c.cfg.UseMock {
		return mockGetDependents(nin)
	}
	params := map[string]string{"nin": nin, "birthDateG": birthDateG}
	var resp DependentDataResponse
	if err := c.callData(ServiceDependentsByNin, params, &resp); err != nil {
		return nil, err
	}
	return resp.Result, nil
}

// GetDependentsByIqama returns dependents for an iqama holder.
func (c *Client) GetDependentsByIqama(iqama, birthDateG string) ([]Dependent, error) {
	if c.cfg.UseMock {
		return mockGetDependents(iqama)
	}
	params := map[string]string{"iqama": iqama, "birthDateG": birthDateG}
	var resp DependentDataResponse
	if err := c.callData(ServiceDependentsByIqama, params, &resp); err != nil {
		return nil, err
	}
	return resp.Result, nil
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

// callData makes an authenticated GET to the Yakeen data endpoint with the
// given service identifier and query parameters.
func (c *Client) callData(serviceID string, queryParams map[string]string, dest interface{}) error {
	if err := c.ensureToken(); err != nil {
		return fmt.Errorf("yaqeen: auth failed: %w", err)
	}

	url := c.cfg.BaseURL + dataPath

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return fmt.Errorf("yaqeen: build data request: %w", err)
	}

	// Required headers per Elm integration guide.
	c.mu.Lock()
	req.Header.Set("authorization", "Bearer "+c.token)
	c.mu.Unlock()

	req.Header.Set("service-identifier", serviceID)
	req.Header.Set("usage-code", c.cfg.UsageCode)
	req.Header.Set("operator-id", c.cfg.OperatorID)
	req.Header.Set("app-id", c.cfg.AppID)
	req.Header.Set("app-key", c.cfg.AppKey)

	// Query parameters vary by service.
	q := req.URL.Query()
	for k, v := range queryParams {
		q.Set(k, v)
	}
	req.URL.RawQuery = q.Encode()

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("yaqeen: data request failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("yaqeen: read response body: %w", err)
	}

	if resp.StatusCode == http.StatusUnauthorized {
		// Token may have been invalidated server-side; retry once.
		c.mu.Lock()
		c.token = ""
		c.mu.Unlock()
		if err := c.ensureToken(); err != nil {
			return fmt.Errorf("yaqeen: re-auth failed: %w", err)
		}
		return c.callData(serviceID, queryParams, dest)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("yaqeen: data endpoint returned %d: %s", resp.StatusCode, string(body))
	}

	if err := json.Unmarshal(body, dest); err != nil {
		return fmt.Errorf("yaqeen: decode data response: %w", err)
	}
	return nil
}
