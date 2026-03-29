"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const COLUMN_MAP: Record<string, string> = {
  // English
  "contact name": "contact_name",
  "contact_name": "contact_name",
  "name": "contact_name",
  "full name": "contact_name",
  "company name": "company_name",
  "company_name": "company_name",
  "company": "company_name",
  "organization": "company_name",
  "phone": "contact_phone",
  "contact phone": "contact_phone",
  "contact_phone": "contact_phone",
  "mobile": "contact_phone",
  "email": "contact_email",
  "contact email": "contact_email",
  "contact_email": "contact_email",
  "source": "source",
  "lead source": "source",
  "status": "status",
  "estimated amount": "estimated_amount",
  "estimated_amount": "estimated_amount",
  "amount": "estimated_amount",
  "notes": "notes",
  "note": "notes",
  // Arabic
  "اسم المسؤول": "contact_name",
  "اسم التواصل": "contact_name",
  "الاسم": "contact_name",
  "اسم الشركة": "company_name",
  "الشركة": "company_name",
  "المنشأة": "company_name",
  "الهاتف": "contact_phone",
  "الجوال": "contact_phone",
  "رقم التواصل": "contact_phone",
  "البريد الإلكتروني": "contact_email",
  "البريد": "contact_email",
  "المصدر": "source",
  "مصدر العميل": "source",
  "الحالة": "status",
  "المبلغ المتوقع": "estimated_amount",
  "المبلغ": "estimated_amount",
  "ملاحظات": "notes",
  "ملاحظة": "notes",
};

const SOURCE_MAP: Record<string, string> = {
  "إحالة": "referral", "referral": "referral",
  "موقع": "website", "website": "website", "الموقع": "website",
  "اتصال": "cold_call", "cold_call": "cold_call", "مكالمة": "cold_call",
  "فعالية": "event", "event": "event", "معرض": "event",
  "تواصل اجتماعي": "social_media", "social_media": "social_media", "سوشيال": "social_media",
};

