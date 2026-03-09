"use client";

import { useTranslations } from "next-intl";

interface PaginationControlsProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

export function PaginationControls({ total, limit, offset, onPageChange }: PaginationControlsProps) {
  const tc = useTranslations("common");
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  if (total <= limit) return null;

  return (
    <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3 sm:px-6">
      <div className="text-sm text-stone-700">
        {tc("showingFromTo", { from, to, total })}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(offset - limit)}
          disabled={offset === 0}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tc("previous")}
        </button>
        <span className="flex items-center px-3 text-sm text-stone-700">
          {tc("pageXofY", { current: currentPage, total: totalPages })}
        </span>
        <button
          onClick={() => onPageChange(offset + limit)}
          disabled={offset + limit >= total}
          className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tc("next")}
        </button>
      </div>
    </div>
  );
}
