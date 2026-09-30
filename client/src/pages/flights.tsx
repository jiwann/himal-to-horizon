import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Plane, ExternalLink, ShieldCheck, Wifi, BedDouble, Car, ShieldPlus, Compass, User, CalendarIcon, Plus, X } from "lucide-react";
import { NavTabs } from "@/components/nav-tabs";
import { useLanguage } from "@/contexts/language-context";
import { setSEO, resetSEO } from "@/lib/seo";
import { format } from "date-fns";
import logoImg from "@/assets/logo.png";
import { VisaWidget } from "@/components/visa-widget";
import { AuthModal } from "@/components/auth-modal";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/contexts/auth-context";
import { searchAirports, type Airport } from "@/lib/airports";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  buildAviasalesUrl as buildAviasalesUrlAffiliate,
  buildKiwiUrl as buildKiwiUrlAffiliate,
  buildKiwiMultiCityUrl,
  buildAviasalesMultiCityUrl,
  buildGoogleFlightsMultiCityUrl,
  KIWI_AFFILIATE_URL,
} from "@/lib/affiliate";

type TripType = "one_way" | "round_trip" | "multi_city";
type Leg = { from: string; to: string; date: string };

const AMBER  = "hsl(22 79% 75%)";
const GREEN  = "hsl(145 65% 55%)";
const BLUE   = "hsl(205 80% 70%)";

function buildKiwiUrl(
  originIata: string,
  destIata: string,
  departDate: string,
  returnDate?: string,
  adults = 1,
): string {
  return buildKiwiUrlAffiliate(originIata, destIata, departDate, returnDate, adults);
}

function buildGoogleFlightsUrl(
  originIata: string,
  destIata: string,
  departDate: string,
  returnDate?: string,
): string {
  const suffix = returnDate ? `%20through%20${encodeURIComponent(returnDate)}` : "";
  return (
    "https://www.google.com/travel/flights?q=Flights%20to%20" +
    encodeURIComponent(destIata) +
    "%20from%20" + encodeURIComponent(originIata) +
    "%20on%20" + encodeURIComponent(departDate) + suffix
  );
}

function buildAviasalesUrl(
  originIata: string,
  destIata: string,
  departDate: string,
  returnDate?: string,
): string {
  return buildAviasalesUrlAffiliate(originIata, destIata, departDate, returnDate, 1);
}

function airportLabel(a: Airport) {
  return `${a.city} (${a.iata})`;
}

