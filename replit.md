# Himal to Horizon — Premium Flight & Travel Advisory Platform

## Overview
Himal to Horizon is a premium dark-themed web application offering flight booking and travel advisory services. Operated by Synergy Soul LLC, it generates revenue through affiliate commissions, primarily from Travelpayouts. The platform aims to be a "travel intelligence advisor" rather than just a flight search engine. Key capabilities include comprehensive flight search, advanced visa intelligence, multi-language support (19 languages), and a blog with extensive destination guides. It integrates various travel services like EKTA travel insurance and 12Go for Asian routes. The business vision is to provide users with intelligent travel advice and seamless booking redirection through a metasearch model.

## User Preferences
I prefer that the agent focuses on the core functionality and user experience. When making changes, prioritize performance and maintainability. I appreciate clear explanations for any significant architectural decisions or changes to the codebase. Please ask for confirmation before implementing major structural changes or introducing new external dependencies.

## System Architecture
The application features a modern web architecture.

**Frontend:**
- Built with React, TypeScript, and Vite for a fast development experience.
- Styling is handled by TailwindCSS, augmented with shadcn/ui components for a polished dark-themed UI.
- Client-side routing is managed by Wouter, supporting routes like `/`, `/results`, `/booking`, and visa-specific pages.
- State management leverages TanStack Query v5 for efficient data fetching and caching.
- **Design System:** The theme is dark-only, featuring an Alpine Blue background and Deep Midnight Navy footer. Accent colors include Sunrise Peach, Mist Teal, and Horizon Gold. Fonts are Satoshi (headings) and Inter (body). The design incorporates glassmorphism effects.

**Backend:**
- An Express.js server written in TypeScript handles API requests.
- Authentication uses Passport.js (local and Google OAuth) with `express-session` and `connect-pg-simple` for session management, storing data in PostgreSQL (`user_sessions` table). User profiles store preferences like home airport.
- Email alerts are managed via Resend.
- Production hardening includes a `/api/health` check, `express-rate-limit` on heavy search routes, Pino JSON logger for structured logging, and Sentry for error tracking. GA4 and Clarity are used for analytics.

**Core Features & Technical Implementations:**
- **Flight Search:** Includes origin/destination autocompletion, flexible date searches (±3 days), and a "Himal Insight" feature for identifying potential savings. "Horizon's Insight" provides a wide scanner (±14 days) for optimal pricing.
- **Price Confidence:** Utilizes `localStorage` to track historical prices, displaying "H2H Verified: Buy Now" or "Horizon's Prediction: likely to Rise/Fall" badges.
- **Booking Flow:** Operates on a pure metasearch affiliate model, redirecting users to OTAs (Trip.com, Expedia, CheapoAir, Google Flights) via stealth `/go/:partner` routes for booking completion. No payment processing occurs on Himal to Horizon.
- **Stay Optimizer™:** A feature for flexible trip duration searches and suggesting best value stays, with direct links to Agoda for hotel bookings.
- **Visa Engine:** A programmatic engine providing visa intelligence through a three-tier data architecture:
    - `passport-index.json`: Basic visa status for all country pairs.
    - `visa-data.json`: Tier-1 rich, curated data with processing times, fees, and official links.
    - `destination-requirements.json`: Tier-2 global intelligence covering fee, processing, max stay, and required documents for all 199 destinations.
    - `official-portals.json`: Official government visa portal URLs.
    - `jurisdictions.json`: Regional embassy hubs.
- **i18n:** Supports 19 languages for visa guides and blog content. Blog translations are layered:
    - `blog-i18n.ts`: Title and excerpt translations for all 47 posts across 18 languages.
    - `blog-content-i18n.ts`: Body content translations (paragraphs, lists, tips, warnings) for all 47 posts across 6 major languages (es, fr, de, ja, zh, ko). Other languages fall back to English.
    - `blog-auto-translate.ts`: Auto-translates facts labels and h2/h3 headings for all posts using dictionary lookup (no API needed).
    - Translation array structure: Each post has a full-length array matching `content_json`. `null` entries = auto-translated sections (facts, h2, h3). `{t, v}` entries = manually translated body content.
- **SEO:** Centralized SEO utility (`client/src/lib/seo.ts`) sets dynamic `<title>`, meta description, OG tags (title, description, type, url, image, site_name), Twitter card tags, canonical URL, and JSON-LD structured data per page. Every routed page calls `setSEO()` on mount and `resetSEO()` on unmount. Blog posts get Article structured data. Visa pages get dynamic titles per country pair. `index.html` has sensible defaults. Server generates `sitemap.xml` (all pages + 47 blog posts + 199×199 visa pairs) and `robots.txt`.
- **API Routes:** Comprehensive set of API endpoints for flight search variations (e.g., `/api/flights/search`, `/api/flights/wide-insight`, `/api/flights/multi-city`, `/api/flights/horizon-hop`), airport suggestions, and authentication.

## External Dependencies
- **Flight Data API:** Travelpayouts / Aviasales API
- **Affiliate Partners:**
    - **Flight Booking:** Trip.com, Expedia, CheapoAir, Google Flights
    - **Hotels/Stays:** Agoda, Hostelworld, Hotels
    - **Activities/Tours:** Viator, Klook, Tiqets, WeGoTrip, TripAdvisor
    - **Insurance:** EKTA, VisitorsCoverage
    - **Car Rental:** Localrent
    - **Trains/Buses:** 12go (Asia), Omio (Europe)
    - **Yacht Rental:** SeaRadar
- **Authentication:** Google OAuth
- **Database:** PostgreSQL (via Drizzle ORM)
- **Email Service:** Resend
- **Error Tracking:** Sentry
- **Analytics:** Google Analytics 4 (GA4), Microsoft Clarity