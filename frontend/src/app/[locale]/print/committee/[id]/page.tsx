"use client";

import { use, useEffect, useState } from "react";

interface Vote {
  id: string;
  package_id: string;
  voter_id: string;
  voter_name: string;
  decision: "approve" | "reject";
  comments: string;
  voted_at: string;
}

interface CommitteePackage {
  id: string;
  application_id: string;
  credit_assessment_id?: string;
  status: "pending" | "approved" | "rejected";
  quorum_required: number;
  votes_for: number;
  votes_against: number;
  decision_date?: string;
  created_at: string;
  votes?: Vote[];
}

interface CreditAssessment {
  id: string;
  project_name?: string;
  organization_id?: string;
}

interface Organization {
  id: string;
  name_ar?: string;
  name_en?: string;
}

const formatDate = (iso?: string) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default function CommitteePrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [pkg, setPkg] = useState<CommitteePackage | null>(null);
  const [assessment, setAssessment] = useState<CreditAssessment | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pkgRes, assessRes] = await Promise.all([
          fetch(`/api/v1/packages/${id}`),
          fetch(`/api/v1/packages`),
        ]);
        const pkgData = await pkgRes.json();
        setPkg(pkgData);

        if (pkgData?.credit_assessment_id) {
          const aRes = await fetch(`/api/v1/credit-assessments/${pkgData.credit_assessment_id}`);
          const aData = await aRes.json();
          setAssessment(aData);

          if (aData?.organization_id) {
            const oRes = await fetch(`/api/v1/organizations/${aData.organization_id}`);
            const oData = await oRes.json();
            setOrg(oData);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  useEffect(() => {
    if (!loading && pkg) {
      setTimeout(() => window.print(), 600);
    }
  }, [loading, pkg]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  if (!pkg) {
    return <div className="p-8 text-center text-gray-500">لم يتم العثور على الحزمة</div>;
  }

  const isApproved = pkg.status === "approved";
  const majority = Math.floor((pkg.quorum_required || 3) / 2) + 1;
  const approveVotes = pkg.votes?.filter((v) => v.decision === "approve") || [];
  const rejectVotes = pkg.votes?.filter((v) => v.decision === "reject") || [];

  return (
    <div className="min-h-screen bg-white" dir="rtl" lang="ar">
      <style>{`
        @media print {
          @page { margin: 20mm; size: A4; }
          .no-print { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; }
      `}</style>

      {/* Print button */}
      <div className="no-print fixed top-4 left-4 z-50">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition text-sm"
        >
          طباعة / تصدير PDF
        </button>
      </div>

      <div className="max-w-3xl mx-auto p-10 space-y-8">
        {/* Header */}
        <div className="text-center border-b-2 border-teal-700 pb-6">
          <p className="text-xs text-gray-400 mb-1">المملكة العربية السعودية</p>
          <h1 className="text-2xl font-bold text-teal-800">محضر قرار لجنة الائتمان</h1>
          <p className="text-sm text-gray-500 mt-1">Credit Committee Decision Report</p>
        </div>

        {/* Package Info */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-5 text-sm">
          <div>
            <span className="text-gray-500 block text-xs mb-0.5">المشروع</span>
            <span className="font-semibold">{assessment?.project_name || "—"}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs mb-0.5">المنشأة</span>
            <span className="font-semibold">{org?.name_ar || org?.name_en || "—"}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs mb-0.5">تاريخ تقديم الحزمة</span>
            <span className="font-semibold">{formatDate(pkg.created_at)}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs mb-0.5">تاريخ القرار</span>
            <span className="font-semibold">{formatDate(pkg.decision_date)}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs mb-0.5">عدد أعضاء اللجنة المطلوب</span>
            <span className="font-semibold">{pkg.quorum_required}</span>
          </div>
          <div>
            <span className="text-gray-500 block text-xs mb-0.5">حد الأغلبية المطلوبة</span>
            <span className="font-semibold">{majority} أصوات</span>
          </div>
        </div>

        {/* Decision Banner */}
        <div className={`rounded-xl border-2 p-6 text-center ${
          isApproved
            ? "border-green-400 bg-green-50"
            : "border-red-400 bg-red-50"
        }`}>
          <p className="text-xs text-gray-400 mb-1">قرار اللجنة</p>
          <p className={`text-4xl font-black ${isApproved ? "text-green-700" : "text-red-700"}`}>
            {isApproved ? "مقبول ✓" : "مرفوض ✗"}
          </p>
          <p className="text-sm mt-2 text-gray-500">
            {isApproved
              ? `حصل على ${pkg.votes_for} أصوات قبول من أصل ${(pkg.votes || []).length} صوت`
              : `حصل على ${pkg.votes_against} أصوات رفض من أصل ${(pkg.votes || []).length} صوت`}
          </p>
        </div>

        {/* Vote Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="text-sm font-bold text-green-700 mb-3">أصوات القبول ({approveVotes.length})</h3>
            {approveVotes.length === 0 ? (
              <p className="text-xs text-gray-400">لا يوجد</p>
            ) : (
              <ul className="space-y-2">
                {approveVotes.map((v) => (
                  <li key={v.id} className="text-sm">
                    <span className="font-medium">{v.voter_name || v.voter_id}</span>
                    {v.comments && (
                      <p className="text-xs text-gray-500 mt-0.5">{v.comments}</p>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(v.voted_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="text-sm font-bold text-red-700 mb-3">أصوات الرفض ({rejectVotes.length})</h3>
            {rejectVotes.length === 0 ? (
              <p className="text-xs text-gray-400">لا يوجد</p>
            ) : (
              <ul className="space-y-2">
                {rejectVotes.map((v) => (
                  <li key={v.id} className="text-sm">
                    <span className="font-medium">{v.voter_name || v.voter_id}</span>
                    {v.comments && (
                      <p className="text-xs text-gray-500 mt-0.5">{v.comments}</p>
                    )}
                    <p className="text-xs text-gray-400">{formatDate(v.voted_at)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* All Votes Detail */}
        {pkg.votes && pkg.votes.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3">تفاصيل التصويت</h3>
            <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-right p-3 font-semibold text-gray-600">#</th>
                  <th className="text-right p-3 font-semibold text-gray-600">اسم العضو</th>
                  <th className="text-right p-3 font-semibold text-gray-600">القرار</th>
                  <th className="text-right p-3 font-semibold text-gray-600">الملاحظات</th>
                  <th className="text-right p-3 font-semibold text-gray-600">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {pkg.votes.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 text-gray-400">{i + 1}</td>
                    <td className="p-3 font-medium">{v.voter_name || v.voter_id}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        v.decision === "approve"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}>
                        {v.decision === "approve" ? "قبول" : "رفض"}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 text-xs">{v.comments || "—"}</td>
                    <td className="p-3 text-gray-400 text-xs">{formatDate(v.voted_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 flex justify-between text-xs text-gray-400">
          <span>m360 CRM — نظام إدارة التمويل الشرعي</span>
          <span>تاريخ الطباعة: {formatDate(new Date().toISOString())}</span>
        </div>
      </div>
    </div>
  );
}
