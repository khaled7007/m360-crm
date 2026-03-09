package document

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/CamelLabSA/M360/backend/internal/auth"
	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Register(g *echo.Group, authMW echo.MiddlewareFunc) {
	g.POST("/documents", h.Upload, authMW)
	g.GET("/documents/entity/:type/:id", h.ListByEntity, authMW)
	g.GET("/documents/:id", h.GetByID, authMW)
	g.DELETE("/documents/:id", h.Delete, authMW, auth.RequireRole(auth.RoleAdmin, auth.RoleManager))
}

var (
	allowedEntityTypes = map[string]bool{
		"application": true, "organization": true, "contact": true,
		"lead": true, "facility": true, "committee": true,
	}
	safeNameRegex = regexp.MustCompile(`[^a-zA-Z0-9._\-\p{Arabic}\s]`)
	allowedMIMETypes = map[string]bool{
		"application/pdf":  true,
		"image/jpeg":       true,
		"image/png":        true,
		"application/msword": true,
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
		"application/vnd.ms-excel": true,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":       true,
	}
	contentSignatures = map[string][]byte{
		"application/pdf": {0x25, 0x50, 0x44, 0x46},
		"image/jpeg":      {0xFF, 0xD8, 0xFF},
		"image/png":       {0x89, 0x50, 0x4E, 0x47},
	}
)

func (h *Handler) Upload(c echo.Context) error {
	claims := auth.GetClaims(c)
	if claims == nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"error": "unauthorized"})
	}

	form, err := c.MultipartForm()
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid form data"})
	}

	files := form.File["file"]
	if len(files) == 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "no file provided"})
	}

	file := files[0]

	const maxFileSize = 10 << 20 // 10MB
	if file.Size > maxFileSize {
		return echo.NewHTTPError(http.StatusBadRequest, "file too large (max 10MB)")
	}

	contentType := file.Header.Get("Content-Type")
	if !allowedMIMETypes[contentType] {
		return echo.NewHTTPError(http.StatusBadRequest, "unsupported file type")
	}

	src, err := file.Open()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to open file"})
	}
	defer src.Close()

	fileData, err := io.ReadAll(src)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to read file"})
	}

	if sig, ok := contentSignatures[contentType]; ok {
		if len(fileData) < len(sig) || !bytesEqual(fileData[:len(sig)], sig) {
			return echo.NewHTTPError(http.StatusBadRequest, "file content does not match declared type")
		}
	}

	entityType := c.FormValue("entity_type")
	entityIDStr := c.FormValue("entity_id")
	name := c.FormValue("name")
	category := c.FormValue("category")

	if entityType == "" || entityIDStr == "" || name == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "missing required fields: entity_type, entity_id, name"})
	}

	if !allowedEntityTypes[entityType] {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid entity_type"})
	}

	name = sanitizeFileName(name)

	entityID, err := uuid.Parse(entityIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid entity_id format"})
	}

	req := &UploadRequest{
		EntityType: entityType,
		EntityID:   entityID,
		Name:       name,
	}

	if category != "" {
		req.Category = &category
	}

	doc, err := h.service.Create(c.Request().Context(), req, claims.UserID, int64(len(fileData)), contentType)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to create document record"})
	}

	uploadDir := filepath.Dir(doc.FilePath)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to create upload directory"})
	}

	if err := os.WriteFile(doc.FilePath, fileData, 0644); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to save file"})
	}

	return c.JSON(http.StatusCreated, doc)
}

func sanitizeFileName(name string) string {
	name = filepath.Base(name)
	name = strings.ReplaceAll(name, "..", "")
	name = safeNameRegex.ReplaceAllString(name, "_")
	if name == "" || name == "." {
		name = "unnamed"
	}
	return name
}

func bytesEqual(a, b []byte) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func (h *Handler) GetByID(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid document id"})
	}

	doc, err := h.service.GetByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "document not found"})
	}

	return c.JSON(http.StatusOK, doc)
}

func (h *Handler) ListByEntity(c echo.Context) error {
	entityType := c.Param("type")
	entityIDStr := c.Param("id")

	entityID, err := uuid.Parse(entityIDStr)
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid entity id"})
	}

	documents, err := h.service.ListByEntity(c.Request().Context(), entityType, entityID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to fetch documents"})
	}

	if documents == nil {
		documents = []*Document{}
	}

	return c.JSON(http.StatusOK, documents)
}

func (h *Handler) Delete(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"error": "invalid document id"})
	}

	doc, err := h.service.GetByID(c.Request().Context(), id)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"error": "document not found"})
	}

	if err := h.service.Delete(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to delete document"})
	}

	if err := os.Remove(doc.FilePath); err != nil && !os.IsNotExist(err) {
		return c.JSON(http.StatusInternalServerError, echo.Map{"error": "failed to delete file from disk"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "document deleted successfully"})
}
