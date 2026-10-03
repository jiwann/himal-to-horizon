import { useEffect } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { ArrowLeft, ExternalLink, Building2, MapPin, Globe, Clock, DollarSign, CheckCircle2, XCircle, AlertTriangle, Info, RefreshCw, Navigation } from "lucide-react";
import visaData from "@/lib/visa-data.json";
import passportIndex from "@/lib/passport-index.json";
import jurisdictions from "@/lib/jurisdictions.json";
import officialPortals from "@/lib/official-portals.json";
import destRequirements from "@/lib/destination-requirements.json";
import { setSEO, resetSEO } from "@/lib/seo";
import visaSyncStatus from "@/lib/visa-sync-status.json";
import { describeFee, getStayDays, getEffectiveStatus, getGuideStatus, getNepalFact, NEPAL_FACTS_CHECKED } from "@/lib/passport-lookup";

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusType = "visa_free" | "evisa" | "visa_on_arrival" | "sticker_visa" | "not_admitted" | "unknown";

interface TrafficLight {
  color: string;
  glow: string;
  label: string;
  description: string;
  icon: typeof CheckCircle2;
}

// ─── Country Lookup Maps ──────────────────────────────────────────────────────

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Supplemental countries in passport-index but not in visa-data.json
const EXTRA_COUNTRIES: Record<string, { name: string; flag: string; iso: string }> = {
  "antigua-and-barbuda": { name: "Antigua and Barbuda", flag: "🇦🇬", iso: "AG" },
  "barbados": { name: "Barbados", flag: "🇧🇧", iso: "BB" },
  "belize": { name: "Belize", flag: "🇧🇿", iso: "BZ" },
  "benin": { name: "Benin", flag: "🇧🇯", iso: "BJ" },
  "burkina-faso": { name: "Burkina Faso", flag: "🇧🇫", iso: "BF" },
  "burundi": { name: "Burundi", flag: "🇧🇮", iso: "BI" },
  "cape-verde": { name: "Cape Verde", flag: "🇨🇻", iso: "CV" },
  "central-african-republic": { name: "Central African Republic", flag: "🇨🇫", iso: "CF" },
  "chad": { name: "Chad", flag: "🇹🇩", iso: "TD" },
  "comoros": { name: "Comoros", flag: "🇰🇲", iso: "KM" },
  "congo": { name: "Congo", flag: "🇨🇬", iso: "CG" },
  "dominica": { name: "Dominica", flag: "🇩🇲", iso: "DM" },
  "dr-congo": { name: "DR Congo", flag: "🇨🇩", iso: "CD" },
  "el-salvador": { name: "El Salvador", flag: "🇸🇻", iso: "SV" },
  "equatorial-guinea": { name: "Equatorial Guinea", flag: "🇬🇶", iso: "GQ" },
  "eritrea": { name: "Eritrea", flag: "🇪🇷", iso: "ER" },
  "estonia": { name: "Estonia", flag: "🇪🇪", iso: "EE" },
  "gabon": { name: "Gabon", flag: "🇬🇦", iso: "GA" },
  "gambia": { name: "Gambia", flag: "🇬🇲", iso: "GM" },
  "grenada": { name: "Grenada", flag: "🇬🇩", iso: "GD" },
  "guinea": { name: "Guinea", flag: "🇬🇳", iso: "GN" },
  "guinea-bissau": { name: "Guinea-Bissau", flag: "🇬🇼", iso: "GW" },
  "guyana": { name: "Guyana", flag: "🇬🇾", iso: "GY" },
  "haiti": { name: "Haiti", flag: "🇭🇹", iso: "HT" },
  "honduras": { name: "Honduras", flag: "🇭🇳", iso: "HN" },
  "hong-kong": { name: "Hong Kong", flag: "🇭🇰", iso: "HK" },
  "iceland": { name: "Iceland", flag: "🇮🇸", iso: "IS" },
  "ivory-coast": { name: "Ivory Coast", flag: "🇨🇮", iso: "CI" },
  "kiribati": { name: "Kiribati", flag: "🇰🇮", iso: "KI" },
  "kosovo": { name: "Kosovo", flag: "🇽🇰", iso: "XK" },
  "latvia": { name: "Latvia", flag: "🇱🇻", iso: "LV" },
  "lesotho": { name: "Lesotho", flag: "🇱🇸", iso: "LS" },
  "liberia": { name: "Liberia", flag: "🇱🇷", iso: "LR" },
  "liechtenstein": { name: "Liechtenstein", flag: "🇱🇮", iso: "LI" },
  "lithuania": { name: "Lithuania", flag: "🇱🇹", iso: "LT" },
  "luxembourg": { name: "Luxembourg", flag: "🇱🇺", iso: "LU" },
  "macao": { name: "Macao", flag: "🇲🇴", iso: "MO" },
  "madagascar": { name: "Madagascar", flag: "🇲🇬", iso: "MG" },
  "malawi": { name: "Malawi", flag: "🇲🇼", iso: "MW" },
  "mali": { name: "Mali", flag: "🇲🇱", iso: "ML" },
  "marshall-islands": { name: "Marshall Islands", flag: "🇲🇭", iso: "MH" },
  "mauritania": { name: "Mauritania", flag: "🇲🇷", iso: "MR" },
  "mauritius": { name: "Mauritius", flag: "🇲🇺", iso: "MU" },
  "micronesia": { name: "Micronesia", flag: "🇫🇲", iso: "FM" },
  "monaco": { name: "Monaco", flag: "🇲🇨", iso: "MC" },
  "montenegro": { name: "Montenegro", flag: "🇲🇪", iso: "ME" },
  "nauru": { name: "Nauru", flag: "🇳🇷", iso: "NR" },
  "nicaragua": { name: "Nicaragua", flag: "🇳🇮", iso: "NI" },
  "niger": { name: "Niger", flag: "🇳🇪", iso: "NE" },
  "north-korea": { name: "North Korea", flag: "🇰🇵", iso: "KP" },
  "north-macedonia": { name: "North Macedonia", flag: "🇲🇰", iso: "MK" },
  "palau": { name: "Palau", flag: "🇵🇼", iso: "PW" },
  "palestine": { name: "Palestine", flag: "🇵🇸", iso: "PS" },
  "rwanda": { name: "Rwanda", flag: "🇷🇼", iso: "RW" },
  "saint-kitts-and-nevis": { name: "Saint Kitts and Nevis", flag: "🇰🇳", iso: "KN" },
  "saint-lucia": { name: "Saint Lucia", flag: "🇱🇨", iso: "LC" },
  "saint-vincent-and-the-grenadines": { name: "Saint Vincent and the Grenadines", flag: "🇻🇨", iso: "VC" },
  "samoa": { name: "Samoa", flag: "🇼🇸", iso: "WS" },
  "san-marino": { name: "San Marino", flag: "🇸🇲", iso: "SM" },
  "sao-tome-and-principe": { name: "Sao Tome and Principe", flag: "🇸🇹", iso: "ST" },
  "seychelles": { name: "Seychelles", flag: "🇸🇨", iso: "SC" },
  "sierra-leone": { name: "Sierra Leone", flag: "🇸🇱", iso: "SL" },
  "slovakia": { name: "Slovakia", flag: "🇸🇰", iso: "SK" },
  "slovenia": { name: "Slovenia", flag: "🇸🇮", iso: "SI" },
  "solomon-islands": { name: "Solomon Islands", flag: "🇸🇧", iso: "SB" },
  "somalia": { name: "Somalia", flag: "🇸🇴", iso: "SO" },
  "south-sudan": { name: "South Sudan", flag: "🇸🇸", iso: "SS" },
  "sudan": { name: "Sudan", flag: "🇸🇩", iso: "SD" },
  "suriname": { name: "Suriname", flag: "🇸🇷", iso: "SR" },
  "swaziland": { name: "Swaziland", flag: "🇸🇿", iso: "SZ" },
  "syria": { name: "Syria", flag: "🇸🇾", iso: "SY" },
  "tajikistan": { name: "Tajikistan", flag: "🇹🇯", iso: "TJ" },
  "timor-leste": { name: "Timor-Leste", flag: "🇹🇱", iso: "TL" },
  "togo": { name: "Togo", flag: "🇹🇬", iso: "TG" },
  "tonga": { name: "Tonga", flag: "🇹🇴", iso: "TO" },
  "trinidad-and-tobago": { name: "Trinidad and Tobago", flag: "🇹🇹", iso: "TT" },
  "tunisia": { name: "Tunisia", flag: "🇹🇳", iso: "TN" },
  "turkmenistan": { name: "Turkmenistan", flag: "🇹🇲", iso: "TM" },
  "tuvalu": { name: "Tuvalu", flag: "🇹🇻", iso: "TV" },
  "vanuatu": { name: "Vanuatu", flag: "🇻🇺", iso: "VU" },
  "vatican": { name: "Vatican City", flag: "🇻🇦", iso: "VA" },
  "venezuela": { name: "Venezuela", flag: "🇻🇪", iso: "VE" },
};

