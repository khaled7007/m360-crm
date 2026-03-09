package collection

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

// SystemOfficerID is a well-known UUID used for automated collection actions.
var SystemOfficerID = uuid.MustParse("00000000-0000-0000-0000-000000000000")

// StartOverdueChecker launches a background goroutine that periodically scans
// for overdue facilities and auto-creates an "sms_reminder" collection action
// for any facility that has been overdue for more than 30 days and has no
// existing collection actions.
func StartOverdueChecker(svc *Service, interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		log.Println("[overdue-checker] started, interval:", interval)

		for range ticker.C {
			if err := checkOverdueFacilities(svc); err != nil {
				log.Println("[overdue-checker] error:", err)
			}
		}
	}()
}

func checkOverdueFacilities(svc *Service) error {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	summary, err := svc.GetOverdueSummary(ctx)
	if err != nil {
		return err
	}

	for _, f := range summary.OverdueFacilities {
		if f.DaysOverdue <= 30 {
			continue
		}
		if f.CollectionCount > 0 {
			continue
		}

		desc := fmt.Sprintf("Automated SMS reminder: facility %s is %d days overdue for borrower %s",
			f.FacilityNumber, f.DaysOverdue, f.BorrowerName)

		_, err := svc.Create(ctx, SystemOfficerID, &CreateRequest{
			FacilityID: f.ID,
			ActionType: "sms_reminder",
			Description: &desc,
		})
		if err != nil {
			log.Printf("[overdue-checker] failed to create action for facility %s: %v", f.FacilityNumber, err)
			continue
		}

		log.Printf("[overdue-checker] created sms_reminder for facility %s (%d days overdue)", f.FacilityNumber, f.DaysOverdue)
	}

	return nil
}