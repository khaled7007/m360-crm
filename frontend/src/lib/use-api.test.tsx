import { renderHook, waitFor } from "@testing-library/react";
import { ReactNode } from "react";
import { AuthContext } from "./auth-context";
import { useApiList, useApiMutation } from "./use-api";

// ---------------------------------------------------------------------------
// Auth context wrapper that injects a test token
// ---------------------------------------------------------------------------

const TEST_TOKEN = "test-token";

function makeWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AuthContext.Provider
        value={{
          token: TEST_TOKEN,
          user: null,
          login: vi.fn(),
          logout: vi.fn(),
          isLoading: false,
        }}
      >
        {children}
      </AuthContext.Provider>
    );
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchOnce(body: unknown, status = 200) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

function mockFetchError(message: string) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    new Response(JSON.stringify({ message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    })
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useApiList", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches data on mount", async () => {
    mockFetchOnce({ data: [{ id: "1", name: "Lead A" }] });

    const { result } = renderHook(() => useApiList<{ id: string; name: string }>("/leads"), {
      wrapper: makeWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([{ id: "1", name: "Lead A" }]);
    expect(result.current.error).toBeNull();

    // Verify the correct Authorization header was sent
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/leads"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: `Bearer ${TEST_TOKEN}`,
        }),
      })
    );
  });

  it("handles error", async () => {
    mockFetchError("Not found");

    const { result } = renderHook(() => useApiList("/leads"), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe("Not found");
  });
});

describe("useApiMutation", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calls API with correct method and body", async () => {
    const responseData = { id: "42", name: "New Lead" };
    mockFetchOnce(responseData);

    const { result } = renderHook(
      () => useApiMutation<{ name: string }, { id: string; name: string }>("/leads", "POST"),
      { wrapper: makeWrapper() }
    );

    const payload = { name: "New Lead" };
    let returned: { id: string; name: string } | null = null;

    await waitFor(async () => {
      returned = await result.current.mutate(payload);
    });

    expect(returned).toEqual(responseData);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.error).toBeNull();

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/leads"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
        headers: expect.objectContaining({
          Authorization: `Bearer ${TEST_TOKEN}`,
          "Content-Type": "application/json",
        }),
      })
    );
  });
});
