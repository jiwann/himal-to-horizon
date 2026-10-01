import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "wouter";
import { Search, ChevronDown, X, ArrowRight, CheckCircle2, Globe, AlertTriangle, Info, XCircle } from "lucide-react";
import allCountriesData from "@/lib/all-countries.json";
import passportIndex from "@/lib/passport-index.json";
import { getEffectiveStatus } from "@/lib/passport-lookup";
import visaData from "@/lib/visa-data.json";

type Country = { code: string; name: string; flag: string };
type StatusType = "visa_free" | "evisa" | "visa_on_arrival" | "sticker_visa" | "not_admitted" | "unknown";

const COUNTRIES: Country[] = allCountriesData.countries as Country[];

const STATUS_CONFIG: Record<StatusType, { color: string; bg: string; border: string; label: string; icon: typeof CheckCircle2 }> = {
  visa_free:       { color: "hsl(145 65% 55%)", bg: "rgba(56,200,120,0.09)",  border: "rgba(56,200,120,0.25)",   label: "Visa Free",           icon: CheckCircle2 },
  evisa:           { color: "hsl(205 80% 65%)", bg: "rgba(99,179,237,0.09)",  border: "rgba(99,179,237,0.25)",   label: "e-Visa Available",    icon: Globe },
  visa_on_arrival: { color: "hsl(42 90% 65%)",  bg: "rgba(247,200,100,0.09)", border: "rgba(247,200,100,0.25)",  label: "Visa on Arrival",     icon: Info },
  sticker_visa:    { color: "hsl(22 79% 75%)",  bg: "rgba(247,176,136,0.09)", border: "rgba(247,176,136,0.25)",  label: "Sticker Visa Required", icon: AlertTriangle },
  not_admitted:    { color: "hsl(0 65% 60%)",   bg: "rgba(220,60,60,0.09)",   border: "rgba(220,60,60,0.25)",    label: "Entry Not Permitted", icon: XCircle },
  unknown:         { color: "rgba(255,255,255,0.4)", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.1)", label: "Data Unavailable",  icon: Info },
};

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function resolveCountry(value: string | undefined): Country | null {
  if (!value) return null;
  const v = value.trim();
  // Try exact name match
  const byName = COUNTRIES.find((c) => c.name.toLowerCase() === v.toLowerCase());
  if (byName) return byName;
  // Try ISO code
  const byCode = COUNTRIES.find((c) => c.code.toUpperCase() === v.toUpperCase());
  if (byCode) return byCode;
  // Try slug
  const slug = nameToSlug(v);
  return COUNTRIES.find((c) => nameToSlug(c.name) === slug) ?? null;
}

function lookupStatus(origin: Country, dest: Country): StatusType {
  const key = `${origin.code}->${dest.code}`;
  const tier1 = (visaData as any).requirements[key];
  if (tier1?.statusType) return tier1.statusType as StatusType;
  const tier2 = (passportIndex as any).requirements[key] as string | undefined;
  return tier2 ? (getEffectiveStatus(origin.code, dest.code, tier2) as StatusType) : "unknown";
}

