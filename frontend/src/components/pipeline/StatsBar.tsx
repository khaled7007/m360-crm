"use client";

import { Client } from "./stageConfig";

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);

interface StatsBarProps {
  clients: Client[];
}

export function StatsBar({ clients }: StatsBarProps) {
  const total = clients.length;
  const totalValue = clients.reduce((s, c) => s + (c.value || 0), 0);
  const deals = clients.filter((c) => c.stage === "deal").length;
  const nonRejects = clients.filter((c) => c.stage !== "reject").length;
  const winRate = nonRejects > 0 ? Math.round((deals / nonRejects) * 100) : 0;

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard
        label="إجمالي العملاء"
        value={total.toLocaleString("ar-SA")}
        sub="عميل في خط الأعمال"
        gradient="from-blue-500 to-blue-600"
        textColor="text-blue-600"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 20h5v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2h5m6 0v-2a2 2 0 10-4 0v2m4 0H9" />
          </svg>
        }
      />
      <StatCard
        label="إجمالي قيمة الصفقات"
        value={fmt(totalValue)}
        sub="القيمة الإجمالية"
        gradient="from-emerald-500 to-emerald-600"
        textColor="text-emerald-600"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <StatCard
        label="معدل الإغلاق"
        value={`${winRate}%`}
        sub={`${deals} صفقة من ${nonRejects} عميل`}
        gradient="from-violet-500 to-violet-600"
        textColor="text-violet-600"
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  gradient: string;
  textColor: string;
  icon: React.ReactNode;
}

function StatCard({ label, value, sub, gradient, textColor, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
        <div className="text-sm font-semibold text-gray-700 mt-0.5">{label}</div>
        <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
      </div>
    </div>
  );
}
