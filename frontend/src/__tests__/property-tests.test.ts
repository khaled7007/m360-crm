import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

// ---------------------------------------------------------------------------
// 1. API URL Construction
//
// The api() function in lib/api.ts builds URLs as: `${API_BASE}${path}`
// where API_BASE defaults to "/api/v1".
// We test the pure string-concatenation logic without invoking fetch.
// ---------------------------------------------------------------------------

const API_BASE = "/api/v1";

function buildApiUrl(base: string, path: string): string {
  return `${base}${path}`;
}

describe("API URL Construction", () => {
  it("never crashes regardless of path input", () => {
    fc.assert(
      fc.property(fc.string(), (path) => {
        const url = buildApiUrl(API_BASE, path);
        expect(typeof url).toBe("string");
        expect(url.length).toBeGreaterThan(0);
      })
    );
  });

  it("constructed URL always starts with the base prefix", () => {
    fc.assert(
      fc.property(fc.string(), (path) => {
        const url = buildApiUrl(API_BASE, path);
        expect(url.startsWith(API_BASE)).toBe(true);
      })
    );
  });

  it("path starting with / does not produce double slashes after base", () => {
    // Simulate a stricter builder that normalises the join
    function buildApiUrlSafe(base: string, path: string): string {
      const normalizedBase = base.replace(/\/+$/, "");
      const normalizedPath = path.replace(/\/{2,}/g, "/");
      return `${normalizedBase}${normalizedPath}`;
    }

    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("/", "a", "b", "c", "1", "2", "?")).map((arr) => arr.join("")),
        (path) => {
          const url = buildApiUrlSafe(API_BASE, path);
          // After the scheme-less base, there should be no "//" in the path portion
          const pathPortion = url.slice(API_BASE.replace(/\/+$/, "").length);
          expect(pathPortion).not.toMatch(/\/{2,}/);
        }
      )
    );
  });

  it("preserves the original path content (no data loss)", () => {
    fc.assert(
      fc.property(fc.string(), (path) => {
        const url = buildApiUrl(API_BASE, path);
        expect(url).toBe(API_BASE + path);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Pagination Parameter Validation
//
// From use-api.ts the pagination uses limit/offset.
// Page-based UIs would compute: offset = (page - 1) * limit
// ---------------------------------------------------------------------------

function normalizePaginationParams(page: number, limit: number) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.max(1, Math.floor(limit));
  const offset = (safePage - 1) * safeLimit;
  return { page: safePage, limit: safeLimit, offset };
}

describe("Pagination Parameter Validation", () => {
  it("page is always >= 1 after normalization", () => {
    fc.assert(
      fc.property(fc.integer(), (page) => {
        const result = normalizePaginationParams(page, 20);
        expect(result.page).toBeGreaterThanOrEqual(1);
      })
    );
  });

  it("limit is always > 0 after normalization", () => {
    fc.assert(
      fc.property(fc.integer(), (limit) => {
        const result = normalizePaginationParams(1, limit);
        expect(result.limit).toBeGreaterThan(0);
      })
    );
  });

  it("offset is always non-negative", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (page, limit) => {
        const result = normalizePaginationParams(page, limit);
        expect(result.offset).toBeGreaterThanOrEqual(0);
      })
    );
  });

  it("offset equals (page - 1) * limit", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 1000 }),
        (page, limit) => {
          const result = normalizePaginationParams(page, limit);
          expect(result.offset).toBe((result.page - 1) * result.limit);
        }
      )
    );
  });

  it("normalization is idempotent", () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (page, limit) => {
        const first = normalizePaginationParams(page, limit);
        const second = normalizePaginationParams(first.page, first.limit);
        expect(second).toEqual(first);
      })
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Status Badge Mapping
//
// From StatusBadge.tsx: statusColors is a Record<string, string>, and unknown
// statuses fall back to "bg-stone-100 text-stone-700".
// ---------------------------------------------------------------------------

const statusColors: Record<string, string> = {
  new: "bg-teal-100 text-teal-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
  unqualified: "bg-red-100 text-red-700",
  converted: "bg-purple-100 text-purple-700",
  draft: "bg-stone-100 text-stone-700",
  submitted: "bg-teal-100 text-teal-700",
  pre_approved: "bg-cyan-100 text-cyan-700",
  documents_collected: "bg-indigo-100 text-indigo-700",
  credit_assessment: "bg-orange-100 text-orange-700",
  committee_review: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  disbursed: "bg-emerald-100 text-emerald-700",
  active: "bg-green-100 text-green-700",
  closed: "bg-stone-100 text-stone-700",
  defaulted: "bg-red-100 text-red-700",
  current: "bg-green-100 text-green-700",
  par_1_29: "bg-yellow-100 text-yellow-700",
  par_30: "bg-orange-100 text-orange-700",
  par_60: "bg-red-100 text-red-700",
  par_90: "bg-red-200 text-red-800",
  pending: "bg-yellow-100 text-yellow-700",
  approve: "bg-green-100 text-green-700",
  reject: "bg-red-100 text-red-700",
  defer: "bg-stone-100 text-stone-700",
  true: "bg-green-100 text-green-700",
  false: "bg-red-100 text-red-700",
};