function DatePickerField({
  label,
  optional,
  value,
  onChange,
  placeholder,
  testId,
  defaultMonth,
  minDate,
}: {
  label: string;
  optional?: boolean;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  testId: string;
  defaultMonth?: Date;
  minDate?: Date;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value + "T12:00:00") : undefined;

  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: AMBER }}>
        {label}{optional && <span className="font-normal normal-case opacity-50 tracking-normal text-[9px]"> (opt)</span>}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid={testId}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm bg-transparent outline-none text-left"
            style={{
              border: `1px solid ${open ? "rgba(247,176,136,0.55)" : "rgba(255,255,255,0.15)"}`,
              color: selected ? "#fff" : "rgba(255,255,255,0.35)",
              minWidth: "130px",
            }}
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0" style={{ color: AMBER }} />
            <span>{selected ? format(selected, "MMM d, yyyy") : placeholder}</span>
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="start"
          style={{ background: "#0b1829", border: "1px solid rgba(255,255,255,0.12)", zIndex: 9999 }}
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (day) {
                onChange(format(day, "yyyy-MM-dd"));
                setOpen(false);
              }
            }}
            defaultMonth={selected ?? defaultMonth ?? new Date()}
            disabled={minDate ? (day) => day < minDate : (day) => day < new Date(new Date().setHours(0,0,0,0))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function IataField({
  label, iata, onSelect, placeholder, testId,
}: {
  label: string;
  iata: string;
  onSelect: (iata: string) => void;
  placeholder: string;
  testId: string;
}) {
  const AIRPORTS = searchAirports("");
  const initial = AIRPORTS.find((a) => a.iata === iata);
  const [query, setQuery] = useState(initial ? airportLabel(initial) : "");
  const [open, setOpen] = useState(false);
  const suggestions = searchAirports(query.replace(/\(.*\)/, "").trim());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const match = searchAirports("").find((a) => a.iata === iata);
    if (match && !open) setQuery(airportLabel(match));
  }, [iata, open]);

  useEffect(() => {
    function onOut(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        const match = searchAirports("").find((a) => a.iata === iata);
        if (match) setQuery(airportLabel(match));
        else if (!iata) setQuery("");
      }
    }
    document.addEventListener("mousedown", onOut);
    return () => document.removeEventListener("mousedown", onOut);
  }, [iata]);

  return (
    <div ref={ref} className="flex flex-col gap-1 min-w-0 relative">
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: AMBER }}>{label}</label>
      <input
        type="text"
        value={query}
        data-testid={testId}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        className="w-44 px-3 py-2 rounded-xl text-sm bg-transparent outline-none"
        style={{
          border: `1px solid ${open ? "rgba(247,176,136,0.55)" : "rgba(255,255,255,0.15)"}`,
          color: "#fff",
          caretColor: AMBER,
        }}
      />
      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1.5 rounded-xl shadow-2xl overflow-hidden z-50"
          style={{ background: "#0b1829", border: "1px solid rgba(255,255,255,0.12)", minWidth: "260px" }}
        >
          {suggestions.map((s) => (
            <button
              key={s.iata}
              type="button"
              data-testid={`${testId}-option-${s.iata}`}
              onClick={() => { onSelect(s.iata); setQuery(airportLabel(s)); setOpen(false); }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm transition-colors"
              style={{ color: "rgba(255,255,255,0.85)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <span className="font-black w-9 shrink-0 text-sm" style={{ color: AMBER }}>{s.iata}</span>
              <span className="truncate">{s.city}</span>
              <span className="ml-auto text-[11px] opacity-40 shrink-0">{s.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FlightsPage() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    setSEO({
      title: "Flights — Smart Flight Search",
      description: "Search flights across Aviasales, Kiwi.com, and Google Flights. Compare prices with no booking fees — powered by Himal to Horizon.",
      path: "/flights",
    });
    return () => { resetSEO(); };
  }, []);

  const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  // ── Simple mode state (one-way / round-trip) ──────────────────────────────
  const [fromCode, setFromCode]     = useState("TPA");
  const [toCode, setToCode]         = useState("");
  const [departDate, setDepartDate] = useState(defaultDate);
  const [returnDate, setReturnDate] = useState("");

  // ── Trip type & multi-city ────────────────────────────────────────────────
  const [tripType, setTripType] = useState<TripType>("round_trip");
  const [legs, setLegs] = useState<Leg[]>([
    { from: "TPA", to: "", date: defaultDate },
    { from: "",    to: "", date: "" },
  ]);

  function updateLeg(i: number, field: keyof Leg, val: string) {
    setLegs(prev => prev.map((l, idx) => idx === i ? { ...l, [field]: val } : l));
  }
  function addLeg() {
    if (legs.length < 4) setLegs(prev => [...prev, { from: prev[prev.length - 1].to, to: "", date: "" }]);
  }
  function removeLeg(i: number) {
    if (legs.length > 2) setLegs(prev => prev.filter((_, idx) => idx !== i));
  }

  // ── Derived URLs ──────────────────────────────────────────────────────────
  const isMulti = tripType === "multi_city";

  const kiwiHref = isMulti
    ? buildKiwiMultiCityUrl(legs.map(l => ({ origin: l.from, destination: l.to, date: l.date })))
    : (fromCode && toCode
        ? buildKiwiUrl(fromCode, toCode, departDate, tripType === "round_trip" ? (returnDate || undefined) : undefined)
        : KIWI_AFFILIATE_URL);

  const googleHref = isMulti
    ? buildGoogleFlightsMultiCityUrl(legs.map(l => ({ origin: l.from, destination: l.to, date: l.date })))
    : (fromCode && toCode
        ? buildGoogleFlightsUrl(fromCode, toCode, departDate, tripType === "round_trip" ? (returnDate || undefined) : undefined)
        : "https://www.google.com/travel/flights");

  // Use window.open() instead of <a href> so the TP tracking script
  // cannot override the href at runtime.
  function openKiwi() {
    window.open(kiwiHref, "_blank", "noopener,noreferrer");
  }

  function openAviasales() {
    const href = isMulti
      ? buildAviasalesMultiCityUrl(legs.map(l => ({ origin: l.from, destination: l.to, date: l.date })))
      : (fromCode && toCode
          ? buildAviasalesUrl(fromCode, toCode, departDate, tripType === "round_trip" ? (returnDate || undefined) : undefined)
          : "/go/aviasales");
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "linear-gradient(180deg, rgba(11,20,33,0.97) 0%, rgba(16,28,45,0.97) 100%)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(247,176,136,0.18)" }}
      >
        <div className="max-w-6xl mx-auto px-4 pt-3 pb-0 flex items-center gap-3">
          <button type="button" onClick={() => setLocation("/")} className="flex items-center gap-2">
            <img src={logoImg} alt="Himal to Horizon" className="w-6 h-6 rounded-full object-cover" />
            <span className="text-sm font-semibold" style={{ color: AMBER }}>Himal to Horizon</span>
          </button>
          <div className="hidden sm:flex items-center gap-4 ml-auto">
            <button type="button" data-testid="nav-visa-guides" onClick={() => setLocation("/visa-guides")} className="text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = AMBER)} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}>{t("nav.visa_intelligence")}</button>
            <button type="button" data-testid="nav-travel-blog" onClick={() => setLocation("/blog")} className="text-xs font-medium transition-colors" style={{ color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer" }} onMouseEnter={(e) => (e.currentTarget.style.color = AMBER)} onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}>{t("nav.travel_blog")}</button>
            {user ? <UserMenu user={user} /> : (
              <button type="button" data-testid="button-sign-in" onClick={() => setAuthOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: "rgba(247,176,136,0.15)", color: AMBER, border: "1px solid rgba(247,176,136,0.3)" }}>
                <User className="w-3 h-3" />{t("auth.sign_in")}
              </button>
            )}
          </div>
        </div>
        <NavTabs />
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-10 w-full">

        {/* ── Page title ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(247,176,136,0.12)", border: "1px solid rgba(247,176,136,0.25)" }}
            >
              <Plane className="h-5 w-5" style={{ color: AMBER }} />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-serif)" }}>
              {t("flights.title")}
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {t("flights.desc")}
          </p>
        </div>

        {/* ── Route configurator ── */}
        <div
          className="mb-8 p-4 rounded-2xl space-y-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          data-testid="route-config-form"
        >
          {/* Trip type selector */}
          <div className="flex items-center gap-1">
            {(["one_way", "round_trip", "multi_city"] as TripType[]).map((tt) => {
              const labels: Record<TripType, string> = { one_way: t("flights.trip_one_way"), round_trip: t("flights.trip_round_trip"), multi_city: t("flights.trip_multi_city") };
              const active = tripType === tt;
              return (
                <button
                  key={tt}
                  type="button"
                  data-testid={`trip-type-${tt}`}
                  onClick={() => setTripType(tt)}
                  className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                  style={{
                    background: active ? "rgba(247,176,136,0.18)" : "transparent",
                    border: `1px solid ${active ? "rgba(247,176,136,0.5)" : "rgba(255,255,255,0.12)"}`,
                    color: active ? AMBER : "rgba(255,255,255,0.5)",
                  }}
                >
                  {labels[tt]}
                </button>
              );
            })}
          </div>

          {/* One-way / Round-trip form */}
          {!isMulti && (
            <div className="flex flex-wrap items-end gap-4">
              <IataField label={t("flights.form_from")} iata={fromCode} onSelect={setFromCode} placeholder={t("flights.form_from_ph")} testId="input-origin-iata" />
              <div className="self-end pb-2.5 text-muted-foreground/40 font-bold text-lg select-none">→</div>
              <IataField label={t("flights.form_to")} iata={toCode} onSelect={setToCode} placeholder={t("flights.form_to_ph")} testId="input-dest-iata" />
              <DatePickerField
                label={t("flights.form_depart")} value={departDate} onChange={setDepartDate}
                placeholder={t("flights.form_pick_date")} testId="input-depart-date" defaultMonth={new Date()}
              />
              {tripType === "round_trip" && (
                <DatePickerField
                  label={t("flights.form_return")} optional value={returnDate} onChange={setReturnDate}
                  placeholder={t("flights.form_optional")} testId="input-return-date"
                  defaultMonth={departDate ? new Date(departDate + "T12:00:00") : new Date()}
                  minDate={departDate ? new Date(departDate + "T12:00:00") : undefined}
                />
              )}
              <button
                type="button" data-testid="btn-search-aviasales-inline" onClick={openAviasales}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all self-end"
                style={{ background: "rgba(247,176,136,0.10)", border: "1px solid rgba(247,176,136,0.35)", color: AMBER }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(247,176,136,0.18)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(247,176,136,0.10)"; }}
              >
                <ExternalLink className="h-4 w-4" /> {t("flights.search_aviasales")}
              </button>
              <p className="text-[11px] text-muted-foreground/50 self-end pb-2 ml-auto">
                {t("flights.form_hint")}
              </p>
            </div>
          )}

          {/* Multi-city form */}
          {isMulti && (
            <div className="space-y-3">
              {legs.map((leg, i) => (
                <div key={i} className="flex flex-wrap items-end gap-3">
                  <span className="self-end pb-2.5 text-[10px] font-black uppercase tracking-widest w-10 text-right shrink-0" style={{ color: AMBER }}>
                    {`${t("flights.form_depart")} ${i + 1}`}
                  </span>
                  <IataField
                    label={t("flights.form_from")} iata={leg.from}
                    onSelect={(v) => updateLeg(i, "from", v)}
                    placeholder={t("flights.form_from")} testId={`input-mc-from-${i}`}
                  />
                  <div className="self-end pb-2.5 text-muted-foreground/40 font-bold text-lg select-none">→</div>
                  <IataField
                    label={t("flights.form_to")} iata={leg.to}
                    onSelect={(v) => updateLeg(i, "to", v)}
                    placeholder={t("flights.form_to")} testId={`input-mc-to-${i}`}
                  />
                  <DatePickerField
                    label={t("flights.form_depart")} value={leg.date}
                    onChange={(v) => updateLeg(i, "date", v)}
                    placeholder={t("flights.form_pick_date")} testId={`input-mc-date-${i}`}
                    defaultMonth={
                      i > 0 && legs[i - 1].date
                        ? new Date(legs[i - 1].date + "T12:00:00")
                        : new Date()
                    }
                    minDate={
                      i > 0 && legs[i - 1].date
                        ? new Date(legs[i - 1].date + "T12:00:00")
                        : new Date(new Date().setHours(0, 0, 0, 0))
                    }
                  />
                  {legs.length > 2 && (
                    <button
                      type="button" onClick={() => removeLeg(i)}
                      data-testid={`btn-remove-leg-${i}`}
                      className="self-end p-2 rounded-xl transition-all"
                      style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.4)" }}
                      title={t("flights.remove_leg")}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add leg / actions */}
              <div className="flex items-center gap-3 pt-1 flex-wrap">
                {legs.length < 4 && (
                  <button
                    type="button" onClick={addLeg} data-testid="btn-add-leg"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                    style={{ border: "1px solid rgba(247,176,136,0.3)", color: AMBER, background: "transparent" }}
                  >
                    <Plus className="h-3.5 w-3.5" /> {t("flights.add_leg")}
                  </button>
                )}
                <button
                  type="button" data-testid="btn-search-aviasales-multi"
                  onClick={openAviasales}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all"
                  style={{ background: "rgba(247,176,136,0.10)", border: "1px solid rgba(247,176,136,0.35)", color: AMBER }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(247,176,136,0.18)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(247,176,136,0.10)"; }}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> {t("flights.search_aviasales")}
                </button>
                <p className="text-[11px] text-muted-foreground/50 ml-auto">
                  {t("flights.multi_hint")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div className="flex gap-8 items-start">

          {/* ── Main content ── */}
          <div className="flex-1 space-y-6">

            {/* Partner section label */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: AMBER }}>
                {t("common.verified_partners")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(247,176,136,0.2)" }} />
            </div>

            {/* ── Partner grid ── */}
            {/* Multi-city: Aviasales only (verified working). One-way/RT: all three. */}
            <div className={`grid gap-4 ${isMulti ? "grid-cols-1 max-w-sm" : "grid-cols-1 md:grid-cols-3"}`}>

              {/* Kiwi — hidden in multi-city (deep-link not supported) */}
              {!isMulti && (
                <button
                  type="button"
                  onClick={openKiwi}
                  data-testid="flights-kiwi"
                  className="group flex flex-col gap-4 p-5 rounded-2xl transition-all duration-150 hover:border-amber-400/40 text-left w-full"
                  style={{
                    background: "rgba(247,176,136,0.06)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(247,176,136,0.22)",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(247,176,136,0.12)" }}>🦅</div>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(247,176,136,0.18)", color: AMBER }}>{t("flights.badge_self_transfer")}</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground mb-1">Kiwi.com</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("flights.kiwi_desc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-center py-2 px-3 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto" style={{ background: AMBER, color: "hsl(220 20% 10%)" }}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("flights.kiwi_cta")}
                  </div>
                </button>
              )}

              {/* Aviasales — always visible, multi-city supported */}
              <button
                type="button"
                onClick={openAviasales}
                data-testid="flights-aviasales"
                className="group flex flex-col gap-4 p-5 rounded-2xl transition-all duration-150 hover:border-amber-400/40 text-left"
                style={{
                  background: "rgba(247,176,136,0.06)",
                  backdropFilter: "blur(16px)",
                  border: "1px solid rgba(247,176,136,0.22)",
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(247,176,136,0.12)" }}>✈️</div>
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(247,176,136,0.18)", color: AMBER }}>{t("flights.badge_horizons_pick")}</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-foreground mb-1">{t("flights.aviasales_heading")}</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isMulti
                      ? t("flights.aviasales_desc_multi")
                      : <>{t("flights.aviasales_desc")}{fromCode && toCode && <> Routing <span className="font-semibold" style={{ color: AMBER }}>{fromCode} → {toCode}</span>.</>}</>
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2 justify-center py-2 px-3 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto" style={{ background: AMBER, color: "hsl(220 20% 10%)" }}>
                  <ExternalLink className="h-3.5 w-3.5" />
                  {t("flights.search_aviasales")}
                </div>
              </button>

              {/* Google Flights — hidden in multi-city (deep-link not supported) */}
              {!isMulti && (
                <a
                  href={googleHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="flights-google"
                  className="group flex flex-col gap-4 p-5 rounded-2xl transition-all duration-150 hover:border-blue-400/30"
                  style={{
                    background: "rgba(99,179,237,0.04)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(99,179,237,0.16)",
                    textDecoration: "none",
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl" style={{ background: "rgba(99,179,237,0.10)" }}>🌐</div>
                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full" style={{ background: "rgba(99,179,237,0.12)", color: BLUE }}>{t("flights.badge_free")}</span>
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground mb-1">Google Flights</h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t("flights.google_desc")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 justify-center py-2 px-3 rounded-xl font-semibold text-sm transition-all group-hover:opacity-90 mt-auto" style={{ background: "rgba(99,179,237,0.14)", color: BLUE, border: "1px solid rgba(99,179,237,0.3)" }}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    {t("flights.google_cta")}
                  </div>
                </a>
              )}
            </div>

            {/* ── Visa Intelligence Widget ── */}
            <div className="rounded-2xl p-5 mt-2" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: AMBER }}>{t("flights.visa_heading")}</h3>
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t("flights.visa_desc")}</p>
              <VisaWidget />
            </div>

            {/* ── Mastering the Horizon Hop ── */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(145,200,100,0.04)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(145,200,100,0.15)",
              }}
            >
              <h2
                className="text-xl font-extrabold mb-2"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                ✈️ {t("flights.hop_title")}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {t("flights.hop_intro")}
              </p>

              <div className="space-y-4">
                {([
                  { n: "1", title: t("flights.hop1_title"), body: t("flights.hop1_body") },
                  { n: "2", title: t("flights.hop2_title"), body: t("flights.hop2_body") },
                  { n: "3", title: t("flights.hop3_title"), body: t("flights.hop3_body") },
                ]).map((step) => (
                  <div
                    key={step.n}
                    className="flex gap-4 p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-black"
                      style={{ background: "rgba(145,200,100,0.15)", color: GREEN }}
                    >
                      {step.n}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm mb-1">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-5 p-4 rounded-xl text-sm leading-relaxed"
                style={{
                  background: "rgba(145,200,100,0.06)",
                  border: "1px solid rgba(145,200,100,0.2)",
                  color: GREEN,
                }}
              >
                <span className="font-bold block mb-1 text-xs uppercase tracking-wide opacity-70">{t("flights.hop_tip_label")}</span>
                {t("flights.hop_tip_body")}
              </div>
            </div>
          </div>

          {/* ── Horizon Shield sidebar ── */}
          <aside
            className="hidden lg:flex flex-col gap-3 w-64 shrink-0 sticky"
            style={{ top: "80px" }}
            data-testid="flights-horizon-shield"
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: AMBER }} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: AMBER }}>
                {t("flights.shield_label")}
              </span>
              <div className="flex-1 h-px" style={{ background: "rgba(247,176,136,0.2)" }} />
            </div>

            {/* EKTA Insurance */}
            <a
              href="/go/ekta"
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-testid="flights-ekta"
              className="flex flex-col gap-2.5 p-4 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "rgba(247,176,136,0.06)",
                border: "1px solid rgba(247,176,136,0.25)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                <span className="text-sm font-semibold text-foreground">{t("flights.insurance_label")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("flights.insurance_tip")}
              </p>
              <div
                className="text-xs font-bold text-center py-1.5 px-3 rounded-lg"
                style={{ background: "rgba(247,176,136,0.15)", color: AMBER }}
              >
                {t("flights.insurance_cta")}
              </div>
            </a>

            {/* Airalo eSIM */}
            <a
              href="/go/airalo"
              target="_blank"
              rel="noopener noreferrer sponsored"
              data-testid="flights-airalo"
              className="flex flex-col gap-2.5 p-4 rounded-xl transition-all hover:opacity-90"
              style={{
                background: "rgba(99,179,237,0.05)",
                border: "1px solid rgba(99,179,237,0.2)",
                textDecoration: "none",
              }}
            >
              <div className="flex items-center gap-2">
                <Wifi className="h-5 w-5" style={{ color: BLUE }} />
                <span className="text-sm font-semibold text-foreground">{t("flights.connectivity_label")}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {t("flights.airalo_desc")}
              </p>
              <div
                className="text-xs font-bold text-center py-1.5 px-3 rounded-lg"
                style={{ background: "rgba(99,179,237,0.12)", color: BLUE }}
              >
                {t("flights.airalo_cta")}
              </div>
            </a>

            {/* Affiliate note */}
            <p className="text-[10px] text-muted-foreground/40 leading-relaxed px-1">
              {t("flights.affiliate_note")}
            </p>
          </aside>
        </div>
      </main>

      <footer
        className="text-center text-[11px] py-6 px-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.35)" }}
      >
        {t("footer.affiliate_notice")}
      </footer>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