// Build slug → {name, flag, iso} map from visa-data.json + extras
// Also maps ISO alpha-2 codes (both cases) so /visa/NP/BR and /visa/nepal/brazil both work
const SLUG_MAP: Record<string, { name: string; flag: string; iso: string }> = {};
for (const c of (visaData as any).countries) {
  SLUG_MAP[nameToSlug(c.name)] = { name: c.name, flag: c.flag, iso: c.code };
  SLUG_MAP[c.code.toUpperCase()] = { name: c.name, flag: c.flag, iso: c.code };
  SLUG_MAP[c.code.toLowerCase()] = { name: c.name, flag: c.flag, iso: c.code };
}
for (const [slug, info] of Object.entries(EXTRA_COUNTRIES)) {
  SLUG_MAP[slug] = info;
  SLUG_MAP[info.iso.toUpperCase()] = info;
  SLUG_MAP[info.iso.toLowerCase()] = info;
}

// ─── Traffic Light Config ─────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusType, TrafficLight> = {
  visa_free: {
    color: "#34d399",
    glow: "rgba(52,211,153,0.35)",
    label: "Visa Free",
    description: "No visa required. You may enter freely.",
    icon: CheckCircle2,
  },
  evisa: {
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.35)",
    label: "e-Visa Available",
    description: "Apply online before you travel.",
    icon: Globe,
  },
  visa_on_arrival: {
    color: "#fbbf24",
    glow: "rgba(251,191,36,0.35)",
    label: "Visa on Arrival",
    description: "Obtain your visa at the port of entry.",
    icon: Info,
  },
  sticker_visa: {
    color: "#f87171",
    glow: "rgba(248,113,113,0.35)",
    label: "Sticker Visa Required",
    description: "You must apply at an embassy or VFS Global before travel.",
    icon: AlertTriangle,
  },
  not_admitted: {
    color: "#94a3b8",
    glow: "rgba(148,163,184,0.2)",
    label: "Entry Not Permitted",
    description: "Citizens of this passport are not admitted.",
    icon: XCircle,
  },
  unknown: {
    color: "#94a3b8",
    glow: "rgba(148,163,184,0.2)",
    label: "Data Unavailable",
    description: "We do not have visa data for this combination.",
    icon: Info,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function VisaCheckPage() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  // These pages are reached from several places now (the country search,
  // the difficulty ranking, the visa-free/eVisa lists) — "back" should
  // return to whichever of those the person actually came from, not
  // always jump to the top of Visa Intelligence. history.back() does
  // that when we got here via an in-app link; the length check guards
  // the case where this page was opened directly (a bookmark or a
  // shared link), where there's nothing in this tab's history to go
  // back to.
  const goBackOrToHub = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/visa-guides");
    }
  };
  const [, params] = useRoute<{ passport: string; destination: string }>(
    "/visa/:passport/:destination"
  );

  const passportSlug = params?.passport ?? "";
  const destSlug = params?.destination ?? "";

  const originInfo = SLUG_MAP[passportSlug];
  const destInfo = SLUG_MAP[destSlug];

  // Tier-2: basic status from passport-index.json, corrected for Nepali
  // passports by the hand-checked nepal-visa-facts.json.
  const tier2Key = originInfo && destInfo ? `${originInfo.iso}->${destInfo.iso}` : null;
  const tier2Raw = tier2Key ? ((passportIndex as any).requirements[tier2Key] as string | undefined) : undefined;
  const tier2Status: StatusType =
    tier2Raw && originInfo && destInfo
      ? (getEffectiveStatus(originInfo.iso, destInfo.iso, tier2Raw) as StatusType)
      : "unknown";

  // Tier-1: rich detail from visa-data.json
  const tier1 = tier2Key
    ? ((visaData as any).requirements[tier2Key] ?? null)
    : null;

  // Destination-level tourist requirements (covers all 199 countries)
  const destReq: {
    fee: string; maxStay: number; processingTime: string;
    evisaAvailable: boolean; voaAvailable: boolean;
    docs: string[]; notes: string;
  } | null = destInfo
    ? ((destRequirements as any).destinations[destInfo.iso] ?? null)
    : null;

  const guideStatus = originInfo && destInfo ? getGuideStatus(originInfo.iso, destInfo.iso) : undefined;
  const statusType: StatusType = (guideStatus as StatusType | undefined) ?? (tier1 ? tier1.statusType : tier2Status);
  const sc = STATUS_CONFIG[statusType] ?? STATUS_CONFIG.unknown;

  // Display values for the generic (tier-2) view. destReq is one record per
  // destination for every passport, so visa-free/on-arrival pairs get
  // passport-aware fee, stay and processing text instead of, say, another
  // nationality's sticker-visa fee.
  const npFact = originInfo?.iso === "NP" && destInfo ? getNepalFact(destInfo.iso) : undefined;
  const feeText = npFact?.fee ?? describeFee(statusType, destReq?.fee) ?? "Varies";
  const stayDays = npFact
    ? npFact.stay
    : statusType === "visa_free"
      ? (originInfo && destInfo ? getStayDays(originInfo.iso, destInfo.iso) : undefined)
      : destReq?.maxStay;
  const stayText = npFact?.stayText ?? (stayDays ? `${stayDays} days` : "Varies");
  const processingText = statusType === "visa_free"
    ? "No visa needed"
    : statusType === "visa_on_arrival"
      ? "On arrival"
      : npFact
        // destReq's processing time is another nationality's; don't guess.
        ? (statusType === "evisa" ? "Apply online before travel" : "Apply before travel")
        : destReq?.processingTime ?? "Varies";
  const StatusIcon = sc.icon;

  const syncStatus = visaSyncStatus as { lastChecked: string; lastChanged: string };

  useEffect(() => {
    const originName = originInfo?.name ?? passportSlug;
    const destName = destInfo?.name ?? destSlug;
    setSEO({
      title: `${destName} Visa for ${originName} Passport Holders (2026 Guide)`,
      description: `Do ${originName} citizens need a visa for ${destName}? Check entry requirements, tourist visa fees, processing times, required documents, and nearest embassy locations. Updated 2026.`,
      path: `/visa/${passportSlug}/${destSlug}`,
      type: "article",
    });
    return () => { resetSEO(); };
  }, [originInfo, destInfo, passportSlug, destSlug]);

  // ─── JSON-LD structured data ─────────────────────────────────────────────────
  useEffect(() => {
    if (!originInfo || !destInfo) return;
    const originName = originInfo.name;
    const destName = destInfo.name;
    const statusLabel = sc.label;
    const fee = feeText;
    const processing = processingText;
    const maxStay = stayText;
    const docs = destReq?.docs?.slice(0, 4).join(", ") ?? "Passport (6+ months validity)";

    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Do ${originName} citizens need a visa to visit ${destName}?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `${originName} passport holders: ${statusLabel}. ${sc.description}`,
          },
        },
        {
          "@type": "Question",
          name: `What is the tourist visa fee for ${destName} for ${originName} passport holders?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `The typical tourist visa fee for ${destName} is: ${fee}.`,
          },
        },
        {
          "@type": "Question",
          name: `How long does it take to process a ${destName} visa?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Processing time for a ${destName} tourist visa is typically: ${processing}.`,
          },
        },
        {
          "@type": "Question",
          name: `How long can ${originName} citizens stay in ${destName} on a tourist visa?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `The maximum tourist stay in ${destName} is ${maxStay}.`,
          },
        },
        {
          "@type": "Question",
          name: `What documents are required for a ${destName} tourist visa?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Typical documents required: ${docs}.`,
          },
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "visa-faq-jsonld";
    script.textContent = JSON.stringify(faqSchema);
    document.head.appendChild(script);

    return () => {
      document.getElementById("visa-faq-jsonld")?.remove();
    };
  }, [originInfo, destInfo, sc, destReq, feeText, processingText, stayText]);

  // ─── Not Found ───────────────────────────────────────────────────────────────
  if (!originInfo || !destInfo) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
        style={{ background: "hsl(211 60% 8%)" }}
      >
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-foreground mb-2">Country Not Found</h1>
        <p className="text-sm text-muted-foreground mb-6">
          We couldn't find <code className="text-foreground/70">{passportSlug}</code> or{" "}
          <code className="text-foreground/70">{destSlug}</code> in our database.
        </p>
        <Link
          href="/visa-guides"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
          style={{ background: "rgba(247,176,136,0.15)", color: "#F7B088", border: "1px solid rgba(247,176,136,0.3)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Visa Intelligence
        </Link>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "hsl(211 60% 8%)", fontFamily: "var(--font-sans)" }}
    >
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* ── Breadcrumb ─────────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={goBackOrToHub}
          data-testid="link-back-visa"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground/70 transition-colors mb-8"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {t("visa.back_generic" as TranslationKey)}
        </button>

        {/* ── Country Pair Header ────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 mb-8">
          <div className="text-center">
            <div className="text-5xl mb-1">{originInfo.flag}</div>
            <p className="text-xs font-semibold text-muted-foreground">{originInfo.name}</p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="h-px flex-1 bg-white/10" />
            <span className="mx-3 text-muted-foreground/40 text-lg">→</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="text-center">
            <div className="text-5xl mb-1">{destInfo.flag}</div>
            <p className="text-xs font-semibold text-muted-foreground">{destInfo.name}</p>
          </div>
        </div>

        {/* ── Intelligence Card ──────────────────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${sc.color}40`,
            boxShadow: `0 0 32px ${sc.glow}`,
          }}
          data-testid="card-visa-intelligence"
        >
          {/* Traffic Light Header */}
          <div
            className="px-6 py-5 flex items-center gap-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${sc.color}20`, border: `2px solid ${sc.color}60` }}
            >
              <StatusIcon className="h-6 w-6" style={{ color: sc.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">
                Visa Status — {originInfo.name} → {destInfo.name}
              </p>
              <h1
                className="text-2xl font-black"
                style={{ color: sc.color, fontFamily: "var(--font-serif)" }}
                data-testid="text-visa-status"
              >
                {sc.label}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">{sc.description}</p>
            </div>
          </div>

          {/* ── Official Government Portal (always shown if available) ──── */}
          {(() => {
            const portal = (officialPortals as any).portals[destInfo.iso];
            if (!portal) return null;
            return (
              <div
                className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(247,176,136,0.04)" }}
              >
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Official Government Source</p>
                  <p className="text-xs text-muted-foreground">{portal.label}</p>
                </div>
                <a
                  href={portal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-official-gov"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold shrink-0 transition-all"
                  style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
                >
                  <Navigation className="h-3.5 w-3.5" />
                  Go to Official Government Site
                </a>
              </div>
            );
          })()}

          {/* ── Tier-1 Rich Detail ─────────────────────────────────────────── */}
          {tier1 && (
            <>
              {/* Quick Stats */}
              <div
                className="grid grid-cols-2 gap-px"
                style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Processing Time</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground/80">{tier1.processingTime}</p>
                </div>
                <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Consular Fee</p>
                  </div>
                  <p className="text-sm font-semibold text-foreground/80">{tier1.fee}</p>
                </div>
              </div>

              {/* Action Path */}
              <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Action Path</p>
                <div className="flex flex-wrap gap-2">
                  {tier1.applyOnline?.available && tier1.applyOnline?.url && (
                    <a
                      href={tier1.applyOnline.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-apply-online"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{ background: `${sc.color}20`, color: sc.color, border: `1px solid ${sc.color}50` }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Apply Online (Official Link)
                    </a>
                  )}
                  {tier1.applyVFS?.available && tier1.applyVFS?.url && (
                    <a
                      href={tier1.applyVFS.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-apply-vfs"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                      style={{ background: "rgba(255,255,255,0.08)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
                    >
                      <Building2 className="h-3.5 w-3.5" />
                      VFS Global
                    </a>
                  )}
                  {tier1.officialUrl && (
                    <a
                      href={tier1.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-testid="link-official"
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Official Portal
                    </a>
                  )}
                </div>
              </div>

              {/* Notes */}
              {tier1.notes && (
                <div className="px-6 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Important Notes</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{tier1.notes}</p>
                </div>
              )}

              {/* Embassy / Where to Apply */}
              <div className="px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4" style={{ color: sc.color }} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Where to Apply</p>
                </div>
                {tier1.embassyInOrigin ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="font-semibold text-foreground/80">{destInfo.name}</span> has a diplomatic mission in{" "}
                      <span className="font-semibold text-foreground/80">{originInfo.name}</span>.
                    </p>
                    {tier1.nearestEmbassy && (
                      <EmbassyBlock
                        embassy={tier1.nearestEmbassy}
                        consulates={tier1.additionalConsulates}
                        destName={destInfo.name}
                        accentColor={sc.color}
                      />
                    )}
                  </div>
                ) : tier1.nearestEmbassy ? (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">
                      <span className="font-semibold" style={{ color: sc.color }}>No Embassy in {originInfo.name}.</span>{" "}
                      Nearest consulate:{" "}
                      <span className="font-semibold text-foreground/80">
                        {tier1.nearestEmbassy.city}, {tier1.nearestEmbassy.country}
                      </span>
                    </p>
                    <EmbassyBlock
                      embassy={tier1.nearestEmbassy}
                      consulates={tier1.additionalConsulates}
                      destName={destInfo.name}
                      accentColor={sc.color}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No embassy visit required — application is fully online.</p>
                )}
              </div>
            </>
          )}

          {/* ── Tier-2 Fallback — Global Intelligence (all 199 countries) ─── */}
          {!tier1 && statusType !== "unknown" && statusType !== "not_admitted" && (
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>

              {/* Quick Stats from destination-requirements.json */}
              {destReq && (
                <div
                  className="grid grid-cols-3 gap-px"
                  style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
                  data-testid="dest-req-stats"
                >
                  <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{statusType === "visa_free" ? "Visa Fee" : "Typical Fee"}</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground/80" data-testid="fee-value">{feeText}</p>
                  </div>
                  <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Processing</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground/80" data-testid="processing-value">{processingText}</p>
                  </div>
                  <div className="px-5 py-4" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max Stay</p>
                    </div>
                    <p className="text-sm font-semibold text-foreground/80" data-testid="maxstay-value">{stayText}</p>
                  </div>
                </div>
              )}

              {/* Nepal-specific conditions, from nepal-visa-facts.json */}
              {npFact && (
                <div className="px-6 pt-5 space-y-2" data-testid="nepal-facts">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">For Nepali passport holders</p>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={npFact.confidence === "confirmed"
                        ? { background: "rgba(56,200,120,0.12)", color: "hsl(145 65% 60%)" }
                        : { background: "rgba(247,200,100,0.12)", color: "hsl(42 90% 65%)" }}
                    >
                      {npFact.confidence === "confirmed" ? `Checked ${formatDate(NEPAL_FACTS_CHECKED)}` : "Not confirmed — check before travel"}
                    </span>
                  </div>
                  {npFact.conditions.length > 0 && (
                    <ul className="space-y-1.5">
                      {npFact.conditions.map((c, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" style={{ color: "hsl(42 90% 65%)" }} />
                          {c}
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Sources:{" "}
                    {npFact.sources.map((url, i) => (
                      <span key={url}>
                        {i > 0 && ", "}
                        <a href={url} target="_blank" rel="noopener noreferrer" className="underline">{new URL(url).hostname.replace(/^www\./, "")}</a>
                      </span>
                    ))}
                  </p>
                </div>
              )}

              {/* Action Block */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Recommended Action</p>

                {(statusType === "evisa") && (
                  <div
                    className="flex items-start gap-3 rounded-xl p-4"
                    style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}30` }}
                    data-testid="action-evisa"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" style={{ color: sc.color }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: sc.color }}>Apply Online Before Travel</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {npFact
                          ? `Apply for your ${destInfo.name} e-Visa or travel authorization online before you fly. Fee: ${feeText}.`
                          : destReq
                          ? `Apply for the ${destInfo.name} e-Visa at least ${processingText.toLowerCase()} before your trip. Fee: ${feeText}.`
                          : `Search for the official ${destInfo.name} e-Visa portal and apply at least 2–4 weeks before your trip.`}
                      </p>
                    </div>
                  </div>
                )}

                {(statusType === "visa_on_arrival") && (
                  <div
                    className="flex items-start gap-3 rounded-xl p-4"
                    style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}30` }}
                    data-testid="action-voa"
                  >
                    <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: sc.color }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: sc.color }}>Available at Port of Entry</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {destReq
                          ? `Visa fee: ${feeText}, paid at the ${destInfo.name} immigration counter on arrival. Max stay: ${stayText}.`
                          : `Bring sufficient funds, a return ticket, and passport photos. Check the official ${destInfo.name} immigration website for fees.`}
                      </p>
                    </div>
                  </div>
                )}

                {(statusType === "sticker_visa") && (
                  <div className="space-y-3" data-testid="action-sticker">
                    <div
                      className="flex items-start gap-3 rounded-xl p-4"
                      style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}30` }}
                    >
                      <Building2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: sc.color }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: sc.color }}>Apply at Nearest Embassy or VFS Global</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {npFact
                          ? `Get a visa before you travel — see the conditions above. Fee: ${feeText}.`
                          : destReq
                            ? `Contact the ${destInfo.name} embassy. Fee: ${feeText}. Allow ${processingText} for processing.`
                            : `Contact the ${destInfo.name} embassy or a VFS Global service centre in your nearest city. Allow 3–6 weeks for processing.`}
                        </p>
                        <a
                          href="https://www.vfsglobal.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          data-testid="link-vfs-global"
                          className="inline-flex items-center gap-1 mt-2 text-xs font-semibold hover:underline"
                          style={{ color: sc.color }}
                        >
                          Find VFS Global locations <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                    {/* Regional Hub Helper */}
                    {(() => {
                      const hub = (jurisdictions as any).hubs[originInfo.iso];
                      if (!hub) return null;
                      const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(`${destInfo.name} Embassy ${hub.city} ${hub.country}`)}`;
                      return (
                        <div
                          className="rounded-xl p-4"
                          style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.07)" }}
                          data-testid="regional-hub"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: sc.color }} />
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nearest Embassy Hub</p>
                          </div>
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="text-sm font-semibold text-foreground/80">
                                {destInfo.name} Embassy — {hub.city}, {hub.country}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {originInfo.name} passports are typically served via the {hub.city} regional hub.
                              </p>
                            </div>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              data-testid="link-hub-maps"
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all"
                              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }}
                            >
                              <MapPin className="h-3.5 w-3.5" />
                              View on Maps
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {(statusType === "visa_free") && (
                  <div
                    className="flex items-start gap-3 rounded-xl p-4"
                    style={{ background: `${sc.color}10`, border: `1px solid ${sc.color}30` }}
                    data-testid="action-visa-free"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: sc.color }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: sc.color }}>No Visa Required</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {destReq
                          ? `You may enter ${destInfo.name} freely with a valid ${originInfo.name} passport. Maximum stay: ${stayText}.`
                          : `You may enter ${destInfo.name} freely. Check entry conditions for maximum stay duration.`}
                      </p>
                      {!npFact && destReq?.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">General note for all nationalities: {destReq.notes}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Required Documents */}
              {destReq && destReq.docs.length > 0 && statusType !== "visa_free" && (
                <div className="px-6 py-5" data-testid="section-docs">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Typical Documents Required</p>
                  <ul className="space-y-1.5">
                    {destReq.docs.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-foreground/70">
                        <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: sc.color }} />
                        {doc}
                      </li>
                    ))}
                  </ul>
                  {!npFact && destReq.notes && (
                    <p className="text-xs text-muted-foreground mt-3 italic border-l-2 pl-3" style={{ borderColor: `${sc.color}50` }}>
                      {destReq.notes}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {statusType === "not_admitted" && (
            <div className="px-6 py-5">
              <div
                className="flex items-start gap-3 rounded-xl p-4"
                style={{ background: "rgba(148,163,184,0.06)", border: "1px solid rgba(148,163,184,0.2)" }}
                data-testid="action-not-admitted"
              >
                <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Entry into {destInfo.name} is not permitted for holders of a {originInfo.name} passport per current Passport Index data. Verify with the destination country's official immigration authority.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Last Updated + Data Credit ────────────────────────────────────── */}
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3 mb-8"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)" }}
          data-testid="text-last-updated"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            {npFact && (
              <>Nepal entry rules checked: <span className="font-semibold text-foreground/60">{formatDate(NEPAL_FACTS_CHECKED)}</span>{" · "}</>
            )}
            Entry data checked: <span className="font-semibold text-foreground/60">{formatDate(syncStatus.lastChecked)}</span> (weekly)
            {" · "}
            Rules last changed: <span className="font-semibold text-foreground/60">{formatDate(syncStatus.lastChanged)}</span>
            {" · "}
            Source:{" "}
            <a
              href="https://github.com/ilyankou/passport-index-dataset"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
              style={{ color: "rgba(247,176,136,0.7)" }}
            >
              Passport Index Dataset
            </a>
            {" · "}
            Operated by Synergy Soul LLC
          </p>
        </div>

        {/* ── CTA — Check Another Pair ─────────────────────────────────────── */}
        <div className="text-center">
          <button
            type="button"
            onClick={goBackOrToHub}
            data-testid="link-check-another"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all"
            style={{
              background: "rgba(247,176,136,0.12)",
              color: "#F7B088",
              border: "1px solid rgba(247,176,136,0.25)",
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Check Another Country Pair
          </button>
        </div>

        {/* ── Legal Disclaimer ─────────────────────────────────────────────── */}
        <p className="text-center text-[11px] text-muted-foreground leading-relaxed mt-8 px-2">
          Visa requirements change frequently. This information is provided for reference only and may not reflect the latest regulations.
          Always verify with the official embassy or consulate of {destInfo.name} before travelling.
          Himal to Horizon / Synergy Soul LLC accepts no liability for decisions made based on this data.
        </p>

      </div>
    </div>
  );
}

// ─── Embassy Block Sub-Component ─────────────────────────────────────────────

function EmbassyBlock({
  embassy,
  consulates,
  destName,
  accentColor,
}: {
  embassy: { city: string; country: string; address: string; mapsUrl: string };
  consulates: string[];
  destName: string;
  accentColor: string;
}) {
  return (
    <div className="flex items-start gap-3 flex-wrap">
      <div
        className="flex-1 min-w-0 rounded-xl p-3"
        style={{ background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p className="text-sm font-semibold text-foreground/80">
          {destName} Embassy — {embassy.city}, {embassy.country}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{embassy.address}</p>
        {consulates && consulates.length > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Additional VFS / consulate cities in {embassy.country}:{" "}
            <span className="text-foreground/60">{consulates.join(" · ")}</span>
          </p>
        )}
      </div>
      <a
        href={embassy.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        data-testid="link-view-maps"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all"
        style={{
          background: "rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.7)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <MapPin className="h-3.5 w-3.5" />
        View on Maps
      </a>
    </div>
  );
}
