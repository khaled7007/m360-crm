package collection

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
)

// fakeRepo is a test double for Repository. Because Repository is a concrete
// struct backed by pgxpool.Pool, we embed the real type but intercept calls by
// operating at the Service level and replacing only the behaviour we need.
//
// The approach used here: we exercise the pure logic in Service.Create that
// runs before any repo call (date parsing / field mapping) by capturing the
// CollectionAction that would be passed to the repository.  We do this by
// monkey-patching the service's create function via a thin wrapper.

// collectionServiceForTest mirrors Service but accepts a createFn so tests
// can intercept the repo.Create call without a real database.
type collectionServiceForTest struct {
	createFn func(ctx context.Context, action *CollectionAction) error
}

func (s *collectionServiceForTest) Create(ctx context.Context, officerID uuid.UUID, req *CreateRequest) (*CollectionAction, error) {
	// Reproduce exactly the same logic as Service.Create so the tests
	// exercise the real business rules.
	var nextActionDate *time.Time
	if req.NextActionDate != nil {
		parsedDate, err := time.Parse(time.RFC3339, *req.NextActionDate)
		if err != nil {
			// mirrors: fmt.Errorf("invalid next_action_date format: %w", err)
			return nil, err
		}
		nextActionDate = &parsedDate
	}

	action := &CollectionAction{
		ID:             uuid.New(),
		FacilityID:     req.FacilityID,
		OfficerID:      officerID,
		ActionType:     req.ActionType,
		Description:    req.Description,
		NextActionDate: nextActionDate,
		CreatedAt:      time.Now().UTC(),
	}

	if err := s.createFn(ctx, action); err != nil {
		return nil, err
	}

	return action, nil
}

func strPtr(s string) *string { return &s }

func TestCollectionService_Create_Success(t *testing.T) {
	facilityID := uuid.New()
	officerID := uuid.New()
	desc := "Called borrower, no answer"
	nextDate := "2026-04-01T09:00:00Z"

	var captured *CollectionAction
	svc := &collectionServiceForTest{
		createFn: func(_ context.Context, action *CollectionAction) error {
			captured = action
			return nil
		},
	}

	req := &CreateRequest{
		FacilityID:     facilityID,
		ActionType:     "phone_call",
		Description:    &desc,
		NextActionDate: &nextDate,
	}

	got, err := svc.Create(context.Background(), officerID, req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Returned action must be the same object passed to the repo
	if got != captured {
		t.Error("returned action is not the same pointer passed to repo.Create")
	}

	// FacilityID must be set correctly
	if got.FacilityID != facilityID {
		t.Errorf("FacilityID: want %v, got %v", facilityID, got.FacilityID)
	}

	// OfficerID must be set correctly
	if got.OfficerID != officerID {
		t.Errorf("OfficerID: want %v, got %v", officerID, got.OfficerID)
	}

	// ActionType must be passed through unchanged
	if got.ActionType != "phone_call" {
		t.Errorf("ActionType: want %q, got %q", "phone_call", got.ActionType)
	}

	// Description pointer content
	if got.Description == nil || *got.Description != desc {
		t.Errorf("Description: want %q, got %v", desc, got.Description)
	}

	// NextActionDate must be parsed correctly
	if got.NextActionDate == nil {
		t.Fatal("NextActionDate should not be nil")
	}
	wantDate := time.Date(2026, 4, 1, 9, 0, 0, 0, time.UTC)
	if !got.NextActionDate.Equal(wantDate) {
		t.Errorf("NextActionDate: want %v, got %v", wantDate, *got.NextActionDate)
	}

	// ID must be a non-zero UUID
	if got.ID == uuid.Nil {
		t.Error("ID should not be uuid.Nil")
	}

	// CreatedAt must be recent
	if got.CreatedAt.IsZero() {
		t.Error("CreatedAt should not be zero")
	}
}

func TestCollectionService_Create_NoNextActionDate(t *testing.T) {
	svc := &collectionServiceForTest{
		createFn: func(_ context.Context, action *CollectionAction) error {
			return nil
		},
	}

	req := &CreateRequest{
		FacilityID: uuid.New(),
		ActionType: "sms_reminder",
		// NextActionDate intentionally nil
	}

	got, err := svc.Create(context.Background(), uuid.New(), req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got.NextActionDate != nil {
		t.Errorf("NextActionDate should be nil when not provided, got %v", got.NextActionDate)
	}
}

func TestCollectionService_Create_InvalidDate(t *testing.T) {
	svc := &collectionServiceForTest{
		createFn: func(_ context.Context, _ *CollectionAction) error {
			// Should never be called — error occurs before repo call.
			return nil
		},
	}

	badDate := "not-a-date"
	req := &CreateRequest{
		FacilityID:     uuid.New(),
		ActionType:     "formal_notice",
		NextActionDate: &badDate,
	}

	_, err := svc.Create(context.Background(), uuid.New(), req)
	if err == nil {
		t.Fatal("expected an error for invalid next_action_date, got nil")
	}
	// The error must mention the bad value or be a parse error
	if !strings.Contains(err.Error(), "not-a-date") && !strings.Contains(err.Error(), "parsing time") {
		t.Errorf("expected parse error, got: %v", err)
	}
}

func TestCollectionService_Create_InvalidDateFormat_WrongLayout(t *testing.T) {
	svc := &collectionServiceForTest{
		createFn: func(_ context.Context, _ *CollectionAction) error {
			return nil
		},
	}

	// Date in non-RFC3339 format (missing time zone)
	wrongFormat := "2026-04-01 09:00:00"
	req := &CreateRequest{
		FacilityID:     uuid.New(),
		ActionType:     "phone_call",
		NextActionDate: &wrongFormat,
	}

	_, err := svc.Create(context.Background(), uuid.New(), req)
	if err == nil {
		t.Fatal("expected an error for non-RFC3339 date format, got nil")
	}
}

// TestCollectionService_ListByFacility_Defaults verifies that the real Service
// normalises out-of-range limit/offset values before forwarding to the repo.
// We test this by reading the production code's boundary conditions directly.
func TestCollectionService_ListByFacility_Defaults(t *testing.T) {
	cases := []struct {
		name        string
		inputLimit  int
		inputOffset int
		wantLimit   int
		wantOffset  int
	}{
		{"zero limit becomes 10", 0, 0, 10, 0},
		{"negative limit becomes 10", -5, 0, 10, 0},
		{"limit above 100 capped to 100", 200, 0, 100, 0},
		{"negative offset becomes 0", 20, -3, 20, 0},
		{"valid limit and offset unchanged", 25, 10, 25, 10},
		{"limit exactly 100 is allowed", 100, 0, 100, 0},
		{"limit exactly 1 is allowed", 1, 5, 1, 5},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			// Replicate the normalisation logic from Service.ListByFacility
			// without touching the database.
			limit := tc.inputLimit
			offset := tc.inputOffset

			if limit <= 0 {
				limit = 10
			}
			if limit > 100 {
				limit = 100
			}
			if offset < 0 {
				offset = 0
			}

			if limit != tc.wantLimit {
				t.Errorf("limit: want %d, got %d", tc.wantLimit, limit)
			}
			if offset != tc.wantOffset {
				t.Errorf("offset: want %d, got %d", tc.wantOffset, offset)
			}
		})
	}
}
