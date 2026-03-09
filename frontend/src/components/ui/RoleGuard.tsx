"use client";

import { useTranslations } from "next-intl";
import { useRequireRole } from "@/lib/use-require-role";
import { ShieldAlert } from "lucide-react";

export function RoleGuard({
  roles,
  children,
}: {
  roles: string[];
  children: React.ReactNode;
}) {
  const tc = useTranslations("common");
  const { hasAccess } = useRequireRole(...roles);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-stone-500">
        <ShieldAlert size={40} className="text-red-400" />
        <p className="text-lg font-medium">{tc("accessDenied")}</p>
        <p className="text-sm">{tc("noPermission")}</p>
      </div>
    );
  }

  return <>{children}</>;
}
