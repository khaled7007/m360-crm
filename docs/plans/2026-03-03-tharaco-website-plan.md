# Tharaco Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a bilingual (EN/AR) Apple-style marketing website for Tharaco (ذرى) crowdfunding platform using Next.js 15 + Tailwind CSS + Framer Motion.

**Architecture:** Next.js App Router with `[locale]` dynamic segment for i18n routing via next-intl. Tailwind CSS v4 for styling with logical properties for RTL. Framer Motion for Apple-style scroll animations. All text in JSON translation files.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, next-intl, Framer Motion, Vercel deployment

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`
- Create: `src/app/globals.css`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`

**Step 1: Initialize Next.js project**

Run from the M360 project root:
```bash
npx create-next-app@latest tharaco-website --typescript --eslint --tailwind --app --src-dir --no-import-alias
cd tharaco-website
```

Expected: New `tharaco-website/` directory with Next.js boilerplate.

**Step 2: Install dependencies**

```bash
npm install next-intl framer-motion
npm install @tailwindcss/postcss
```

Expected: packages added to `package.json`.

**Step 3: Configure next-intl plugin in `next.config.ts`**

```typescript
import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
```

**Step 4: Create i18n routing config at `src/i18n/routing.ts`**

```typescript
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
});
```

**Step 5: Create i18n request config at `src/i18n/request.ts`**

```typescript
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

**Step 6: Create middleware at `src/middleware.ts`**

```typescript
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

**Step 7: Create translation files**

Create `messages/ar.json`:
```json
{
  "metadata": {
    "title": "ذرى للتمويل الجماعي بالدين",
    "description": "منصة تمويل جماعي بالدين متوافقة مع الشريعة الإسلامية ومرخصة من البنك المركزي السعودي"
  },
  "nav": {
    "home": "الرئيسية",
    "about": "عن ذرى",
    "programs": "البرامج",
    "faq": "الأسئلة الشائعة",
    "contact": "تواصل معنا",
    "login": "تسجيل الدخول",
    "register": "سجل الآن"
  },
  "hero": {
    "title": "حقق عوائد تصل إلى",
    "highlight": "39%",
    "titleEnd": "مع ذرى",
    "subtitle": "انضم إلى ذرى واستثمر في فرص تمويل جماعي بالدين متوافقة مع الشريعة الإسلامية، ومرخصة من البنك المركزي السعودي.",
    "cta": "ابدأ الاستثمار"
  },
  "stats": {
    "heading": "أرقام عملياتنا التمويلية",
    "avgReturns": "متوسط عوائد الأرباح السنوية",
    "opportunities": "فرصة استثمارية",
    "totalFinancing": "إجمالي مبالغ التمويل",
    "collectionRate": "نسبة المبالغ المحصلة"
  },
  "howItWorks": {
    "heading": "كيف تعمل المنصة",
    "subtitle": "اكتشف خيارات التمويل الجماعي بالدين المتوافقة مع الشريعة الإسلامية للمشاريع العقارية والفواتير.",
    "step1Title": "أنشئ حسابك",
    "step1Desc": "أنشئ حسابك خلال دقائق.",
    "step2Title": "استعرض الفرص",
    "step2Desc": "استكشف الفرص الاستثمارية المتاحة.",
    "step3Title": "استثمر",
    "step3Desc": "اختر الفرصة المناسبة وابدأ بتحقيق العوائد."
  },
  "programs": {
    "heading": "برامجنا التمويلية",
    "realEstate": "برامج التطوير العقاري",
    "realEstateDesc": "اكتشف خيارات التمويل الجماعي المتوافقة مع الشريعة الإسلامية لمشاريع العقارات في المملكة العربية السعودية.",
    "invoiceFinancing": "برامج تمويل فواتير المقاولين",
    "invoiceDesc": "اكتشف خيارات التمويل المتوافقة مع الشريعة الإسلامية للمقاولين وفواتير الأعمال.",
    "growth": "برنامج النمو",
    "growthAmount": "حتى 20 مليون ريال",
    "growthDesc": "برنامج يهدف لدعم شركات التطوير العقاري المتوسطة في تنفيذ مشاريعها التي تتطلب تمويلاً متوسط الحجم.",
    "leadership": "برنامج الريادة",
    "leadershipAmount": "حتى 10 مليون ريال",
    "leadershipDesc": "مصمم خصيصًا لدعم شركات التطوير العقاري ومساعدتها في المشاريع العقارية.",
    "expansion": "برنامج التوسع",
    "expansionAmount": "أكثر من 20 مليون ريال",
    "expansionDesc": "مخصص لتمويل مشاريع التطوير العقاري الكبرى التي تتطلب رؤوس أموال ضخمة.",
    "applyNow": "قدّم طلب تمويل",
    "learnMore": "اعرف المزيد"
  },
  "partners": {
    "heading": "منظومة ذرى",
    "subtitle": "الشراكة مع مزودي خدمات موثوقين لتقديم حلول تمويل جماعي سلسة"
  },
  "cta": {
    "heading": "جاهز للاستثمار؟",
    "subtitle": "سجل خلال دقائق وابدأ الاستثمار من",
    "amount": "1,000",
    "currency": "ريال",
    "button": "ابدأ الاستثمار"
  },
  "about": {
    "pageTitle": "عن ذرى",
    "partnerTitle": "شريكك في التطوير العقاري",
    "heading": "عن ذرى للتمويل الجماعي بالدين",
    "description": "شركة تقنية مالية متخصصة في تمويل مشاريع التطوير العقاري، وتربط المستثمرين الأفراد والمؤسسات بفرص استثمارية في قطاع التطوير العقاري بصيغة المرابحة، وتهدف العملية إلى توفير السيولة لمشاريع التطوير العقاري والفواتير وعائد استثماري للممولين.",
    "visionTitle": "الرؤية",
    "visionText": "أن تكون شركة ذرى للتمويل الجماعي بالدين المحرك الرئيسي في دعم وتطوير القطاع العقاري، عبر توفير حلول تمويلية بالدين تخلق قيمة حقيقية للمستثمرين وتلبي احتياجات القطاع في المملكة العربية السعودية.",
    "whyThra": "لماذا ذرى؟",
    "reason1": "تمكين الممولين العقاريين للوصول إلى أكبر شريحة من المستثمرين",
    "reason2": "تمكين المستثمرين من تنويع محافظهم الاستثمارية",
    "reason3": "منتجات تمويلية متوافقة مع الشريعة الإسلامية",
    "reason4": "فرص استثمارية نوعية في مجال التطوير العقاري",
    "boardTitle": "أعضاء مجلس الإدارة",
    "teamTitle": "الكفاءات",
    "teamSubtitle": "تعتمد ذرى على كفاءات متخصصة تعمل وفق أعلى معايير الحوكمة والاحترافية",
    "license": "مرخصة من البنك المركزي السعودي برقم الترخيص (84/أ ش/202401)"
  },
  "faq": {
    "pageTitle": "الأسئلة الشائعة",
    "tabGeneral": "عام",
    "tabInvestors": "المستثمرون",
    "tabBorrowers": "المقترضون",
    "searchPlaceholder": "ابحث في الأسئلة...",
    "q1": "ما هي شركة ذرى للتمويل الجماعي؟",
    "a1": "ذرى للتمويل الجماعي هي شركة تقنية مالية متخصصة في تمويل مشاريع التطوير العقاري، تربط بين المستثمرين الأفراد والمؤسسات بفرص استثمارية في قطاع التطوير العقاري بصيغة المرابحة.",
    "q2": "هل ذرى للتمويل الجماعي مرخصة؟",
    "a2": "نعم، ذرى للتمويل الجماعي هي شركة مساهمة مغلقة مسجلة لدى وزارة التجارة بالسجل التجاري رقم 1010797355 ومرخصة من البنك المركزي السعودي (ساما) برقم الترخيص (84/أ ش/202401).",
    "q3": "هل عمليات المنصة متوافقة مع أحكام الشريعة الإسلامية؟",
    "a3": "نعم، جميع العمليات الاستثمارية والتمويلية متوافقة مع أحكام الشريعة الإسلامية.",
    "q4": "ما هي قنوات التواصل للاستفسارات أو الشكاوى؟",
    "a4": "يمكنكم التواصل معنا عبر الرقم الموحد: 8001240393، البريد الإلكتروني: care@tharaco.sa، أو عن طريق صفحة اتصل بنا.",
    "q5": "ما هو التمويل الجماعي بالدين؟",
    "a5": "التمويل الجماعي بالدين هو عملية ربط الممولين الأفراد أو الشركات بمشاريع التطوير العقاري لتمويل مشاريعهم بعائد مجزٍ للممول."
  },
  "contact": {
    "pageTitle": "تواصل معنا",
    "heading": "نسعد بتواصلك",
    "subtitle": "لديك سؤال أو تحتاج مساعدة؟ فريقنا جاهز لخدمتك.",
    "nameLabel": "الاسم الكامل",
    "emailLabel": "البريد الإلكتروني",
    "phoneLabel": "رقم الجوال",
    "messageLabel": "الرسالة",
    "submitButton": "إرسال",
    "phone": "8001240393",
    "email": "care@tharaco.sa",
    "phoneTitle": "الرقم الموحد",
    "emailTitle": "البريد الإلكتروني"
  },
  "footer": {
    "description": "ذرى للتمويل الجماعي بالدين شركة تقنية مالية متخصصة في تمويل مشاريع التطوير العقاري.",
    "quickLinks": "روابط سريعة",
    "otherPages": "صفحات أخرى",
    "terms": "الشروط والأحكام",
    "privacy": "سياسة الخصوصية",
    "risks": "المخاطر",
    "license": "خاضعة لرقابة وإشراف البنك المركزي السعودي ومرخصة بترخيص رقم (84/أ ش/202401)",
    "copyright": "© 2025 ذرى للتمويل الجماعي. جميع الحقوق محفوظة."
  }
}
```

