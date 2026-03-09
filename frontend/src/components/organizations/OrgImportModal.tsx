"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, X, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

// Column aliases: Excel header → field key
const COLUMN_MAP: Record<string, string> = {
  // English
  "organization name": "name_en",
  "name en": "name_en",
  "name_en": "name_en",
  "arabic name": "name_ar",
  "name ar": "name_ar",
  "name_ar": "name_ar",
  "cr number": "cr_number",
  "cr_number": "cr_number",
  "commercial registration": "cr_number",
  "vat number": "vat_number",
  "vat_number": "vat_number",
  "tax id": "vat_number",
  "industry": "industry",
  "sector": "industry",
  "city": "city",
  "address": "address",
  "phone": "phone",
  "mobile": "phone",
  "email": "email",
  "website": "website",
  "annual revenue": "annual_revenue",
  "annual_revenue": "annual_revenue",
  "revenue": "annual_revenue",
  "employee count": "employee_count",
  "employee_count": "employee_count",
  "employees": "employee_count",
  // Arabic
  "اسم المنظمة": "name_en",
  "اسم المنظمة بالإنجليزية": "name_en",
  "اسم المنظمة بالعربية": "name_ar",
  "اسم المنظمة بالعربي": "name_ar",
  "الاسم بالعربي": "name_ar",
  "رقم السجل التجاري": "cr_number",
  "رقم السجل": "cr_number",
  "السجل التجاري": "cr_number",
  "الرقم الضريبي": "vat_number",
  "رقم ضريبة القيمة المضافة": "vat_number",
  "القطاع": "industry",
  "الصناعة": "industry",
  "المدينة": "city",
  "العنوان": "address",
  "الهاتف": "phone",
  "الجوال": "phone",
  "البريد الإلكتروني": "email",
  "البريد": "email",
  "الموقع الإلكتروني": "website",
  "الموقع": "website",
  "الإيرادات السنوية": "annual_revenue",
  "الإيرادات": "annual_revenue",
  "عدد الموظفين": "employee_count",
  "الموظفون": "employee_count",
};

