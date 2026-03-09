import { render, screen } from "@testing-library/react";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders status text with underscores replaced by spaces", () => {
    render(<StatusBadge status="pre_approved" />);
    expect(screen.getByText("pre approved")).toBeInTheDocument();
  });

  it("applies correct color class for approved status", () => {
    render(<StatusBadge status="approved" />);
    const badge = screen.getByText("approved");
    expect(badge).toHaveClass("bg-green-100");
  });

  it("applies correct color class for rejected status", () => {
    render(<StatusBadge status="rejected" />);
    const badge = screen.getByText("rejected");
    expect(badge).toHaveClass("bg-red-100");
  });

  it("applies default gray class for unknown status", () => {
    render(<StatusBadge status="unknown_status" />);
    const badge = screen.getByText("unknown status");
    expect(badge).toHaveClass("bg-gray-100");
    expect(badge).toHaveClass("text-gray-700");
  });

  it("renders with capitalize class", () => {
    render(<StatusBadge status="draft" />);
    const badge = screen.getByText("draft");
    expect(badge).toHaveClass("capitalize");
  });
});
