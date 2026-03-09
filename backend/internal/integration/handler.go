package integration

import (
	"net/http"
	"regexp"
	"sync"

	"github.com/CamelLabSA/M360/backend/internal/integration/bayan"
	"github.com/CamelLabSA/M360/backend/internal/integration/nafath"
	"github.com/CamelLabSA/M360/backend/internal/integration/simah"
	"github.com/CamelLabSA/M360/backend/internal/integration/watheq"
	"github.com/CamelLabSA/M360/backend/internal/integration/yaqeen"
	"github.com/labstack/echo/v4"
)

var crNumberRegex = regexp.MustCompile(`^\d{10}$`)

// Handler handles all integration-related HTTP requests
type Handler struct {
	simahClient  *simah.Client
	bayanClient  *bayan.Client
	nafathClient *nafath.Client
	yaqeenClient *yaqeen.Client
	watheqClient *watheq.Client
}

// New creates a new integration handler with all clients
func New() *Handler {
	return &Handler{
		simahClient:  simah.New(),
		bayanClient:  bayan.New(),
		nafathClient: nafath.New(),
		yaqeenClient: yaqeen.New(),
		watheqClient: watheq.New(),
	}
}

// Register registers all integration endpoints
func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	// Apply authentication middleware to all routes
	intGroup := g.Group("/integrations", authMW)

	intGroup.GET("/simah/:national_id", h.GetSIMAHReport)
	intGroup.GET("/bayan/:cr_number", h.GetBayanReport)
	intGroup.GET("/nafath/:national_id", h.VerifyNafathIdentity)
	intGroup.GET("/yaqeen/:national_id", h.GetYaqeenPersonInfo)
	intGroup.GET("/watheq/:cr_number", h.VerifyWatheqCR)
	intGroup.GET("/watheq/:cr_number/full", h.GetWatheqFullReport)
}

// GetSIMAHReport retrieves SIMAH consumer credit report
func (h *Handler) GetSIMAHReport(c echo.Context) error {
	nationalID := c.Param("national_id")
	if nationalID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "national_id is required"})
	}

	report, err := h.simahClient.GetCreditReport(nationalID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to retrieve SIMAH report"})
	}

	return c.JSON(http.StatusOK, report)
}

// GetBayanReport retrieves Bayan commercial credit report
func (h *Handler) GetBayanReport(c echo.Context) error {
	crNumber := c.Param("cr_number")
	if crNumber == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "cr_number is required"})
	}

	report, err := h.bayanClient.GetBusinessCreditReport(crNumber)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to retrieve Bayan report"})
	}

	return c.JSON(http.StatusOK, report)
}

// VerifyNafathIdentity verifies identity through Nafath
func (h *Handler) VerifyNafathIdentity(c echo.Context) error {
	nationalID := c.Param("national_id")
	if nationalID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "national_id is required"})
	}

	identity, err := h.nafathClient.VerifyIdentity(nationalID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to verify identity with Nafath"})
	}

	return c.JSON(http.StatusOK, identity)
}

// GetYaqeenPersonInfo retrieves enriched person information from Yaqeen
func (h *Handler) GetYaqeenPersonInfo(c echo.Context) error {
	nationalID := c.Param("national_id")
	if nationalID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "national_id is required"})
	}

	personInfo, err := h.yaqeenClient.GetPersonInfo(nationalID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to retrieve Yaqeen person info"})
	}

	return c.JSON(http.StatusOK, personInfo)
}

// VerifyWatheqCR verifies CR information through Watheq
func (h *Handler) VerifyWatheqCR(c echo.Context) error {
	crNumber := c.Param("cr_number")
	if crNumber == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "cr_number is required"})
	}

	crInfo, err := h.watheqClient.VerifyCR(crNumber)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to verify CR with Watheq"})
	}

	return c.JSON(http.StatusOK, crInfo)
}

// WatheqFullReport is the combined response from all Wathq API calls for a CR.
type WatheqFullReport struct {
	CRNumber     string                `json:"cr_number"`
	Registration *watheq.CRFullInfo    `json:"registration,omitempty"`
	Owners       []watheq.Owner        `json:"owners,omitempty"`
	Managers     []watheq.Manager      `json:"managers,omitempty"`
	Branches     []watheq.Branch       `json:"branches,omitempty"`
	Capital      *watheq.Capital       `json:"capital,omitempty"`
	Addresses    []watheq.NationalAddress `json:"addresses,omitempty"`
	Errors       map[string]string     `json:"errors,omitempty"`
}

// GetWatheqFullReport aggregates data from multiple Wathq API calls for a CR number.
func (h *Handler) GetWatheqFullReport(c echo.Context) error {
	crNumber := c.Param("cr_number")
	if crNumber == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "cr_number is required"})
	}
	if !crNumberRegex.MatchString(crNumber) {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "cr_number must be exactly 10 digits"})
	}

	report := WatheqFullReport{
		CRNumber: crNumber,
		Errors:   make(map[string]string),
	}

	var mu sync.Mutex
	var wg sync.WaitGroup

	setError := func(section string, err error) {
		mu.Lock()
		report.Errors[section] = err.Error()
		mu.Unlock()
	}

	wg.Add(6)

	go func() {
		defer wg.Done()
		result, err := h.watheqClient.GetFullInfo(crNumber)
		if err != nil {
			setError("registration", err)
			return
		}
		mu.Lock()
		report.Registration = result
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		result, err := h.watheqClient.GetOwners(crNumber)
		if err != nil {
			setError("owners", err)
			return
		}
		mu.Lock()
		report.Owners = result
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		result, err := h.watheqClient.GetManagers(crNumber)
		if err != nil {
			setError("managers", err)
			return
		}
		mu.Lock()
		report.Managers = result
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		result, err := h.watheqClient.GetBranches(crNumber)
		if err != nil {
			setError("branches", err)
			return
		}
		mu.Lock()
		report.Branches = result
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		result, err := h.watheqClient.GetCapital(crNumber)
		if err != nil {
			setError("capital", err)
			return
		}
		mu.Lock()
		report.Capital = result
		mu.Unlock()
	}()

	go func() {
		defer wg.Done()
		result, err := h.watheqClient.GetNationalAddress(crNumber)
		if err != nil {
			setError("addresses", err)
			return
		}
		mu.Lock()
		report.Addresses = result
		mu.Unlock()
	}()

	wg.Wait()

	// Omit errors field if empty
	if len(report.Errors) == 0 {
		report.Errors = nil
	}

	return c.JSON(http.StatusOK, report)
}
