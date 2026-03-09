package nafath

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/google/uuid"
)

const (
	// PreProdBaseURL is the Elm pre-production (staging) environment.
	PreProdBaseURL = "https://nafath.api.elm.sa/stg"
	// ProdBaseURL is the Elm production environment.
	ProdBaseURL = "https://nafath.api.elm.sa"

	defaultTimeout = 30 * time.Second
)

// Config holds the configuration for the Nafath API client.
type Config struct {
	// BaseURL is the Nafath API base URL (use PreProdBaseURL or ProdBaseURL).
	BaseURL string
	// AppID is the APP-ID header value provided by Elm.
	AppID string
	// AppKey is the APP-KEY header value provided by Elm.
	AppKey string
	// CallbackURL is the registered callback URL for async MFA results.
	CallbackURL string
	// UseMock when true routes all calls through the mock client.
	UseMock bool
	// Locale for the API requests ("ar" or "en"). Defaults to "ar".
	Locale string
	// HTTPClient allows injecting a custom HTTP client (e.g. for testing).
	HTTPClient *http.Client
}

// Client is the Nafath API client. When UseMock is true, it delegates
// to the MockClient for all operations.
type Client struct {
	config Config
	http   *http.Client
	mock   *MockClient
}

// New creates a new Nafath client. If config is nil or config.UseMock is true,
// the client operates in mock mode.
func New(cfgs ...Config) *Client {
	c := &Client{
		mock: NewMock(),
	}

	if len(cfgs) > 0 {
		c.config = cfgs[0]
	} else {
		// No config provided: default to mock mode
		c.config.UseMock = true
	}

	if c.config.Locale == "" {
		c.config.Locale = "ar"
	}

	if c.config.HTTPClient != nil {
		c.http = c.config.HTTPClient
	} else {
		c.http = &http.Client{Timeout: defaultTimeout}
	}

	return c
}

// VerifyIdentity is the legacy synchronous mock endpoint.
// Kept for backward compatibility with the existing handler.
func (c *Client) VerifyIdentity(nationalID string) (*IdentityInfo, error) {
	return c.mock.VerifyIdentity(nationalID)
}

// StartVerification initiates the async Nafath MFA flow.
//
// POST /api/v1/mfa/request?local={locale}&requestId={uuid}
// Headers: APP-ID, APP-KEY
// Body: {"nationalId": "...", "service": "..."}
//
// Returns MFAResponse with transId and random number.
// The random number should be displayed to the user; they must confirm it
// in their Nafath mobile app within the service timeout (60s for Login, 180s otherwise).
func (c *Client) StartVerification(nationalID, service string) (*MFAResponse, error) {
	if c.config.UseMock {
		return c.mock.StartVerification(nationalID, service)
	}

	requestID := uuid.New().String()
	url := fmt.Sprintf("%s/api/v1/mfa/request?local=%s&requestId=%s",
		c.config.BaseURL, c.config.Locale, requestID)

	body := MFARequest{
		NationalID: nationalID,
		Service:    service,
	}

	resp, err := c.doPost(url, body)
	if err != nil {
		return nil, fmt.Errorf("nafath: start verification failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.readError(resp)
	}

	var result MFAResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("nafath: failed to decode MFA response: %w", err)
	}

	return &result, nil
}

// CheckStatus polls the Nafath MFA status.
//
// POST /api/v1/mfa/request/status
// Headers: APP-ID, APP-KEY
// Body: {"nationalId": "...", "transId": "...", "random": "..."}
//
// Returns StatusResponse with status (WAITING, EXPIRED, REJECTED, COMPLETED)
// and Person data when COMPLETED.
func (c *Client) CheckStatus(nationalID, transID, random string) (*StatusResponse, error) {
	if c.config.UseMock {
		return c.mock.CheckStatus(nationalID, transID, random)
	}

	url := fmt.Sprintf("%s/api/v1/mfa/request/status", c.config.BaseURL)

	body := StatusRequest{
		NationalID: nationalID,
		TransID:    transID,
		Random:     random,
	}

	resp, err := c.doPost(url, body)
	if err != nil {
		return nil, fmt.Errorf("nafath: check status failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.readError(resp)
	}

	var result StatusResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("nafath: failed to decode status response: %w", err)
	}

	return &result, nil
}

// GetJWK fetches the JSON Web Key set used to verify Nafath callback JWTs.
//
// GET /api/v1/mfa/jwk
// Headers: APP-ID, APP-KEY
func (c *Client) GetJWK() (*JWKResponse, error) {
	if c.config.UseMock {
		return c.mock.GetJWK()
	}

	url := fmt.Sprintf("%s/api/v1/mfa/jwk", c.config.BaseURL)

	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("nafath: failed to create JWK request: %w", err)
	}
	c.setHeaders(req)

	resp, err := c.http.Do(req)
	if err != nil {
		return nil, fmt.Errorf("nafath: JWK request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, c.readError(resp)
	}

	var result JWKResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("nafath: failed to decode JWK response: %w", err)
	}

	return &result, nil
}

// doPost sends a POST request with JSON body and the required Nafath headers.
func (c *Client) doPost(url string, body interface{}) (*http.Response, error) {
	jsonBody, err := json.Marshal(body)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request body: %w", err)
	}

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	c.setHeaders(req)

	return c.http.Do(req)
}

// setHeaders adds the APP-ID and APP-KEY headers required by the Nafath API.
func (c *Client) setHeaders(req *http.Request) {
	req.Header.Set("APP-ID", c.config.AppID)
	req.Header.Set("APP-KEY", c.config.AppKey)
}

// readError reads and returns an error from a non-200 response.
func (c *Client) readError(resp *http.Response) error {
	body, _ := io.ReadAll(resp.Body)
	return fmt.Errorf("nafath: API returned status %d: %s", resp.StatusCode, string(body))
}
