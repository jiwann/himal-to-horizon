import { useLocation } from "wouter";
import { Plane, BedDouble, Car, ShieldPlus, FileText, BookOpen, Compass, Users } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";

const AMBER = "hsl(22 79% 75%)";
// Matches the sticky header's gradient background so the fade blends in
// rather than showing a visible seam.
const EDGE_FADE_BG = "rgb(13,23,37)";

const TABS: { id: string; labelKey?: TranslationKey; label?: string; icon: React.ReactNode; path: string; primary?: boolean }[] = [
  { id: "tab-visa",      labelKey: "nav.visa_intelligence",  icon: <FileText className="h-4 w-4" />,  path: "/visa-guides", primary: true },
  { id: "tab-flights",   labelKey: "nav.flights",            icon: <Plane className="h-4 w-4" />,     path: "/flights" },
  { id: "tab-hotels",    labelKey: "nav.hotels",             icon: <BedDouble className="h-4 w-4" />, path: "/hotels" },
  { id: "tab-cars",      labelKey: "nav.cars",               icon: <Car className="h-4 w-4" />,       path: "/cars" },
  { id: "tab-insurance", labelKey: "nav.insurance",          icon: <ShieldPlus className="h-4 w-4" />,path: "/insurance" },
  { id: "tab-blog",      labelKey: "nav.travel_blog",        icon: <BookOpen className="h-4 w-4" />,  path: "/blog" },
  { id: "tab-activities",labelKey: "nav.activities",         icon: <Compass className="h-4 w-4" />,   path: "/activities" },
  { id: "tab-community", labelKey: "nav.community",          icon: <Users className="h-4 w-4" />,     path: "/community" },
];

interface NavTabsProps {
  wrapStyle?: React.CSSProperties;
  wrapClass?: string;
  activePath?: string;
}

export function NavTabs({ wrapStyle, wrapClass = "", activePath }: NavTabsProps) {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const current = activePath ?? location;

  return (
    <div className="relative">
      <div
        className={`flex gap-0 overflow-x-auto px-4 ${wrapClass}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", ...wrapStyle }}
        data-testid="service-tabs"
      >
        {TABS.map((tab) => {
          const isActive = current === tab.path || (tab.path !== "/" && current.startsWith(tab.path));
          return (
            <button
              key={tab.id}
              type="button"
              data-testid={tab.id}
              onClick={() => setLocation(tab.path)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 bg-transparent shrink-0"
              style={{
                borderBottomColor: isActive ? AMBER : tab.primary ? "rgba(247,176,136,0.5)" : "transparent",
                color: isActive ? "#fff" : tab.primary ? AMBER : "rgba(255,255,255,0.60)",
              }}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = tab.primary ? AMBER : "rgba(255,255,255,0.60)"; }}
            >
              {tab.icon}
              {tab.label ?? t(tab.labelKey!)}
            </button>
          );
        })}
      </div>
      {/* Edge fades — a visual cue that the tab bar scrolls, so a tab pushed
          off-screen (e.g. Community, currently last) is never silently hidden
          with no hint that more tabs exist. Purely decorative/non-interactive. */}
      <div
        className="absolute left-0 top-0 bottom-0 w-6 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${EDGE_FADE_BG}, transparent)` }}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-10 pointer-events-none flex items-center justify-end pr-1"
        style={{ background: `linear-gradient(to left, ${EDGE_FADE_BG} 30%, transparent)` }}
      >
        <span className="text-white/30 text-xs">›</span>
      </div>
    </div>
  );
}