type OrgRow = Record<string, string | number>;

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function OrgImportModal({ open, onClose, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [rows, setRows] = useState<OrgRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);

  const reset = () => {
    setRows([]);
    setHeaders([]);
    setFileName("");
    setImportResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onClose();
  };

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

      const mapped: OrgRow[] = dataRows.map((row: string[]) => {
        const obj: OrgRow = {};
        rawHeaders.forEach((h, i) => {
          const key = COLUMN_MAP[h.toLowerCase()] || COLUMN_MAP[h] || h;
          const val = row[i];
          if (val !== undefined && val !== null && val !== "") {
            obj[key] = typeof val === "number" ? val : String(val).trim();
          }
        });
        return obj;
      });

      setHeaders(rawHeaders);
      setRows(mapped);
      setFileName(file.name);
      setImportResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFile = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      toast.error("يرجى رفع ملف Excel أو CSV");
      return;
    }
    parseFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    const token = localStorage.getItem("m360_token") || "";
    setIsImporting(true);
    let success = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        const payload = {
          name_en: row.name_en || row["اسم المنظمة"] || "",
          name_ar: row.name_ar || row["اسم المنظمة بالعربي"] || row.name_en || "",
          cr_number: String(row.cr_number || ""),
          vat_number: String(row.vat_number || ""),
          industry: String(row.industry || ""),
          city: String(row.city || ""),
          address: String(row.address || ""),
          phone: String(row.phone || ""),
          email: String(row.email || ""),
          website: String(row.website || ""),
          annual_revenue: Number(row.annual_revenue) || 0,
          employee_count: Number(row.employee_count) || 0,
        };
        await api("/organizations", { method: "POST", body: payload, token });
        success++;
      } catch {
        failed++;
      }
    }

    setIsImporting(false);
    setImportResult({ success, failed });
    if (success > 0) {
      toast.success(`تم استيراد ${success} منظمة بنجاح`);
      onImported();
    }
    if (failed > 0) {
      toast.error(`فشل استيراد ${failed} صف`);
    }
  };

  if (!open) return null;

  // Preview columns (mapped field names, show first 6 known + unknown)
  const DISPLAY_FIELDS = ["name_en", "name_ar", "cr_number", "industry", "city", "phone", "email"];
  const previewCols = DISPLAY_FIELDS.filter((f) => rows.some((r) => r[f]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={22} className="text-teal-600" />
            <h2 className="text-lg font-semibold text-stone-800">استيراد المنظمات من Excel</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded hover:bg-stone-100 transition">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Drop zone */}
          {!rows.length && (
            <div
              ref={dropRef}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition ${
                isDragging ? "border-teal-500 bg-teal-50" : "border-stone-300 hover:border-teal-400 hover:bg-stone-50"
              }`}
            >
              <Upload size={36} className="mx-auto mb-3 text-stone-400" />
              <p className="font-medium text-stone-700 mb-1">اسحب وأفلت ملف Excel هنا</p>
              <p className="text-sm text-stone-500">أو اضغط لاختيار ملف (.xlsx, .xls, .csv)</p>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleInputChange}
              />
            </div>
          )}

          {/* Template hint */}
          {!rows.length && (
            <div className="rounded-lg bg-teal-50 border border-teal-200 p-4 text-sm text-teal-800">
              <p className="font-medium mb-1">الأعمدة المدعومة:</p>
              <p className="text-teal-700">
                اسم المنظمة، الاسم بالعربي، رقم السجل التجاري، الصناعة، المدينة، العنوان، الهاتف، البريد الإلكتروني، الموقع، الإيرادات السنوية، عدد الموظفين
              </p>
              <p className="mt-1 text-teal-600">كذلك تدعم الأسماء الإنجليزية: name_en, cr_number, industry, city, phone, email, …</p>
            </div>
          )}

          {/* File loaded — preview */}
          {rows.length > 0 && !importResult && (
            <>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <FileSpreadsheet size={16} className="text-teal-600" />
                <span className="font-medium">{fileName}</span>
                <span className="text-stone-400">—</span>
                <span>{rows.length} صف</span>
                <button onClick={reset} className="mr-auto text-xs text-red-500 hover:underline">
                  إزالة الملف
                </button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-stone-200">
                <table className="min-w-full text-sm divide-y divide-stone-200">
                  <thead className="bg-stone-50">
                    <tr>
                      {previewCols.map((col) => (
                        <th key={col} className="px-3 py-2 text-right font-medium text-stone-600 whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 bg-white">
                    {rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-stone-50">
                        {previewCols.map((col) => (
                          <td key={col} className="px-3 py-2 text-stone-700 whitespace-nowrap max-w-[180px] truncate">
                            {String(row[col] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 10 && (
                  <p className="text-xs text-center text-stone-400 py-2">
                    يُعرض أول 10 صفوف من أصل {rows.length}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Result */}
          {importResult && (
            <div className="space-y-3">
              {importResult.success > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                  <CheckCircle2 size={20} className="text-green-600 shrink-0" />
                  <p className="text-green-800 font-medium">تم استيراد {importResult.success} منظمة بنجاح</p>
                </div>
              )}
              {importResult.failed > 0 && (
                <div className="flex items-center gap-3 rounded-lg bg-red-50 border border-red-200 p-4">
                  <AlertCircle size={20} className="text-red-600 shrink-0" />
                  <p className="text-red-800 font-medium">فشل استيراد {importResult.failed} صف</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-stone-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition"
          >
            إغلاق
          </button>
          {rows.length > 0 && !importResult && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  جاري الاستيراد…
                </>
              ) : (
                <>
                  <Upload size={16} />
                  استيراد {rows.length} منظمة
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
