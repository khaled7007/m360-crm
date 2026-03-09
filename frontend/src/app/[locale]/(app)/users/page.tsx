"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { useApiList, useApiMutation } from "@/lib/use-api";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { RoleGuard } from "@/components/ui/RoleGuard";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole =
  | "admin"
  | "manager"
  | "loan_officer"
  | "credit_analyst"
  | "compliance_officer"
  | "collections_officer"
  | "data_entry";

interface AppUser extends Record<string, unknown> {
  id: string;
  email: string;
  name_en: string;
  name_ar: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

interface CreateUserInput {
  email: string;
  password: string;
  name_en: string;
  name_ar: string;
  role: UserRole;
}

// ROLES moved inside component to use translations

const DEFAULT_FORM: CreateUserInput = {
  email: "",
  password: "",
  name_en: "",
  name_ar: "",
  role: "loan_officer",
};

// ─── Role badge colours (extends StatusBadge palette via inline fallbacks) ────

const roleBadgeColor: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-700",
  manager: "bg-purple-100 text-purple-700",
  loan_officer: "bg-teal-100 text-teal-700",
  credit_analyst: "bg-cyan-100 text-cyan-700",
  compliance_officer: "bg-amber-100 text-amber-700",
  collections_officer: "bg-orange-100 text-orange-700",
  data_entry: "bg-stone-100 text-stone-700",
};

function RoleBadge({ role }: { role: UserRole }) {
  const color = roleBadgeColor[role] ?? "bg-stone-100 text-stone-700";
  const label = role.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${color}`}
    >
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const t = useTranslations("users");
  const tc = useTranslations("common");

  const ROLES: { value: UserRole; label: string }[] = [
    { value: "admin", label: t("roleLabels.admin") },
    { value: "manager", label: t("roleLabels.manager") },
    { value: "loan_officer", label: t("roleLabels.loan_officer") },
    { value: "credit_analyst", label: t("roleLabels.credit_analyst") },
    { value: "compliance_officer", label: t("roleLabels.compliance_officer") },
    { value: "collections_officer", label: t("roleLabels.collections_officer") },
    { value: "data_entry", label: t("roleLabels.data_entry") },
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState({ limit: 20, offset: 0 });
  const [searchQuery, setSearchQuery] = useState("");
  const [formData, setFormData] = useState<CreateUserInput>(DEFAULT_FORM);

  const { data: users, pagination, isLoading, error: usersError, refetch } = useApiList<AppUser>("/auth/users", { ...page, search: searchQuery || undefined });
  const { mutate: createUser, isSubmitting } = useApiMutation<CreateUserInput, AppUser>(
    "/auth/users",
    "POST"
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error(t("emailRequired"));
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error(t("passwordMinLength"));
      return;
    }
    if (!formData.name_en.trim()) {
      toast.error(t("nameEnRequired"));
      return;
    }
    if (!formData.name_ar.trim()) {
      toast.error(t("nameArRequired"));
      return;
    }

    try {
      await createUser(formData);
      toast.success(t("createSuccess"));
      setIsModalOpen(false);
      setFormData(DEFAULT_FORM);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : t("createError")
      );
    }
  };

  const columns: Column<AppUser>[] = [
    {
      key: "name_en",
      header: tc("name"),
      render: (item) => (
        <div>
          <p className="font-medium text-stone-900">{item.name_en}</p>
          <p className="text-xs text-stone-400" dir="rtl">{item.name_ar}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: tc("email"),
      render: (item) => (
        <span className="text-sm text-stone-700">{item.email}</span>
      ),
    },
    {
      key: "role",
      header: t("role"),
      render: (item) => <RoleBadge role={item.role} />,
    },
    {
      key: "is_active",
      header: tc("status"),
      render: (item) => (
        <StatusBadge status={item.is_active ? "active" : "closed"} />
      ),
    },
    {
      key: "created_at",
      header: tc("date"),
      render: (item) => (
        <span className="text-sm text-stone-500">
          {new Date(item.created_at).toLocaleDateString("en-SA", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <RoleGuard roles={["admin"]}>
    <div>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            <Plus size={20} />
            {t("newUser")}
          </button>
        }
      />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      )}
      {usersError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-600">{t("loadError")}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm text-teal-600 hover:underline">{tc("retry")}</button>
        </div>
      )}
      {!isLoading && !usersError && users.length === 0 && (
        <div className="py-12 text-center text-stone-500">
          <p>{t("noUsers")}</p>
        </div>
      )}
      {!isLoading && !usersError && users.length > 0 && (
        <DataTable<AppUser>
          columns={columns}
          data={users}
          isLoading={isLoading}
          emptyMessage={t("noUsers")}
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

      <Modal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setFormData(DEFAULT_FORM);
        }}
        title={t("newUser")}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* English name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("fullNameEn")} *
              </label>
              <input
                type="text"
                name="name_en"
                value={formData.name_en}
                onChange={handleInputChange}
                placeholder={t("nameEnPlaceholder")}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            {/* Arabic name */}
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">
                {t("fullNameAr")} *
              </label>
              <input
                type="text"
                name="name_ar"
                value={formData.name_ar}
                onChange={handleInputChange}
                placeholder={t("nameArPlaceholder")}
                dir="rtl"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-right"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("email")} *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t("emailPlaceholder")}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("password")} *
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t("passwordPlaceholder")}
              autoComplete="new-password"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              {t("roleName")} *
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              required
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setFormData(DEFAULT_FORM);
              }}
              className="flex-1 px-4 py-2 text-stone-700 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
            >
              {tc("cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? tc("creating") : t("newUser")}
            </button>
          </div>
        </form>
      </Modal>
    </div>
    </RoleGuard>
  );
}
