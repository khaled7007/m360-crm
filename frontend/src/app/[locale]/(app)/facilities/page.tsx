"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList } from "@/lib/use-api";

interface Facility {
  id: string;
  reference_number: string;
  principal_amount: number;
  profit_amount: number;
  total_amount: number;
  outstanding_balance: number;
  profit_rate: number;
  tenor_months: number;
  status: "active" | "closed" | "defaulted";
  delinquency: "current" | "par_1_29" | "par_30" | "par_60" | "par_90";
  disbursement_date: string;
  maturity_date: string;
  [key: string]: unknown;
}

const sar = (amount: number) =>
  new Intl.NumberFormat("en-SA", { style: "currency", currency: "SAR" }).format(amount);

// delinquencyLabels moved inside component to use translations

export default function FacilitiesPage() {
  const t = useTranslations("facilities");
  const tc = useTranslations("common");
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  const { data: facilities, pagination, isLoading, error: facilitiesError, refetch: refetchFacilities } =
    useApiList<Facility>("/facilities", { ...page, search: searchQuery || undefined });

  const delinquencyLabels: Record<string, string> = {
    current: t("delinquencyLabels.current"),
    par_1_29: t("delinquencyLabels.par_1_29"),
    par_30: t("delinquencyLabels.par_30"),
    par_60: t("delinquencyLabels.par_60"),
    par_90: t("delinquencyLabels.par_90"),
  };

  const columns: Column<Facility>[] = [
    {
      key: "reference_number",
      header: t("referenceNumber"),
      render: (item) => (
        <span className="font-mono text-sm font-medium text-stone-900">
          {item.reference_number}
        </span>
      ),
    },
    {
      key: "total_amount",
      header: t("totalAmount"),
      render: (item) => (
        <span className="tabular-nums text-sm">{sar(item.total_amount)}</span>
      ),
    },
    {
      key: "outstanding_balance",
      header: t("outstandingBalance"),
      render: (item) => (
        <span className="tabular-nums text-sm font-medium text-stone-900">
          {sar(item.outstanding_balance)}
        </span>
      ),
    },
    {
      key: "profit_rate",
      header: t("profitRate"),
      render: (item) => (
        <span className="tabular-nums text-sm">
          {item.profit_rate.toFixed(2)}%
        </span>
      ),
    },
    {
      key: "tenor_months",
      header: t("tenor"),
      render: (item) => (
        <span className="text-sm text-stone-600">{t("tenorMonths", { months: item.tenor_months })}</span>
      ),
    },
    {
      key: "disbursement_date",
      header: t("disbursementDate"),
      render: (item) => (
        <span className="text-sm text-stone-600">
          {item.disbursement_date
            ? new Date(item.disbursement_date).toLocaleDateString("en-SA")
            : "—"}
        </span>
      ),
    },
    {
      key: "maturity_date",
      header: t("maturityDate"),
      render: (item) => (
        <span className="text-sm text-stone-600">
          {item.maturity_date
            ? new Date(item.maturity_date).toLocaleDateString("en-SA")
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: tc("status"),
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: "delinquency",
      header: t("delinquency"),
      render: (item) => (
        <StatusBadge status={item.delinquency} />
      ),
    },
  ];

  // Summary stats
  const totalOutstanding = facilities.reduce(
    (sum, f) => sum + f.outstanding_balance,
    0
  );
  const activeFacilities = facilities.filter((f) => f.status === "active").length;
  const defaultedFacilities = facilities.filter(
    (f) => f.status === "defaulted"
  ).length;
  const atRisk = facilities.filter(
    (f) => f.delinquency !== "current"
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-stone-200 p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">
            {t("outstandingBalance")}
          </p>
          <p className="mt-1 text-xl font-semibold text-stone-900 tabular-nums">
            {sar(totalOutstanding)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">
            {t("title")}
          </p>
          <p className="mt-1 text-xl font-semibold text-green-700">
            {activeFacilities}
            {pagination && (
              <span className="text-sm text-stone-400 font-normal ml-1">
                / {pagination.total}
              </span>
            )}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">
            {t("atRiskPar")}
          </p>
          <p className="mt-1 text-xl font-semibold text-orange-600">
            {atRisk}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-stone-200 p-4">
          <p className="text-xs text-stone-500 uppercase tracking-wide font-medium">
            {t("defaulted")}
          </p>
          <p className="mt-1 text-xl font-semibold text-red-600">
            {defaultedFacilities}
          </p>
        </div>
      </div>

      {/* Delinquency legend */}
      <div className="bg-white rounded-lg border border-stone-200 px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide mr-1">
          {t("delinquency")}:
        </span>
        {Object.entries(delinquencyLabels).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5">
            <StatusBadge status={key} />
            <span className="text-xs text-stone-500">{label}</span>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {facilitiesError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetchFacilities()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoading && !facilitiesError && facilities.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noFacilities")}</p>
        </div>
      )}
      {!isLoading && !facilitiesError && facilities.length > 0 && (
        <DataTable
          columns={columns}
          data={facilities}
          isLoading={isLoading}
          emptyMessage={t("noFacilities")}
          searchable
          onSearch={(q) => { setSearchQuery(q); setPage((p) => ({ ...p, offset: 0 })); }}
        />
      )}
      {pagination && (
        <PaginationControls
          total={pagination.total}
          limit={pagination.limit}
          offset={pagination.offset}
          onPageChange={(offset) => setPage((p) => ({ ...p, offset }))}
        />
      )}
    </div>
  );
}
