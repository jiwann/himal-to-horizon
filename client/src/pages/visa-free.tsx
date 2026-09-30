import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { NavTabs } from "@/components/nav-tabs";
import { VisaSubNav } from "@/components/visa-subnav";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { ArrowUpRight, ShieldCheck, Info, Search } from "lucide-react";
import { setSEO, resetSEO } from "@/lib/seo";
import { buildVisaList, type PassportCategory, type PassportEntry } from "@/lib/passport-lookup";

const AMBER = "hsl(22 79% 75%)";

const CATEGORY_META: Record<PassportCategory, { titleKey: TranslationKey; blurbKey: TranslationKey; color: string; bg: string; border: string }> = {
  visa_free: {
    titleKey: "visa.free_category_visa_free_title" as TranslationKey,
    blurbKey: "visa.free_category_visa_free_blurb" as TranslationKey,
    color: "hsl(145 65% 60%)",
    bg: "rgba(56,200,120,0.10)",
    border: "rgba(56,200,120,0.3)",
  },
  visa_on_arrival: {
    titleKey: "visa.free_category_voa_title" as TranslationKey,
    blurbKey: "visa.free_category_voa_blurb" as TranslationKey,
    color: "hsl(42 90% 65%)",
    bg: "rgba(247,200,100,0.10)",
    border: "rgba(247,200,100,0.3)",
  },
  evisa: {
    titleKey: "visa.subnav_evisa" as TranslationKey,
    blurbKey: "visa.free_category_visa_free_blurb" as TranslationKey,
    color: "hsl(205 80% 68%)",
    bg: "rgba(99,179,237,0.10)",
    border: "rgba(99,179,237,0.3)",
  },
};

const CATEGORY_ORDER: PassportCategory[] = ["visa_free", "visa_on_arrival"];

function cardStyle(): React.CSSProperties {
  return {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "1rem",
  };
}

function EntryCard({ entry }: { entry: PassportEntry }) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLocation(`/visa/NP/${entry.code}`)}
      className="w-full text-left p-3.5 rounded-xl flex items-center gap-3 transition-colors"
      style={cardStyle()}
      data-testid={`visa-free-row-${entry.code}`}
    >
      <span className="text-xl shrink-0">{entry.flag}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-white truncate">{entry.name}</div>
        <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
          {entry.maxStay
            ? `${t("visa.up_to" as TranslationKey)} ${entry.maxStay} ${t("visa.days_unit" as TranslationKey)}`
            : t("visa.stay_varies" as TranslationKey)}
          {entry.fee ? ` · ${entry.fee}` : ""}
        </div>
      </div>
      <ArrowUpRight className="h-4 w-4 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }} />
    </button>
  );
}

export default function VisaFreePage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    setSEO({
      title: "Visa-Free & Visa-on-Arrival Countries for Nepali Passport Holders",
      description: "The full list of countries Nepali citizens can visit without a pre-approved visa — visa-free and visa-on-arrival destinations, with stay lengths and fees.",
      path: "/visa-guides/visa-free",
    });
    return () => resetSEO();
  }, []);

  const lists = useMemo(() => {
    const byCategory: Record<PassportCategory, PassportEntry[]> = {
      visa_free: buildVisaList("visa_free"),
      visa_on_arrival: buildVisaList("visa_on_arrival"),
      evisa: [],
    };
    if (!query.trim()) return byCategory;
    const q = query.toLowerCase();
    const filtered: Record<PassportCategory, PassportEntry[]> = { visa_free: [], visa_on_arrival: [], evisa: [] };
    for (const cat of CATEGORY_ORDER) {
      filtered[cat] = byCategory[cat].filter((e) => e.name.toLowerCase().includes(q));
    }
    return filtered;
  }, [query]);

  const totalCount = CATEGORY_ORDER.reduce((sum, cat) => sum + lists[cat].length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="sticky top-0 z-40" style={{ background: "hsl(211 60% 8%)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center justify-between px-4 py-3">
          <button type="button" onClick={() => setLocation("/")} className="text-sm font-bold text-white">
            Himal to Horizon
          </button>
        </div>
        <NavTabs />
        <VisaSubNav active="visa-free" />
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
          <h1 className="text-3xl font-extrabold text-white mb-2">{t("visa.free_page_title" as TranslationKey)}</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
            {t("visa.free_page_subtitle" as TranslationKey)}
          </p>
        </div>

        <div
          className="flex items-start gap-2.5 p-3.5 rounded-xl mb-6 text-xs leading-relaxed"
          style={{ background: "rgba(99,179,237,0.08)", border: "1px solid rgba(99,179,237,0.25)", color: "rgba(255,255,255,0.75)" }}
        >
          <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "hsl(205 80% 70%)" }} />
          <span>{t("visa.free_disclaimer" as TranslationKey)}</span>
        </div>

        <div className="relative mb-6">
          <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.4)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("visa.search_country" as TranslationKey)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm text-white placeholder:text-white/40 outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
            data-testid="input-visa-free-search"
          />
        </div>

        {totalCount === 0 ? (
          <div className="text-center text-sm py-10" style={{ color: "rgba(255,255,255,0.5)" }}>{t("visa.no_matches" as TranslationKey)}</div>
        ) : (
          <div className="flex flex-col gap-8">
            {CATEGORY_ORDER.map((cat) => {
              const entries = lists[cat];
              if (entries.length === 0) return null;
              const meta = CATEGORY_META[cat];
              return (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-extrabold px-2.5 py-1 rounded-full"
                      style={{ background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}
                    >
                      {t(meta.titleKey)} · {entries.length}
                    </span>
                  </div>
                  <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>{t(meta.blurbKey)}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {entries.map((entry) => (
                      <EntryCard key={entry.code} entry={entry} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
