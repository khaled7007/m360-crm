# M360 UI Refresh Design

**Date**: 2026-03-06
**Direction**: Clean Modern SaaS with Teal accent

## Color System
- Primary: teal-600 (#0d9488), hover: teal-700
- Neutrals: stone scale (warm grays) replacing pure gray
- Sidebar: stone-900
- Surface: white cards on stone-50
- Status colors: keep existing (emerald, rose, amber, etc.)

## Typography
- Headings: DM Sans (via next/font/google)
- Body: Inter (via next/font/google)
- Arabic: IBM Plex Arabic
- Mono: Geist Mono (keep for reference numbers, amounts)

## Login Page
- Split-screen: 60% brand panel (teal→stone-900 gradient, logo, tagline, geometric pattern) + 40% form
- Mobile: brand panel becomes compact header strip
- Form: modern inputs, teal button, fade-in animation

## Dashboard
- Stats row: 4 cards with text-3xl numbers, trend arrows, teal left-border accent, stagger animation
- Left column (60%): Pipeline funnel chart (recharts) + recent applications table
- Right column (40%): Quick actions cards + portfolio quality donut chart
- Charts use teal gradient palette

## Animations
- Page load: cards stagger opacity+translateY, 50ms delay
- Hover: translateY(-2px) + shadow
- Buttons: scale 0.98 on press
- Modal: fade overlay + scale-in (0.95→1)
- CSS transitions + @keyframes only

## Scope
- All pages: color swap (blue→teal, gray→stone)
- All pages: font swap to DM Sans headings
- Login: full redesign
- Dashboard: charts + layout restructure
- Global: animation utilities
