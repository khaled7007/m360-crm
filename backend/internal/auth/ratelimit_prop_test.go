package auth

import (
	"sync"
	"testing"

	"golang.org/x/time/rate"

	"pgregory.net/rapid"
)

func TestProp_SameIPSameLimiter(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		r := rate.Limit(rapid.Float64Range(0.1, 100).Draw(t, "rate"))
		b := rapid.IntRange(1, 100).Draw(t, "burst")
		rl := NewIPRateLimiter(r, b)

		ip := rapid.String().Draw(t, "ip")
		l1 := rl.GetLimiter(ip)
		l2 := rl.GetLimiter(ip)

		if l1 != l2 {
			t.Fatalf("expected same limiter instance for ip %q, got different pointers", ip)
		}
	})
}

func TestProp_DifferentIPsDifferentLimiters(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		r := rate.Limit(rapid.Float64Range(0.1, 100).Draw(t, "rate"))
		b := rapid.IntRange(1, 100).Draw(t, "burst")
		rl := NewIPRateLimiter(r, b)

		ip1 := rapid.String().Draw(t, "ip1")
		ip2 := rapid.String().Draw(t, "ip2")

		if ip1 == ip2 {
			t.Skip("generated identical IPs, skipping")
		}

		l1 := rl.GetLimiter(ip1)
		l2 := rl.GetLimiter(ip2)

		if l1 == l2 {
			t.Fatalf("expected different limiter instances for ip1=%q and ip2=%q, got same pointer", ip1, ip2)
		}
	})
}

func TestProp_LimiterHasCorrectRate(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		r := rate.Limit(rapid.Float64Range(0.1, 100).Draw(t, "rate"))
		b := rapid.IntRange(1, 100).Draw(t, "burst")
		rl := NewIPRateLimiter(r, b)

		ip := rapid.String().Draw(t, "ip")
		limiter := rl.GetLimiter(ip)

		if limiter.Limit() != r {
			t.Fatalf("expected rate %v, got %v", r, limiter.Limit())
		}
	})
}

func TestProp_LimiterHasCorrectBurst(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		r := rate.Limit(rapid.Float64Range(0.1, 100).Draw(t, "rate"))
		b := rapid.IntRange(1, 100).Draw(t, "burst")
		rl := NewIPRateLimiter(r, b)

		ip := rapid.String().Draw(t, "ip")
		limiter := rl.GetLimiter(ip)

		if limiter.Burst() != b {
			t.Fatalf("expected burst %d, got %d", b, limiter.Burst())
		}
	})
}

func TestProp_BurstAllowsInitialRequests(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		// Use a very low rate so token replenishment is negligible during the test.
		b := rapid.IntRange(1, 50).Draw(t, "burst")
		rl := NewIPRateLimiter(0.0001, b)

		ip := rapid.String().Draw(t, "ip")
		limiter := rl.GetLimiter(ip)

		for n := 0; n < b; n++ {
			if !limiter.Allow() {
				t.Fatalf("expected request %d/%d to be allowed, but it was rejected", n+1, b)
			}
		}

		// The next request after exhausting the burst should be rejected.
		if limiter.Allow() {
			t.Fatalf("expected request %d to be rejected after exhausting burst of %d", b+1, b)
		}
	})
}

func TestProp_NoCrashOnArbitraryStrings(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		rl := NewIPRateLimiter(1, 1)
		ip := rapid.String().Draw(t, "ip")

		// Must not panic.
		limiter := rl.GetLimiter(ip)
		if limiter == nil {
			t.Fatal("GetLimiter returned nil")
		}
	})
}

func TestProp_ConcurrentSafety(t *testing.T) {
	rapid.Check(t, func(t *rapid.T) {
		r := rate.Limit(rapid.Float64Range(0.1, 100).Draw(t, "rate"))
		b := rapid.IntRange(1, 100).Draw(t, "burst")
		rl := NewIPRateLimiter(r, b)

		ips := rapid.SliceOf(rapid.String()).Draw(t, "ips")
		if len(ips) == 0 {
			t.Skip("empty IP slice, skipping")
		}

		const goroutines = 16
		var wg sync.WaitGroup
		wg.Add(goroutines)

		// Collect results so we can verify correctness after the concurrent phase.
		type result struct {
			ip      string
			limiter *rate.Limiter
		}
		results := make([][]result, goroutines)

		for g := 0; g < goroutines; g++ {
			g := g
			go func() {
				defer wg.Done()
				var local []result
				for _, ip := range ips {
					l := rl.GetLimiter(ip)
					local = append(local, result{ip: ip, limiter: l})
				}
				results[g] = local
			}()
		}

		wg.Wait()

		// All goroutines must agree on the limiter instance for each IP.
		canonical := make(map[string]*rate.Limiter)
		for _, goroutineResults := range results {
			for _, res := range goroutineResults {
				if existing, ok := canonical[res.ip]; ok {
					if existing != res.limiter {
						t.Fatalf("concurrent GetLimiter returned different instances for ip %q", res.ip)
					}
				} else {
					canonical[res.ip] = res.limiter
				}
			}
		}
	})
}