Create `messages/en.json`:
```json
{
  "metadata": {
    "title": "Thra Crowdfunding",
    "description": "Sharia-compliant debt-based crowdfunding platform licensed by the Saudi Central Bank"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "programs": "Programs",
    "faq": "FAQ",
    "contact": "Contact",
    "login": "Sign In",
    "register": "Register"
  },
  "hero": {
    "title": "Achieve returns up to",
    "highlight": "39%",
    "titleEnd": "with Thra",
    "subtitle": "Join Thra and invest in Sharia-compliant debt-based crowdfunding opportunities, licensed by the Saudi Central Bank.",
    "cta": "Start Investing"
  },
  "stats": {
    "heading": "Our Financing Figures",
    "avgReturns": "Average Annual Returns",
    "opportunities": "Investment Opportunities",
    "totalFinancing": "Total Financing Amount",
    "collectionRate": "Collection Rate"
  },
  "howItWorks": {
    "heading": "How the Platform Works",
    "subtitle": "Discover Sharia-compliant debt-based crowdfunding options for real estate projects and invoices.",
    "step1Title": "Create Your Account",
    "step1Desc": "Sign up in just a few minutes.",
    "step2Title": "Browse Opportunities",
    "step2Desc": "Explore available investment opportunities.",
    "step3Title": "Invest",
    "step3Desc": "Choose the right opportunity and start earning returns."
  },
  "programs": {
    "heading": "Our Financing Programs",
    "realEstate": "Real Estate Development Programs",
    "realEstateDesc": "Discover Sharia-compliant crowdfunding options for real estate projects in Saudi Arabia.",
    "invoiceFinancing": "Contractor Invoice Financing",
    "invoiceDesc": "Discover Sharia-compliant financing options for contractors and business invoices.",
    "growth": "Growth Program",
    "growthAmount": "Up to SAR 20 Million",
    "growthDesc": "Supporting medium-sized real estate development companies in executing projects that require mid-range financing.",
    "leadership": "Leadership Program",
    "leadershipAmount": "Up to SAR 10 Million",
    "leadershipDesc": "Designed specifically to support real estate development companies in their projects.",
    "expansion": "Expansion Program",
    "expansionAmount": "Over SAR 20 Million",
    "expansionDesc": "Dedicated to financing large-scale real estate development projects requiring substantial capital.",
    "applyNow": "Apply for Financing",
    "learnMore": "Learn More"
  },
  "partners": {
    "heading": "Our Ecosystem",
    "subtitle": "Partnering with trusted service providers to deliver seamless crowdfunding solutions"
  },
  "cta": {
    "heading": "Ready to Invest?",
    "subtitle": "Register in minutes and start investing from",
    "amount": "1,000",
    "currency": "SAR",
    "button": "Start Investing"
  },
  "about": {
    "pageTitle": "About Thra",
    "partnerTitle": "Your Partner in Real Estate Development",
    "heading": "About Thra Crowdfunding",
    "description": "A fintech company specializing in real estate development financing, connecting individual and institutional investors with investment opportunities in the real estate sector through Murabaha, aiming to provide liquidity for real estate and invoice projects with investment returns for funders.",
    "visionTitle": "Our Vision",
    "visionText": "To be the primary driver in supporting and developing the real estate sector, by providing debt-based financing solutions that create real value for investors and meet the needs of the sector in Saudi Arabia.",
    "whyThra": "Why Thra?",
    "reason1": "Enabling real estate developers to reach the largest pool of investors",
    "reason2": "Empowering investors to diversify their portfolios",
    "reason3": "Sharia-compliant financing products",
    "reason4": "Quality investment opportunities in real estate development",
    "boardTitle": "Board of Directors",
    "teamTitle": "Our Team",
    "teamSubtitle": "Thra relies on specialized professionals working with the highest standards of governance and professionalism",
    "license": "Licensed by the Saudi Central Bank, License No. (84/A SH/202401)"
  },
  "faq": {
    "pageTitle": "Frequently Asked Questions",
    "tabGeneral": "General",
    "tabInvestors": "Investors",
    "tabBorrowers": "Borrowers",
    "searchPlaceholder": "Search questions...",
    "q1": "What is Thra Crowdfunding?",
    "a1": "Thra Crowdfunding is a fintech company specializing in real estate development financing, connecting individual and institutional investors with opportunities in the real estate sector through Murabaha.",
    "q2": "Is Thra Crowdfunding licensed?",
    "a2": "Yes, Thra Crowdfunding is a closed joint-stock company registered with the Ministry of Commerce under CR 1010797355 and licensed by the Saudi Central Bank (SAMA) under License No. (84/A SH/202401).",
    "q3": "Are the platform operations Sharia-compliant?",
    "a3": "Yes, all investment and financing operations are fully compliant with Islamic Sharia principles.",
    "q4": "What are the contact channels for inquiries or complaints?",
    "a4": "You can contact us via our unified number: 8001240393, email: care@tharaco.sa, or through our Contact Us page.",
    "q5": "What is debt-based crowdfunding?",
    "a5": "Debt-based crowdfunding connects individual or corporate funders with real estate development projects to finance them with attractive returns for the funder."
  },
  "contact": {
    "pageTitle": "Contact Us",
    "heading": "Get in Touch",
    "subtitle": "Have a question or need help? Our team is ready to assist you.",
    "nameLabel": "Full Name",
    "emailLabel": "Email Address",
    "phoneLabel": "Phone Number",
    "messageLabel": "Message",
    "submitButton": "Send Message",
    "phone": "8001240393",
    "email": "care@tharaco.sa",
    "phoneTitle": "Unified Number",
    "emailTitle": "Email"
  },
  "footer": {
    "description": "Thra is a fintech company specializing in debt-based crowdfunding for real estate development.",
    "quickLinks": "Quick Links",
    "otherPages": "Other Pages",
    "terms": "Terms & Conditions",
    "privacy": "Privacy Policy",
    "risks": "Risk Disclosure",
    "license": "Regulated and supervised by the Saudi Central Bank, License No. (84/A SH/202401)",
    "copyright": "© 2025 Thra Crowdfunding. All rights reserved."
  }
}
```

