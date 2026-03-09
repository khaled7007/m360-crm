"use client";

import { ReactNode, useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  sortable?: boolean;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  searchable?: boolean;
  onSearch?: (query: string) => void;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  onRowClick,
  emptyMessage,
  isLoading,
  searchable,
  onSearch,
}: Props<T>) {
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  };

  const handleSort = (key: string) => {
    if (sortCol === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortCol) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortCol];
      const bVal = b[sortCol];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-stone-200 p-12 text-center text-stone-400">
        <div className="animate-spin h-6 w-6 border-2 border-teal-600 border-t-transparent rounded-full mx-auto mb-2" />
        {tc("loading")}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden">
      {searchable && (
        <div className="p-4 border-b border-stone-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={tc("searchPlaceholder")}
              aria-label={tc("search")}
              className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  onClick={col.sortable ? () => handleSort(col.key) : undefined}
                  className={`px-4 py-3 text-left text-xs font-medium text-stone-500 uppercase tracking-wider ${
                    col.sortable ? "cursor-pointer select-none hover:bg-stone-100" : ""
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {col.header}
                    {col.sortable && sortCol === col.key && (
                      sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-stone-400"
                >
                  {emptyMessage ?? tc("noDataFound")}
                </td>
              </tr>
            ) : (
              sortedData.map((item, idx) => (
                <tr
                  key={(item.id as string) || idx}
                  onClick={() => onRowClick?.(item)}
                  onKeyDown={onRowClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(item); } } : undefined}
                  role={onRowClick ? "button" : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  className={`${onRowClick ? "cursor-pointer hover:bg-stone-50" : ""}`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3 text-sm text-stone-700 whitespace-nowrap"
                    >
                      {col.render
                        ? col.render(item)
                        : (item[col.key] as ReactNode) ?? "—"}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
