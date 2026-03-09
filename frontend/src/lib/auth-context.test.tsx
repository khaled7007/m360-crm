import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./auth-context";
import React from "react";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

function wrapper({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it("throws when used outside AuthProvider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within AuthProvider");
  });

  it("starts with null user and isLoading true", () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it("login calls API and stores token", async () => {
    const fakeToken = "jwt-token-123";
    const fakeUser = {
      id: "1",
      email: "admin@m360.sa",
      name_en: "Admin",
      name_ar: "مدير",
      role: "admin",
      is_active: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: fakeToken, user: fakeUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@m360.sa", "admin123!");
    });

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "m360_token",
      fakeToken
    );
    expect(result.current.token).toBe(fakeToken);
    expect(result.current.user).toEqual(fakeUser);
  });

  it("logout clears token and user", async () => {
    const fakeToken = "jwt-token-123";
    const fakeUser = {
      id: "1",
      email: "admin@m360.sa",
      name_en: "Admin",
      name_ar: "مدير",
      role: "admin",
      is_active: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ token: fakeToken, user: fakeUser }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("admin@m360.sa", "admin123!");
    });

    act(() => {
      result.current.logout();
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("m360_token");
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it("restores session from localStorage on mount", async () => {
    const fakeUser = {
      id: "1",
      email: "admin@m360.sa",
      name_en: "Admin",
      name_ar: "مدير",
      role: "admin",
      is_active: true,
    };

    localStorageMock.getItem.mockReturnValue("stored-token");
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(fakeUser),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toEqual(fakeUser);
    expect(result.current.token).toBe("stored-token");
  });

  it("clears invalid token from localStorage on mount", async () => {
    localStorageMock.getItem.mockReturnValue("expired-token");
    mockFetch.mockRejectedValueOnce(new Error("Unauthorized"));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith("m360_token");
    expect(result.current.user).toBeNull();
  });
});