**Step 8: Set up Tailwind globals at `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-brand: #0D9488;
  --color-brand-light: #CCFBF1;
  --color-brand-dark: #0F766E;
  --color-apple-text: #1D1D1F;
  --color-apple-gray: #86868B;
  --color-apple-bg: #F5F5F7;
  --color-apple-border: #E5E5E7;

  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-arabic: "IBM Plex Arabic", "Noto Sans Arabic", system-ui, sans-serif;
}
```

**Step 9: Restructure app directory for locale routing**

Delete `src/app/page.tsx` and `src/app/layout.tsx`. Create new structure:

Create `src/app/layout.tsx` (bare root):
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
```

Create `src/app/[locale]/layout.tsx`:
```tsx
import { NextIntlClientProvider, useMessages } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import "../globals.css";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const isRTL = locale === "ar";
  const fontClass = isRTL ? "font-arabic" : "font-sans";

  return (
    <html lang={locale} dir={isRTL ? "rtl" : "ltr"}>
      <body className={`${fontClass} bg-white text-apple-text antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Create `src/app/[locale]/page.tsx` (placeholder):
```tsx
export default function HomePage() {
  return <div>Home</div>;
}
```

**Step 10: Verify the dev server starts**

```bash
npm run dev
```

Expected: Server running at localhost:3000, redirects to `/ar` by default.

**Step 11: Commit**

```bash
git add .
git commit -m "feat: scaffold Next.js project with next-intl i18n and Tailwind CSS"
```

---

## Task 2: Shared Layout Components (Navbar + Footer)

**Files:**
- Create: `src/components/Navbar.tsx`
- Create: `src/components/Footer.tsx`
- Create: `src/components/LanguageSwitcher.tsx`
- Modify: `src/app/[locale]/layout.tsx`

**Step 1: Create LanguageSwitcher component**

Create `src/components/LanguageSwitcher.tsx`:
```tsx
"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLocale = () => {
    const newLocale = locale === "ar" ? "en" : "ar";
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <button
      onClick={switchLocale}
      className="rounded-full border border-apple-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-apple-bg"
    >
      {locale === "ar" ? "English" : "العربية"}
    </button>
  );
}
```

**Step 2: Create Navbar component**

Create `src/components/Navbar.tsx`:
```tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const links = [
    { href: `/${locale}`, label: t("home") },
    { href: `/${locale}/about`, label: t("about") },
    { href: `/${locale}/programs`, label: t("programs") },
    { href: `/${locale}/faq`, label: t("faq") },
    { href: `/${locale}/contact`, label: t("contact") },
  ];

  return (
    <nav
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-apple-border bg-white/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href={`/${locale}`} className="text-2xl font-bold text-brand">
          ذرى
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-apple-gray transition-colors hover:text-apple-text"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <a
            href="https://tharaco.sa/register"
            className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
          >
            {t("register")}
          </a>
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <div className="flex flex-col gap-1.5">
            <span className={`h-0.5 w-6 bg-apple-text transition-transform ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`h-0.5 w-6 bg-apple-text transition-opacity ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`h-0.5 w-6 bg-apple-text transition-transform ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-apple-border bg-white/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col gap-4 px-6 py-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-lg font-medium text-apple-text"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 pt-4">
              <LanguageSwitcher />
              <a
                href="https://tharaco.sa/register"
                className="rounded-full bg-brand px-5 py-2 text-sm font-medium text-white"
              >
                {t("register")}
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
```

**Step 3: Create Footer component**

Create `src/components/Footer.tsx`:
```tsx
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";

export default function Footer() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");
  const locale = useLocale();

  const quickLinks = [
    { href: `/${locale}`, label: nav("home") },
    { href: `/${locale}/about`, label: nav("about") },
    { href: `/${locale}/programs`, label: nav("programs") },
    { href: `/${locale}/faq`, label: nav("faq") },
    { href: `/${locale}/contact`, label: nav("contact") },
  ];

  const legalLinks = [
    { href: "#", label: t("terms") },
    { href: "#", label: t("privacy") },
    { href: "#", label: t("risks") },
  ];

  return (
    <footer className="border-t border-apple-border bg-apple-bg">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <p className="text-2xl font-bold text-brand">ذرى</p>
            <p className="mt-4 text-sm leading-relaxed text-apple-gray">
              {t("description")}
            </p>
            <p className="mt-4 text-xs text-apple-gray">{t("license")}</p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-4 text-sm font-semibold text-apple-text">
              {t("quickLinks")}
            </p>
            <ul className="flex flex-col gap-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-apple-gray transition-colors hover:text-apple-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="mb-4 text-sm font-semibold text-apple-text">
              {t("otherPages")}
            </p>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-apple-gray transition-colors hover:text-apple-text"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social + Copyright */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-apple-border pt-8 md:flex-row">
          <p className="text-xs text-apple-gray">{t("copyright")}</p>
          <div className="flex gap-4">
            <a href="https://x.com/thraco_sa" target="_blank" rel="noopener noreferrer" className="text-apple-gray transition-colors hover:text-apple-text">𝕏</a>
            <a href="https://www.instagram.com/thraco_sa" target="_blank" rel="noopener noreferrer" className="text-apple-gray transition-colors hover:text-apple-text">Instagram</a>
            <a href="https://www.linkedin.com/company/tharaco" target="_blank" rel="noopener noreferrer" className="text-apple-gray transition-colors hover:text-apple-text">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

**Step 4: Wire Navbar and Footer into locale layout**

Modify `src/app/[locale]/layout.tsx` to import and render `<Navbar />` above `{children}` and `<Footer />` below.

**Step 5: Verify both languages render correctly**

```bash
npm run dev
```

Visit `localhost:3000/ar` and `localhost:3000/en`. Confirm:
- Navbar shows Arabic text on `/ar`, English on `/en`
- Language switcher toggles between them
- RTL layout applies on Arabic, LTR on English
- Footer renders correctly in both languages

**Step 6: Commit**

```bash
git add .
git commit -m "feat: add Navbar, Footer, and LanguageSwitcher with i18n support"
```

---

## Task 3: Animation Utilities

**Files:**
- Create: `src/components/AnimateOnScroll.tsx`
- Create: `src/components/CountUp.tsx`

**Step 1: Create scroll animation wrapper**

Create `src/components/AnimateOnScroll.tsx`:
```tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimateOnScroll({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Step 2: Create count-up number component**

Create `src/components/CountUp.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

interface Props {
  end: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
}

export default function CountUp({ end, suffix = "", prefix = "", decimals = 0, duration = 2000 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(eased * end);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{value.toFixed(decimals)}{suffix}
    </span>
  );
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: add AnimateOnScroll and CountUp animation components"
```

---

## Task 4: Homepage — Hero + Stats Sections

**Files:**
- Create: `src/components/home/HeroSection.tsx`
- Create: `src/components/home/StatsSection.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Step 1: Create HeroSection**

Create `src/components/home/HeroSection.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

export default function HeroSection() {
  const t = useTranslations("hero");

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      {/* Subtle decorative shapes */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute end-[10%] top-[20%] h-72 w-72 rounded-full bg-brand-light/40 blur-3xl" />
        <div className="absolute bottom-[20%] start-[10%] h-96 w-96 rounded-full bg-brand-light/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl font-bold leading-tight tracking-tight text-apple-text md:text-7xl"
        >
          {t("title")}{" "}
          <span className="text-brand">{t("highlight")}</span>{" "}
          {t("titleEnd")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-apple-gray md:text-2xl"
        >
          {t("subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          className="mt-10"
        >
          <a
            href="https://tharaco.sa/register"
            className="inline-block rounded-full bg-brand px-8 py-4 text-lg font-medium text-white transition-all hover:bg-brand-dark hover:shadow-lg"
          >
            {t("cta")} →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
```

**Step 2: Create StatsSection**

Create `src/components/home/StatsSection.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import AnimateOnScroll from "../AnimateOnScroll";
import CountUp from "../CountUp";

export default function StatsSection() {
  const t = useTranslations("stats");

  const stats = [
    { end: 14.4, suffix: "%", decimals: 1, label: t("avgReturns") },
    { end: 97, suffix: "", decimals: 0, label: t("opportunities") },
    { end: 112, suffix: "M+", decimals: 0, label: t("totalFinancing"), prefix: "SAR " },
    { end: 100, suffix: "%", decimals: 0, label: t("collectionRate") },
  ];

  return (
    <section className="bg-apple-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateOnScroll>
          <h2 className="text-center text-3xl font-bold text-apple-text md:text-5xl">
            {t("heading")}
          </h2>
        </AnimateOnScroll>

        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, i) => (
            <AnimateOnScroll key={i} delay={i * 0.1}>
              <div className="text-center">
                <p className="text-4xl font-bold text-brand md:text-5xl">
                  <CountUp
                    end={stat.end}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    decimals={stat.decimals}
                  />
                </p>
                <p className="mt-2 text-sm text-apple-gray md:text-base">
                  {stat.label}
                </p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 3: Wire into homepage**

Modify `src/app/[locale]/page.tsx`:
```tsx
import HeroSection from "@/components/home/HeroSection";
import StatsSection from "@/components/home/StatsSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <StatsSection />
    </main>
  );
}
```

**Step 4: Verify both sections render in AR and EN**

```bash
npm run dev
```

Visit both `/ar` and `/en`. Confirm hero text, animation on load, stats count-up on scroll, and RTL layout.

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Hero and Stats homepage sections with animations"
```

---

## Task 5: Homepage — How It Works + Programs Preview

**Files:**
- Create: `src/components/home/HowItWorksSection.tsx`
- Create: `src/components/home/ProgramsPreview.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Step 1: Create HowItWorksSection**

Create `src/components/home/HowItWorksSection.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import AnimateOnScroll from "../AnimateOnScroll";

export default function HowItWorksSection() {
  const t = useTranslations("howItWorks");

  const steps = [
    { num: "01", title: t("step1Title"), desc: t("step1Desc") },
    { num: "02", title: t("step2Title"), desc: t("step2Desc") },
    { num: "03", title: t("step3Title"), desc: t("step3Desc") },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateOnScroll>
          <h2 className="text-center text-3xl font-bold text-apple-text md:text-5xl">
            {t("heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-apple-gray">
            {t("subtitle")}
          </p>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <AnimateOnScroll key={i} delay={i * 0.15}>
              <div className="rounded-2xl border border-apple-border p-8 text-center transition-shadow hover:shadow-lg">
                <span className="text-5xl font-bold text-brand/20">{step.num}</span>
                <h3 className="mt-4 text-xl font-semibold text-apple-text">
                  {step.title}
                </h3>
                <p className="mt-2 text-apple-gray">{step.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Create ProgramsPreview**

Create `src/components/home/ProgramsPreview.tsx`:
```tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import AnimateOnScroll from "../AnimateOnScroll";

export default function ProgramsPreview() {
  const t = useTranslations("programs");
  const locale = useLocale();

  const cards = [
    {
      title: t("realEstate"),
      desc: t("realEstateDesc"),
    },
    {
      title: t("invoiceFinancing"),
      desc: t("invoiceDesc"),
    },
  ];

  return (
    <section className="bg-apple-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateOnScroll>
          <h2 className="text-center text-3xl font-bold text-apple-text md:text-5xl">
            {t("heading")}
          </h2>
        </AnimateOnScroll>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {cards.map((card, i) => (
            <AnimateOnScroll key={i} delay={i * 0.15}>
              <Link
                href={`/${locale}/programs`}
                className="group block rounded-2xl border border-apple-border bg-white p-10 transition-all hover:shadow-xl"
              >
                <h3 className="text-2xl font-semibold text-apple-text">
                  {card.title}
                </h3>
                <p className="mt-4 text-apple-gray leading-relaxed">
                  {card.desc}
                </p>
                <span className="mt-6 inline-block text-brand font-medium transition-transform group-hover:translate-x-1">
                  {t("learnMore")} →
                </span>
              </Link>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 3: Wire into homepage**

Add `HowItWorksSection` and `ProgramsPreview` to `src/app/[locale]/page.tsx` after StatsSection.

**Step 4: Verify and commit**

```bash
npm run dev
git add .
git commit -m "feat: add How It Works and Programs Preview homepage sections"
```

---

## Task 6: Homepage — Partners + CTA Sections

**Files:**
- Create: `src/components/home/PartnersSection.tsx`
- Create: `src/components/home/CTASection.tsx`
- Modify: `src/app/[locale]/page.tsx`

**Step 1: Create PartnersSection**

Create `src/components/home/PartnersSection.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import AnimateOnScroll from "../AnimateOnScroll";

export default function PartnersSection() {
  const t = useTranslations("partners");

  const partners = [
    { name: "Arab National Bank", initials: "ANB" },
    { name: "Oracle Cloud", initials: "Oracle" },
    { name: "Alfayran Law Firm", initials: "Alfayran" },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateOnScroll>
          <h2 className="text-center text-3xl font-bold text-apple-text md:text-5xl">
            {t("heading")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-apple-gray">
            {t("subtitle")}
          </p>
        </AnimateOnScroll>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-12">
          {partners.map((partner, i) => (
            <AnimateOnScroll key={i} delay={i * 0.1}>
              <div className="flex h-20 w-44 items-center justify-center rounded-xl border border-apple-border px-6 text-lg font-semibold text-apple-gray transition-colors hover:text-apple-text">
                {partner.initials}
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Step 2: Create CTASection**

Create `src/components/home/CTASection.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import AnimateOnScroll from "../AnimateOnScroll";

export default function CTASection() {
  const t = useTranslations("cta");

  return (
    <section className="bg-apple-bg py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <AnimateOnScroll>
          <h2 className="text-3xl font-bold text-apple-text md:text-5xl">
            {t("heading")}
          </h2>
          <p className="mt-4 text-xl text-apple-gray">
            {t("subtitle")}{" "}
            <span className="font-bold text-brand">
              {t("currency")} {t("amount")}
            </span>
          </p>
          <div className="mt-10">
            <a
              href="https://tharaco.sa/register"
              className="inline-block rounded-full bg-brand px-8 py-4 text-lg font-medium text-white transition-all hover:bg-brand-dark hover:shadow-lg"
            >
              {t("button")} →
            </a>
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  );
}
```

**Step 3: Wire into homepage and verify**

Add `PartnersSection` and `CTASection` to `src/app/[locale]/page.tsx`.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add Partners and CTA homepage sections"
```

---

## Task 7: About Page

**Files:**
- Create: `src/app/[locale]/about/page.tsx`

**Step 1: Create About page**

Create `src/app/[locale]/about/page.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import AnimateOnScroll from "@/components/AnimateOnScroll";

const boardMembers = [
  { name: { ar: "عبدالإله الصعب", en: "Abdulilah Al-Saab" }, role: { ar: "رئيس مجلس الإدارة", en: "Chairman" } },
  { name: { ar: "عبدالسلام الماجد", en: "Abdulsalam Al-Majed" }, role: { ar: "نائب رئيس مجلس الإدارة", en: "Vice Chairman" } },
  { name: { ar: "خالد الماجد", en: "Khaled Al-Majed" }, role: { ar: "عضو مجلس إدارة", en: "Board Member" } },
  { name: { ar: "صادق الثواب", en: "Sadiq Al-Thawab" }, role: { ar: "عضو مجلس إدارة", en: "Board Member" } },
  { name: { ar: "عبدالعزيز المقيطيب", en: "Abdulaziz Al-Muqaitib" }, role: { ar: "عضو مجلس إدارة", en: "Board Member" } },
];

const teamMembers = [
  { name: { ar: "م. إبراهيم الزهيميل", en: "Eng. Ibrahim Al-Zuhaimil" }, role: { ar: "الرئيس التنفيذي", en: "CEO" } },
  { name: { ar: "عبد الكريم العبيد", en: "Abdulkarim Al-Obaid" }, role: { ar: "رئيس الالتزام", en: "Head of Compliance" } },
  { name: { ar: "مشاعل الحسيني", en: "Mashael Al-Husseini" }, role: { ar: "مدير العمليات", en: "Operations Manager" } },
  { name: { ar: "عبدالمجيد العنزي", en: "Abdulmajid Al-Anazi" }, role: { ar: "مدير الائتمان والمخاطر", en: "Credit & Risk Manager" } },
  { name: { ar: "منصور العنزي", en: "Mansour Al-Anazi" }, role: { ar: "مدير المبيعات", en: "Sales Manager" } },
  { name: { ar: "ربى البداح", en: "Ruba Al-Baddah" }, role: { ar: "مدير العناية بالعميل", en: "Customer Care Manager" } },
];

export default function AboutPage() {
  const t = useTranslations("about");
  const locale = (typeof window !== "undefined" ? document.documentElement.lang : "ar") as "ar" | "en";

  return (
    <main className="pt-24">
      {/* Header */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <AnimateOnScroll>
            <p className="text-lg text-brand font-medium">{t("partnerTitle")}</p>
            <h1 className="mt-4 text-4xl font-bold text-apple-text md:text-6xl">
              {t("heading")}
            </h1>
            <p className="mt-6 text-xl leading-relaxed text-apple-gray">
              {t("description")}
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Vision */}
      <section className="bg-apple-bg py-24">
        <div className="mx-auto max-w-4xl px-6">
          <AnimateOnScroll>
            <div className="rounded-2xl border-s-4 border-brand bg-white p-10">
              <h2 className="text-2xl font-bold text-apple-text">{t("visionTitle")}</h2>
              <p className="mt-4 text-lg leading-relaxed text-apple-gray">
                {t("visionText")}
              </p>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Why Thra */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <h2 className="text-center text-3xl font-bold text-apple-text md:text-5xl">
              {t("whyThra")}
            </h2>
          </AnimateOnScroll>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {([1, 2, 3, 4] as const).map((n, i) => (
              <AnimateOnScroll key={n} delay={i * 0.1}>
                <div className="rounded-2xl border border-apple-border p-8">
                  <h3 className="text-lg font-semibold text-apple-text">
                    {t(`reason${n}`)}
                  </h3>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Board */}
      <section className="bg-apple-bg py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <h2 className="text-center text-3xl font-bold text-apple-text md:text-5xl">
              {t("boardTitle")}
            </h2>
          </AnimateOnScroll>
          <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-5">
            {boardMembers.map((member, i) => (
              <AnimateOnScroll key={i} delay={i * 0.1}>
                <div className="text-center">
                  <div className="mx-auto h-24 w-24 rounded-full bg-brand-light" />
                  <p className="mt-4 font-semibold text-apple-text">
                    {member.name[locale]}
                  </p>
                  <p className="text-sm text-apple-gray">{member.role[locale]}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <h2 className="text-center text-3xl font-bold text-apple-text md:text-5xl">
              {t("teamTitle")}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-apple-gray">
              {t("teamSubtitle")}
            </p>
          </AnimateOnScroll>
          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {teamMembers.map((member, i) => (
              <AnimateOnScroll key={i} delay={i * 0.1}>
                <div className="rounded-2xl border border-apple-border p-8 text-center">
                  <div className="mx-auto h-20 w-20 rounded-full bg-brand-light" />
                  <p className="mt-4 text-lg font-semibold text-apple-text">
                    {member.name[locale]}
                  </p>
                  <p className="text-sm text-apple-gray">{member.role[locale]}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* License */}
      <section className="bg-apple-bg py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm text-apple-gray">{t("license")}</p>
        </div>
      </section>
    </main>
  );
}
```

**Step 2: Verify and commit**

```bash
npm run dev
git add .
git commit -m "feat: add About page with board and team sections"
```

---

## Task 8: Programs Page

**Files:**
- Create: `src/app/[locale]/programs/page.tsx`

**Step 1: Create Programs page**

Create `src/app/[locale]/programs/page.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function ProgramsPage() {
  const t = useTranslations("programs");
  const [activeTab, setActiveTab] = useState<"realEstate" | "invoice">("realEstate");

  const realEstatePrograms = [
    { name: t("growth"), amount: t("growthAmount"), desc: t("growthDesc") },
    { name: t("leadership"), amount: t("leadershipAmount"), desc: t("leadershipDesc") },
    { name: t("expansion"), amount: t("expansionAmount"), desc: t("expansionDesc") },
  ];

  return (
    <main className="pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <h1 className="text-center text-4xl font-bold text-apple-text md:text-6xl">
              {t("heading")}
            </h1>
          </AnimateOnScroll>

          {/* Tabs */}
          <div className="mt-12 flex justify-center gap-4">
            <button
              onClick={() => setActiveTab("realEstate")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "realEstate"
                  ? "bg-brand text-white"
                  : "bg-apple-bg text-apple-gray hover:text-apple-text"
              }`}
            >
              {t("realEstate")}
            </button>
            <button
              onClick={() => setActiveTab("invoice")}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                activeTab === "invoice"
                  ? "bg-brand text-white"
                  : "bg-apple-bg text-apple-gray hover:text-apple-text"
              }`}
            >
              {t("invoiceFinancing")}
            </button>
          </div>

          {/* Real Estate Programs */}
          {activeTab === "realEstate" && (
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {realEstatePrograms.map((program, i) => (
                <AnimateOnScroll key={i} delay={i * 0.1}>
                  <div className="flex flex-col justify-between rounded-2xl border border-apple-border p-8 transition-shadow hover:shadow-xl">
                    <div>
                      <h3 className="text-2xl font-bold text-apple-text">{program.name}</h3>
                      <p className="mt-2 text-lg font-semibold text-brand">{program.amount}</p>
                      <p className="mt-4 leading-relaxed text-apple-gray">{program.desc}</p>
                    </div>
                    <a
                      href="https://tharaco.sa/register"
                      className="mt-8 inline-block rounded-full bg-brand px-6 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                    >
                      {t("applyNow")} →
                    </a>
                  </div>
                </AnimateOnScroll>
              ))}
            </div>
          )}

          {/* Invoice Financing */}
          {activeTab === "invoice" && (
            <div className="mt-16 mx-auto max-w-2xl">
              <AnimateOnScroll>
                <div className="rounded-2xl border border-apple-border p-10 text-center">
                  <h3 className="text-2xl font-bold text-apple-text">{t("invoiceFinancing")}</h3>
                  <p className="mt-4 leading-relaxed text-apple-gray">{t("invoiceDesc")}</p>
                  <a
                    href="https://tharaco.sa/register"
                    className="mt-8 inline-block rounded-full bg-brand px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
                  >
                    {t("applyNow")} →
                  </a>
                </div>
              </AnimateOnScroll>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
```

**Step 2: Verify and commit**

```bash
npm run dev
git add .
git commit -m "feat: add Programs page with tabbed real estate and invoice financing"
```

---

## Task 9: FAQ Page

**Files:**
- Create: `src/app/[locale]/faq/page.tsx`
- Create: `src/components/Accordion.tsx`

**Step 1: Create Accordion component**

Create `src/components/Accordion.tsx`:
```tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AccordionItem {
  question: string;
  answer: string;
}

export default function Accordion({ items }: { items: AccordionItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex flex-col divide-y divide-apple-border">
      {items.map((item, i) => (
        <div key={i}>
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-6 text-start"
          >
            <span className="text-lg font-medium text-apple-text pe-4">
              {item.question}
            </span>
            <span
              className={`shrink-0 text-2xl text-apple-gray transition-transform ${
                openIndex === i ? "rotate-45" : ""
              }`}
            >
              +
            </span>
          </button>
          <AnimatePresence>
            {openIndex === i && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <p className="pb-6 leading-relaxed text-apple-gray">
                  {item.answer}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Create FAQ page**

Create `src/app/[locale]/faq/page.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import AnimateOnScroll from "@/components/AnimateOnScroll";
import Accordion from "@/components/Accordion";

export default function FAQPage() {
  const t = useTranslations("faq");
  const [activeTab, setActiveTab] = useState("general");

  const generalFAQs = [
    { question: t("q1"), answer: t("a1") },
    { question: t("q2"), answer: t("a2") },
    { question: t("q3"), answer: t("a3") },
    { question: t("q4"), answer: t("a4") },
    { question: t("q5"), answer: t("a5") },
  ];

  const tabs = [
    { id: "general", label: t("tabGeneral") },
    { id: "investors", label: t("tabInvestors") },
    { id: "borrowers", label: t("tabBorrowers") },
  ];

  return (
    <main className="pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-3xl px-6">
          <AnimateOnScroll>
            <h1 className="text-center text-4xl font-bold text-apple-text md:text-6xl">
              {t("pageTitle")}
            </h1>
          </AnimateOnScroll>

          {/* Tabs */}
          <div className="mt-12 flex justify-center gap-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-brand text-white"
                    : "bg-apple-bg text-apple-gray hover:text-apple-text"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* FAQ List */}
          <div className="mt-12">
            <Accordion items={generalFAQs} />
          </div>
        </div>
      </section>
    </main>
  );
}
```

**Step 3: Verify and commit**

```bash
npm run dev
git add .
git commit -m "feat: add FAQ page with accordion and category tabs"
```

---

## Task 10: Contact Page

**Files:**
- Create: `src/app/[locale]/contact/page.tsx`

**Step 1: Create Contact page**

Create `src/app/[locale]/contact/page.tsx`:
```tsx
"use client";

import { useTranslations } from "next-intl";
import AnimateOnScroll from "@/components/AnimateOnScroll";

export default function ContactPage() {
  const t = useTranslations("contact");

  return (
    <main className="pt-24">
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <AnimateOnScroll>
            <h1 className="text-center text-4xl font-bold text-apple-text md:text-6xl">
              {t("heading")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-apple-gray">
              {t("subtitle")}
            </p>
          </AnimateOnScroll>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {/* Form */}
            <AnimateOnScroll>
              <form className="flex flex-col gap-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-apple-text">
                    {t("nameLabel")}
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-xl border border-apple-border bg-white px-4 py-3 text-apple-text outline-none transition-colors focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-apple-text">
                    {t("emailLabel")}
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-xl border border-apple-border bg-white px-4 py-3 text-apple-text outline-none transition-colors focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-apple-text">
                    {t("phoneLabel")}
                  </label>
                  <input
                    type="tel"
                    className="w-full rounded-xl border border-apple-border bg-white px-4 py-3 text-apple-text outline-none transition-colors focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-apple-text">
                    {t("messageLabel")}
                  </label>
                  <textarea
                    rows={5}
                    className="w-full resize-none rounded-xl border border-apple-border bg-white px-4 py-3 text-apple-text outline-none transition-colors focus:border-brand"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-full bg-brand px-8 py-3 font-medium text-white transition-colors hover:bg-brand-dark"
                >
                  {t("submitButton")} →
                </button>
              </form>
            </AnimateOnScroll>

            {/* Contact Info */}
            <AnimateOnScroll delay={0.2}>
              <div className="flex flex-col gap-8">
                <div className="rounded-2xl border border-apple-border p-8">
                  <h3 className="text-lg font-semibold text-apple-text">{t("phoneTitle")}</h3>
                  <p className="mt-2 text-2xl font-bold text-brand" dir="ltr">
                    {t("phone")}
                  </p>
                </div>
                <div className="rounded-2xl border border-apple-border p-8">
                  <h3 className="text-lg font-semibold text-apple-text">{t("emailTitle")}</h3>
                  <p className="mt-2 text-xl font-medium text-brand">
                    <a href={`mailto:${t("email")}`}>{t("email")}</a>
                  </p>
                </div>
                <div className="rounded-2xl border border-apple-border p-8">
                  <h3 className="text-lg font-semibold text-apple-text">
                    {/* Social */}
                    Social
                  </h3>
                  <div className="mt-4 flex gap-4">
                    <a href="https://x.com/thraco_sa" target="_blank" rel="noopener noreferrer" className="text-apple-gray hover:text-brand">𝕏</a>
                    <a href="https://www.instagram.com/thraco_sa" target="_blank" rel="noopener noreferrer" className="text-apple-gray hover:text-brand">Instagram</a>
                    <a href="https://www.linkedin.com/company/tharaco" target="_blank" rel="noopener noreferrer" className="text-apple-gray hover:text-brand">LinkedIn</a>
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </main>
  );
}
```

**Step 2: Verify and commit**

```bash
npm run dev
git add .
git commit -m "feat: add Contact page with form and contact info"
```

---

## Task 11: Font Loading + Metadata + Final Polish

**Files:**
- Modify: `src/app/[locale]/layout.tsx` — add Google Fonts (Inter + IBM Plex Arabic)
- Modify: `src/app/[locale]/layout.tsx` — add metadata per locale

**Step 1: Add font imports to locale layout**

Use `next/font/google` to load Inter and IBM Plex Arabic:

```tsx
import { Inter } from "next/font/google";
import localFont from "next/font/local";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// For IBM Plex Arabic, use Google Fonts
import { IBM_Plex_Sans_Arabic } from "next/font/google";
const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-arabic",
});
```

Apply font variables to `<body>` className.

**Step 2: Add generateMetadata function**

```tsx
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return {
    title: t("title"),
    description: t("description"),
  };
}
```

**Step 3: Verify fonts load, metadata renders, all pages work in both languages**

```bash
npm run dev
```

Test every page in both `/ar` and `/en`.

**Step 4: Commit**

```bash
git add .
git commit -m "feat: add font loading, metadata, and final polish"
```

---

## Task 12: Build Verification + Deploy

**Step 1: Run production build**

```bash
npm run build
```

Expected: No errors. All pages generate successfully.

**Step 2: Test production locally**

```bash
npm run start
```

Verify all pages, language switching, animations, RTL layout.

**Step 3: Commit any fixes and deploy**

```bash
git add .
git commit -m "chore: production build verification"
```

Deploy to Vercel or run `vercel deploy`.

---
