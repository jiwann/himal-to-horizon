# Himal to Horizon — The Intelligent Way to Plan Long-Stay Travel

> **Himal to Horizon — Stop searching dates. Optimize your stay.**

Himal to Horizon is a premium, dark-themed travel advisory site engineered by Synergy Soul LLC. Unlike traditional search engines that require you to commit to fixed dates, Himal to Horizon takes your desired stay length and finds the cheapest combination of departure and return dates that fit it — automatically, across a 30-day window.

Revenue is generated through Travelpayouts affiliate commissions (Marker: 707746) with verified partner links across flights, hotels, insurance, activities, and regional transport.

---

## Core Philosophy

Most flight search engines ask: *"What dates do you want to fly?"*

Himal to Horizon asks: *"How long do you want to stay?"*

This is a fundamentally different approach. Long-stay travellers — diaspora families visiting home, remote workers, digital nomads — don't care about specific dates. They care about staying 30, 45, or 60 days. The Stay Optimizer™ engine finds the cheapest possible dates that satisfy that constraint.

---

## Technical Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | Wouter v3 |
| State / Data fetching | TanStack Query v5 |
| UI Components | shadcn/ui + Radix UI |
| Forms | react-hook-form + Zod |
| Styling | Tailwind CSS (dark-only design system) |
| Fonts | Satoshi (brand/headings) + Inter (data/UI) |
| Backend | Node.js + Express |
| Flight Data | Travelpayouts API (Aviasales) |
| Affiliate Links | Travelpayouts partner network via `/go/:partner` stealth routing |
| IP Detection | ipapi.co |
| Database | Drizzle ORM + PostgreSQL (Replit-hosted) |
| i18n | 19 languages with full visa data + blog content translations |

---

## Key Features

### Stay Optimizer™
The flagship feature. Users enter a destination and specify how many days they want to stay (7–90). The engine:
1. Takes the user's departure date as an anchor
2. Generates 7 date pairs across a ±15 day window around that anchor, each pair separated by exactly the requested stay duration
3. Fires all 7 searches in parallel against the Travelpayouts API
4. Aggregates and ranks results by price
5. Calculates savings vs. the user's original fixed-date search
6. Shows a savings tip if departing earlier/later saves ≥$80

### Himalayan Insight (Best Alternate Date)
When the standard search is active, the backend simultaneously runs ±3 flexible date comparisons and highlights the single best alternate date if it's cheaper than the user's exact choice.

### H2H Tips (Nearby Airports)
Searches alternative airports (e.g., EWR/LGA instead of JFK) using a predefined `NEARBY_AIRPORT_MAP` to find cheaper options.

### Price Confidence Badges
Records every search result locally (localStorage) and compares new searches to historical prices for the same route and date. Badges the cheapest offer accordingly.

### Horizon's Booking Recommendations
Partner links are validated client-side via `safePartnerOpen()` — if a partner link fails, the user is redirected to the Aviasales fallback (`tpk.mx/gCtH7LX7`).

### Visa Intelligence
10 countries × 19 languages with full visa requirement data, embedded in the i18n system.

### SEO Blog
47 destination guides with titles and excerpts translated across 19 languages.

### EKTA Insurance (Always-On)
EKTA travel insurance card appears on all result pages, regardless of destination.

### 12Go Asia (SEA Routes)
12Go transport card appears specifically for Southeast Asia routes (TH, VN, MY, ID, PH, SG, KH, LA, MM, BN, TL).

---

## Affiliate Architecture

All partner links route through `/go/:partner` stealth endpoints defined in `server/affiliate-config.ts`. The full partner registry is available at `public/partners.json`.

Partners include: Kiwi.com, Aviasales, CheapOair, Trip.com, Expedia, Hotels.com, Agoda, Hostelworld, Localrent, SeaRadar, EKTA, VisitorsCoverage, Klook, Viator, Tiqets, WeGoTrip, TripAdvisor, 12Go Asia, Omio, Airalo.

---

## Security & Configuration

All API keys are managed via Replit Secrets (environment variables):

| Secret | Purpose |
|--------|---------|
| `TRAVELPAYOUTS_TOKEN` | Travelpayouts API access |
| `TRAVELPAYOUTS_MARKER` | Affiliate tracking marker (707746) |
| `SESSION_SECRET` | Express session signing |

No API keys are ever exposed to the frontend. All API calls are made exclusively from the Express backend.

---

## Architecture Notes

- **Single-port deployment** — Vite dev server and Express run on the same port via Vite's middleware proxy configuration.
- **Parallel API calls** — The Stay Optimizer™ fires up to 7 simultaneous API requests; searches run in parallel with TanStack Query.
- **Stale-while-revalidate** — All flight queries use a 5-minute stale time with TanStack Query's intelligent caching.
- **Server-side caching** — Flight search results cached for 20 minutes (`SEARCH_CACHE_TTL`).
- **Partner link validation** — Client-side `safePartnerOpen()` checks partner reachability with 3s timeout, falls back to Aviasales.
- **Error recovery** — Friendly error states with one-click retry.

---

## Running Locally

The project runs via the pre-configured `Start application` workflow:

```bash
npm run dev
```

This starts the Express + Vite unified dev server. Set `TRAVELPAYOUTS_TOKEN` and `TRAVELPAYOUTS_MARKER` in your environment (Replit Secrets) before starting.

---

*Himal to Horizon — A Synergy Soul LLC Project*
