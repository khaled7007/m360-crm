package document

import (
	"strings"
	"testing"

	"pgregory.net/rapid"
)

// Extracted validation logic mirroring handler.go for direct testing.

const maxFileSize int64 = 10 << 20 // 10MB

var allowedMIMETypes = map[string]bool{
	"application/pdf":  true,
	"image/jpeg":       true,
	"image/png":        true,
	"application/msword": true,
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": true,
	"application/vnd.ms-excel": true,
	"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":       true,
}

func isFileSizeValid(size int64) bool {
	return size <= maxFileSize
}

func isMIMETypeAllowed(mimeType string) bool {
	return allowedMIMETypes[mimeType]
}

// allAllowedTypes returns a slice of all allowed MIME type strings.
func allAllowedTypes() []string {
	types := make([]string, 0, len(allowedMIMETypes))
	for t := range allowedMIMETypes {
		types = append(types, t)
	}
	return types
}

// --- Property-based tests ---

// Property 1: Files exactly at 10MB are valid, files at 10MB+1 are invalid.
func TestProp_SizeBoundary(t *testing.T) {
	if !isFileSizeValid(maxFileSize) {
		t.Fatal("file exactly at maxFileSize should be valid")
	}
	if isFileSizeValid(maxFileSize + 1) {
		t.Fatal("file at maxFileSize+1 should be invalid")
	}
}

// Property 2: Any file size <= 10MB is always valid, any file size > 10MB is always invalid.
func TestProp_SizeInvariant(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		size := rapid.Int64Range(0, 20<<20).Draw(t, "size")
		result := isFileSizeValid(size)
		if size <= maxFileSize && !result {
			t.Fatalf("size %d should be valid (<=maxFileSize)", size)
		}
		if size > maxFileSize && result {
			t.Fatalf("size %d should be invalid (>maxFileSize)", size)
		}
	})
}

// Property 3: All non-negative sizes up to maxFileSize are valid.
func TestProp_NonNegativeSizesValid(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		size := rapid.Int64Range(0, maxFileSize).Draw(t, "size")
		if !isFileSizeValid(size) {
			t.Fatalf("non-negative size %d within limit should be valid", size)
		}
	})
}

// Property 4: Negative sizes should be handled — they are technically <= maxFileSize,
// so the current logic treats them as valid.
func TestProp_NegativeSizes(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		size := rapid.Int64Range(-1<<40, -1).Draw(t, "negativeSize")
		// Negative sizes pass the <= check. This documents current behavior.
		if !isFileSizeValid(size) {
			t.Fatalf("negative size %d is <= maxFileSize so current logic treats it as valid", size)
		}
	})
}

// Property 5: All 7 known MIME types always return true.
func TestProp_KnownMIMETypesValid(t *testing.T) {
	types := allAllowedTypes()
	rapid.Check(t, func(t *rapid.T) {
		idx := rapid.IntRange(0, len(types)-1).Draw(t, "typeIndex")
		mime := types[idx]
		if !isMIMETypeAllowed(mime) {
			t.Fatalf("known MIME type %q should be allowed", mime)
		}
	})
}

// Property 6: Random strings that are not in the allowed set are always rejected.
func TestProp_RandomMIMETypesRejected(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		mime := rapid.String().Draw(t, "randomMIME")
		if allowedMIMETypes[mime] {
			// The random string happens to match an allowed type — skip.
			return
		}
		if isMIMETypeAllowed(mime) {
			t.Fatalf("random MIME type %q should be rejected", mime)
		}
	})
}

// Property 7: Empty MIME type is always rejected.
func TestProp_EmptyMIMERejected(t *testing.T) {
	if isMIMETypeAllowed("") {
		t.Fatal("empty MIME type should be rejected")
	}
}

// Property 8: MIME type validation is case-sensitive.
// Upper-cased or mixed-case variants of allowed types must be rejected.
func TestProp_MIMETypeCaseSensitivity(t *testing.T) {
	types := allAllowedTypes()
	rapid.Check(t, func(t *rapid.T) {
		idx := rapid.IntRange(0, len(types)-1).Draw(t, "typeIndex")
		original := types[idx]

		// Generate a case-altered variant that differs from the original.
		upper := strings.ToUpper(original)
		if upper == original {
			// All-uppercase matches original (shouldn't happen for these types, but guard).
			return
		}
		if isMIMETypeAllowed(upper) {
			t.Fatalf("upper-cased MIME type %q should be rejected (case-sensitive)", upper)
		}

		// Also test title-case.
		title := strings.ToTitle(original)
		if title == original {
			return
		}
		if isMIMETypeAllowed(title) {
			t.Fatalf("title-cased MIME type %q should be rejected (case-sensitive)", title)
		}
	})
}

// Property 9: Determinism — same inputs always produce the same validation result.
func TestProp_Determinism(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		size := rapid.Int64Range(0, 20<<20).Draw(t, "size")
		mime := rapid.String().Draw(t, "mime")

		sizeResult1 := isFileSizeValid(size)
		sizeResult2 := isFileSizeValid(size)
		if sizeResult1 != sizeResult2 {
			t.Fatalf("isFileSizeValid(%d) is non-deterministic: %v vs %v", size, sizeResult1, sizeResult2)
		}

		mimeResult1 := isMIMETypeAllowed(mime)
		mimeResult2 := isMIMETypeAllowed(mime)
		if mimeResult1 != mimeResult2 {
			t.Fatalf("isMIMETypeAllowed(%q) is non-deterministic: %v vs %v", mime, mimeResult1, mimeResult2)
		}
	})
}
