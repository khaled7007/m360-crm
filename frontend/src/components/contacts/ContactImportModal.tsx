"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const COLUMN_MAP: Record<string, string> = {
  // English
  "name en": "name_en", "name_en": "name_en", "english name": "name_en", "name": "name_en",
  "name ar": "name_ar", "name_ar": "name_ar", "arabic name": "name_ar",
  "national id": "national_id", "national_id": "national_id", "id number": "national_id",
  "role": "role", "position": "role", "title": "role", "job title": "role",
  "phone": "phone", "mobile": "phone", "contact phone": "phone",
  "email": "email", "contact email": "email",
  // Arabic
  "الاسم بالإنجليزية": "name_en", "الاسم الإنجليزي": "name_en",
  "الاسم بالعربية": "name_ar", "الاسم بالعربي": "name_ar", "الاسم": "name_ar",
  "رقم الهوية": "national_id", "الهوية الوطنية": "national_id", "رقم الهوية الوطنية": "national_id",
  "المسمى الوظيفي": "role", "الدور": "role", "الوظيفة": "role", "المنصب": "role",
  "الهاتف": "phone", "الجوال": "phone", "رقم التواصل": "phone",
  "البريد الإلكتروني": "email", "البريد": "email",
};

type ContactRow = Record<string, string | number>;

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function ContactImportModal({ open, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const downloadSample = () => {
    const sampleData = [
      ["الاسم بالعربية", "الاسم بالإنجليزية", "رقم الهوية", "المسمى الوظيفي", "الهاتف", "البريد الإلكتروني"],
      ["محمد العتيبي", "Mohammed Al-Otaibi", "1012345678", "الرئيس التنفيذي", "+966501234567", "m.otaibi@company.sa"],
      ["نورة الزهراني", "Noura Al-Zahrani", "1023456789", "المدير المالي", "+966552345678", "noura@company.sa"],
      ["فهد الحربي", "Fahad Al-Harbi", "1034567890", "مدير العمليات", "+966543456789", "fahad@company.sa"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sampleData);
    ws["!cols"] = sampleData[0].map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "جهات الاتصال");
    XLSX.writeFile(wb, "نموذج_استيراد_جهات_الاتصال.xlsx");
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
      const mapped: ContactRow[] = dataRows.map((row: string[]) => {
        const obj: ContactRow = {};
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
    const token = sessionStorage.getItem("m360_token") || "";
    setIsImporting(true);
    let success = 0, failed = 0;
    for (const row of rows) {
      try {
        const nameAr = String(row.name_ar || row["الاسم بالعربية"] || row["الاسم"] || "");
        const nameEn = String(row.name_en || row["الاسم بالإنجليزية"] || nameAr || "");
        if (!nameAr && !nameEn) { failed++; continue; }
        const payload = {
          name_en: nameEn || nameAr,
          name_ar: nameAr || nameEn,
          national_id: String(row.national_id || ""),
          role: String(row.role || ""),
          phone: String(row.phone || ""),
          email: String(row.email || ""),
          is_guarantor: false,
        };
        await api("/contacts", { method: "POST", body: payload, token });
        success++;
      } catch { failed++; }
    }
    setIsImporting(false);
    setImportResult({ success, failed });
    if (success > 0) { toast.success(`تم استيراد ${success} جهة اتصال بنجاح`); onImported(); }
    if (failed > 0) toast.error(`فشل استيراد ${failed} صف`);
  };

  if (!open) return null;

  const DISPLAY_FIELDS = ["name_ar", "name_en", "national_id", "role", "phone", "email"];
  const previewCols = DISPLAY_FIELDS.filter((f) => rows.some((r) => r[f]));

  const FIELD_LABEL: Record<string, string> = {
    name_ar: "الاسم بالعربي", name_en: "الاسم بالإنجليزي",
    national_id: "رقم الهوية", role: "الوظيفة",
    phone: "الهاتف", email: "البريد",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-stone-800">استيراد جهات الاتصال من Excel</h2>
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
                  <p className="text-teal-700">الاسم بالعربية، الاسم بالإنجليزية، رقم الهوية، المسمى الوظيفي، الهاتف، البريد الإلكتروني</p>
                  <p className="mt-1 text-teal-600">كذلك تدعم الأسماء الإنجليزية: name_ar, name_en, national_id, role, phone, email</p>
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
                  <p className="text-green-800 font-medium">تم استيراد {importResult.success} جهة اتصال بنجاح</p>
                </div>
              )}
              {importResult.failed > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                  <p className="text-red-800 font-medium">فشل استيراد {importResult.failed} صف (يُشترط الاسم)</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <button onClick={handleClose} className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition">إغلاق</button>
          {rows.length > 0 && !importResult && (
            <button onClick={handleImport} disabled={isImporting} className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50">
              {isImporting ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />جاري الاستيراد…</>) : (<><Upload size={16} />استيراد {rows.length} جهة اتصال</>)}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
