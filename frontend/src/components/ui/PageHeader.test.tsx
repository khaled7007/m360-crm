import { render, screen } from "@testing-library/react";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders title", () => {
    render(<PageHeader title="Applications" />);
    expect(screen.getByRole("heading", { name: "Applications" })).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(<PageHeader title="Applications" description="Manage loan applications" />);
    expect(screen.getByText("Manage loan applications")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(<PageHeader title="Applications" />);
    expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    // The p element should not exist at all
    const container = screen.getByRole("heading").closest("div")!.parentElement!;
    expect(container.querySelector("p")).toBeNull();
  });

  it("renders action element when provided", () => {
    render(
      <PageHeader
        title="Applications"
        action={<button>New Application</button>}
      />
    );
    expect(screen.getByRole("button", { name: "New Application" })).toBeInTheDocument();
  });
});