type LeadRow = Record<string, string | number>;

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function LeadImportModal({ open, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const downloadSample = () => {
    const sampleData = [
      ["اسم المسؤول", "اسم الشركة", "الهاتف", "البريد الإلكتروني", "المصدر", "المبلغ المتوقع", "ملاحظات"],
      ["محمد العتيبي", "شركة العتيبي للمقاولات", "+966501234567", "m.otaibi@otaibi-co.sa", "إحالة", 500000, "عميل محتمل مميز"],
      ["نورة الزهراني", "مجموعة الزهراني التجارية", "+966552345678", "noura@zahrani-group.sa", "موقع", 320000, "تواصلت عبر الموقع"],
      ["فهد الحربي", "الحربي للتطوير", "+966543456789", "fahad@harbi-dev.sa", "فعالية", 750000, "تعرفنا في معرض سيتي سكيب"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    ws["!cols"] = sampleData[0].map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "العملاء المحتملون");
    XLSX.writeFile(wb, "نموذج_استيراد_العملاء_المحتملين.xlsx");
  };

  const reset = () => {
    setRows([]);
    setFileName("");
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => { reset(); onClose(); };

  const parseFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1 });
      if (!raw.length) return;
      const rawHeaders = (raw[0] as string[]).map((h) => String(h ?? "").trim());
      const dataRows = raw.slice(1).filter((r: string[]) => r.some((c) => c !== undefined && c !== ""));
      const mapped: LeadRow[] = dataRows.map((row: string[]) => {
        const obj: LeadRow = {};
        rawHeaders.forEach((h, i) => {
          const key = COLUMN_MAP[h.toLowerCase()] || COLUMN_MAP[h] || h;
          const val = row[i];
          if (val !== undefined && val !== null && val !== "") {
            obj[key] = typeof val === "number" ? val : String(val).trim();
          }
        });
        return obj;
      });
      setRows(mapped);
      setFileName(file.name);
      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) { toast.error("يرجى رفع ملف Excel أو CSV"); return; }
    parseFile(file);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    const token = localStorage.getItem("m360_token") || "";
    setIsImporting(true);
    let success = 0, failed = 0;
    for (const row of rows) {
      try {
        const sourceRaw = String(row.source || "website").toLowerCase().trim();
        const payload = {
          contact_name: String(row.contact_name || row["اسم المسؤول"] || ""),
          company_name: String(row.company_name || row["اسم الشركة"] || ""),
          contact_phone: String(row.contact_phone || row["الهاتف"] || ""),
          contact_email: String(row.contact_email || row["البريد الإلكتروني"] || ""),
          source: SOURCE_MAP[sourceRaw] || SOURCE_MAP[row.source as string] || "website",
          status: "new",
          estimated_amount: Number(row.estimated_amount) || 0,
          notes: String(row.notes || ""),
        };
        if (!payload.contact_name) { failed++; continue; }
        await api("/leads", { method: "POST", body: payload, token });
        success++;
      } catch { failed++; }
    }
    setIsImporting(false);
    setImportResult({ success, failed });
    if (success > 0) { toast.success(`تم استيراد ${success} عميل محتمل بنجاح`); onImported(); }
    if (failed > 0) toast.error(`فشل استيراد ${failed} صف`);
  };

  if (!open) return null;

  const DISPLAY_FIELDS = ["contact_name", "company_name", "contact_phone", "contact_email", "source", "estimated_amount"];
  const previewCols = DISPLAY_FIELDS.filter((f) => rows.some((r) => r[f]));

  const FIELD_LABEL: Record<string, string> = {
    contact_name: "اسم المسؤول", company_name: "الشركة",
    contact_phone: "الهاتف", contact_email: "البريد",
    source: "المصدر", estimated_amount: "المبلغ",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-stone-800">استيراد العملاء المحتملين من Excel</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-stone-100 transition"><X size={20} className="text-stone-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!rows.length && (
            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${isDragging ? "border-teal-500 bg-teal-50" : "border-stone-300 hover:border-teal-400 hover:bg-stone-50"}`}
            >
              <Upload size={36} className="mx-auto mb-3 text-stone-400" />
              <p className="font-medium text-stone-700 mb-1">اسحب وأفلت ملف Excel هنا</p>
              <p className="text-sm text-stone-500">أو اضغط لاختيار ملف (.xlsx, .xls, .csv)</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}

          {!rows.length && (
            <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 text-sm text-teal-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium mb-1">الأعمدة المدعومة:</p>
                  <p className="text-teal-700">اسم المسؤول، اسم الشركة، الهاتف، البريد الإلكتروني، المصدر، المبلغ المتوقع، ملاحظات</p>
                  <p className="mt-1 text-teal-600">المصادر المقبولة: إحالة، موقع، اتصال، فعالية، تواصل اجتماعي</p>
                </div>
                <button onClick={downloadSample} className="flex items-center gap-1.5 shrink-0 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-xs font-medium">
                  <Download size={14} />
                  تحميل نموذج
                </button>
              </div>
            </div>
          )}

          {rows.length > 0 && !importResult && (
            <>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <FileSpreadsheet size={16} className="text-teal-600" />
                <span className="font-medium">{fileName}</span>
                <span className="text-stone-400">—</span>
                <span>{rows.length} صف</span>
                <button onClick={reset} className="mr-auto text-xs text-red-500 hover:underline">إزالة الملف</button>
              </div>
              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="min-w-full text-sm divide-y divide-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      {previewCols.map((col) => (
                        <th key={col} className="px-3 py-2 text-right font-medium text-stone-600 whitespace-nowrap">{FIELD_LABEL[col] || col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-stone-50">
                        {previewCols.map((col) => (
                          <td key={col} className="px-3 py-2 text-stone-700 whitespace-nowrap max-w-[180px] truncate">{String(row[col] ?? "—")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && <p className="text-xs text-center text-stone-400 py-2">يُعرض أول 10 صفوف من أصل {rows.length}</p>}
              </div>
            </>
          )}

          {importResult && (
            <div className="space-y-3">
              {importResult.success > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <p className="text-green-800 font-medium">تم استيراد {importResult.success} عميل محتمل بنجاح</p>
                </div>
              )}
              {importResult.failed > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                  <p className="text-red-800 font-medium">فشل استيراد {importResult.failed} صف (يُشترط اسم المسؤول)</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <button onClick={handleClose} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">إغلاق</button>
          {rows.length > 0 && !importResult && (
            <button onClick={handleImport} disabled={isImporting} className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
              {isImporting ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />جاري الاستيراد…</>) : (<><Upload size={16} />استيراد {rows.length} عميل</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
