import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable, Column } from "./DataTable";

type Item = { id: string; name: string; status: string };

const columns: Column<Item>[] = [
  { key: "name", header: "Name" },
  { key: "status", header: "Status" },
];

const data: Item[] = [
  { id: "1", name: "Alice", status: "active" },
  { id: "2", name: "Bob", status: "inactive" },
];

describe("DataTable", () => {
  it("renders column headers", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renders data rows", () => {
    render(<DataTable columns={columns} data={data} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByText("inactive")).toBeInTheDocument();
  });

  it("renders empty message when no data", () => {
    render(<DataTable columns={columns} data={[]} />);
    expect(screen.getByText("No data found")).toBeInTheDocument();
  });

  it("renders custom empty message", () => {
    render(
      <DataTable columns={columns} data={[]} emptyMessage="No applications yet" />
    );
    expect(screen.getByText("No applications yet")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<DataTable columns={columns} data={[]} isLoading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
    // Table should not be rendered
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("calls onRowClick when row clicked", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} data={data} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Alice").closest("tr")!);
    expect(onRowClick).toHaveBeenCalledTimes(1);
    expect(onRowClick).toHaveBeenCalledWith(data[0]);
  });

  it("renders custom render function for column", () => {
    const customColumns: Column<Item>[] = [
      { key: "name", header: "Name" },
      {
        key: "status",
        header: "Status",
        render: (item) => <span data-testid="custom-status">{item.status.toUpperCase()}</span>,
      },
    ];
    render(<DataTable columns={customColumns} data={data} />);
    const badges = screen.getAllByTestId("custom-status");
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveTextContent("ACTIVE");
    expect(badges[1]).toHaveTextContent("INACTIVE");
  });
});