function CountrySelect({ value, onChange, placeholder, testId }: {
  value: Country | null;
  onChange: (c: Country | null) => void;
  placeholder: string;
  testId: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 260 });
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.code.toLowerCase().includes(query.toLowerCase()),
  );

  function updatePosition() {
    if (!buttonRef.current) return;
    const r = buttonRef.current.getBoundingClientRect();
    setDropdownStyle({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(r.width, 260),
    });
  }

  function handleOpen() {
    updatePosition();
    setOpen((o) => !o);
    setQuery("");
  }

  useEffect(() => {
    if (!open) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      const portal = document.getElementById(`visa-portal-${testId}`);
      if (portal?.contains(target)) return;
      setOpen(false);
    }
    function handleScroll() { updatePosition(); }
    document.addEventListener("mousedown", handleOutside);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const dropdown = open ? (
    <div
      id={`visa-portal-${testId}`}
      className="rounded-xl shadow-2xl overflow-hidden"
      style={{
        position: "fixed",
        top: dropdownStyle.top,
        left: dropdownStyle.left,
        width: dropdownStyle.width,
        zIndex: 99999,
        background: "#0b1829",
        border: "1px solid rgba(255,255,255,0.12)",
      }}
    >
      <div className="p-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
          <Search className="h-3.5 w-3.5 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search country…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/30"
            style={{ color: "#fff" }}
          />
        </div>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No matches found</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              data-testid={`${testId}-option-${c.code}`}
              onClick={() => { onChange(c); setOpen(false); setQuery(""); }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors"
              style={{
                background: value?.code === c.code ? "rgba(247,176,136,0.1)" : "transparent",
                color: value?.code === c.code ? "#F7B088" : "rgba(255,255,255,0.85)",
              }}
              onMouseEnter={(e) => { if (value?.code !== c.code) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = value?.code === c.code ? "rgba(247,176,136,0.1)" : "transparent"; }}
            >
              <span className="text-lg leading-none">{c.flag}</span>
              <span className="truncate">{c.name}</span>
              <span className="ml-auto text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>{c.code}</span>
            </button>
          ))
        )}
      </div>
    </div>
  ) : null;

  return (
    <div ref={wrapperRef} className="relative flex-1 min-w-0">
      <button
        ref={buttonRef}
        type="button"
        data-testid={testId}
        onClick={handleOpen}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-sm transition-all text-left"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: open ? "1px solid rgba(247,176,136,0.55)" : "1px solid rgba(255,255,255,0.11)",
          color: value ? "#fff" : "rgba(255,255,255,0.4)",
        }}
      >
        <span className="flex items-center gap-2 truncate">
          {value ? (
            <><span className="text-lg leading-none shrink-0">{value.flag}</span><span className="truncate">{value.name}</span></>
          ) : (
            <span>{placeholder}</span>
          )}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="p-0.5 rounded hover:bg-white/10 transition-colors"
            >
              <X className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.35)" }} />
            </button>
          )}
          <ChevronDown
            className="h-4 w-4"
            style={{
              color: "rgba(255,255,255,0.35)",
              transform: open ? "rotate(180deg)" : "none",
              transition: "transform 0.2s",
            }}
          />
        </div>
      </button>
      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </div>
  );
}

interface VisaWidgetProps {
  defaultOrigin?: string;
  defaultDestination?: string;
}

export function VisaWidget({ defaultOrigin, defaultDestination }: VisaWidgetProps) {
  const [, setLocation] = useLocation();
  const [origin, setOrigin] = useState<Country | null>(() => resolveCountry(defaultOrigin));
  const [dest, setDest] = useState<Country | null>(() => resolveCountry(defaultDestination));

  // If defaults change (e.g. different blog post), re-resolve
  useEffect(() => { setDest(resolveCountry(defaultDestination)); }, [defaultDestination]);
  useEffect(() => { setOrigin(resolveCountry(defaultOrigin)); }, [defaultOrigin]);

  const statusType: StatusType = origin && dest ? lookupStatus(origin, dest) : "unknown";
  const sc = STATUS_CONFIG[statusType];
  const StatusIcon = sc.icon;
  const hasResult = !!(origin && dest);

  function goToFullPage() {
    if (!origin || !dest) return;
    setLocation(`/visa/${nameToSlug(origin.name)}/${nameToSlug(dest.name)}`);
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.09)",
      }}
    >
      {/* Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <CountrySelect
          value={origin}
          onChange={setOrigin}
          placeholder="🛂 Your passport country"
          testId="visa-widget-origin"
        />
        <div className="hidden sm:flex items-center" style={{ color: "rgba(255,255,255,0.25)" }}>→</div>
        <CountrySelect
          value={dest}
          onChange={setDest}
          placeholder="🌍 Travelling to"
          testId="visa-widget-dest"
        />
      </div>

      {/* Result */}
      {hasResult ? (
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
          style={{ background: sc.bg, border: `1px solid ${sc.border}` }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <StatusIcon className="h-5 w-5 shrink-0" style={{ color: sc.color }} />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest mb-0.5" style={{ color: sc.color, opacity: 0.7 }}>
                {origin.name} → {dest.name}
              </p>
              <p className="text-sm font-bold" style={{ color: sc.color }}>{sc.label}</p>
            </div>
          </div>
          <button
            type="button"
            data-testid="visa-widget-full-details"
            onClick={goToFullPage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-all hover:opacity-80"
            style={{ background: sc.color, color: "hsl(220 20% 10%)" }}
          >
            Full details <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground/60 text-center py-1">
          Select both countries to check requirements instantly.
        </p>
      )}
    </div>
  );
}
