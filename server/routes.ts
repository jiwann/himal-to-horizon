import express, { type Express, type Request, type Response, type NextFunction } from "express";
import path from "path";
import { createServer, type Server } from "http";
import { AFFILIATE_ROUTES } from "./affiliate-config";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { flightSearchSchema, calendarSearchSchema, signupSchema, loginSchema, createAlertSchema, insertCommunityPostSchema, communityReportSchema, insertCommunityCommentSchema, RECOMMENDATION_CATEGORIES } from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError, getObjectAclPolicy } from "./replit_integrations/object_storage";
import { translatePost, translationAvailable, isSupportedLang } from "./translate";
import {
  searchFlights,
  searchFlightForDate,
  searchCheapestFromAirport,
  getNearbyAirports,
  getAirportDisplayName,
  CARRIER_BAGGAGE_DEFAULTS,
  DEFAULT_CARRIER_BAGGAGE,
  IS_LIVE_MODE,
  getCalendarPrices,
  checkTPApiHealth,
} from "./kiwi";
import { format, parseISO, addDays, getDaysInMonth, startOfMonth, differenceInDays } from "date-fns";
import type { HimalInsight, H2HTip, FlightSearchResult, CalendarDay, GoldenOpportunity, StayExtraDayInsight, MultiCityInsightResult, StayOptimizerDeal, MultiCitySegment, HubStayDeal, FlightOffer } from "@shared/schema";
import { storage } from "./storage";
import { listFromCountries, listVisaCountries, getVisaProfileLocalized, getVisaDifficultyRanking } from "./visa-service";
import { VISA_CATEGORIES, type VisaCategory } from "@shared/visa-schema";
import { sendPriceAlertEmail, sendVerificationEmail } from "./email";
import { pool } from "./db";
import { logger } from "./logger";
import bcrypt from "bcrypt";
import passport from "passport";
import crypto from "crypto";
import type { CommunityPost } from "@shared/schema";

// Translate a feed page of community posts into `lang`, using the per-post DB
// cache and translating misses with bounded concurrency. Any post that fails to
// translate is returned in its original language so the feed never breaks.
async function translateFeedPosts(posts: CommunityPost[], lang: string): Promise<CommunityPost[]> {
  const out = posts.slice();
  let cursor = 0;
  const worker = async () => {
    while (cursor < posts.length) {
      const idx = cursor++;
      const post = posts[idx];
      if ((post.originalLang ?? "en") === lang) continue;
      if (!post.title && !post.story) continue;
      try {
        let tr = await storage.getCommunityTranslation(post.id, lang);
        if (!tr) {
          tr = await translatePost(post, lang);
          await storage.saveCommunityTranslation(post.id, lang, tr).catch(() => {});
        }
        out[idx] = {
          ...post,
          title: tr.title || post.title,
          story: tr.story ?? post.story,
        };
      } catch {
        // Leave the original post untouched on failure.
      }
    }
  };
  const lanes = Math.min(4, posts.length);
  await Promise.all(Array.from({ length: lanes }, worker));
  return out;
}

// ── Rate limiters ──────────────────────────────────────────────────────────
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many search requests — please wait a moment before trying again." },
});

// Autocomplete suggestions: generous limit but blocks bots hammering typeahead
const suggestionsRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many autocomplete requests — please slow down." },
});

const FLEXIBLE_WINDOW_DAYS = [-1, 1];
const H2H_MIN_SAVINGS_PCT = 5;
const H2H_MIN_SAVINGS_ABS = 25;

// ── ISO codes for all 199 countries (used for sitemap generation) ──────────
import allCountriesData from "../client/src/lib/all-countries.json" with { type: "json" };
const ALL_ISO_CODES: string[] = (allCountriesData as { countries: { code: string }[] }).countries.map((c) => c.code);

let _sitemapCache: string | null = null;
function buildSitemap(): string {
  if (_sitemapCache) return _sitemapCache;
  const base = "https://himaltohorizon.com";
  const staticPages = [
    { url: "/", priority: "1.0", changefreq: "daily" },
    { url: "/community", priority: "0.9", changefreq: "daily" },
    { url: "/visa-guides", priority: "0.9", changefreq: "weekly" },
    { url: "/blog", priority: "0.7", changefreq: "weekly" },
    { url: "/stays", priority: "0.5", changefreq: "monthly" },
    { url: "/hotels", priority: "0.7", changefreq: "monthly" },
    { url: "/flights", priority: "0.7", changefreq: "monthly" },
    { url: "/cars", priority: "0.5", changefreq: "monthly" },
    { url: "/insurance", priority: "0.5", changefreq: "monthly" },
  ];
  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ];
  for (const p of staticPages) {
    lines.push(`  <url><loc>${base}${p.url}</loc><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`);
  }
  for (const origin of ALL_ISO_CODES) {
    for (const dest of ALL_ISO_CODES) {
      if (origin === dest) continue;
      lines.push(`  <url><loc>${base}/visa/${origin}/${dest}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`);
    }
  }
  lines.push("</urlset>");
  _sitemapCache = lines.join("\n");
  return _sitemapCache;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ── Serve root public/ directory (blog images, partners.json, etc.) ─────────
  app.use(express.static(path.join(process.cwd(), "public")));

  // ── SEO: robots.txt ────────────────────────────────────────────────────────
  app.get("/robots.txt", (_req, res) => {
    res.type("text/plain").send(
      `User-agent: *\nAllow: /\nSitemap: https://himaltohorizon.com/sitemap.xml\n`
    );
  });

  // ── SEO: sitemap.xml (static + blog posts + all 199×199 visa pairs) ─────────
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const { getAllPublishedSlugs } = await import("./blog");
      const base = "https://himaltohorizon.com";
      const slugs = await getAllPublishedSlugs();
      const blogEntries = slugs.map(
        ({ slug, published_at }) =>
          `  <url><loc>${base}/blog/${slug}</loc><lastmod>${new Date(published_at).toISOString().split("T")[0]}</lastmod><priority>0.8</priority></url>`
      );
      let communityEntries: string[] = [];
      try {
        const destinations = await storage.listCommunityDestinations();
        communityEntries = destinations.map(
          (d) => `  <url><loc>${base}/community/${d.countryCode}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`
        );
      } catch { /* community table may not be ready yet */ }
      const staticXml = buildSitemap();
      // Insert blog + community entries after the opening urlset tag
      const xml = staticXml.replace(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...blogEntries, ...communityEntries].join("\n")}`
      );
      res.type("application/xml").send(xml);
    } catch {
      res.type("application/xml").send(buildSitemap());
    }
  });

  // ── LLM discoverability: llms.txt (llmstxt.org standard) ──────────────────
  app.get("/llms.txt", (_req, res) => {
    res.type("text/plain").send(`# Himal to Horizon — Travel Intelligence Platform
> Operated by Synergy Soul LLC. A premium flight search and global visa intelligence platform for long-stay and adventure travellers.

## What this site does
- Searches live flight prices via the Travelpayouts/Aviasales data API
- Provides visa requirements for all 199 passport × 199 destination country pairs (tourist visas only)
- Covers fee, processing time, max stay, required documents, and nearest embassy for every pair
- Offers a Stay Optimizer™ tool for flexible-date long-haul travel planning

## Key pages
- https://himaltohorizon.com/ — Flight search (home)
- https://himaltohorizon.com/visa-guides — Global Visa Intelligence hub (check any passport → destination)
- https://himaltohorizon.com/visa/{ORIGIN_ISO}/{DEST_ISO} — Individual visa guide (e.g. /visa/US/TH for US passport → Thailand)
- https://himaltohorizon.com/blog — Travel guides and destination articles
- https://himaltohorizon.com/sitemap.xml — Full sitemap of all 39,000+ visa guide pages

## Visa data coverage
All 199 ISO 3166-1 alpha-2 country codes are supported as both passport origin and travel destination.
Status types: visa_free, visa_on_arrival, evisa, sticker_visa, not_admitted.
Data sourced from the Passport Index dataset (github.com/ilyankou/passport-index-dataset) and supplemented with curated embassy, fee, and document data by Synergy Soul LLC.

