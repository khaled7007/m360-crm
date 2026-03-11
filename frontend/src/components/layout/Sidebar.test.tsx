import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import { AuthContext } from "@/lib/auth-context";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/dashboard",
}));

// Mock next/link
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockLogout = vi.fn();
const mockUser = {
  id: "1",
  email: "admin@m360.sa",
  name_en: "Admin User",
  name_ar: "مدير",
  role: "admin",
  is_active: true,
};

function renderSidebar() {
  return render(
    <AuthContext.Provider
      value={{
        user: mockUser,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
        isLoading: false,
      }}
    >
      <Sidebar />
    </AuthContext.Provider>
  );
}

describe("Sidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the M360 logo", () => {
    renderSidebar();
    expect(screen.getByText("ClientsCycle")).toBeInTheDocument();
  });

  it("renders all 13 navigation links", () => {
    renderSidebar();
    const navItems = [
      "Dashboard",
      "Leads",
      "Organizations",
      "Contacts",
      "Products",
      "Applications",
      "Committee",
      "Facilities",
      "Collections",
      "Integrations",
      "Reports",
      "Users",
      "Notifications",
    ];
    navItems.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument();
    });
  });

  it("displays user name and role", () => {
    renderSidebar();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("admin")).toBeInTheDocument();
  });

  it("renders logout button", () => {
    renderSidebar();
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("calls logout when logout button is clicked", () => {
    renderSidebar();
    fireEvent.click(screen.getByText("Logout"));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("highlights active navigation item", () => {
    renderSidebar();
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink?.className).toContain("bg-blue-600");
  });

  it("generates correct href with locale prefix", () => {
    renderSidebar();
    const leadsLink = screen.getByText("Leads").closest("a");
    expect(leadsLink).toHaveAttribute("href", "/en/leads");
  });

  it("toggles collapsed state when chevron is clicked", () => {
    renderSidebar();
    // Initially expanded - M360 logo should be visible
    expect(screen.getByText("ClientsCycle")).toBeInTheDocument();

    // Find and click the collapse button (the button in the header)
    const collapseButton = screen
      .getByText("ClientsCycle")
      .closest("div")!
      .querySelector("button")!;
    fireEvent.click(collapseButton);

    // After collapse, nav item text should be hidden
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });
});
