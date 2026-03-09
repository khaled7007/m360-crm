"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { FileText, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface Document {
  id: string;
  name: string;
  file_size: number;
  created_at: string;
}

interface DocumentListProps {
  entityType: string;
  entityId: string;
  refreshKey?: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({ entityType, entityId, refreshKey }: DocumentListProps) {
  const tc = useTranslations("common");
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/v1/documents?entity_type=${encodeURIComponent(entityType)}&entity_id=${encodeURIComponent(entityId)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Failed to fetch documents");
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : data.data ?? []);
    } catch {
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, token]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments, refreshKey]);

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      const res = await fetch(`/api/v1/documents/${docId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      toast.success(tc("documentDeleted"));
      fetchDocuments();
    } catch {
      toast.error(tc("deleteDocumentError"));
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 text-sm text-stone-500">{tc("loadingDocuments")}</div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="py-4 text-sm text-stone-500">{tc("noDocuments")}</div>
    );
  }

  return (
    <ul className="divide-y divide-stone-200">
      {documents.map((doc) => (
        <li key={doc.id} className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-5 w-5 shrink-0 text-teal-600" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-stone-900 truncate">{doc.name}</p>
              <p className="text-xs text-stone-500">
                {formatFileSize(doc.file_size)} &middot;{" "}
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <a
              href={`/api/v1/documents/${doc.id}/download`}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-600 hover:text-teal-600 transition"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </a>
            <button
              onClick={() => handleDelete(doc.id)}
              className="p-1.5 rounded hover:bg-stone-100 text-stone-600 hover:text-red-600 transition"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
