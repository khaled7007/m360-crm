"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "@/lib/schemas";

export default function LoginPage() {
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations("auth");
  const locale = useLocale();
  const { login } = useAuth();
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError("");
    setLoading(true);

    try {
      await login(data.email, data.password);
      router.push(`/${locale}/dashboard`);
    } catch {
      setServerError(t("invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand Panel */}
      <div className="hidden lg:flex lg:w-[60%] relative overflow-hidden bg-gradient-to-br from-teal-600 via-teal-700 to-stone-900">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">ClientsCycle</h1>
            <p className="text-teal-200 mt-1 text-lg">{t("smeLendingCrm")}</p>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                {t("tagline")}
              </h2>
              <p className="mt-4 text-teal-100 text-lg max-w-md leading-relaxed">
                {t("description")}
              </p>
            </div>

            <div className="flex gap-8">
              <div className="border-l-2 border-teal-400/40 pl-4">
                <p className="text-2xl font-bold text-white">7</p>
                <p className="text-sm text-teal-200">{t("statsUserRoles")}</p>
              </div>
              <div className="border-l-2 border-teal-400/40 pl-4">
                <p className="text-2xl font-bold text-white">5</p>
                <p className="text-sm text-teal-200">{t("statsSaudiIntegrations")}</p>
              </div>
              <div className="border-l-2 border-teal-400/40 pl-4">
                <p className="text-2xl font-bold text-white">9</p>
                <p className="text-sm text-teal-200">{t("statsWorkflowStages")}</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-teal-300/60">{t("copyright")}</p>
        </div>
      </div>

      {/* Form Panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm animate-fade-in">
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight">ClientsCycle</h1>
            <p className="text-stone-500 text-sm">{t("smeLendingCrm")}</p>
          </div>

          <h2 className="text-2xl font-bold text-stone-900">{t("welcomeBack")}</h2>
          <p className="text-stone-500 mt-1 mb-8">{t("signInToAccount")}</p>

          {serverError && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-100" role="alert">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1.5">
                {t("email")}
              </label>
              <input
                id="email"
                type="email"
                {...register("email")}
                className={`w-full px-4 py-3 border rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow ${errors.email ? "border-red-400" : "border-stone-300"}`}
                placeholder="admin@m360.sa"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1.5">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                {...register("password")}
                className={`w-full px-4 py-3 border rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-shadow ${errors.password ? "border-red-400" : "border-stone-300"}`}
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 font-semibold text-sm transition-colors press-scale flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("signingIn")}
                </>
              ) : (
                t("loginButton")
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
