import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { NavTabs } from "@/components/nav-tabs";
import { VisaSubNav } from "@/components/visa-subnav";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";
import {
  ArrowUpRight, ShieldCheck, FileText, Users, Languages, Clock, AlertTriangle, Info,
} from "lucide-react";
import { setSEO, resetSEO } from "@/lib/seo";
import { difficultyQuery } from "@/lib/visa-queries";
import visaData from "@/lib/visa-data.json";

const AMBER = "hsl(22 79% 75%)";

type DifficultyTier = "easy" | "moderate" | "hard" | "very_hard";

type DifficultyEntry = {
  countryCode: string;
  countryName: string;
  status: string;
  score: number;
  tier: DifficultyTier;
  documentCount: number;
  requiresPoliceClearance: boolean;
  requiresInterview: boolean;
  requiresTranslation: boolean;
  processingTime: string;
  fee: string;
  verified: boolean;
};

const FLAG_BY_CODE: Record<string, string> = Object.fromEntries(
  (visaData as any).countries.map((c: { code: string; flag: string }) => [c.code, c.flag])
);

// Status/tier text now comes from the shared translation table (see
// i18n.ts) so this page reads correctly in whichever language the site is
// set to, matching every other page in Visa Intelligence.
const STATUS_KEYS: Record<string, TranslationKey> = {
  visa_free: "visa.status_visa_free" as TranslationKey,
  visa_on_arrival: "visa.status_voa" as TranslationKey,
  evisa: "visa.status_evisa" as TranslationKey,
  sponsor_program: "visa.label_sponsor" as TranslationKey,
  employer_petition: "visa.label_employer" as TranslationKey,
  embassy_visa: "visa.status_required" as TranslationKey,
};

const TIER_META: Record<DifficultyTier, { labelKey: TranslationKey; color: string; bg: string; border: string }> = {
  easy: {
    labelKey: "visa.tier_easy" as TranslationKey,
    color: "hsl(145 65% 60%)",
    bg: "rgba(56,200,120,0.10)",
    border: "rgba(56,200,120,0.3)",
  },
  moderate: {
    labelKey: "visa.tier_moderate" as TranslationKey,
    color: "hsl(205 80% 68%)",
    bg: "rgba(99,179,237,0.10)",
    border: "rgba(99,179,237,0.3)",
  },
  hard: {
    labelKey: "visa.tier_hard" as TranslationKey,
    color: "hsl(42 90% 65%)",
    bg: "rgba(247,200,100,0.10)",
    border: "rgba(247,200,100,0.3)",
  },
  very_hard: {
    labelKey: "visa.tier_very_hard" as TranslationKey,
    color: "hsl(0 75% 65%)",
    bg: "rgba(220,80,80,0.10)",
    border: "rgba(220,80,80,0.3)",
  },
};

const TIER_ORDER: DifficultyTier[] = ["easy", "moderate", "hard", "very_hard"];

function cardStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "1rem",
  };
}

function Tag({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.65)" }}
    >
      {icon}
      {label}
    </span>
  );
}

function CountryRow({ entry }: { entry: DifficultyEntry }) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const flag = FLAG_BY_CODE[entry.countryCode] ?? "🌐";
  const statusKey = STATUS_KEYS[entry.status];

  return (
    <button
      type="button"
      onClick={() => setLocation(`/visa/NP/${entry.countryCode}`)}
      className="w-full text-left p-4 rounded-xl flex items-center gap-3 transition-colors"
      style={cardStyle()}
      data-testid={`difficulty-row-${entry.countryCode}`}
    >
      <span className="text-2xl shrink-0">{flag}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="text-sm font-bold text-white">{entry.countryName}</span>
          <span className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.45)" }}>
            {statusKey ? t(statusKey) : entry.status}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag icon={<FileText className="h-3 w-3" />} label={`${entry.documentCount} ${t("visa.documents_label" as TranslationKey)}`} />
          <Tag icon={<Clock className="h-3 w-3" />} label={entry.processingTime} />
          {entry.requiresPoliceClearance && <Tag icon={<ShieldCheck className="h-3 w-3" />} label={t("visa.tag_police" as TranslationKey)} />}
          {entry.requiresInterview && <Tag icon={<Users className="h-3 w-3" />} label={t("visa.tag_interview" as TranslationKey)} />}
          {entry.requiresTranslation && <Tag icon={<Languages className="h-3 w-3" />} label={t("visa.tag_translation" as TranslationKey)} />}
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
    </button>
  );
}