## Contact
- Website: https://himaltohorizon.com
- Email: hello@himaltohorizon.com
- Operated by: Synergy Soul LLC
`);
  });

  app.get("/api/config", (_req, res) => {
    const testMode = !IS_LIVE_MODE;
    const googleEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const travelpayoutsMarker = process.env.TRAVELPAYOUTS_MARKER ?? "504117";
    res.json({ testMode, googleEnabled, travelpayoutsMarker });
  });

  // ── Waitlist sign-up ────────────────────────────────────────────────────
  app.post("/api/waitlist", async (req, res) => {
    try {
      const { waitlistEntrySchema } = await import("@shared/schema");
      const parsed = waitlistEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid email or service." });
      await storage.addWaitlistEntry(parsed.data.email, parsed.data.service);
      return res.json({ ok: true });
    } catch (err) {
      console.error("Waitlist error:", err);
      return res.status(500).json({ error: "Failed to save. Please try again." });
    }
  });

  // ── Visa data feedback ───────────────────────────────────────────────────
  app.post("/api/feedback/visa", async (req, res) => {
    try {
      const { visaFeedbackSchema } = await import("@shared/schema");
      const parsed = visaFeedbackSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Please fill in all required fields." });
      const { countryPair, issue, correctInfo, email } = parsed.data;
      await storage.addVisaFeedback(countryPair, issue, correctInfo, email ?? "");
      return res.json({ ok: true });
    } catch (err) {
      console.error("Visa feedback error:", err);
      return res.status(500).json({ error: "Failed to submit. Please try again." });
    }
  });

  // ── Health check ─────────────────────────────────────────────────────────
  app.get("/api/health", async (_req, res) => {
    const start = Date.now();
    const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; detail?: string }> = {};

    try {
      const t0 = Date.now();
      await pool.query("SELECT 1");
      checks.database = { status: "ok", latencyMs: Date.now() - t0 };
    } catch (err: any) {
      checks.database = { status: "error", detail: err?.message };
    }

    try {
      const t0 = Date.now();
      const ok = await checkTPApiHealth();
      checks.aviasales = ok
        ? { status: "ok", latencyMs: Date.now() - t0 }
        : { status: "error", detail: "TRAVELPAYOUTS_TOKEN not configured or API unreachable" };
    } catch (err: any) {
      checks.aviasales = { status: "error", detail: err?.message };
    }

    const allOk = Object.values(checks).every(c => c.status === "ok");
    const status = allOk ? 200 : 503;
    logger.info({ type: "health_check", checks, totalMs: Date.now() - start, healthy: allOk });
    res.status(status).json({ status: allOk ? "healthy" : "degraded", checks, uptime: process.uptime() });
  });

  // ── Airport / city autocomplete — static lookup from Travelpayouts city list ──
  app.get("/api/places/suggestions", suggestionsRateLimit, async (req, res) => {
    try {
      const query = ((req.query.query as string) ?? "").trim().toUpperCase();
      if (query.length < 2) return res.json({ data: [] });
      const token = process.env.TRAVELPAYOUTS_TOKEN;
      if (!token) return res.json({ data: [] });
      const url = `https://autocomplete.travelpayouts.com/places2?locale=en&types[]=airport&types[]=city&term=${encodeURIComponent(query)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) return res.json({ data: [] });
      const raw: any[] = await resp.json();
      const items = (raw ?? []).slice(0, 10).map((item: any) => ({
        id: item.code ?? item.id,
        type: item.type === "city" ? "city" : "airport",
        name: item.name ?? item.city_name ?? item.code,
        iata_code: item.code ?? item.iata_code,
        iata_city_code: item.city_code ?? item.code,
        iata_country_code: item.country_code ?? null,
        city_name: item.city_name ?? item.name ?? null,
        airports: null,
      }));
      res.json({ data: items });
    } catch (err: any) {
      console.error("Places suggestions error:", err?.message ?? err);
      res.json({ data: [] });
    }
  });

  // ── Partner fallback — returns Aviasales fallback URL for a given partner ────
  app.get("/api/flights/partner-fallback", (_req, res) => {
    res.json({
      fallback: "https://tpk.mx/gCtH7LX7",
      partner: "Aviasales",
      message: "Use this link if your chosen partner is unreachable.",
    });
  });

  // ── Aviasales cached price — Travelpayouts prices_for_dates API ─────────────
  app.get("/api/flights/cached-price", async (req, res) => {
    const { origin, destination, month } = req.query as Record<string, string>;
    if (!origin || !destination || !month) {
      return res.status(400).json({ error: "origin, destination, and month are required" });
    }
    const token = process.env.TRAVELPAYOUTS_TOKEN;
    if (!token) return res.json({ price: null, reason: "token_not_configured" });

    try {
      const url = new URL("https://api.travelpayouts.com/v3/prices_for_dates");
      url.searchParams.set("origin", origin.toUpperCase());
      url.searchParams.set("destination", destination.toUpperCase());
      url.searchParams.set("departure_at", month);
      url.searchParams.set("token", token);
      url.searchParams.set("currency", "USD");
      url.searchParams.set("one_way", "true");
      url.searchParams.set("limit", "10");

      const apiRes = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
      if (!apiRes.ok) return res.json({ price: null, reason: "api_error" });

      const json = await apiRes.json() as { success?: boolean; data?: { price: number }[] };
      if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
        return res.json({ price: null, reason: "no_data" });
      }

      const minPrice = Math.min(...json.data.map((d) => d.price).filter((p) => typeof p === "number" && p > 0));
      res.json({ price: isFinite(minPrice) ? minPrice : null });
    } catch (err: any) {
      console.error("[cached-price] error:", err?.message);
      res.json({ price: null, reason: "fetch_error" });
    }
  });

  app.post("/api/flights/search", searchRateLimit, async (req, res) => {
    try {
      const body = flightSearchSchema.parse(req.body);
      const {
        origin,
        destination,
        departureDate,
        returnDate,
        passengers,
        cabinClass,
        tripType,
        includeNearbyAirports,
        directOnly,
        currency,
        segments,
      } = body;

      const isMultiCity = tripType === "multi_city" && segments && segments.length >= 2;
      const actualReturnDate = tripType === "round_trip" ? returnDate : undefined;

      // For multi-city, use first/last segment as primary route for nearby/flexible lookups
      const effectiveOrigin = isMultiCity ? (segments![0].origin) : origin;
      const effectiveDestination = isMultiCity ? (segments![segments!.length - 1].destination) : destination;
      const effectiveDepartureDate = isMultiCity ? segments![0].departureDate : departureDate;

      // Nearby airports for origin and destination (if opted in, only for standard searches)
      const nearbyOrigins = (!isMultiCity && includeNearbyAirports) ? getNearbyAirports(effectiveOrigin) : [];
      const nearbyDestinations = (!isMultiCity && includeNearbyAirports) ? getNearbyAirports(effectiveDestination) : [];

      // Build all parallel tasks
      const mainSearchPromise = searchFlights({
        origin: effectiveOrigin,
        destination: effectiveDestination,
        departureDate: effectiveDepartureDate,
        returnDate: actualReturnDate,
        adults: passengers.adults,
        children: passengers.children,
        infants: passengers.infants,
        cabinClass,
        maxOffers: 20,
        currency,
        segments: isMultiCity ? segments! : undefined,
        maxConnections: directOnly ? 0 : undefined,
      });

      // Flex ±3 day search — skip for multi-city (complex itineraries don't flex simply)
      const flexSearchPromises = isMultiCity ? [] : FLEXIBLE_WINDOW_DAYS.map(offset => {
        const altDate = format(addDays(parseISO(effectiveDepartureDate), offset), "yyyy-MM-dd");
        return searchFlightForDate(
          effectiveOrigin, effectiveDestination, altDate,
          passengers.adults, passengers.children, passengers.infants, cabinClass
        );
      });

      // Nearby origin searches (origin swap, same destination)
      const nearbyOriginPromises = nearbyOrigins.map(alt =>
        searchCheapestFromAirport(
          alt, effectiveDestination, effectiveDepartureDate, actualReturnDate,
          passengers.adults, passengers.children, passengers.infants, cabinClass
        )
      );

      // Nearby destination searches (same origin, destination swap)
      const nearbyDestPromises = nearbyDestinations.map(alt =>
        searchCheapestFromAirport(
          effectiveOrigin, alt, effectiveDepartureDate, actualReturnDate,
          passengers.adults, passengers.children, passengers.infants, cabinClass
        )
      );

      const [mainResult, ...rest] = await Promise.allSettled([
        mainSearchPromise,
        ...flexSearchPromises,
        ...nearbyOriginPromises,
        ...nearbyDestPromises,
      ]);

      if (mainResult.status === "rejected") {
        const err = mainResult.reason;
        const errMsg = err?.message || String(err) || "Unknown error";
        console.error("Main search failed:", errMsg);
        return res.status(502).json({
          error: `Flight search error: ${errMsg}`,
          hint: "Ensure TRAVELPAYOUTS_TOKEN is correctly set in Secrets.",
        });
      }

      // Strip any placeholder/test carriers if present
      const offers = IS_LIVE_MODE
        ? mainResult.value.filter(o => (o.owner?.iata_code ?? "").toUpperCase() !== "ZZ")
        : mainResult.value;
      const mainMinPrice = offers.length > 0 ? parseFloat(offers[0].total_amount) : null;
      const mainCurrency = offers.length > 0 ? offers[0].total_currency : "USD";

      // --- Himal Insight: flexible dates ---
      let himalInsight: HimalInsight | undefined;
      const flexResults = rest.slice(0, FLEXIBLE_WINDOW_DAYS.length);

      if (mainMinPrice !== null) {
        const flexPrices: { date: string; price: number; currency: string; offerId: string; checkedBags: number; carryOnBags: number }[] = [];
        FLEXIBLE_WINDOW_DAYS.forEach((offset, idx) => {
          const r = flexResults[idx];
          if (r && r.status === "fulfilled" && r.value) {
            const offer = r.value as FlightOffer;
            const price = parseFloat(offer.total_amount);
            const altDate = format(addDays(parseISO(effectiveDepartureDate), offset), "yyyy-MM-dd");
            flexPrices.push({ date: altDate, price, currency: offer.total_currency, offerId: offer.id, checkedBags: offer.checkedBags ?? 0, carryOnBags: offer.carryOnBags ?? 0 });
          }
        });

        if (flexPrices.length > 0) {
          const best = flexPrices.reduce((b, c) => c.price < b.price ? c : b);
          const savingsPct = ((mainMinPrice - best.price) / mainMinPrice) * 100;
          if (savingsPct > 15) {
            himalInsight = {
              originalDate: departureDate,
              alternateDate: best.date,
              originalPrice: mainMinPrice,
              alternatePrice: best.price,
              savings: mainMinPrice - best.price,
              savingsPercent: savingsPct,
              currency: best.currency,
              offerId: best.offerId,
              alternateCheckedBags: best.checkedBags,
              alternateCarryOnBags: best.carryOnBags,
            };
          }
        }
      }

      // --- H2H Tips: nearby airports ---
      const h2hTips: H2HTip[] = [];

      if (mainMinPrice !== null && includeNearbyAirports) {
        const nearbyOriginResults = rest.slice(FLEXIBLE_WINDOW_DAYS.length, FLEXIBLE_WINDOW_DAYS.length + nearbyOrigins.length);
        const nearbyDestResults = rest.slice(FLEXIBLE_WINDOW_DAYS.length + nearbyOrigins.length);

        // Origin swaps
        nearbyOriginResults.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value) {
            const rv = r.value as { offer: FlightOffer; origin: string };
            const altOrigin = rv.origin;
            const altPrice = parseFloat(rv.offer.total_amount);
            const savings = mainMinPrice - altPrice;
            const savingsPct = (savings / mainMinPrice) * 100;
            if (savings >= H2H_MIN_SAVINGS_ABS && savingsPct >= H2H_MIN_SAVINGS_PCT) {
              h2hTips.push({
                direction: "origin",
                searchedCode: origin,
                searchedName: getAirportDisplayName(origin),
                alternateCode: altOrigin,
                alternateName: getAirportDisplayName(altOrigin),
                searchedPrice: mainMinPrice,
                alternatePrice: altPrice,
                savings,
                savingsPercent: savingsPct,
                currency: rv.offer.total_currency,
              });
            }
          }
        });

        // Destination swaps
        const mainDestPrice = mainMinPrice;
        nearbyDestResults.forEach((r, idx) => {
          if (r.status === "fulfilled" && r.value) {
            const rv2 = r.value as { offer: FlightOffer; origin: string };
            const altDest = rv2.origin; // origin field stores the code we searched with
            const altPrice = parseFloat(rv2.offer.total_amount);
            const savings = mainDestPrice - altPrice;
            const savingsPct = (savings / mainDestPrice) * 100;
            if (savings >= H2H_MIN_SAVINGS_ABS && savingsPct >= H2H_MIN_SAVINGS_PCT) {
              h2hTips.push({
                direction: "destination",
                searchedCode: destination,
                searchedName: getAirportDisplayName(destination),
                alternateCode: nearbyDestinations[idx],
                alternateName: getAirportDisplayName(nearbyDestinations[idx]),
                searchedPrice: mainDestPrice,
                alternatePrice: altPrice,
                savings,
                savingsPercent: savingsPct,
                currency: rv2.offer.total_currency,
              });
            }
          }
        });

        // Sort by savings desc
        h2hTips.sort((a, b) => b.savings - a.savings);
      }

      const result: FlightSearchResult = {
        offers,
        himalInsight,
        h2hTips,
        searchedDates: { departure: departureDate, return: returnDate },
      };

      res.json(result);
    } catch (err: any) {
      console.error("Flight search error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid search parameters", details: err.errors });
      }
      const msg = err?.message ?? "Failed to search flights";
      res.status(500).json({ error: msg });
    }
  });

  app.post("/api/flights/flexible", async (req, res) => {
    try {
      const body = flightSearchSchema.parse(req.body);
      const { origin, destination, departureDate, passengers, cabinClass } = body;

      const FLEXIBLE_STAY_MIN = 45;
      const FLEXIBLE_STAY_MAX = 60;
      const datesToCheck: string[] = [];
      for (let d = FLEXIBLE_STAY_MIN; d <= FLEXIBLE_STAY_MAX; d += 5) {
        datesToCheck.push(format(addDays(parseISO(departureDate), d), "yyyy-MM-dd"));
      }

      const results = await Promise.allSettled(
        datesToCheck.map(date =>
          searchFlightForDate(origin, destination, date, passengers.adults, passengers.children, passengers.infants, cabinClass)
        )
      );

      const offers = results
        .map((r, i) => r.status === "fulfilled" && r.value ? { date: datesToCheck[i], offer: r.value } : null)
        .filter(Boolean) as { date: string; offer: any }[];

      offers.sort((a, b) => parseFloat(a.offer.total_amount) - parseFloat(b.offer.total_amount));

      res.json({ flexible_dates: offers.map(o => ({ date: o.date, offer: o.offer })) });
    } catch (err: any) {
      console.error("Flexible search error:", err);
      res.status(500).json({ error: err?.message ?? "Failed to search flexible flights" });
    }
  });

  app.post("/api/flights/calendar", searchRateLimit, async (req, res) => {
    try {
      const body = calendarSearchSchema.parse(req.body);
      const { origin, destination, month, passengers } = body;

      const monthStart = startOfMonth(parseISO(`${month}-01`));
      const daysCount = getDaysInMonth(monthStart);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currency = "USD";
      const priceMap = await getCalendarPrices(origin, destination, month, currency);

      const allDays: CalendarDay[] = [];
      for (let d = 0; d < daysCount; d++) {
        const date = format(addDays(monthStart, d), "yyyy-MM-dd");
        const entry = priceMap[date];
        const dayDate = addDays(monthStart, d);
        if (entry) {
          allDays.push({
            date,
            price: entry.price * passengers.adults,
            currency,
            available: true,
          });
        } else {
          allDays.push({ date, available: dayDate >= today });
        }
      }

      res.json({ days: allDays });
    } catch (err: any) {
      console.error("Calendar error:", err);
      if (err instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid parameters", details: err.errors });
      }
      res.status(500).json({ error: err?.message ?? "Failed to load calendar" });
    }
  });

  app.get("/api/flights/calendar", async (req, res) => {
    try {
      const { origin, destination, month, adults } = req.query;
      if (!origin || !destination || !month) {
        return res.status(400).json({ error: "origin, destination and month are required" });
      }

      const monthStart = startOfMonth(parseISO(`${month as string}-01`));
      const daysCount = getDaysInMonth(monthStart);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const pax = parseInt(adults as string ?? "1") || 1;

      const priceMap = await getCalendarPrices(origin as string, destination as string, month as string, "USD");

      const allDays: CalendarDay[] = [];
      for (let d = 0; d < daysCount; d++) {
        const date = format(addDays(monthStart, d), "yyyy-MM-dd");
        const entry = priceMap[date];
        const dayDate = addDays(monthStart, d);
        if (entry) {
          allDays.push({ date, price: entry.price * pax, currency: "USD", available: true });
        } else {
          allDays.push({ date, available: dayDate >= today });
        }
      }

      res.json({ days: allDays });
    } catch (err: any) {
      console.error("Calendar GET error:", err);
      res.status(500).json({ error: err?.message ?? "Failed to load calendar" });
    }
  });

  // --- Wide Insight: ±14 day departure window + stay-extra-day check ---
  app.post("/api/flights/wide-insight", searchRateLimit, async (req, res) => {
    try {
      const body = flightSearchSchema.parse(req.body);
      const { origin, destination, departureDate, returnDate, passengers, cabinClass, tripType } = body;
      const actualReturnDate = tripType === "round_trip" ? returnDate : undefined;

      // Accept pre-computed price from main search to skip a baseline API call
      const passedPrice = typeof req.body.currentSearchPrice === "number" ? req.body.currentSearchPrice : null;
      const passedCurrency = typeof req.body.currentSearchCurrency === "string" ? req.body.currentSearchCurrency : "USD";

      let currentPrice: number;
      let currentCurrency: string;

      if (passedPrice && passedPrice > 0) {
        currentPrice = passedPrice;
        currentCurrency = passedCurrency;
      } else {
        const currentOffer = await searchFlightForDate(
          origin, destination, departureDate,
          passengers.adults, passengers.children, passengers.infants,
          cabinClass, actualReturnDate
        );
        if (!currentOffer) return res.json({ opportunity: null, stayExtraDay: null, priceMap: [], currentPrice: 0, currentCurrency: "USD" });
        currentPrice = parseFloat(currentOffer.total_amount);
        currentCurrency = currentOffer.total_currency;
      }

      // Dynamic window — sorted closest-first, processed in batches with early exit
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = addDays(today, 1);
      const daysUntilDeparture = Math.round(
        (parseISO(departureDate).getTime() - today.getTime()) / 86400000
      );

      let WIDE_OFFSETS: number[];
      if (daysUntilDeparture < 7) {
        // Near-departure: today → today+12 forward window
        const startOffset = -daysUntilDeparture;
        const endOffset = 12 - daysUntilDeparture;
        WIDE_OFFSETS = [];
        for (let o = startOffset; o <= endOffset; o++) {
          if (o !== 0) WIDE_OFFSETS.push(o);
        }
      } else {
        // Standard: ±5 days (10 offsets) — balanced speed vs. insight depth
        WIDE_OFFSETS = Array.from({ length: 10 }, (_, i) => i - 5).filter((o) => o !== 0);
      }
      // Exclude dates before tomorrow + sort closest-first for early exit to kick in sooner
      WIDE_OFFSETS = WIDE_OFFSETS.filter((o) => addDays(parseISO(departureDate), o) >= tomorrow);
      WIDE_OFFSETS.sort((a, b) => Math.abs(a) - Math.abs(b));

      // Compute trip length to detect short stays (<7 days)
      const tripDays = actualReturnDate
        ? Math.round((parseISO(actualReturnDate).getTime() - parseISO(departureDate).getTime()) / 86400000)
        : null;
      const isShortStay = tripDays !== null && tripDays < 7;

      const candidates: {
        date: string;
        price: number;
        offset: number;
        returnDate?: string;
        checkedBags: number;
        carryOnBags: number;
        airlineName: string;
      }[] = [];

      // Stay-extra-day: fire immediately so it runs concurrently with offset batch 1
      const extendedReturn = actualReturnDate
        ? format(addDays(parseISO(actualReturnDate), 1), "yyyy-MM-dd")
        : null;
      const stayExtraDayPromise: Promise<FlightOffer | null> = extendedReturn
        ? searchFlightForDate(
            origin, destination, departureDate,
            passengers.adults, passengers.children, passengers.infants,
            cabinClass, extendedReturn
          ).catch(() => null)
        : Promise.resolve(null);

      // Process offsets in batches of 4 — with early exit once a great deal is found.
      // Closest dates run first (sorted above), so early exit fires sooner in practice.
      const BATCH_SIZE = 4;
      const EARLY_EXIT_PCT = 20; // stop if we find >20% savings — enough to show a deal
      for (let i = 0; i < WIDE_OFFSETS.length; i += BATCH_SIZE) {
        const batchOffsets = WIDE_OFFSETS.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.allSettled(
          batchOffsets.map(offset => {
            const altDate = format(addDays(parseISO(departureDate), offset), "yyyy-MM-dd");
            const altRet = actualReturnDate
              ? format(addDays(parseISO(actualReturnDate), offset), "yyyy-MM-dd")
              : undefined;
            return searchFlightForDate(
              origin, destination, altDate,
              passengers.adults, passengers.children, passengers.infants,
              cabinClass, altRet
            ).then(offer => ({ offer, offset, altDate, altRet }));
          })
        );
        for (const r of batchResults) {
          if (r.status === "fulfilled" && r.value.offer) {
            candidates.push({
              date: r.value.altDate,
              price: parseFloat(r.value.offer.total_amount),
              offset: r.value.offset,
              returnDate: r.value.altRet,
              checkedBags: r.value.offer.checkedBags ?? 0,
              carryOnBags: r.value.offer.carryOnBags ?? 0,
              airlineName: r.value.offer.owner?.name ?? "",
            });
          }
        }
        // Early exit: if a great deal is already visible, skip remaining batches
        if (candidates.length > 0) {
          const bestSavings = Math.max(...candidates.map(c => currentPrice - c.price));
          if ((bestSavings / currentPrice) * 100 >= EARLY_EXIT_PCT) break;
        }
      }

      // Await stayExtraDay (usually resolved by now since it ran concurrently with batch 1)
      const stayExtraDayOffer = await stayExtraDayPromise;

      // Build main departure-shift opportunity
      let opportunity: GoldenOpportunity | null = null;
      if (candidates.length > 0) {
        const best = candidates.reduce((a, b) => b.price < a.price ? b : a);
        const savings = currentPrice - best.price;
        const savingsPct = (savings / currentPrice) * 100;
        const minPct = daysUntilDeparture < 7 ? 15 : 5;
        const meetsThreshold = savings >= 25 && savingsPct >= minPct;
        if (meetsThreshold) {
          opportunity = {
            currentDepartureDate: departureDate,
            alternateDepartureDate: best.date,
            alternateReturnDate: best.returnDate,
            currentPrice,
            alternatePrice: best.price,
            savings,
            savingsPercent: savingsPct,
            currency: currentCurrency,
            dayOffset: best.offset,
            alternateCheckedBags: best.checkedBags,
            alternateCarryOnBags: best.carryOnBags,
            airlineName: best.airlineName,
          };
        }
      }

      // Stay-extra-day result (already computed in parallel above)
      let stayExtraDay: StayExtraDayInsight | null = null;
      if (extendedReturn && stayExtraDayOffer) {
        const extendedPrice = parseFloat(stayExtraDayOffer.total_amount);
        const extSavings = currentPrice - extendedPrice;
        const extSavingsPct = (extSavings / currentPrice) * 100;
        if (extSavings > 0 && extSavingsPct >= 5) {
          stayExtraDay = {
            returnDate: extendedReturn,
            alternatePrice: extendedPrice,
            savings: extSavings,
            savingsPercent: extSavingsPct,
            currency: currentCurrency,
          };
        }
      }

      const priceMap = candidates.map(c => ({ date: c.date, price: c.price, currency: currentCurrency }));
      res.json({ opportunity, stayExtraDay, priceMap, currentPrice, currentCurrency });
    } catch (err: any) {
      console.error("Wide insight error:", err);
      res.status(500).json({ opportunity: null, stayExtraDay: null, priceMap: [], currentPrice: 0, currentCurrency: "USD" });
    }
  });

  // --- Fetch a specific offer by ID (Travelpayouts offers are ephemeral; return 404 gracefully) ---
  app.get("/api/flights/offer/:offerId", async (req, res) => {
    res.status(404).json({ error: "Offer lookup not supported — re-search to get fresh prices." });
  });

  // --- Multi-City Insight Engine + Stay Optimizer ---
  app.post("/api/flights/multi-city-insight", searchRateLimit, async (req, res) => {
    try {
      const { segments, passengers, cabinClass } = req.body as {
        segments: MultiCitySegment[];
        passengers: { adults: number; children: number; infants: number };
        cabinClass: string;
      };
      if (!segments || segments.length < 2) {
        return res.status(400).json({ error: "At least 2 segments required" });
      }
      const { adults, children, infants } = passengers;

      // 1. Baseline: search the full multi-city itinerary
      const baselineOffers = await searchFlights({
        origin: segments[0].origin,
        destination: segments[segments.length - 1].destination,
        departureDate: segments[0].departureDate,
        adults, children, infants,
        cabinClass: cabinClass as any,
        maxOffers: 1,
        segments,
      });

      if (baselineOffers.length === 0) {
        return res.json({ insight: null, stayOptimizerDeals: [] });
      }
      const baselineTotal = parseFloat(baselineOffers[0].total_amount);

      // 2. Window search: shift the entire itinerary by ±7 days, maintaining all gaps
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = addDays(today, 1);
      const ALL_OFFSETS = [-7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7];
      const validOffsets = ALL_OFFSETS.filter(offset =>
        segments.every((s: MultiCitySegment) => addDays(parseISO(s.departureDate), offset) >= tomorrow)
      );

      const windowResults: Array<{ offset: number; total: number; currency: string }> = [];
      const BATCH_SIZE = 3;
      for (let b = 0; b < validOffsets.length; b += BATCH_SIZE) {
        const batch = validOffsets.slice(b, b + BATCH_SIZE);
        if (b > 0) await new Promise(r => setTimeout(r, 300));
        const batchResults = await Promise.allSettled(
          batch.map(async (offset) => {
            const shiftedSegments = segments.map((s: MultiCitySegment) => ({
              ...s,
              departureDate: format(addDays(parseISO(s.departureDate), offset), "yyyy-MM-dd"),
            }));
            const offers = await searchFlights({
              origin: shiftedSegments[0].origin,
              destination: shiftedSegments[shiftedSegments.length - 1].destination,
              departureDate: shiftedSegments[0].departureDate,
              adults, children, infants,
              cabinClass: cabinClass as any,
              maxOffers: 1,
              segments: shiftedSegments,
            });
            if (offers.length === 0) throw new Error("no offers");
            return { offset, total: parseFloat(offers[0].total_amount), currency: offers[0].total_currency };
          })
        );
        for (const r of batchResults) {
          if (r.status === "fulfilled") windowResults.push(r.value);
        }
      }

      let insight: MultiCityInsightResult | null = null;
      if (windowResults.length > 0) {
        const best = windowResults.reduce((b, c) => c.total < b.total ? c : b);
        const savings = baselineTotal - best.total;
        if (savings >= 50) {
          const optimizedSegments = segments.map((s: MultiCitySegment) => ({
            ...s,
            departureDate: format(addDays(parseISO(s.departureDate), best.offset), "yyyy-MM-dd"),
          }));
          insight = {
            originalTotal: baselineTotal,
            optimizedTotal: best.total,
            savings,
            savingsPercent: (savings / baselineTotal) * 100,
            shiftDays: best.offset,
            optimizedSegments,
            currency: best.currency,
            stayOptimizerDeals: [],
          };
        }
      }

      // 3. Stay Optimizer: check adjacent segment pairs with gap >= 2 departure-days
      const stayOptimizerDeals: StayOptimizerDeal[] = [];
      const HOTEL_ESTIMATE_PER_NIGHT = 80;

      for (let i = 0; i < segments.length - 1; i++) {
        const segA = segments[i];
        const segB = segments[i + 1];
        const depA = parseISO(segA.departureDate);
        const depB = parseISO(segB.departureDate);
        const gapDays = differenceInDays(depB, depA);

        if (gapDays >= 2) {
          // Compare: flying segB on connection date (depA + 1) vs the actual later date
          const connectionDate = format(addDays(depA, 1), "yyyy-MM-dd");
          const [connectionResult, actualResult] = await Promise.allSettled([
            searchFlightForDate(segB.origin, segB.destination, connectionDate, adults, children, infants, cabinClass),
            searchFlightForDate(segB.origin, segB.destination, segB.departureDate, adults, children, infants, cabinClass),
          ]);

          if (
            connectionResult.status === "fulfilled" && connectionResult.value &&
            actualResult.status === "fulfilled" && actualResult.value
          ) {
            const connectionPrice = parseFloat(connectionResult.value.total_amount);
            const actualPrice = parseFloat(actualResult.value.total_amount);
            const priceDrop = connectionPrice - actualPrice;
            const gapNights = gapDays - 1;
            const totalHotelCost = gapNights * HOTEL_ESTIMATE_PER_NIGHT;
            const netSavings = priceDrop - totalHotelCost;

            if (priceDrop > 50 && netSavings > 0) {
              const checkIn = segA.departureDate;
              const checkOut = segB.departureDate;
              const bookingUrl = `/go/agoda`;
              stayOptimizerDeals.push({
                segmentIdx: i,
                stopoverCity: segB.origin,
                gapNights,
                priceDrop,
                totalHotelCost,
                netSavings,
                currency: actualResult.value.total_currency,
                checkIn,
                checkOut,
                bookingUrl,
                checkedBags: connectionResult.value.checkedBags ?? 0,
                carryOnBags: connectionResult.value.carryOnBags ?? 0,
              });
            }
          }
        }
      }

      res.json({ insight, stayOptimizerDeals });
    } catch (err: any) {
      console.error("Multi-city insight error:", err);
      res.status(500).json({ insight: null, stayOptimizerDeals: [] });
    }
  });

  // IATA airport code → actual city name (used so "John F. Kennedy Intl" → "New York", "O'Hare" → "Chicago", etc.)
  const IATA_CITY_MAP: Record<string, string> = {
    JFK: "New York", LGA: "New York", EWR: "Newark",
    LAX: "Los Angeles", SFO: "San Francisco", SJC: "San Jose",
    ORD: "Chicago", MDW: "Chicago",
    MIA: "Miami", FLL: "Fort Lauderdale",
    ATL: "Atlanta", DFW: "Dallas", DAL: "Dallas",
    DEN: "Denver", SEA: "Seattle", BOS: "Boston",
    IAD: "Washington DC", DCA: "Washington DC", BWI: "Baltimore",
    PHX: "Phoenix", LAS: "Las Vegas", MSP: "Minneapolis",
    DTW: "Detroit", CLT: "Charlotte", PHL: "Philadelphia",
    HOU: "Houston", IAH: "Houston", MSY: "New Orleans",
    YYZ: "Toronto", YVR: "Vancouver", YUL: "Montreal",
    LHR: "London", LGW: "London", STN: "London", LTN: "London",
    CDG: "Paris", ORY: "Paris",
    AMS: "Amsterdam", FRA: "Frankfurt", MUC: "Munich",
    MAD: "Madrid", BCN: "Barcelona",
    FCO: "Rome", MXP: "Milan", LIN: "Milan",
    ZRH: "Zurich", VIE: "Vienna", BRU: "Brussels",
    CPH: "Copenhagen", ARN: "Stockholm", HEL: "Helsinki", OSL: "Oslo",
    IST: "Istanbul", SAW: "Istanbul",
    DXB: "Dubai", AUH: "Abu Dhabi", DOH: "Doha", KWI: "Kuwait City",
    RUH: "Riyadh", JED: "Jeddah", BAH: "Bahrain",
    SIN: "Singapore",
    KUL: "Kuala Lumpur",
    BKK: "Bangkok", DMK: "Bangkok",
    HKG: "Hong Kong",
    NRT: "Tokyo", HND: "Tokyo",
    ICN: "Seoul", GMP: "Seoul",
    PEK: "Beijing", PKX: "Beijing",
    PVG: "Shanghai", SHA: "Shanghai",
    CAN: "Guangzhou", SZX: "Shenzhen",
    DEL: "Delhi", BOM: "Mumbai", MAA: "Chennai", BLR: "Bangalore",
    HYD: "Hyderabad", CCU: "Kolkata", AMD: "Ahmedabad",
    KTM: "Kathmandu",
    CMB: "Colombo",
    DAC: "Dhaka",
    KHI: "Karachi", LHE: "Lahore", ISB: "Islamabad",
    CGK: "Jakarta", SUB: "Surabaya", DPS: "Bali",
    MNL: "Manila",
    SGN: "Ho Chi Minh City", HAN: "Hanoi",
    RGN: "Yangon",
    DAD: "Da Nang",
    SYD: "Sydney", MEL: "Melbourne", BNE: "Brisbane", PER: "Perth",
    AKL: "Auckland",
    JNB: "Johannesburg", CPT: "Cape Town", NBO: "Nairobi",
    CAI: "Cairo",
    ADD: "Addis Ababa",
    LOS: "Lagos", ABV: "Abuja",
    GRU: "São Paulo", CGH: "São Paulo",
    GIG: "Rio de Janeiro",
    BOG: "Bogotá", LIM: "Lima", SCL: "Santiago",
    EZE: "Buenos Aires", MVD: "Montevideo",
    MEX: "Mexico City",
    YMX: "Montreal",
  };

  function hubCityName(iataCode: string, apiName?: string): string {
    if (IATA_CITY_MAP[iataCode]) return IATA_CITY_MAP[iataCode];
    if (apiName) {
      return apiName
        .replace(/\s+International\s+Airport\s*/gi, "")
        .replace(/\s+Airport\s*/gi, "")
        .replace(/\s+International\s*/gi, "")
        .trim() || iataCode;
    }
    return iataCode;
  }

  // --- Hub Leg Stay Optimizer: detect transit cities from connecting flights & find split-ticket deals ---
  app.post("/api/flights/hub-stay-optimizer", searchRateLimit, async (req, res) => {
    try {
      const { origin, destination, departureDate, passengers, cabinClass } = req.body as {
        origin: string;
        destination: string;
        departureDate: string;
        passengers: { adults: number; children: number; infants: number };
        cabinClass: string;
      };
      if (!origin || !destination || !departureDate) {
        return res.json({ deal: null });
      }
      const { adults, children, infants } = passengers;

      // 1. Get cheapest offers (up to 5) to detect connecting itineraries
      const offers = await searchFlights({
        origin, destination, departureDate,
        adults, children, infants,
        cabinClass: cabinClass as any,
        maxOffers: 5,
      });

      if (offers.length === 0) return res.json({ deal: null });

      const cheapestFare = parseFloat(offers[0].total_amount);
      const fareCurrency = offers[0].total_currency;

      // 2. Find transit cities from connecting flights (layover < 12h in outbound slice)
      const seen = new Set<string>();
      const transitCandidates: { iataCode: string; cityName: string }[] = [];

      for (const offer of offers) {
        const outboundSlice = offer.slices[0];
        if (!outboundSlice || !outboundSlice.segments || outboundSlice.segments.length < 2) continue;

        for (let i = 0; i < outboundSlice.segments.length - 1; i++) {
          const seg = outboundSlice.segments[i];
          const nextSeg = outboundSlice.segments[i + 1];
          const transitCode = seg.destination.iata_code;

          if (transitCode === origin || transitCode === destination || seen.has(transitCode)) continue;
          seen.add(transitCode);

          const arrivalMs = new Date(seg.arrival_at).getTime();
          const departureMs = new Date(nextSeg.departure_at).getTime();
          const layoverMinutes = (departureMs - arrivalMs) / 60000;

          if (layoverMinutes > 0 && layoverMinutes < 12 * 60) {
            transitCandidates.push({
              iataCode: transitCode,
              cityName: hubCityName(transitCode, seg.destination.name),
            });
          }
        }
      }

      if (transitCandidates.length === 0) return res.json({ deal: null });

      // 3. For each transit city, search split tickets across ±3 departure-date shifts × 1-3 stay nights
      //    This detects deals where flying earlier/later and pausing at the hub saves money.
      const NET_SAVINGS_THRESHOLD = 100;
      let bestDeal: HubStayDeal | null = null;

      // Departure offsets: -3 to +3 days. Stay nights: 1, 2, 3.
      const depOffsets = [-3, -2, -1, 0, 1, 2, 3];
      const stayOptions = [1, 2, 3];

      for (const transit of transitCandidates.slice(0, 2)) {
        // Build all (depOffset, stayNights) combinations and run in parallel
        const combinations = depOffsets.flatMap(depOffset =>
          stayOptions.map(nights => ({ depOffset, nights }))
        );

        // Pre-fetch all unique leg1 dates in parallel (7 searches, not 21)
        const leg1DateMap = new Map<string, number | null>(); // date → price or null
        await Promise.allSettled(
          depOffsets.map(async (depOffset) => {
            const leg1Date = format(addDays(parseISO(departureDate), depOffset), "yyyy-MM-dd");
            const offer = await searchFlightForDate(origin, transit.iataCode, leg1Date, adults, children, infants, cabinClass);
            leg1DateMap.set(leg1Date, offer ? parseFloat(offer.total_amount) : null);
          })
        );

        // Fetch all leg2 dates in parallel (21 searches)
        const results = await Promise.allSettled(
          combinations.map(async ({ depOffset, nights }) => {
            const leg1Date = format(addDays(parseISO(departureDate), depOffset), "yyyy-MM-dd");
            const leg2Date = format(addDays(parseISO(leg1Date), nights), "yyyy-MM-dd");
            const leg1Price = leg1DateMap.get(leg1Date);
            if (leg1Price == null) return null;

            const leg2Offer = await searchFlightForDate(transit.iataCode, destination, leg2Date, adults, children, infants, cabinClass);
            if (!leg2Offer) return null;
            return {
              depOffset,
              nights,
              leg1Date,
              leg2Date,
              leg1Price,
              leg2Price: parseFloat(leg2Offer.total_amount),
              checkedBags: leg2Offer.checkedBags ?? 0,
              carryOnBags: leg2Offer.carryOnBags ?? 0,
            };
          })
        );

        for (const r of results) {
          if (r.status !== "fulfilled" || !r.value) continue;
          const { depOffset, nights, leg1Date, leg2Date, leg1Price, leg2Price, checkedBags, carryOnBags } = r.value;
          const netSavings = cheapestFare - (leg1Price + leg2Price);
          if (netSavings >= NET_SAVINGS_THRESHOLD) {
            if (!bestDeal || netSavings > bestDeal.netSavings) {
              bestDeal = {
                transitCity: transit.iataCode,
                transitCityName: transit.cityName,
                originalFare: cheapestFare,
                leg1Price,
                leg2Price,
                netSavings,
                currency: fareCurrency,
                leg1Date,
                leg2Date,
                leg2OffsetDays: nights,
                leg1DateOffset: depOffset,
                checkedBags,
                carryOnBags,
                bookingUrl: `/go/agoda`,
              };
            }
          }
        }
      }

      res.json({ deal: bestDeal });
    } catch (err: any) {
      console.error("Hub stay optimizer error:", err);
      res.json({ deal: null });
    }
  });

  // ── Auth middleware helper ─────────────────────────────────────────────────
  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Not authenticated" });
    next();
  }

  // ── Auth routes ───────────────────────────────────────────────────────────

  // GET current user
  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated() || !req.user) return res.json({ user: null });
    res.json({ user: req.user });
  });

  // POST signup
  app.post("/api/auth/signup", async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

    const { email, password, name } = parsed.data;
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ error: "An account with that email already exists." });

    const passwordHash = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString("hex");
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await storage.createUser({
      email,
      passwordHash,
      name: name ?? null,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email (non-blocking — login proceeds regardless)
    sendVerificationEmail(email, name ?? null, verificationToken).catch(() => {});

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: "Login after signup failed" });
      res.json({ user, verificationEmailSent: true });
    });
  });

  // GET verify email via token link
  app.get("/api/auth/verify-email", async (req, res) => {
    const token = req.query.token as string;
    if (!token) return res.redirect("/?verified=invalid");

    const user = await storage.verifyUserEmail(token);
    if (!user) return res.redirect("/?verified=invalid");

    // Log the user in if not already
    req.login(user, (err) => {
      if (err) {
        console.error("[auth] Login after verification failed:", err);
        return res.redirect("/?verified=success");
      }
      req.session.save(() => res.redirect("/?verified=success"));
    });
  });

  // POST login (email/password)
  app.post("/api/auth/login", (req, res, next) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message ?? "Invalid credentials." });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        res.json({ user });
      });
    })(req, res, next);
  });

  // GET Google OAuth
  app.get("/api/auth/google", (req, res, next) => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(501).json({ error: "Google login is not configured." });
    }
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  // GET Google OAuth callback
  app.get("/api/auth/google/callback", (req, res, next) => {
    passport.authenticate("google", {}, (err: any, user: any) => {
      if (err) {
        const msg = err?.message ?? "";
        const isMismatch = msg.toLowerCase().includes("redirect_uri_mismatch") || msg.toLowerCase().includes("redirect uri");
        if (isMismatch) {
          const expectedURI = encodeURIComponent(
            process.env.OAUTH_CALLBACK_URL
              ? process.env.OAUTH_CALLBACK_URL
              : process.env.NODE_ENV === "production"
                ? `${process.env.APP_URL || "https://himaltohorizon.com"}/api/auth/google/callback`
                : process.env.REPLIT_DOMAINS
                  ? `https://${process.env.REPLIT_DOMAINS}/api/auth/google/callback`
                  : `http://localhost:${process.env.PORT || 5000}/api/auth/google/callback`
          );
          console.error(`[google-oauth] redirect_uri_mismatch — add this URI to Google Cloud Console: ${decodeURIComponent(expectedURI)}`);
          return res.redirect(`/?auth_error=redirect_uri_mismatch&uri=${expectedURI}`);
        }
        console.error("[google-oauth] error:", msg);
        return res.redirect("/?auth_error=google");
      }
      if (!user) return res.redirect("/?auth_error=google");
      req.login(user, (loginErr) => {
        if (loginErr) return res.redirect("/?auth_error=google");
        // Explicitly save the session to the store before redirecting —
        // prevents a race condition where the browser follows the redirect
        // and hits /api/auth/me before the session is written to PostgreSQL.
        req.session.save((saveErr) => {
          if (saveErr) return res.redirect("/?auth_error=google");
          res.redirect("/");
        });
      });
    })(req, res, next);
  });

  // POST logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      req.session.destroy(() => {
        res.clearCookie("connect.sid");
        res.json({ ok: true });
      });
    });
  });

  // PUT update profile (home airport, name)
  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    const { name, homeAirport, homeAirportLabel } = req.body;
    const updated = await storage.updateUser((req.user as any).id, { name, homeAirport, homeAirportLabel });
    res.json({ user: updated });
  });

  // GET favorite routes
  app.get("/api/favorites", requireAuth, async (req, res) => {
    const routes = await storage.getFavoriteRoutes((req.user as any).id);
    res.json({ routes });
  });

  // POST add favorite route
  app.post("/api/favorites", requireAuth, async (req, res) => {
    const { origin, destination, originLabel, destinationLabel } = req.body;
    if (!origin || !destination) return res.status(400).json({ error: "origin and destination required" });
    const route = await storage.addFavoriteRoute((req.user as any).id, origin, destination, originLabel, destinationLabel);
    res.json({ route });
  });

  // DELETE favorite route
  app.delete("/api/favorites/:id", requireAuth, async (req, res) => {
    await storage.removeFavoriteRoute((req.user as any).id, Number(req.params.id));
    res.json({ ok: true });
  });

  // ── Route price history (Horizon's Prediction) ─────────────────────────────

  app.post("/api/prices/record", async (req, res) => {
    try {
      const { origin, destination, departureDate, cabinClass, price, currency } = req.body;
      if (!origin || !destination || !departureDate || !price) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      await storage.recordRoutePrice(
        String(origin).toUpperCase().trim(),
        String(destination).toUpperCase().trim(),
        String(departureDate),
        String(cabinClass || "economy"),
        parseFloat(price),
        String(currency || "USD")
      );
      res.json({ ok: true });
    } catch (err: any) {
      console.error("Record route price error:", err);
      res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/prices/stats", async (req, res) => {
    try {
      const origin = (req.query.origin as string ?? "").toUpperCase().trim();
      const destination = (req.query.destination as string ?? "").toUpperCase().trim();
      const departureDate = (req.query.departureDate as string ?? "");
      const cabinClass = (req.query.cabinClass as string ?? "economy");
      if (!origin || !destination || !departureDate) {
        return res.status(400).json({ error: "Missing required query params" });
      }
      const stats = await storage.getRouteStats(origin, destination, departureDate, cabinClass);

      // Compute prediction from stats
      let prediction: "buy_now" | "wait" | null = null;
      if (stats.avgPrice !== null && stats.dataPoints >= 3) {
        const currentEntries = stats.trend;
        if (currentEntries.length > 0) {
          const latestPrice = currentEntries[currentEntries.length - 1].avgPrice;
          const pct = ((latestPrice - stats.avgPrice) / stats.avgPrice) * 100;
          if (pct <= -10) prediction = "buy_now";
          else if (pct >= 10) prediction = "wait";
        }
      }

      res.json({ ...stats, prediction });
    } catch (err: any) {
      console.error("Get route stats error:", err);
      res.status(500).json({ error: err?.message });
    }
  });

  // ── Conversion / Insight Event Tracking ───────────────────────────────────

  app.post("/api/events/track", async (req, res) => {
    try {
      const { eventType, origin, destination, departureDate, savingsPct, savingsAmount, currency } = req.body;
      if (!eventType) return res.status(400).json({ error: "eventType required" });
      const userId = req.isAuthenticated() ? (req.user as any).id : undefined;
      await storage.trackInsightEvent(
        String(eventType),
        origin ? String(origin).toUpperCase().trim() : undefined,
        destination ? String(destination).toUpperCase().trim() : undefined,
        departureDate ? String(departureDate) : undefined,
        savingsPct != null ? parseFloat(savingsPct) : undefined,
        savingsAmount != null ? parseFloat(savingsAmount) : undefined,
        currency ? String(currency) : undefined,
        userId
      );
      res.json({ ok: true });
    } catch (err: any) {
      console.error("Event track error:", err);
      res.status(500).json({ error: err?.message });
    }
  });

  app.get("/api/events/insights", requireAuth, async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string ?? "20", 10);
      const rows = await storage.getTopInsightRoutes(Math.min(limit, 100));
      res.json({ insights: rows });
    } catch (err: any) {
      res.status(500).json({ error: err?.message });
    }
  });

  // ── Price alert routes ─────────────────────────────────────────────────────

  // GET list alerts
  app.get("/api/alerts", requireAuth, async (req, res) => {
    const alerts = await storage.getPriceAlerts((req.user as any).id);
    res.json({ alerts });
  });

  // POST create alert
  app.post("/api/alerts", requireAuth, async (req, res) => {
    const parsed = createAlertSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
    const alert = await storage.createPriceAlert((req.user as any).id, parsed.data);
    res.json({ alert });
  });

  // DELETE deactivate alert
  app.delete("/api/alerts/:id", requireAuth, async (req, res) => {
    await storage.deactivatePriceAlert((req.user as any).id, Number(req.params.id));
    res.json({ ok: true });
  });

  // POST check alerts (internal: called after wide-insight scan detects a deal)
  // This is triggered server-side within the wide-insight route when a deal is found
  // Also accessible as a webhook for future cron job usage
  app.post("/api/alerts/check", async (req, res) => {
    try {
      const { origin, destination, departureDate, returnDate, newPrice, currency } = req.body;
      if (!origin || !destination || !departureDate || !newPrice) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const allAlerts = await storage.getAllActiveAlerts();
      const matching = allAlerts.filter(
        (a) =>
          a.origin === origin &&
          a.destination === destination &&
          a.departureDate === departureDate &&
          (!returnDate || !a.returnDate || a.returnDate === returnDate)
      );
      let sent = 0;
      for (const alert of matching) {
        const savings = alert.baselinePrice - newPrice;
        const savingsPercent = (savings / alert.baselinePrice) * 100;
        if (savingsPercent < 5) continue;
        // Prevent sending more than once per 24h per alert
        if (alert.lastAlertedAt) {
          const lastSent = new Date(alert.lastAlertedAt).getTime();
          if (Date.now() - lastSent < 24 * 60 * 60 * 1000) continue;
        }
        const ok = await sendPriceAlertEmail({
          toEmail: alert.userEmail,
          toName: alert.userName ?? "",
          origin,
          destination,
          departureDate,
          returnDate,
          baselinePrice: alert.baselinePrice,
          newPrice,
          savings,
          savingsPercent,
          currency: alert.currency ?? currency,
        });
        if (ok) {
          await storage.markAlertSent(alert.id);
          sent++;
        }
      }
      res.json({ checked: matching.length, sent });
    } catch (err: any) {
      console.error("Alert check error:", err);
      res.status(500).json({ error: err?.message });
    }
  });

  // ── Horizon Hop: single-ticket multi-city via hub with 48–72 hr stopover ──
  app.post("/api/flights/horizon-hop", searchRateLimit, async (req, res) => {
    try {
      const { origin, destination, departureDate, returnDate, passengers, cabinClass, directPrice } = req.body as {
        origin: string; destination: string; departureDate: string; returnDate?: string;
        passengers: { adults: number; children: number; infants: number };
        cabinClass: string; directPrice?: number;
      };
      if (!origin || !destination || !departureDate) return res.json({ hop: null });

      const { adults, children, infants } = passengers;

      // ── Hub & airport coordinate tables ────────────────────────────────────
      const HUB_CANDIDATES = [
        // ── Middle East ────────────────────────────────────────────────────────
        { iata: "DOH", city: "Doha",          lat:  25.27, lon:  51.61 },
        { iata: "DXB", city: "Dubai",         lat:  25.25, lon:  55.37 },
        { iata: "AUH", city: "Abu Dhabi",     lat:  24.43, lon:  54.65 },
        { iata: "RUH", city: "Riyadh",        lat:  24.96, lon:  46.70 },
        { iata: "AMM", city: "Amman",         lat:  31.72, lon:  35.99 },
        // ── Europe ─────────────────────────────────────────────────────────────
        { iata: "IST", city: "Istanbul",      lat:  41.28, lon:  28.75 },
        { iata: "AMS", city: "Amsterdam",     lat:  52.31, lon:   4.76 },
        { iata: "LHR", city: "London",        lat:  51.48, lon:  -0.45 },
        { iata: "FRA", city: "Frankfurt",     lat:  50.03, lon:   8.57 },
        { iata: "CDG", city: "Paris",         lat:  49.01, lon:   2.55 },
        { iata: "MAD", city: "Madrid",        lat:  40.47, lon:  -3.56 },
        { iata: "FCO", city: "Rome",          lat:  41.80, lon:  12.25 },
        { iata: "MUC", city: "Munich",        lat:  48.35, lon:  11.79 },
        { iata: "ZRH", city: "Zurich",        lat:  47.46, lon:   8.55 },
        { iata: "VIE", city: "Vienna",        lat:  48.12, lon:  16.57 },
        { iata: "BCN", city: "Barcelona",     lat:  41.30, lon:   2.08 },
        { iata: "CPH", city: "Copenhagen",    lat:  55.62, lon:  12.66 },
        { iata: "ARN", city: "Stockholm",     lat:  59.65, lon:  17.92 },
        // ── Africa ─────────────────────────────────────────────────────────────
        { iata: "CAI", city: "Cairo",         lat:  30.12, lon:  31.41 },
        { iata: "ADD", city: "Addis Ababa",   lat:   8.98, lon:  38.80 },
        { iata: "NBO", city: "Nairobi",       lat:  -1.32, lon:  36.93 },
        { iata: "JNB", city: "Johannesburg",  lat: -26.13, lon:  28.24 },
        { iata: "CMN", city: "Casablanca",    lat:  33.37, lon:  -7.59 },
        { iata: "LOS", city: "Lagos",         lat:   6.58, lon:   3.32 },
        // ── South & Southeast Asia ────────────────────────────────────────────
        { iata: "DEL", city: "Delhi",         lat:  28.57, lon:  77.10 },
        { iata: "BOM", city: "Mumbai",        lat:  19.09, lon:  72.87 },
        { iata: "SIN", city: "Singapore",     lat:   1.37, lon: 103.99 },
        { iata: "KUL", city: "Kuala Lumpur",  lat:   2.74, lon: 101.71 },
        { iata: "BKK", city: "Bangkok",       lat:  13.69, lon: 100.75 },
        { iata: "CGK", city: "Jakarta",       lat:  -6.13, lon: 106.66 },
        { iata: "MNL", city: "Manila",        lat:  14.51, lon: 121.02 },
        // ── East Asia ─────────────────────────────────────────────────────────
        { iata: "HKG", city: "Hong Kong",     lat:  22.31, lon: 113.92 },
        { iata: "NRT", city: "Tokyo",         lat:  35.77, lon: 140.39 },
        { iata: "ICN", city: "Seoul",         lat:  37.46, lon: 126.44 },
        { iata: "PVG", city: "Shanghai",      lat:  31.14, lon: 121.81 },
        { iata: "PEK", city: "Beijing",       lat:  40.08, lon: 116.58 },
        { iata: "CAN", city: "Guangzhou",     lat:  23.39, lon: 113.30 },
        // ── Oceania ────────────────────────────────────────────────────────────
        { iata: "SYD", city: "Sydney",        lat: -33.94, lon: 151.18 },
        { iata: "MEL", city: "Melbourne",     lat: -37.67, lon: 144.84 },
        // ── North America ─────────────────────────────────────────────────────
        { iata: "JFK", city: "New York",      lat:  40.64, lon: -73.78 },
        { iata: "LAX", city: "Los Angeles",   lat:  33.94, lon: -118.41 },
        { iata: "MIA", city: "Miami",         lat:  25.79, lon: -80.29 },
        { iata: "ORD", city: "Chicago",       lat:  41.98, lon: -87.90 },
        { iata: "ATL", city: "Atlanta",       lat:  33.64, lon: -84.43 },
        { iata: "DFW", city: "Dallas",        lat:  32.90, lon: -97.04 },
        { iata: "SFO", city: "San Francisco", lat:  37.62, lon: -122.38 },
        { iata: "YYZ", city: "Toronto",       lat:  43.68, lon: -79.63 },
        { iata: "YVR", city: "Vancouver",     lat:  49.19, lon: -123.18 },
        { iata: "MEX", city: "Mexico City",   lat:  19.44, lon: -99.07 },
        { iata: "CUN", city: "Cancún",        lat:  21.04, lon: -86.87 },
        // ── Latin America ─────────────────────────────────────────────────────
        { iata: "GRU", city: "São Paulo",     lat: -23.43, lon: -46.47 },
        { iata: "EZE", city: "Buenos Aires",  lat: -34.82, lon: -58.54 },
        { iata: "BOG", city: "Bogotá",        lat:   4.70, lon: -74.15 },
        { iata: "LIM", city: "Lima",          lat: -12.02, lon: -77.11 },
        { iata: "SCL", city: "Santiago",      lat: -33.39, lon: -70.79 },
        { iata: "PTY", city: "Panama City",   lat:   9.07, lon: -79.38 },
      ];

      const AP: Record<string, { lat: number; lon: number }> = {
        MIA: { lat: 25.79, lon: -80.29 }, LAX: { lat: 33.94, lon: -118.41 },
        JFK: { lat: 40.64, lon: -73.78 }, EWR: { lat: 40.69, lon: -74.17 },
        ORD: { lat: 41.98, lon: -87.90 }, ATL: { lat: 33.64, lon: -84.43 },
        DFW: { lat: 32.90, lon: -97.04 }, BOS: { lat: 42.36, lon: -71.01 },
        SFO: { lat: 37.62, lon: -122.38 }, SEA: { lat: 47.44, lon: -122.31 },
        DEN: { lat: 39.86, lon: -104.67 }, TPA: { lat: 27.98, lon: -82.54 },
        RSW: { lat: 26.54, lon: -81.75 }, MCO: { lat: 28.43, lon: -81.31 },
        IAD: { lat: 38.94, lon: -77.46 }, PHL: { lat: 39.87, lon: -75.24 },
        LHR: { lat: 51.48, lon: -0.45 },  LGW: { lat: 51.16, lon: -0.18 },
        FRA: { lat: 50.03, lon: 8.57 },   CDG: { lat: 49.01, lon: 2.55 },
        AMS: { lat: 52.31, lon: 4.76 },   MAD: { lat: 40.47, lon: -3.56 },
        FCO: { lat: 41.80, lon: 12.25 },  MUC: { lat: 48.35, lon: 11.79 },
        VIE: { lat: 48.12, lon: 16.57 },  ZRH: { lat: 47.46, lon: 8.55 },
        IST: { lat: 41.28, lon: 28.75 },  BCN: { lat: 41.30, lon: 2.08 },
        CPH: { lat: 55.62, lon: 12.66 },  ARN: { lat: 59.65, lon: 17.92 },
        DOH: { lat: 25.27, lon: 51.61 },  DXB: { lat: 25.25, lon: 55.37 },
        AUH: { lat: 24.43, lon: 54.65 },  RUH: { lat: 24.96, lon: 46.70 },
        CAI: { lat: 30.12, lon: 31.41 },  AMM: { lat: 31.72, lon: 35.99 },
        SIN: { lat: 1.37, lon: 103.99 },  HKG: { lat: 22.31, lon: 113.92 },
        NRT: { lat: 35.77, lon: 140.39 }, ICN: { lat: 37.46, lon: 126.44 },
        PEK: { lat: 40.08, lon: 116.58 }, PVG: { lat: 31.14, lon: 121.81 },
        BOM: { lat: 19.09, lon: 72.87 },  DEL: { lat: 28.57, lon: 77.10 },
        BLR: { lat: 13.20, lon: 77.71 },  MAA: { lat: 12.99, lon: 80.18 },
        BKK: { lat: 13.69, lon: 100.75 }, KUL: { lat: 2.74, lon: 101.71 },
        CGK: { lat: -6.13, lon: 106.66 }, MNL: { lat: 14.51, lon: 121.02 },
        JNB: { lat: -26.13, lon: 28.24 }, NBO: { lat: -1.32, lon: 36.93 },
        ADD: { lat: 8.98, lon: 38.80 },   GRU: { lat: -23.43, lon: -46.47 },
        SYD: { lat: -33.94, lon: 151.18 }, MEL: { lat: -37.67, lon: 144.84 },
        YYZ: { lat: 43.68, lon: -79.63 }, YVR: { lat: 49.19, lon: -123.18 },
        MEX: { lat: 19.44, lon: -99.07 }, CUN: { lat: 21.04, lon: -86.87 },
        EZE: { lat: -34.82, lon: -58.54 }, BOG: { lat: 4.70, lon: -74.15 },
        LIM: { lat: -12.02, lon: -77.11 }, SCL: { lat: -33.39, lon: -70.79 },
        PTY: { lat: 9.07, lon: -79.38 },
        CMN: { lat: 33.37, lon: -7.59 }, LOS: { lat: 6.58, lon: 3.32 },
        CAN: { lat: 23.39, lon: 113.30 },
      };

      const hav = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371, d2r = Math.PI / 180;
        const dLat = (lat2 - lat1) * d2r, dLon = (lon2 - lon1) * d2r;
        const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * d2r) * Math.cos(lat2 * d2r) * Math.sin(dLon / 2) ** 2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const oc = AP[origin], dc = AP[destination];
      const directDist = oc && dc ? hav(oc.lat, oc.lon, dc.lat, dc.lon) : null;

      // Skip Horizon Hop for short routes (< 2500 km — sub-continental)
      if (directDist !== null && directDist < 2500) return res.json({ hop: null, reason: "route_too_short" });

      // ── Hub ranking helper ──────────────────────────────────────────────────
      type Hub = typeof HUB_CANDIDATES[0] & { detourRatio: number };
      const rankHubs = (fromIata: string, toIata: string, exclude: string[] = []): Hub[] => {
        const from = AP[fromIata], to = AP[toIata];
        const dd = from && to ? hav(from.lat, from.lon, to.lat, to.lon) : null;
        return HUB_CANDIDATES
          .filter(h => h.iata !== fromIata && h.iata !== toIata && !exclude.includes(h.iata))
          .map(h => ({
            ...h,
            detourRatio: from && to
              ? (hav(from.lat, from.lon, h.lat, h.lon) + hav(h.lat, h.lon, to.lat, to.lon)) / (dd ?? 1)
              : 1.5,
          }))
          .filter(h => h.detourRatio < 1.75)
          .sort((a, b) => a.detourRatio - b.detourRatio)
          .slice(0, 3);
      };

      const offsetDate = (dateStr: string, n: number): string => {
        const d = new Date(dateStr + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + n);
        return d.toISOString().slice(0, 10);
      };

      const outboundHubs = rankHubs(origin, destination);
      // Return hubs must not re-use the same airport as the best outbound hub candidate
      const topOutboundIata = outboundHubs[0]?.iata;
      const returnHubs = returnDate
        ? rankHubs(destination, origin, topOutboundIata ? [topOutboundIata] : [])
        : [];

      if (outboundHubs.length === 0 && returnHubs.length === 0) return res.json({ hop: null, reason: "no_hub_candidates" });

      const dp = typeof directPrice === "number" ? directPrice : null;
      const STAY_NIGHTS = [2, 3];

      // ── Build all parallel searches ─────────────────────────────────────────
      type HopCandidate = {
        direction: "outbound" | "return";
        hub: Hub;
        leg2Date: string;
        nightsAtHub: number;
        hopPrice: number;
        currency: string;
        offerId: string;
        checkedBags?: number;
        carryOnBags?: number;
      };

      const searches: Promise<HopCandidate | null>[] = [];

      // Outbound hops: single-ticket (origin → hub → dest), return flight separate
      for (const hub of outboundHubs) {
        for (const nights of STAY_NIGHTS) {
          const leg2Date = offsetDate(departureDate, nights);
          searches.push((async (): Promise<HopCandidate | null> => {
            try {
              const offers = await searchFlights({
                segments: [
                  { origin, destination: hub.iata, departureDate },
                  { origin: hub.iata, destination, departureDate: leg2Date },
                ],
                adults, children, infants,
                cabinClass: cabinClass as any,
                maxOffers: 1,
              });
              if (!offers?.length) return null;
              const offer = offers[0];
              const price = parseFloat(offer.total_amount);
              if (isNaN(price)) return null;
              const bags0 = (offer.slices?.[0]?.segments?.[0] as any)?.passengers?.[0];
              return {
                direction: "outbound",
                hub, leg2Date, nightsAtHub: nights,
                hopPrice: price,
                currency: offer.total_currency,
                offerId: offer.id,
                checkedBags: bags0?.baggageAllowance?.checkedBags ?? undefined,
                carryOnBags: bags0?.baggageAllowance?.carryOnBags ?? undefined,
              };
            } catch { return null; }
          })());
        }
      }

      // Return hops: single-ticket (dest → hub → origin), outbound flight separate
      for (const hub of returnHubs) {
        for (const nights of STAY_NIGHTS) {
          if (!returnDate) continue;
          const leg2Date = offsetDate(returnDate, nights);
          searches.push((async (): Promise<HopCandidate | null> => {
            try {
              const offers = await searchFlights({
                segments: [
                  { origin: destination, destination: hub.iata, departureDate: returnDate },
                  { origin: hub.iata, destination: origin, departureDate: leg2Date },
                ],
                adults, children, infants,
                cabinClass: cabinClass as any,
                maxOffers: 1,
              });
              if (!offers?.length) return null;
              const offer = offers[0];
              const price = parseFloat(offer.total_amount);
              if (isNaN(price)) return null;
              const bags0 = (offer.slices?.[0]?.segments?.[0] as any)?.passengers?.[0];
              return {
                direction: "return",
                hub, leg2Date, nightsAtHub: nights,
                hopPrice: price,
                currency: offer.total_currency,
                offerId: offer.id,
                checkedBags: bags0?.baggageAllowance?.checkedBags ?? undefined,
                carryOnBags: bags0?.baggageAllowance?.carryOnBags ?? undefined,
              };
            } catch { return null; }
          })());
        }
      }

      // Companion direct tickets (one-way searches for the non-hop legs)
      let directOutboundPrice: number | null = null;
      let directOutboundOfferId: string | null = null;
      let directReturnPrice: number | null = null;
      let directReturnOfferId: string | null = null;

      const directSearches: Promise<void>[] = [];
      if (returnDate && returnHubs.length > 0) {
        // Need direct outbound price to pair with return hops
        directSearches.push((async () => {
          try {
            const offers = await searchFlights({
              segments: [{ origin, destination, departureDate }],
              adults, children, infants,
              cabinClass: cabinClass as any,
              maxOffers: 1,
            });
            if (offers?.length) {
              directOutboundPrice = parseFloat(offers[0].total_amount);
              directOutboundOfferId = offers[0].id;
            }
          } catch { /* ignore */ }
        })());
      }
      if (returnDate && outboundHubs.length > 0) {
        // Need direct return price to pair with outbound hops
        directSearches.push((async () => {
          try {
            const offers = await searchFlights({
              segments: [{ origin: destination, destination: origin, departureDate: returnDate }],
              adults, children, infants,
              cabinClass: cabinClass as any,
              maxOffers: 1,
            });
            if (offers?.length) {
              directReturnPrice = parseFloat(offers[0].total_amount);
              directReturnOfferId = offers[0].id;
            }
          } catch { /* ignore */ }
        })());
      }

      // Execute all in parallel
      const [hopResults] = await Promise.all([
        Promise.allSettled(searches).then(rs =>
          rs.filter(r => r.status === "fulfilled" && r.value !== null)
            .map(r => (r as PromiseFulfilledResult<HopCandidate>).value)
        ),
        Promise.all(directSearches),
      ]);

      if (hopResults.length === 0) {
        console.log(`[horizon-hop] All ${searches.length} hub searches failed (likely rate-limited)`);
        return res.json({ hop: null, reason: "all_searches_failed" });
      }

      // ── Compute total cost and pick winner ──────────────────────────────────
      type ScoredHop = HopCandidate & { totalPrice: number; companionPrice: number | null; companionOfferId: string | null; companionDepartureDate: string | null };

      const scored: ScoredHop[] = hopResults.map(h => {
        let totalPrice: number;
        let companionPrice: number | null = null;
        let companionOfferId: string | null = null;
        let companionDepartureDate: string | null = null;

        if (returnDate) {
          if (h.direction === "outbound" && directReturnPrice !== null) {
            totalPrice = h.hopPrice + directReturnPrice;
            companionPrice = directReturnPrice;
            companionOfferId = directReturnOfferId;
            companionDepartureDate = returnDate;
          } else if (h.direction === "return" && directOutboundPrice !== null) {
            totalPrice = directOutboundPrice + h.hopPrice;
            companionPrice = directOutboundPrice;
            companionOfferId = directOutboundOfferId;
            companionDepartureDate = departureDate;
          } else {
            // Can't compute full round trip total — skip
            totalPrice = h.hopPrice * 2; // rough estimate, will be filtered out if too high
          }
        } else {
          totalPrice = h.hopPrice;
        }
        return { ...h, totalPrice, companionPrice, companionOfferId, companionDepartureDate };
      });

      // Filter: only show hops cheaper or within 5% of direct price
      const viable = dp !== null
        ? scored.filter(h => h.totalPrice <= dp * 1.05)
        : scored;

      if (viable.length === 0) {
        // All hubs found results but none beat the direct price threshold
        const cheapestHop = scored.sort((a, b) => a.totalPrice - b.totalPrice)[0];
        const extraCost = dp ? cheapestHop.totalPrice - dp : null;
        const pctHigher = dp ? Math.round(((cheapestHop.totalPrice - dp) / dp) * 100) : null;
        console.log(`[horizon-hop] ${scored.length} hub(s) found but all exceed 5% threshold. Cheapest hop: $${cheapestHop.totalPrice.toFixed(0)} vs best fare $${dp?.toFixed(0)} (+${pctHigher}%, +$${extraCost?.toFixed(0)})`);
        return res.json({
          hop: null,
          reason: "too_expensive",
          cheapestHopPrice: cheapestHop.totalPrice,
          cheapestHopHub: cheapestHop.hub.city,
          cheapestHopHubIata: cheapestHop.hub.iata,
          cheapestHopExtraCost: extraCost,
          cheapestHopNights: cheapestHop.nightsAtHub,
          cheapestHopOfferId: cheapestHop.offerId,
          cheapestHopLeg1Date: cheapestHop.direction === "outbound" ? departureDate : (returnDate ?? departureDate),
          cheapestHopLeg2Date: cheapestHop.leg2Date,
          cheapestHopDirection: cheapestHop.direction,
          bestFarePrice: dp,
        });
      }

      viable.sort((a, b) => a.totalPrice - b.totalPrice);
      const best = viable[0];
      const savings = dp !== null ? Math.max(0, dp - best.totalPrice) : 0;

      // For outbound hops: leg1Date = departureDate, leg2Date = hub→dest departure
      // For return hops: leg1Date = returnDate (dest→hub departure), leg2Date = hub→origin departure
      const leg1Date = best.direction === "outbound" ? departureDate : (returnDate ?? departureDate);

      res.json({
        hop: {
          hubIata: best.hub.iata,
          hubCity: best.hub.city,
          totalPrice: best.totalPrice,
          directPrice: dp ?? best.totalPrice,
          savings,
          currency: best.currency,
          leg1Date,
          leg2Date: best.leg2Date,
          offerId: best.offerId,
          checkedBags: best.checkedBags,
          carryOnBags: best.carryOnBags,
          hopDirection: best.direction,
          nightsAtHub: best.nightsAtHub,
          hopPrice: best.hopPrice,
          companionOfferId: best.companionOfferId ?? undefined,
          companionPrice: best.companionPrice ?? undefined,
          companionDepartureDate: best.companionDepartureDate ?? undefined,
        } as import("@shared/schema").HorizonHopResult,
      });
    } catch (err: any) {
      console.error("[horizon-hop] error:", err?.message);
      res.json({ hop: null, reason: "error" });
    }
  });

  app.get("/go/:partner", (req, res) => {
    const slug = req.params.partner.toLowerCase();
    const url = AFFILIATE_ROUTES[slug];
    if (!url) return res.status(404).send("Partner not found");
    logger.info(`[affiliate] /go/${slug} → ${url}`);
    res.redirect(302, url);
  });

  // ── Admin auth middleware ──────────────────────────────────────────────────
  function requireAdmin(req: any, res: any, next: any) {
    if ((req.session as any).adminAuthenticated) return next();
    return res.status(401).json({ error: "Unauthorized" });
  }

  app.post("/api/admin/login", (req: any, res) => {
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) return res.status(503).json({ error: "Admin not configured" });
    const { password } = req.body ?? {};
    if (password === adminPassword) {
      (req.session as any).adminAuthenticated = true;
      req.session.save(() => res.json({ ok: true }));
    } else {
      res.status(401).json({ error: "Wrong password" });
    }
  });

  app.post("/api/admin/logout", (req: any, res) => {
    (req.session as any).adminAuthenticated = false;
    req.session.save(() => res.json({ ok: true }));
  });

  app.get("/api/admin/me", (req: any, res) => {
    res.json({ authenticated: !!(req.session as any).adminAuthenticated });
  });

  app.get("/api/admin/posts", requireAdmin, async (_req, res) => {
    try {
      const { getAllBlogPostsAdmin } = await import("./blog");
      const posts = await getAllBlogPostsAdmin();
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/posts", requireAdmin, async (req: any, res) => {
    try {
      const { createBlogPost } = await import("./blog");
      const post = await createBlogPost(req.body);
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "Failed" });
    }
  });

  app.put("/api/admin/posts/:id", requireAdmin, async (req: any, res) => {
    try {
      const { updateBlogPost } = await import("./blog");
      const post = await updateBlogPost(Number(req.params.id), req.body);
      if (!post) return res.status(404).json({ error: "Not found" });
      res.json(post);
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "Failed" });
    }
  });

  app.delete("/api/admin/posts/:id", requireAdmin, async (req: any, res) => {
    try {
      const { deleteBlogPost } = await import("./blog");
      const ok = await deleteBlogPost(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Not found" });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err?.message ?? "Failed" });
    }
  });

  // ── Blog routes ────────────────────────────────────────────────────────────
  app.get("/api/blog/posts", async (req, res) => {
    try {
      const { getBlogPosts } = await import("./blog");
      const continent = typeof req.query.continent === "string" ? req.query.continent : undefined;
      const posts = await getBlogPosts(200, continent);
      res.json(posts);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.get("/api/blog/posts/:slug", async (req, res) => {
    try {
      const { getBlogPost, getRelatedPosts } = await import("./blog");
      const post = await getBlogPost(req.params.slug);
      if (!post) return res.status(404).json({ error: "Post not found" });
      const related = await getRelatedPosts(req.params.slug, post.country, 3);
      res.json({ post, related });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch post" });
    }
  });

  // ── Community Travel Platform ──────────────────────────────────────────────
  const objectStore = new ObjectStorageService();

  // Serve uploaded objects. ACL is enforced: community photos are public, but
  // private objects are only served to their owner.
  app.get("/objects/*objectPath", async (req, res) => {
    try {
      const objectFile = await objectStore.getObjectEntityFile(req.path);
      const userId = req.isAuthenticated?.() ? String((req.user as any)?.id ?? "") : undefined;
      const canRead = await objectStore.canAccessObjectEntity({ objectFile, userId: userId || undefined });
      if (!canRead) {
        return res.status(403).json({ error: "Forbidden" });
      }
      await objectStore.downloadObject(objectFile, res);
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ error: "Object not found" });
      }
      logger.error("Error serving object: " + (error as any)?.message);
      return res.status(500).json({ error: "Failed to serve object" });
    }
  });

  // Authenticated: get a presigned URL to upload one photo. Validates the
  // declared content type and size before issuing the URL.
  const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10 MB
  app.post("/api/community/photo-url", requireAuth, async (req, res) => {
    try {
      const contentType = typeof req.body?.contentType === "string" ? req.body.contentType.toLowerCase() : "";
      const size = Number(req.body?.size);
      if (!ALLOWED_PHOTO_TYPES.includes(contentType)) {
        return res.status(400).json({ error: "Only JPG, PNG, WebP or GIF images are allowed." });
      }
      if (!Number.isFinite(size) || size <= 0) {
        return res.status(400).json({ error: "A valid image file size is required." });
      }
      if (size > MAX_PHOTO_BYTES) {
        return res.status(400).json({ error: "Images must be 10 MB or smaller." });
      }
      const uploadURL = await objectStore.getObjectEntityUploadURL();
      const objectPath = objectStore.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (err: any) {
      logger.error("Community photo-url failed: " + err?.message);
      res.status(503).json({ error: "Photo uploads are unavailable right now." });
    }
  });

  // Public: global feed (optionally filtered by type/category/destination/city, cursor paginated).
  app.get("/api/community/posts", async (req, res) => {
    try {
      const typeRaw = typeof req.query.type === "string" ? req.query.type : undefined;
      const type = typeRaw === "story" || typeRaw === "recommendation" || typeRaw === "visa_experience" ? typeRaw : undefined;
      const categoryRaw = typeof req.query.category === "string" ? req.query.category : undefined;
      const category = RECOMMENDATION_CATEGORIES.includes(categoryRaw as any) ? categoryRaw : undefined;
      const countryCode = typeof req.query.country === "string" ? req.query.country : undefined;
      const city = typeof req.query.city === "string" ? req.query.city : undefined;
      const beforeId = req.query.before ? Number(req.query.before) : undefined;
      const offsetRaw = req.query.offset ? Number(req.query.offset) : undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const sort = req.query.sort === "popular" ? "popular" : "recent";
      const userId = req.isAuthenticated?.() ? (req.user as any).id : undefined;
      const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw as number, 0) : 0;
      const effLimit = Number.isFinite(limit) ? Math.min(Math.max(limit as number, 1), 50) : 20;
      const posts = await storage.getCommunityFeed({
        type,
        category,
        countryCode,
        city,
        beforeId: Number.isFinite(beforeId) ? beforeId : undefined,
        offset,
        limit: Number.isFinite(limit) ? limit : undefined,
        sort,
        userId,
      });
      const nextCursor =
        sort === "popular"
          ? posts.length === effLimit ? offset + posts.length : null
          : posts.length ? posts[posts.length - 1].id : null;
      const langRaw = typeof req.query.lang === "string" ? req.query.lang : "";
      const lang = langRaw && langRaw !== "en" && isSupportedLang(langRaw) ? langRaw : undefined;
      const outPosts = lang ? await translateFeedPosts(posts, lang) : posts;
      res.json({ posts: outPosts, nextCursor });
    } catch (err: any) {
      logger.error("Community feed failed: " + err?.message);
      res.status(500).json({ error: "Failed to load community posts" });
    }
  });

  // Public: list destinations (countries) that have posts.
  app.get("/api/community/destinations", async (_req, res) => {
    try {
      res.json(await storage.listCommunityDestinations());
    } catch (err: any) {
      logger.error("Community destinations failed: " + err?.message);
      res.status(500).json({ error: "Failed to load destinations" });
    }
  });

  // Public: list cities that have posts within a country.
  app.get("/api/community/destinations/:cc/cities", async (req, res) => {
    try {
      res.json(await storage.listCommunityCities(String(req.params.cc)));
    } catch (err: any) {
      logger.error("Community cities failed: " + err?.message);
      res.status(500).json({ error: "Failed to load cities" });
    }
  });

  // Public: a single post.
  app.get("/api/community/posts/:id", async (req, res) => {
    try {
      const userId = req.isAuthenticated?.() ? (req.user as any).id : undefined;
      const post = await storage.getCommunityPost(Number(req.params.id), userId);
      if (!post || post.status !== "active") return res.status(404).json({ error: "Post not found" });
      const canTranslate = translationAvailable();
      res.json({ post, canTranslate });
    } catch (err: any) {
      logger.error("Community post fetch failed: " + err?.message);
      res.status(500).json({ error: "Failed to load post" });
    }
  });

  // Auth: toggle like on a post.
  app.post("/api/community/posts/:id/like", requireAuth, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const post = await storage.getCommunityPost(id);
      if (!post || post.status !== "active") return res.status(404).json({ error: "Post not found" });
      const result = await storage.toggleCommunityLike(id, req.user.id);
      res.json(result);
    } catch (err: any) {
      logger.error("Community like failed: " + err?.message);
      res.status(500).json({ error: "Failed to like post" });
    }
  });

  // Public: on-demand cached translation for a post.
  app.get("/api/community/posts/:id/translate", async (req, res) => {
    try {
      const lang = typeof req.query.lang === "string" ? req.query.lang : "";
      if (!lang || !isSupportedLang(lang)) {
        return res.status(400).json({ error: "Unsupported language" });
      }
      const post = await storage.getCommunityPost(Number(req.params.id));
      if (!post || post.status !== "active") return res.status(404).json({ error: "Post not found" });
      if (lang === post.originalLang) {
        return res.json({ lang, translation: { title: post.title, story: post.story }, cached: true });
      }
      const cached = await storage.getCommunityTranslation(post.id, lang);
      if (cached) return res.json({ lang, translation: cached, cached: true });

      if (!translationAvailable()) {
        return res.status(503).json({ error: "Translation is not available right now." });
      }
      const translation = await translatePost(post, lang);
      await storage.saveCommunityTranslation(post.id, lang, translation).catch(() => {});
      res.json({ lang, translation, cached: false });
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      logger.error("Community translate failed: " + msg);
      if (/daily limit|timed out|unreachable|unavailable/i.test(msg)) {
        return res.status(503).json({ error: msg });
      }
      res.status(500).json({ error: "Translation failed. Please try again." });
    }
  });

  // Authenticated: create a post.
  app.post("/api/community/posts", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommunityPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid post" });
      }
      const user = req.user as any;
      const langRaw = typeof req.body?.originalLang === "string" ? req.body.originalLang : "en";
      const originalLang = isSupportedLang(langRaw) ? langRaw : "en";
      const authorName = (user.name && String(user.name).trim()) || String(user.email || "Traveler").split("@")[0];

      const post = await storage.createCommunityPost(user.id, authorName, parsed.data, originalLang);

      // Make uploaded photos publicly readable. Guard against hijacking another
      // user's object: only set ACL on freshly-uploaded objects (no owner yet)
      // or objects already owned by the current user.
      for (const photoPath of parsed.data.photos ?? []) {
        try {
          const objectFile = await objectStore.getObjectEntityFile(photoPath);
          const existing = await getObjectAclPolicy(objectFile);
          if (existing && existing.owner && existing.owner !== String(user.id)) {
            logger.warn("Refusing to rewrite ACL for object owned by another user");
            continue;
          }
          await objectStore.trySetObjectEntityAclPolicy(photoPath, { owner: String(user.id), visibility: "public" } as any);
        } catch (e: any) {
          logger.warn("Failed to set photo ACL: " + e?.message);
        }
      }
      res.status(201).json({ post });
    } catch (err: any) {
      logger.error("Community create failed: " + err?.message);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Edit a post. Owners can edit their own; admins can edit any (dual-auth).
  app.put("/api/community/posts/:id", async (req: any, res) => {
    try {
      const isAdmin = !!req.session?.adminAuthenticated;
      const user = req.isAuthenticated() ? (req.user as any) : null;
      if (!isAdmin && !user) return res.status(401).json({ error: "Sign in required" });

      const parsed = insertCommunityPostSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid post" });
      }

      const id = Number(req.params.id);
      const existing = await storage.getCommunityPost(id);
      if (!existing) return res.status(404).json({ error: "Post not found" });
      if (!isAdmin && existing.userId !== user.id) {
        return res.status(403).json({ error: "You can only edit your own posts" });
      }

      const post = await storage.updateCommunityPost(id, parsed.data);
      if (!post) return res.status(404).json({ error: "Post not found" });

      // Only touch ACLs for an owner editing their own post (admins keep the
      // original author's object ownership intact).
      if (user && existing.userId === user.id) {
        for (const photoPath of parsed.data.photos ?? []) {
          try {
            const objectFile = await objectStore.getObjectEntityFile(photoPath);
            const aclPolicy = await getObjectAclPolicy(objectFile);
            if (aclPolicy && aclPolicy.owner && aclPolicy.owner !== String(user.id)) continue;
            await objectStore.trySetObjectEntityAclPolicy(photoPath, { owner: String(user.id), visibility: "public" } as any);
          } catch (e: any) {
            logger.warn("Failed to set photo ACL on edit: " + e?.message);
          }
        }
      }

      res.json({ post });
    } catch (err: any) {
      logger.error("Community update failed: " + err?.message);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // Authenticated: list my posts.
  app.get("/api/community/my-posts", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      res.json(await storage.getUserCommunityPosts(user.id));
    } catch (err: any) {
      logger.error("Community my-posts failed: " + err?.message);
      res.status(500).json({ error: "Failed to load your posts" });
    }
  });

  // Authenticated: delete my own post.
  app.delete("/api/community/posts/:id", requireAuth, async (req, res) => {
    try {
      const user = req.user as any;
      const ok = await storage.deleteCommunityPost(Number(req.params.id), user.id);
      if (!ok) return res.status(404).json({ error: "Post not found" });
      res.json({ ok: true });
    } catch (err: any) {
      logger.error("Community delete failed: " + err?.message);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Authenticated: report a post.
  app.post("/api/community/posts/:id/report", requireAuth, async (req, res) => {
    try {
      const parsed = communityReportSchema.safeParse(req.body ?? {});
      const reason = parsed.success ? parsed.data.reason : "";
      const post = await storage.getCommunityPost(Number(req.params.id));
      if (!post || post.status !== "active") return res.status(404).json({ error: "Post not found" });
      const user = req.user as any;
      await storage.reportCommunityPost(post.id, user.id, reason);
      res.json({ ok: true });
    } catch (err: any) {
      logger.error("Community report failed: " + err?.message);
      res.status(500).json({ error: "Failed to submit report" });
    }
  });

  // Public: list comments on a post.
  app.get("/api/community/posts/:id/comments", async (req, res) => {
    try {
      const post = await storage.getCommunityPost(Number(req.params.id));
      if (!post || post.status !== "active") return res.status(404).json({ error: "Post not found" });
      res.json(await storage.listCommunityComments(post.id));
    } catch (err: any) {
      logger.error("Community comments list failed: " + err?.message);
      res.status(500).json({ error: "Failed to load comments" });
    }
  });

  // Authenticated: add a comment.
  app.post("/api/community/posts/:id/comments", requireAuth, async (req, res) => {
    try {
      const parsed = insertCommunityCommentSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Invalid comment" });
      }
      const post = await storage.getCommunityPost(Number(req.params.id));
      if (!post || post.status !== "active") return res.status(404).json({ error: "Post not found" });
      const user = req.user as any;
      const authorName = (user.name && String(user.name).trim()) || String(user.email || "Traveler").split("@")[0];
      const comment = await storage.createCommunityComment(post.id, user.id, authorName, parsed.data.body);
      res.status(201).json({ comment });
    } catch (err: any) {
      logger.error("Community comment create failed: " + err?.message);
      res.status(500).json({ error: "Failed to add comment" });
    }
  });

  // Delete own comment (admins can delete any).
  app.delete("/api/community/comments/:id", async (req: any, res) => {
    try {
      const isAdmin = !!(req.session as any).adminAuthenticated;
      const user = req.isAuthenticated() ? (req.user as any) : null;
      if (!user && !isAdmin) return res.status(401).json({ error: "Not authenticated" });
      const ok = await storage.deleteCommunityComment(Number(req.params.id), user?.id ?? -1, isAdmin);
      if (!ok) return res.status(404).json({ error: "Comment not found" });
      res.json({ ok: true });
    } catch (err: any) {
      logger.error("Community comment delete failed: " + err?.message);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Admin: list reports.
  app.get("/api/admin/community/reports", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.adminListCommunityReports());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load reports" });
    }
  });

  // Admin: remove a post.
  app.delete("/api/admin/community/posts/:id", requireAdmin, async (req, res) => {
    try {
      const ok = await storage.adminRemoveCommunityPost(Number(req.params.id));
      if (!ok) return res.status(404).json({ error: "Post not found" });
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to remove post" });
    }
  });

  // Admin: signed-up users + their community activity.
  app.get("/api/admin/users", requireAdmin, async (_req, res) => {
    try {
      res.json(await storage.adminListUsers());
    } catch (err: any) {
      res.status(500).json({ error: "Failed to load users" });
    }
  });

  // ── Visa Intelligence ────────────────────────────────────────────────────
  // Served from the server so the client doesn't have to bundle every
  // country's visa data into its JS payload — it fetches only what the
  // current page needs. Every route is keyed by origin ("from") passport
  // country first, then destination — today only Nepal ("NP") has any real
  // data, but the routes already support other origins as they're added.
  app.get("/api/visa/from-countries", (_req, res) => {
    try {
      res.json(listFromCountries());
    } catch (err: any) {
      logger.error({ err }, "Failed to list visa origin countries");
      res.status(500).json({ error: "Failed to load origin countries" });
    }
  });

  app.get("/api/visa/:from/countries", (req, res) => {
    try {
      res.json(listVisaCountries(req.params.from));
    } catch (err: any) {
      logger.error({ err }, "Failed to list visa destination countries");
      res.status(500).json({ error: "Failed to load visa countries" });
    }
  });

  app.get("/api/visa/:from/:countryCode/:category", async (req, res) => {
    try {
      const category = req.params.category as VisaCategory;
      if (!VISA_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Unknown visa category: ${category}` });
      }
      const lang = typeof req.query.lang === "string" ? req.query.lang : "en";
      const result = await getVisaProfileLocalized(req.params.from, req.params.countryCode, category, lang);
      if (!result) {
        return res.status(404).json({ error: "No visa data for this route/category yet" });
      }
      res.json(result);
    } catch (err: any) {
      logger.error({ err }, "Failed to load visa profile");
      res.status(500).json({ error: "Failed to load visa data" });
    }
  });

  // Easy-to-hard difficulty ranking for the Visa Intelligence hub's second
  // tab. See getVisaDifficultyRanking's own doc comment for what the score
  // does and doesn't represent.
  app.get("/api/visa/:from/difficulty", (req, res) => {
    try {
      const category = (typeof req.query.category === "string" ? req.query.category : "tourist") as VisaCategory;
      if (!VISA_CATEGORIES.includes(category)) {
        return res.status(400).json({ error: `Unknown visa category: ${category}` });
      }
      res.json(getVisaDifficultyRanking(req.params.from, category));
    } catch (err: any) {
      logger.error({ err }, "Failed to compute visa difficulty ranking");
      res.status(500).json({ error: "Failed to load visa difficulty ranking" });
    }
  });

  app.use("/api", (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.path}` });
  });

  return httpServer;
}
