import { useState, useEffect, useMemo, useRef } from "react";
import { useLocation, useRoute } from "wouter";
import { VISA_CATEGORIES, type VisaCategory } from "@shared/visa-schema";
import { useQuery } from "@tanstack/react-query";
import { NavTabs } from "@/components/nav-tabs";
import { VisaSubNav } from "@/components/visa-subnav";
import {
  ArrowLeft, FileText, Clock, DollarSign, CheckCircle2, ExternalLink,
  MapPin, ChevronDown, ChevronUp, Globe, Languages, AlertCircle, ShieldCheck,
  Search, X, ClipboardCheck, Link2,
} from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { setSEO, resetSEO } from "@/lib/seo";
import { DEFAULT_FROM_COUNTRY } from "@shared/countries";
import { VisaWidget } from "@/components/visa-widget";
import { isLinkBroken } from "@/lib/link-status";
import { shortLinkFor } from "@/lib/visa-short-links";
import { VisaAlertSignup } from "@/components/visa-alert-signup";

// ── Types ─────────────────────────────────────────────────────────────────

function useCategoryLabels(t: (key: TranslationKey) => string): Record<VisaCategory, string> {
  return {
    tourist: t("visa.category_tourist" as TranslationKey),
    student_f1: t("visa.category_student_f1" as TranslationKey),
    exchange_j1: t("visa.category_exchange_j1" as TranslationKey),
    work_h2b: t("visa.category_work_h2b" as TranslationKey),
    student_general: t("visa.category_student_general" as TranslationKey),
    work_general: t("visa.category_work_general" as TranslationKey),
  };
}

type CountryListing = { countryCode: string; countryName: string; categories: VisaCategory[] };
type FromCountry = { code: string; name: string; active: boolean };

type VisaStep = { order: number; title: string; description: string };
type VisaLink = { label: string; url: string };
type VisaProfile = {
  fromCountryCode?: string;
  countryCode: string;
  countryName: string;
  category: VisaCategory;
  status: string;
  summary: string;
  overview: string;
  steps: VisaStep[];
  requiredDocuments: string[];
  processingTime: string;
  fee: string;
  maxStay?: string;
  officialLinks: VisaLink[];
  nearestEmbassy?: { city: string; country: string; address?: string; mapsUrl?: string; note?: string };
  faqs: { q: string; a: string }[];
  notes?: string;
  verified: boolean;
  lastReviewed: string | null;
  sourceNotes?: string;
};

type LocalizedResponse = { profile: VisaProfile; translated: boolean; translationFailed: boolean };

const AMBER = "hsl(22 79% 75%)";
const GREEN = "hsl(145 65% 55%)";
const BLUE = "hsl(205 80% 65%)";

// A small set of extra display languages beyond the site's own switcher —
// this is specifically "read this visa guide in Nepali (or another language)"
// on top of whatever the site chrome is currently in.
const TRANSLATE_LANGS: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ne", label: "नेपाली (Nepali)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
];

function cardStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "1rem",
  };
}

// ── Country + category picker ───────────────────────────────────────────────

