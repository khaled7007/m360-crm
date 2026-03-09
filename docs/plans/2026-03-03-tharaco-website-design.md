# Tharaco (ذرى) Website Redesign — Apple-Style, Bilingual

**Date:** 2026-03-03
**Status:** Approved

## Overview

Redesign the Tharaco (Thra / ذرى) marketing website in an Apple-inspired clean white minimal style with full English and Arabic (RTL) support. The site serves as a marketing and brand presence with CTAs linking to the existing platform at tharaco.sa.

## Company Context

**Thra (ذرى)** is a Saudi fintech company specializing in Sharia-compliant debt-based crowdfunding for real estate development. Licensed by the Saudi Central Bank (SAMA), license #84/أ ش/202401. Commercial Registration: 1010797355.

**Key Metrics:**
- 14.4% average annual returns
- 97 investment opportunities
- SAR 112M+ total financing
- 100% collection rate
- 0% default rate
- Minimum investment: SAR 1,000

**Programs:**
- Growth (النمو): up to 20M SAR — medium real estate development
- Leadership (الريادة): up to 10M SAR — real estate development support
- Expansion (التوسع): 20M+ SAR — large real estate projects
- Contractor invoice financing

**Partners:** Arab National Bank, Alfayran Law Firm, Oracle Cloud

**Contact:** Phone 8001240393, Email care@tharaco.sa
**Social:** X (@thraco_sa), Instagram (@thraco_sa), LinkedIn (/company/tharaco)

## Scope

Marketing website with investor/borrower landing pages. CTAs link to the existing tharaco.sa platform for registration, login, and dashboard functionality.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4
- **Animations:** Framer Motion
- **Internationalization:** next-intl (en/ar routing)
- **Deployment:** Vercel

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Home — hero, stats, how it works, programs preview, partners, CTA |
| `/about` | Company story, vision, board members, leadership team, licensing |
| `/programs` | Real estate & invoice financing programs with details |
| `/faq` | Accordion FAQ with category tabs (General, Investors, Borrowers) |
| `/contact` | Contact form, phone, email, social links |

## Design System

### Visual Direction
Clean white minimal — inspired by Apple's MacBook Air product pages. Bright white backgrounds, large typography, generous whitespace, subtle shadows.

### Colors
- **Background:** #FFFFFF (white)
- **Text Primary:** #1D1D1F (near-black, Apple standard)
- **Text Secondary:** #86868B (gray)
- **Brand Accent:** #0D9488 (teal, from Thra brand identity)
- **Brand Accent Light:** #CCFBF1 (light teal for backgrounds)
- **CTA Hover:** #0F766E (darker teal)
- **Borders:** #E5E5E7 (light gray)
- **Section alternates:** #F5F5F7 (Apple light gray)

### Typography
- **English:** Inter (primary), system SF Pro Display fallback
- **Arabic:** IBM Plex Arabic
- **Headlines:** text-4xl to text-7xl, font-semibold to font-bold
- **Body:** text-lg to text-xl, font-normal, leading-relaxed
- **Massive whitespace:** py-24 to py-32 between sections

### Navigation
- Fixed top navbar with translucent backdrop blur (frosted glass effect)
- Logo left (RTL: right), nav links center, language toggle + CTA right (RTL: left)
- Smooth hide on scroll down, show on scroll up

### Animations (Framer Motion)
- Fade-up on scroll for section reveals
- Count-up animation for statistics
- Hover scale transforms on cards (scale 1.02)
- Smooth page transitions between routes
- All animations mirror for RTL (slide-from-left ↔ slide-from-right)

## Homepage Sections

### 1. Hero (full viewport)
- White background
- Massive headline: "Achieve returns up to **39%** with Thra" / "حقق عوائد تصل إلى **39%** مع ذرى"
- Subtitle about Sharia-compliant, SAMA-licensed crowdfunding
- Single CTA button: "Start Investing" → links to platform /register
- Subtle parallax floating geometric shapes (translucent teal)

### 2. Stats Counter
- 4-column grid: 14.4% avg returns, 97 opportunities, SAR 112M+ financing, 100% collection rate
- Numbers animate (count up) when scrolled into view
- Large bold numbers, small gray labels below

### 3. How It Works
- 3-step horizontal layout with clean icons
- Create Account → Browse Opportunities → Invest
- Step descriptions below each icon
- Scroll-triggered reveal animation

### 4. Programs Preview
- Two large cards side by side: Real Estate Development / Invoice Financing
- Hover reveals brief program details
- Click navigates to /programs
- Clean borders, generous padding, subtle shadow on hover

### 5. Partners
- Logo strip: Arab National Bank, Oracle Cloud, Alfayran Law Firm
- Grayscale logos, color on hover
- Centered with "Our Ecosystem" / "منظومة ذرى" heading

### 6. CTA Footer Section
- "Ready to invest? Start from SAR 1,000" / "جاهز للاستثمار؟ ابدأ من 1000 ريال"
- Single prominent button linking to platform registration
- Light gray (#F5F5F7) background to differentiate from white sections

## Inner Pages

### About
- Large typography storytelling section
- Vision statement as full-width quote block with teal accent border
- Board members: circular photo crops in a grid with name and title
- Leadership team: larger cards with photo, name, title, and expandable bio paragraphs
- SAMA license badge prominently displayed

### Programs
- Two tabbed sections: Real Estate Development / Invoice Financing
- Each program (Growth, Leadership, Expansion) as an Apple-style feature card
- Card content: program name, amount range, description, "Apply for Financing" CTA
- CTA links to platform /register with borrower intent

### FAQ
- Category tabs: General, Investors, Borrowers
- Search field at top
- Clean accordion with smooth expand/collapse animation
- Content sourced from translation files

### Contact
- Split layout: form (left/right based on RTL) and contact info
- Form fields: name, email, phone, message, submit
- Contact info: phone 8001240393, email care@tharaco.sa
- Social media links: X, Instagram, LinkedIn
- Optional: embedded map of office location

## Internationalization (i18n)

### Routing
- `/en/*` — English pages (LTR)
- `/ar/*` — Arabic pages (RTL, default)
- Middleware detects browser `Accept-Language`, redirects on first visit
- Language switcher in navbar persists preference

### RTL Implementation
- `dir="rtl"` on html root for Arabic
- Tailwind logical properties: `ps-`, `pe-`, `ms-`, `me-` instead of `pl-`, `pr-`
- CSS variable `--font-primary` switches between Inter and IBM Plex Arabic
- All text content in JSON translation files: `/messages/en.json`, `/messages/ar.json`

## Footer

- Company logo and description
- Quick links: Home, About, Programs, FAQ, Contact
- Legal links: Terms, Privacy, Risk Disclosure
- SAMA license information
- Social media icons: X, Instagram, LinkedIn
- Copyright notice
