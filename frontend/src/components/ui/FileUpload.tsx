"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

interface FileUploadProps {
  entityType: string;
  entityId: string;
  onUploadComplete?: () => void;
}

export function FileUpload({ entityType, entityId, onUploadComplete }: FileUploadProps) {
  const tc = useTranslations("common");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const handleUpload = async (file: File) => {
    if (!token) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("entity_type", entityType);
      formData.append("entity_id", entityId);
      formData.append("name", file.name);

      const res = await fetch(`${API_BASE}/documents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      toast.success(tc("uploadDocument"));
      onUploadComplete?.();
    } catch {
      toast.error("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        aria-label={tc("uploadDocument")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
        }}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="flex items-center gap-2 rounded-md border border-dashed border-stone-300 px-4 py-2 text-sm hover:border-stone-400"
      >
        <Upload className="h-4 w-4" />
        {isUploading ? tc("uploading") : tc("uploadDocument")}
      </button>
    </div>
  );
}
