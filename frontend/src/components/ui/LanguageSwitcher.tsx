"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Languages } from "lucide-react";

export function LanguageSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <button
      onClick={switchLocale}
      className="flex items-center gap-2 text-sm text-stone-400 hover:text-white w-full px-1 transition-colors"
      title={locale === "en" ? "العربية" : "English"}
      aria-label={locale === "en" ? "Switch to Arabic" : "التبديل إلى الإنجليزية"}
    >
      <Languages size={16} className="flex-shrink-0" />
      {!collapsed && (
        <span>{locale === "en" ? "العربية" : "English"}</span>
      )}
    </button>
  );
}