function CountryDropdown({
  countries, isLoading, selectedCountry, onSelect,
}: {
  countries: CountryListing[];
  isLoading: boolean;
  selectedCountry: CountryListing | null;
  onSelect: (c: CountryListing) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const filtered = useMemo(
    () => countries.filter((c) => c.countryName.toLowerCase().includes(query.toLowerCase())),
    [countries, query]
  );

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Focus the search box as soon as the dropdown opens, and reset the
  // filter each time it's reopened so it always starts showing everything.
  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        data-testid="button-nepal-visa-country-dropdown"
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="w-full flex items-center justify-between gap-2 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: selectedCountry ? "#fff" : "rgba(255,255,255,0.4)" }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <Search className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
          <span className="truncate">
            {isLoading ? t("visa.loading_countries" as TranslationKey) : selectedCountry ? selectedCountry.countryName : t("visa.travel_to_placeholder" as TranslationKey)}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-20 flex flex-col"
          style={{ background: "#0b1829", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "22rem" }}
        >
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("visa.filter_countries" as TranslationKey)}
              data-testid="input-nepal-visa-country-search"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              style={{ color: "#fff" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            )}
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("visa.no_countries_yet" as TranslationKey).replace("{query}", query)}
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.countryCode}
                  type="button"
                  data-testid={`button-country-${c.countryCode}`}
                  onClick={() => { onSelect(c); setOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium transition-colors"
                  style={{
                    background: selectedCountry?.countryCode === c.countryCode ? "rgba(247,176,136,0.1)" : "transparent",
                    color: selectedCountry?.countryCode === c.countryCode ? AMBER : "#fff",
                  }}
                >
                  <span>{c.countryName}</span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {c.categories.length} {t("visa.visa_types_label" as TranslationKey)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function FromCountryDropdown({
  fromCountries, isLoading, selected, onSelect,
}: {
  fromCountries: FromCountry[];
  isLoading: boolean;
  selected: FromCountry | null;
  onSelect: (c: FromCountry) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const filtered = useMemo(
    () => fromCountries.filter((c) => c.name.toLowerCase().includes(query.toLowerCase())),
    [fromCountries, query]
  );

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        data-testid="button-nepal-visa-from-dropdown"
        onClick={() => setOpen((o) => !o)}
        disabled={isLoading}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
      >
        <span className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: AMBER }} />
          <span className="truncate">
            {isLoading
              ? t("visa.loading_generic" as TranslationKey)
              : selected
              ? t("visa.hold_passport" as TranslationKey).replace("{country}", selected.name)
              : t("visa.select_passport_country" as TranslationKey)}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-30 flex flex-col"
          style={{ background: "#0b1829", border: "1px solid rgba(255,255,255,0.12)", maxHeight: "22rem" }}
        >
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 shrink-0"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}
          >
            <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("visa.filter_countries" as TranslationKey)}
              data-testid="input-nepal-visa-from-search"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
              style={{ color: "#fff" }}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")}>
                <X className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.4)" }} />
              </button>
            )}
          </div>
          <div className="overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {t("visa.no_matches" as TranslationKey)}
              </div>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  data-testid={`button-from-${c.code}`}
                  onClick={() => { onSelect(c); setOpen(false); }}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium transition-colors"
                  style={{
                    background: selected?.code === c.code ? "rgba(247,176,136,0.1)" : "transparent",
                    color: selected?.code === c.code ? AMBER : "#fff",
                  }}
                >
                  <span>{c.name}</span>
                  {!c.active && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" }}
                    >
                      {t("visa.quick_check_badge" as TranslationKey)}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PickerScreen({
  countries, isLoading, onPick, fromCountries, fromCountriesLoading, fromCountry, onFromChange,
}: {
  countries: CountryListing[];
  isLoading: boolean;
  onPick: (countryCode: string, category: VisaCategory) => void;
  fromCountries: FromCountry[];
  fromCountriesLoading: boolean;
  fromCountry: FromCountry | null;
  onFromChange: (c: FromCountry) => void;
}) {
  const [selectedCountry, setSelectedCountry] = useState<CountryListing | null>(null);
  const { t } = useLanguage();
  const categoryLabels = useCategoryLabels(t);

  // Changing the passport country changes which destinations are valid, so
  // clear any destination/category picked under the previous selection.
  useEffect(() => {
    setSelectedCountry(null);
  }, [fromCountry?.code]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
          style={{ background: "rgba(247,176,136,0.12)", color: AMBER, border: "1px solid rgba(247,176,136,0.3)" }}
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          {fromCountry
            ? t("visa.badge_for_passport" as TranslationKey).replace("{country}", fromCountry.name.toUpperCase())
            : t("visa.badge_generic" as TranslationKey)}
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">
          {fromCountry
            ? fromCountry.code === "NP"
              ? t("visa.hub_title_np" as TranslationKey)
              : t("visa.hub_title" as TranslationKey).replace("{country}", fromCountry.name)
            : t("visa.hub_title_generic" as TranslationKey)}
        </h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          {t("visa.hub_subtitle" as TranslationKey)}
        </p>
      </div>

      <div className="mb-3">
        <FromCountryDropdown
          fromCountries={fromCountries}
          isLoading={fromCountriesLoading}
          selected={fromCountry}
          onSelect={onFromChange}
        />
      </div>

      {fromCountry && !fromCountry.active ? (
        // No step-by-step guides for this passport yet, but the passport-index
        // data covers every destination: offer the same checker the
        // Flights/Hotels pages use, set to this passport.
        <div className="mt-2" data-testid="panel-quick-check">
          <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t("visa.quick_check_note" as TranslationKey).replace("{country}", fromCountry.name)}
          </p>
          <VisaWidget defaultOrigin={fromCountry.code} />
        </div>
      ) : (
      <>
      <div className="mb-4">
        <CountryDropdown
          countries={countries}
          isLoading={isLoading}
          selectedCountry={selectedCountry}
          onSelect={setSelectedCountry}
        />
      </div>

      {selectedCountry && (
        <div className="mt-6 p-5 rounded-xl" style={cardStyle()} data-testid="panel-category-picker">
          <div className="text-sm font-bold text-white mb-3">
            {t("visa.category_prompt" as TranslationKey).replace("{country}", selectedCountry.countryName)}
          </div>
          <div className="flex flex-col gap-2">
            {selectedCountry.categories.map((cat) => (
              <button
                key={cat}
                type="button"
                data-testid={`button-category-${cat}`}
                onClick={() => onPick(selectedCountry.countryCode, cat)}
                className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-colors"
                style={{ background: "rgba(247,176,136,0.1)", border: "1px solid rgba(247,176,136,0.25)", color: AMBER }}
              >
                {categoryLabels[cat] ?? cat}
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            ))}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ── Detail (one-stop) screen ────────────────────────────────────────────────

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="p-4 rounded-xl flex items-start gap-3" style={cardStyle()}>
      <div className="mt-0.5 shrink-0" style={{ color: AMBER }}>{icon}</div>
      <div className="min-w-0">
        <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</div>
        <div className="text-sm text-white leading-snug">{value}</div>
      </div>
    </div>
  );
}

function DetailScreen({
  fromCountryCode, countryCode, category, onBack,
}: {
  fromCountryCode: string;
  countryCode: string;
  category: VisaCategory;
  onBack: () => void;
}) {
  // Default this guide's content language to the site's language setting
  // as the starting point, rather than always starting in English — the
  // person who just switched the whole site to Nepali from the nav
  // shouldn't have to also flip this per-page toggle. It only supports a
  // subset of languages (server-translated paragraph content is more
  // expensive than the static UI strings), so anything else falls back
  // to English; the toggle below still lets them override it.
  const { language: siteLanguage, t } = useLanguage();
  const categoryLabels = useCategoryLabels(t);
  const [lang, setLang] = useState<string>(() =>
    TRANSLATE_LANGS.some((l) => l.code === siteLanguage) ? siteLanguage : "en"
  );
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setLocation] = useLocation();

  const { data, isLoading, isFetching, error } = useQuery<LocalizedResponse>({
    queryKey: ["/api/visa", fromCountryCode, countryCode, category, lang],
    queryFn: async () => {
      const r = await fetch(`/api/visa/${fromCountryCode}/${countryCode}/${category}?lang=${encodeURIComponent(lang)}`);
      if (!r.ok) throw new Error(`Failed to load visa guide (${r.status})`);
      return r.json();
    },
  });

  useEffect(() => {
    if (data?.profile) {
      setSEO({
        title: `${data.profile.countryName} ${categoryLabels[category]} Visa for Nepali Citizens`,
        description: data.profile.summary,
        path: `/visa-guides/${countryCode}/${category}`,
      });
    }
    return () => resetSEO();
  }, [data, countryCode, category]);

  if (isLoading) {
    return <div className="max-w-3xl mx-auto px-4 py-16 text-center text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>Loading visa guide…</div>;
  }

  if (error || !data) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <AlertCircle className="h-8 w-8 mx-auto mb-3" style={{ color: "rgba(220,60,60,0.8)" }} />
        <p className="text-sm text-white mb-4">We couldn't load this visa guide.</p>
        <button type="button" onClick={onBack} className="text-sm font-semibold" style={{ color: AMBER }}>
          ← {t("visa.back_generic")}
        </button>
      </div>
    );
  }

  const { profile, translationFailed } = data;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" data-testid="panel-visa-detail">
      <button
        type="button"
        onClick={onBack}
        data-testid="button-back-to-picker"
        className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-colors"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        <ArrowLeft className="h-4 w-4" /> {t("visa.back_generic")}
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(99,179,237,0.12)", color: BLUE, border: "1px solid rgba(99,179,237,0.3)" }}
          >
            {categoryLabels[profile.category] ?? profile.category}
          </span>
          {profile.verified ? (
            <span
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(56,200,120,0.12)", color: GREEN, border: "1px solid rgba(56,200,120,0.3)" }}
            >
              <CheckCircle2 className="h-3 w-3" /> {t("visa.verified_badge" as TranslationKey)}{profile.lastReviewed ? ` · ${profile.lastReviewed}` : ""}
            </span>
          ) : (
            <span
              className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
              style={{ background: "rgba(247,200,100,0.12)", color: "hsl(42 90% 65%)", border: "1px solid rgba(247,200,100,0.3)" }}
            >
              <AlertCircle className="h-3 w-3" /> {t("visa.not_verified" as TranslationKey)}
            </span>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">{profile.countryName}</h1>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{profile.summary}</p>
      </div>

      {/* Checklist download + short shareable link (for video descriptions) */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <a
          href={`/visa-guides/${countryCode}/${category}/checklist?lang=${encodeURIComponent(lang)}`}
          onClick={(e) => { e.preventDefault(); setLocation(`/visa-guides/${countryCode}/${category}/checklist?lang=${encodeURIComponent(lang)}`); }}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold"
          style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
          data-testid="button-open-checklist"
        >
          <ClipboardCheck className="h-3.5 w-3.5" /> Download document checklist
        </a>
        {category === "tourist" && (
          <button
            type="button"
            onClick={() => {
              const url = `https://himaltohorizon.com${shortLinkFor(profile.countryName)}`;
              navigator.clipboard?.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }).catch(() => {});
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
            data-testid="button-copy-short-link"
          >
            <Link2 className="h-3.5 w-3.5" />
            {copied ? "Link copied!" : `himaltohorizon.com${shortLinkFor(profile.countryName)}`}
          </button>
        )}
      </div>

      {/* Language toggle for this guide's content */}
      <div className="relative mb-6">
        <button
          type="button"
          data-testid="button-translate-toggle"
          onClick={() => setLangMenuOpen((o) => !o)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
        >
          <Languages className="h-3.5 w-3.5" />
          {TRANSLATE_LANGS.find((l) => l.code === lang)?.label ?? "English"}
          {isFetching && <span className="opacity-60">· updating…</span>}
          <ChevronDown className="h-3 w-3" />
        </button>
        {langMenuOpen && (
          <div
            className="absolute left-0 top-full mt-1.5 rounded-lg overflow-hidden z-20"
            style={{ background: "#0b1829", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            {TRANSLATE_LANGS.map((l) => (
              <button
                key={l.code}
                type="button"
                data-testid={`button-lang-${l.code}`}
                onClick={() => { setLang(l.code); setLangMenuOpen(false); }}
                className="block w-full text-left px-4 py-2.5 text-sm whitespace-nowrap"
                style={{ color: lang === l.code ? AMBER : "#fff", background: lang === l.code ? "rgba(247,176,136,0.08)" : "transparent" }}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}
        {translationFailed && (
          <p className="text-xs mt-2" style={{ color: "hsl(42 90% 65%)" }}>
            {t("visa.translation_unavailable" as TranslationKey)}
          </p>
        )}
      </div>

      {/* Overview */}
      <div className="p-5 rounded-xl mb-6" style={cardStyle()}>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.85)" }}>{profile.overview}</p>
      </div>

      {/* Key facts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <InfoTile icon={<Clock className="h-4 w-4" />} label={t("visa.processing_time")} value={profile.processingTime} />
        <InfoTile icon={<DollarSign className="h-4 w-4" />} label={t("visa.typical_fee")} value={profile.fee} />
        {profile.maxStay && <InfoTile icon={<Globe className="h-4 w-4" />} label={t("visa.max_stay")} value={profile.maxStay} />}
        {profile.nearestEmbassy && (
          <InfoTile
            icon={<MapPin className="h-4 w-4" />}
            label={t("visa.where_to_apply")}
            value={[profile.nearestEmbassy.city, profile.nearestEmbassy.country].filter(Boolean).join(", ") + (profile.nearestEmbassy.note ? ` — ${profile.nearestEmbassy.note}` : "")}
          />
        )}
      </div>

      {/* Official links */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-white mb-3">{t("visa.official_links_heading" as TranslationKey)}</h2>
        <div className="flex flex-col gap-2">
          {profile.officialLinks.filter((link) => !isLinkBroken(link.url)).map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid={`link-official-${i}`}
              className="flex items-center justify-between px-4 py-3 rounded-lg text-sm font-semibold transition-colors"
              style={{ background: "rgba(247,176,136,0.08)", border: "1px solid rgba(247,176,136,0.25)", color: AMBER }}
            >
              <span className="truncate">{link.label}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0 ml-2" />
            </a>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-white mb-3">{t("visa.steps_heading" as TranslationKey)}</h2>
        <div className="flex flex-col gap-3">
          {profile.steps.map((step) => (
            <div key={step.order} className="flex gap-3 p-4 rounded-xl" style={cardStyle()}>
              <div
                className="shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-extrabold"
                style={{ background: AMBER, color: "hsl(211 60% 8%)" }}
              >
                {step.order}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white mb-0.5">{step.title}</div>
                <div className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Required documents */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-white mb-3">{t("visa.documents_heading" as TranslationKey)}</h2>
        <div className="p-4 rounded-xl" style={cardStyle()}>
          <ul className="flex flex-col gap-2.5">
            {profile.requiredDocuments.map((doc, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                <FileText className="h-4 w-4 mt-0.5 shrink-0" style={{ color: BLUE }} />
                <span>{doc}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Rule-change alerts for this country */}
      <div className="mb-6">
        <VisaAlertSignup defaultCountry={countryCode} countryName={profile.countryName} source="guide" />
      </div>

      {/* FAQs */}
      {profile.faqs.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-bold text-white mb-3">{t("visa.faq_heading" as TranslationKey)}</h2>
          <div className="flex flex-col gap-2">
            {profile.faqs.map((faq, i) => (
              <div key={i} className="rounded-xl overflow-hidden" style={cardStyle()}>
                <button
                  type="button"
                  data-testid={`button-faq-${i}`}
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between gap-2 px-4 py-3.5 text-left text-sm font-semibold text-white"
                >
                  <span>{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes / caveats */}
      {profile.notes && (
        <div className="p-4 rounded-xl mb-6 flex gap-2.5" style={{ background: "rgba(247,200,100,0.06)", border: "1px solid rgba(247,200,100,0.2)" }}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "hsl(42 90% 65%)" }} />
          <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{profile.notes}</p>
        </div>
      )}

      {/* Source / disclaimer */}
      <div className="pt-4 border-t text-xs leading-relaxed" style={{ borderColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
        {t("visa.footer_disclaimer" as TranslationKey)}
        {profile.sourceNotes && <> {t("visa.sources_prefix" as TranslationKey)} {profile.sourceNotes}</>}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────

export default function VisaGuidesPage() {
  const [, setLocation] = useLocation();
  // The open guide lives in the URL (/visa-guides/BR/tourist) so every guide
  // has a shareable address — used by short links like /visa/brazil and in
  // video descriptions.
  const [, params] = useRoute<{ countryCode: string; category: string }>("/visa-guides/:countryCode/:category");
  const selection =
    params && (VISA_CATEGORIES as readonly string[]).includes(params.category)
      ? { countryCode: params.countryCode.toUpperCase(), category: params.category as VisaCategory }
      : null;
  const [fromCountry, setFromCountry] = useState<FromCountry | null>(null);

  const { data: fromCountries = [], isLoading: fromCountriesLoading } = useQuery<FromCountry[]>({
    queryKey: ["/api/visa/from-countries"],
    queryFn: async () => {
      const r = await fetch("/api/visa/from-countries");
      if (!r.ok) throw new Error(`Failed to load origin countries (${r.status})`);
      return r.json();
    },
  });

  // Default to Nepal (the site's current focus) as soon as the origin-country
  // list loads, rather than forcing the person to pick it themselves.
  useEffect(() => {
    if (fromCountry || fromCountries.length === 0) return;
    const nepal = fromCountries.find((c) => c.code === DEFAULT_FROM_COUNTRY);
    setFromCountry(nepal ?? fromCountries.find((c) => c.active) ?? fromCountries[0]);
  }, [fromCountries, fromCountry]);

  const fromCode = fromCountry?.code ?? DEFAULT_FROM_COUNTRY;

  const { data: countries = [], isLoading } = useQuery<CountryListing[]>({
    queryKey: ["/api/visa", fromCode, "countries"],
    enabled: !!fromCountry?.active,
    queryFn: async () => {
      const r = await fetch(`/api/visa/${fromCode}/countries`);
      if (!r.ok) throw new Error(`Failed to load countries (${r.status})`);
      return r.json();
    },
  });

  useEffect(() => {
    setSEO({
      title: `${!fromCountry || fromCountry.code === "NP" ? "Visa Hub for Nepalese" : `Visa Hub for ${fromCountry.name} Passport Holders`} — Tourist, Student & Work Visas`,
      description: "The one-stop visa guide for your passport — steps, documents, fees, and official links for tourist, student, and work visas worldwide.",
      path: "/visa-guides",
    });
    return () => resetSEO();
  }, [fromCountry]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="sticky top-0 z-40" style={{ background: "hsl(211 60% 8%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={() => setLocation("/")} className="text-sm font-bold text-white">
            Himal to Horizon
          </button>
        </div>
        <NavTabs />
        <VisaSubNav active="search" />
      </div>

      {selection ? (
        <DetailScreen
          fromCountryCode={fromCode}
          countryCode={selection.countryCode}
          category={selection.category}
          onBack={() => setLocation("/visa-guides")}
        />
      ) : (
        <PickerScreen
          countries={countries}
          isLoading={isLoading}
          onPick={(countryCode, category) => setLocation(`/visa-guides/${countryCode}/${category}`)}
          fromCountries={fromCountries}
          fromCountriesLoading={fromCountriesLoading}
          fromCountry={fromCountry}
          onFromChange={setFromCountry}
        />
      )}
    </div>
  );
}
