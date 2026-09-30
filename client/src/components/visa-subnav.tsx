import { useEffect } from "react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { difficultyQuery } from "@/lib/visa-queries";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";

const AMBER = "hsl(22 79% 75%)";

type SubTabId = "search" | "difficulty" | "visa-free" | "evisa";

const SUB_TABS: { id: SubTabId; labelKey: TranslationKey; path: string }[] = [
  { id: "search", labelKey: "visa.subnav_find" as TranslationKey, path: "/visa-guides" },
  { id: "difficulty", labelKey: "visa.subnav_difficulty" as TranslationKey, path: "/visa-guides/difficulty" },
  { id: "visa-free", labelKey: "visa.subnav_free" as TranslationKey, path: "/visa-guides/visa-free" },
  { id: "evisa", labelKey: "visa.subnav_evisa" as TranslationKey, path: "/visa-guides/evisa" },
];

// A second-level tab strip for the four Visa Intelligence views. Sits
// directly under the site-wide NavTabs on every page in this section.
export function VisaSubNav({ active }: { active: SubTabId }) {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  // Warm the only sub-tab that needs a server round trip, so switching to
  // it doesn't wait on the network (noticeable on Render's free tier).
  useEffect(() => {
    queryClient.prefetchQuery(difficultyQuery);
  }, []);

  return (
    <div
      className="flex gap-1.5 overflow-x-auto px-4 pt-2 pb-2.5"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {SUB_TABS.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            data-testid={`visa-subtab-${tab.id}`}
            onClick={() => setLocation(tab.path)}
            className="px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0"
            style={{
              background: isActive ? "rgba(247,176,136,0.15)" : "transparent",
              color: isActive ? AMBER : "rgba(255,255,255,0.55)",
              border: isActive ? "1px solid rgba(247,176,136,0.35)" : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {t(tab.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