export default function VisaDifficultyPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { t } = useLanguage();

  const { data = [], isLoading, error } = useQuery<DifficultyEntry[]>({
    queryKey: difficultyQuery.queryKey,
    queryFn: difficultyQuery.queryFn as () => Promise<DifficultyEntry[]>,
  });

  useEffect(() => {
    setSEO({
      title: "Easiest to Hardest Countries to Get a Tourist Visa — Nepal Passport",
      description: "Every destination we cover, ranked from easiest to hardest for a Nepali passport holder based on documents required, processing time, and application channel.",
      path: "/visa-guides/difficulty",
    });
    return () => resetSEO();
  }, []);

  const filtered = useMemo(
    () => data.filter((d) => d.countryName.toLowerCase().includes(query.toLowerCase())),
    [data, query]
  );

  const byTier = useMemo(() => {
    const grouped: Record<DifficultyTier, DifficultyEntry[]> = { easy: [], moderate: [], hard: [], very_hard: [] };
    for (const entry of filtered) grouped[entry.tier].push(entry);
    return grouped;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="sticky top-0 z-40" style={{ background: "hsl(211 60% 8%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={() => setLocation("/")} className="text-sm font-bold text-white">
            Himal to Horizon
          </button>
        </div>
        <NavTabs />
        <VisaSubNav active="difficulty" />
      </div>

      <div className="max-w-3xl mx-auto w-full px-4 py-8">
        <div className="text-center mb-6">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: "rgba(247,176,136,0.12)", color: AMBER, border: "1px solid rgba(247,176,136,0.3)" }}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {t("visa.badge_for_nepali" as TranslationKey)}
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">{t("visa.difficulty_page_title" as TranslationKey)}</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t("visa.difficulty_page_subtitle" as TranslationKey)}
          </p>
        </div>

        <div
          className="flex items-start gap-2.5 p-3.5 rounded-xl mb-6 text-xs leading-relaxed"
          style={{ background: "rgba(247,200,100,0.08)", border: "1px solid rgba(247,200,100,0.25)", color: "rgba(255,255,255,0.75)" }}
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(42 90% 65%)" }} />
          <span>{t("visa.difficulty_disclaimer" as TranslationKey)}</span>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("visa.search_country" as TranslationKey)}
          className="w-full mb-6 px-4 py-2.5 rounded-lg text-sm text-white placeholder:text-white/40 outline-none"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
          data-testid="input-difficulty-search"
        />

        {isLoading && (
          <div className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.5)" }}>{t("visa.difficulty_loading" as TranslationKey)}</div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm p-4 rounded-xl" style={{ color: "hsl(0 75% 70%)", background: "rgba(220,60,60,0.08)" }}>
            <AlertTriangle className="h-4 w-4" /> {t("visa.difficulty_error" as TranslationKey)}
          </div>
        )}

        {!isLoading && !error && (
          <div className="flex flex-col gap-8">
            {TIER_ORDER.map((tier) => {
              const entries = byTier[tier];
              if (entries.length === 0) return null;
              const meta = TIER_META[tier];
              return (
                <div key={tier}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      {t(meta.labelKey)} · {entries.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 mt-3">
                    {entries.map((entry) => (
                      <CountryRow key={entry.countryCode} entry={entry} />
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.5)" }}>{t("visa.no_matches" as TranslationKey)}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