const DEFAULT_COLOR = "bg-stone-100 text-stone-700";

function getStatusColor(status: string): string {
  return statusColors[status] || DEFAULT_COLOR;
}

function getStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

const ALL_KNOWN_STATUSES = Object.keys(statusColors);

describe("Status Badge Mapping", () => {
  it("every known status maps to a valid CSS class string", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_KNOWN_STATUSES), (status) => {
        const color = getStatusColor(status);
        expect(color).toBeTruthy();
        expect(color.length).toBeGreaterThan(0);
        // Must contain Tailwind-style class tokens
        expect(color).toMatch(/^bg-\w/);
        expect(color).toMatch(/text-\w/);
      })
    );
  });

  it("same status always produces the same color (determinism)", () => {
    fc.assert(
      fc.property(fc.constantFrom(...ALL_KNOWN_STATUSES), (status) => {
        const first = getStatusColor(status);
        const second = getStatusColor(status);
        expect(first).toBe(second);
      })
    );
  });

  it("unknown/random statuses do not crash and return a default", () => {
    fc.assert(
      fc.property(fc.string(), (status) => {
        const color = getStatusColor(status);
        expect(typeof color).toBe("string");
        expect(color.length).toBeGreaterThan(0);
        // If not a known status, should get the default
        if (!ALL_KNOWN_STATUSES.includes(status)) {
          expect(color).toBe(DEFAULT_COLOR);
        }
      })
    );
  });

  it("status label replaces underscores with spaces", () => {
    fc.assert(
      fc.property(fc.string(), (status) => {
        const label = getStatusLabel(status);
        expect(label).not.toContain("_");
      })
    );
  });

  it("status label preserves characters other than underscores", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom("a", "b", "1", " ", "-")).map((arr) => arr.join("")),
        (status) => {
          // Strings without underscores should pass through unchanged
          const label = getStatusLabel(status);
          expect(label).toBe(status);
        }
      )
    );
  });
});

// ---------------------------------------------------------------------------
// 4. Search / Filter Logic
//
// From use-api.ts, the query string builder filters out undefined and empty
// values, and uses encodeURIComponent. We test normalisation properties.
// ---------------------------------------------------------------------------

function normalizeSearchText(input: string): string {
  return input.trim().toLowerCase();
}

function buildQueryString(
  params: Record<string, string | number | undefined>
): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join("&");
}

describe("Search / Filter Logic", () => {
  it("normalizing search text is idempotent", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const once = normalizeSearchText(input);
        const twice = normalizeSearchText(once);
        expect(twice).toBe(once);
      })
    );
  });

  it("empty or whitespace-only search normalizes to empty string", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(" ", "\t", "\n", "\r")).map((arr) => arr.join("")),
        (input) => {
          const result = normalizeSearchText(input);
          expect(result).toBe("");
        }
      )
    );
  });

  it("normalized search text has no leading/trailing whitespace", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = normalizeSearchText(input);
        expect(result).toBe(result.trim());
      })
    );
  });

  it("normalized search text is always lowercase", () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = normalizeSearchText(input);
        expect(result).toBe(result.toLowerCase());
      })
    );
  });

  it("query string builder excludes undefined values", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (key, value) => {
        const withUndefined = buildQueryString({ [key]: undefined });
        expect(withUndefined).toBe("");
        const withValue = buildQueryString({ [key]: value });
        if (value === "") {
          expect(withValue).toBe("");
        } else {
          expect(withValue).toContain(key);
        }
      })
    );
  });

  it("query string builder excludes empty string values", () => {
    fc.assert(
      fc.property(fc.string(), (key) => {
        const result = buildQueryString({ [key]: "" });
        expect(result).toBe("");
      })
    );
  });

  it("query string values are properly URI-encoded", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.string({ minLength: 1 }),
        (key, value) => {
          const qs = buildQueryString({ [key]: value });
          // The value portion should be URI-encoded
          expect(qs).toContain(encodeURIComponent(value));
        }
      )
    );
  });

  it("query string with multiple params uses & separator", () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^[a-z]{1,10}$/),
        fc.stringMatching(/^[a-z]{1,10}$/),
        fc.stringMatching(/^[a-z]{1,10}$/),
        fc.stringMatching(/^[a-z]{1,10}$/),
        (k1, v1, k2, v2) => {
          fc.pre(k1 !== k2); // ensure distinct keys
          const qs = buildQueryString({ [k1]: v1, [k2]: v2 });
          // With two non-empty values and alphanumeric keys/values,
          // there should be exactly one "&" joining the two pairs
          const ampCount = (qs.match(/&/g) || []).length;
          expect(ampCount).toBe(1);
        }
      )
    );
  });
});
