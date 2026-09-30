import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, MapPin, Calendar, Tag, ChevronRight, Home, ExternalLink, CalendarIcon, Plane } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import { getBlogTranslation } from "@/lib/blog-i18n";
import { autoTranslateSection } from "@/lib/blog-auto-translate";
import type { TranslationKey } from "@/lib/i18n";
import type { BlogPost, ContentSection } from "../../../server/blog";
import { CarRentalGateway } from "@/components/car-rental-gateway";
import { HotelGateway } from "@/components/hotel-gateway";
import { VisaWidget } from "@/components/visa-widget";
import { ActivityWidget } from "@/components/activity-widget";
import { searchAirports, type Airport } from "@/lib/airports";
import { buildAviasalesUrl, buildKiwiUrl, KIWI_AFFILIATE_URL } from "@/lib/affiliate";
import { setSEO, resetSEO } from "@/lib/seo";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { format } from "date-fns";

const CATEGORY_STYLE: Record<string, { labelKey: TranslationKey; color: string; bg: string }> = {
  "trek-report":      { labelKey: "blog.cat_trek",  color: "hsl(22 79% 75%)",   bg: "rgba(247,176,136,0.12)" },
  "destination-guide":{ labelKey: "blog.cat_guide",  color: "hsl(42 90% 65%)",   bg: "rgba(220,160,56,0.12)" },
  "travel-tips":      { labelKey: "blog.cat_tips",   color: "hsl(200 80% 65%)",  bg: "rgba(56,160,220,0.12)" },
  "travel-story":     { labelKey: "blog.cat_story",  color: "hsl(145 65% 55%)",  bg: "rgba(56,200,120,0.12)" },
  "flight-hack":      { labelKey: "blog.cat_hack",   color: "hsl(200 80% 65%)",  bg: "rgba(56,160,220,0.12)" },
};

function Section({ s, translated, lang }: { s: ContentSection; translated?: any; lang?: string }) {
  const { t } = useLanguage();
  const auto = (!translated && lang && lang !== "en") ? autoTranslateSection(s, lang) : null;
  const v = translated?.v ?? auto?.v ?? s.v;

  if (s.t === "h2") return (
    <h2 className="text-xl font-bold mt-10 mb-4 text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
      {v as string}
    </h2>
  );
  if (s.t === "h3") return (
    <h3 className="text-base font-bold mt-6 mb-2 text-foreground">{v as string}</h3>
  );
  if (s.t === "p") return (
    <p className="text-[15px] leading-relaxed text-foreground/85 mb-4">{v as string}</p>
  );
  if (s.t === "ul") return (
    <ul className="mb-5 space-y-2 pl-1">
      {(v as string[]).map((item: string, i: number) => (
        <li key={i} className="flex items-start gap-2.5 text-[14px] leading-relaxed text-foreground/80">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "hsl(22 79% 75%)" }} />
          {item}
        </li>
      ))}
    </ul>
  );
  if (s.t === "ol") return (
    <ol className="mb-5 space-y-3 pl-1">
      {(v as string[]).map((item: string, i: number) => (
        <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-foreground/80">
          <span
            className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
            style={{ background: "rgba(247,176,136,0.15)", color: "hsl(22 79% 75%)" }}
          >
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  );
  if (s.t === "tip") return (
    <div
      className="rounded-xl px-5 py-4 mb-5 text-[13.5px] leading-relaxed"
      style={{
        background: "rgba(56,200,120,0.06)",
        border: "1px solid rgba(56,200,120,0.2)",
        color: "hsl(145 50% 75%)",
      }}
    >
      <span className="font-bold text-xs uppercase tracking-wide opacity-70 block mb-1">{t("blog.post_advisor_tip")}</span>
      {v as string}
    </div>
  );
  if (s.t === "warn") return (
    <div
      className="rounded-xl px-5 py-4 mb-5 text-[13.5px] leading-relaxed"
      style={{
        background: "rgba(220,60,60,0.06)",
        border: "1px solid rgba(220,60,60,0.2)",
        color: "hsl(0 70% 78%)",
      }}
    >
      <span className="font-bold text-xs uppercase tracking-wide opacity-70 block mb-1">{t("blog.post_important")}</span>
      {v as string}
    </div>
  );
  if (s.t === "facts") return (
    <div
      className="rounded-xl overflow-hidden mb-6"
      style={{ border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="px-4 py-2.5 text-xs font-bold uppercase tracking-wider"
        style={{ background: "rgba(247,176,136,0.1)", color: "hsl(22 79% 75%)" }}
      >
        {t("blog.post_quick_facts")}
      </div>
      <div className="divide-y divide-white/5">
        {(v as Array<{k: string; val: string}>).map((row: {k: string; val: string}, i: number) => (
          <div key={i} className="flex items-baseline px-4 py-2.5 text-sm">
            <span className="w-40 shrink-0 text-muted-foreground text-xs font-medium">{row.k}</span>
            <span className="text-foreground/90 font-semibold">{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
  if (s.t === "quote") return (
    <blockquote
      className="border-l-4 pl-5 py-1 my-6 text-base italic text-foreground/70 leading-relaxed"
      style={{ borderColor: "hsl(22 79% 75%)" }}
    >
      "{v as string}"
    </blockquote>
  );
  return null;
}

const AMBER = "hsl(22 79% 75%)";

function airportLabel(a: Airport) {
  return `${a.city} (${a.iata})`;
}

function BlogIataField({
  label, iata, onSelect, placeholder, testId,
}: {
  label: string;
  iata: string;
  onSelect: (iata: string) => void;
  placeholder: string;
  testId: string;
}) {
  const initial = searchAirports("").find((a) => a.iata === iata);
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
        className="w-40 px-3 py-2 rounded-xl text-sm bg-transparent outline-none"
        style={{
          border: `1px solid ${open ? "rgba(247,176,136,0.55)" : "rgba(255,255,255,0.15)"}`,
          color: "#fff",
          caretColor: AMBER,
        }}
      />
      {open && suggestions.length > 0 && (
        <div
          className="absolute left-0 top-full mt-1.5 rounded-xl shadow-2xl overflow-hidden z-50"
          style={{ background: "#0b1829", border: "1px solid rgba(255,255,255,0.12)", minWidth: "240px" }}
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

function BlogDateField({
  label, value, onChange, placeholder, testId, defaultMonth, minDate,
}: {
  label: string;
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
      <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: AMBER }}>{label}</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            data-testid={testId}
            className="flex items-center gap-2 w-36 px-3 py-2 rounded-xl text-sm bg-transparent text-left"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: value ? "#fff" : "rgba(255,255,255,0.35)" }}
          >
            <CalendarIcon className="h-3.5 w-3.5 shrink-0 opacity-50" />
            {value ? format(new Date(value + "T12:00:00"), "MMM d, yyyy") : placeholder}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
          <CalendarPicker
            mode="single"
            selected={selected}
            onSelect={(d) => { if (d) { onChange(format(d, "yyyy-MM-dd")); setOpen(false); } }}
            defaultMonth={defaultMonth || new Date()}
            disabled={(d) => d < (minDate || new Date(new Date().setHours(0, 0, 0, 0)))}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function buildGoogleFlightsUrl(origin: string, dest: string, depart: string, ret?: string): string {
  const suffix = ret ? `%20through%20${encodeURIComponent(ret)}` : "";
  return (
    "https://www.google.com/travel/flights?q=Flights%20to%20" +
    encodeURIComponent(dest) +
    "%20from%20" + encodeURIComponent(origin) +
    "%20on%20" + encodeURIComponent(depart) + suffix
  );
}

function FlightsCTA({ iata, name }: { iata: string; name: string }) {
  const { t } = useLanguage();
  const defaultDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const [fromCode, setFromCode] = useState("");
  const [departDate, setDepartDate] = useState(defaultDate);
  const [returnDate, setReturnDate] = useState("");

  function openAviasales() {
    const href = fromCode
      ? buildAviasalesUrl(fromCode, iata, departDate, returnDate || undefined, 1)
      : "/go/aviasales";
    window.open(href, "_blank", "noopener,noreferrer");
  }
  function openGoogle() {
    const href = fromCode
      ? buildGoogleFlightsUrl(fromCode, iata, departDate, returnDate || undefined)
      : "https://www.google.com/travel/flights";
    window.open(href, "_blank", "noopener,noreferrer");
  }
  function openKiwi() {
    const href = fromCode
      ? buildKiwiUrl(fromCode, iata, departDate, returnDate || undefined, 1)
      : KIWI_AFFILIATE_URL;
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className="rounded-2xl px-5 py-6 my-10"
      style={{
        background: "linear-gradient(135deg, rgba(247,176,136,0.08) 0%, rgba(247,176,136,0.04) 100%)",
        border: "1px solid rgba(247,176,136,0.2)",
      }}
      data-testid="blog-flight-search-cta"
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "rgba(247,176,136,0.12)", border: "1px solid rgba(247,176,136,0.25)" }}
        >
          <Plane className="h-4 w-4" style={{ color: AMBER }} />
        </div>
        <div>
          <h3 className="font-bold text-base" style={{ fontFamily: "var(--font-serif)" }}>
            {t("blog.post_ready_to_go").replace("{name}", name)}
          </h3>
          <p className="text-xs text-muted-foreground">{t("blog.post_search_desc")}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <BlogIataField
          label={t("flights.form_from")}
          iata={fromCode}
          onSelect={setFromCode}
          placeholder={t("flights.form_from_ph")}
          testId="blog-input-origin"
        />
        <div className="self-end pb-2.5 text-muted-foreground/40 font-bold text-lg select-none">→</div>
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-[10px] font-black uppercase tracking-widest" style={{ color: AMBER }}>{t("flights.form_to")}</label>
          <div
            data-testid="blog-input-dest"
            className="w-40 px-3 py-2 rounded-xl text-sm"
            style={{ border: "1px solid rgba(247,176,136,0.35)", color: AMBER, background: "rgba(247,176,136,0.06)" }}
          >
            {name} ({iata})
          </div>
        </div>
        <BlogDateField
          label={t("flights.form_depart")}
          value={departDate}
          onChange={setDepartDate}
          placeholder={t("flights.form_pick_date")}
          testId="blog-input-depart"
          defaultMonth={new Date()}
        />
        <BlogDateField
          label={t("flights.form_return")}
          value={returnDate}
          onChange={setReturnDate}
          placeholder={t("flights.form_optional")}
          testId="blog-input-return"
          defaultMonth={departDate ? new Date(departDate + "T12:00:00") : new Date()}
          minDate={departDate ? new Date(departDate + "T12:00:00") : undefined}
        />
      </div>

      {!fromCode && (
        <p className="text-[11px] text-muted-foreground/60 mb-2">{t("flights.form_from_ph")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          data-testid="blog-search-aviasales"
          onClick={openAviasales}
          disabled={!fromCode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(247,176,136,0.10)", border: "1px solid rgba(247,176,136,0.35)", color: AMBER }}
          onMouseEnter={(e) => { if (fromCode) (e.currentTarget as HTMLElement).style.background = "rgba(247,176,136,0.18)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(247,176,136,0.10)"; }}
        >
          <ExternalLink className="h-3.5 w-3.5" /> {t("flights.search_aviasales")}
        </button>
        <button
          type="button"
          data-testid="blog-search-google"
          onClick={openGoogle}
          disabled={!fromCode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
          onMouseEnter={(e) => { if (fromCode) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Google Flights
        </button>
        <button
          type="button"
          data-testid="blog-search-kiwi"
          onClick={openKiwi}
          disabled={!fromCode}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.75)" }}
          onMouseEnter={(e) => { if (fromCode) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)"; }}
        >
          <ExternalLink className="h-3.5 w-3.5" /> Kiwi.com
        </button>
      </div>

      <p className="text-[10px] text-muted-foreground/40 mt-3">
        {t("flights.form_hint")}
      </p>
    </div>
  );
}

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const [, setLocation] = useLocation();
  const { language, t } = useLanguage();
  const slug = params.slug;

  const { data, isLoading, isError } = useQuery<{ post: BlogPost; related: BlogPost[] }>({
    queryKey: ["/api/blog/posts", slug],
    queryFn: () => fetch(`/api/blog/posts/${slug}`).then((r) => r.json()),
    enabled: !!slug,
  });

  const post = data?.post;
  const related = data?.related ?? [];
  const catStyle = post ? (CATEGORY_STYLE[post.category] ?? CATEGORY_STYLE["destination-guide"]) : null;
  const tr = post ? getBlogTranslation(post.slug, language) : {};
  const displayTitle = tr.title || post?.title;
  const displayExcerpt = tr.excerpt || post?.excerpt;
  const contentTranslated = tr.content;

  useEffect(() => {
    if (!post) return;
    const title = displayTitle || post.title;
    const desc = (displayExcerpt || post.excerpt).slice(0, 160);
    setSEO({
      title,
      description: desc,
      path: `/blog/${post.slug}`,
      type: "article",
      article: {
        section: post.category,
        tags: [post.country || "", post.destination_name || "", post.category].filter(Boolean),
      },
    });
    return () => { resetSEO(); };
  }, [post, displayTitle, displayExcerpt]);

  if (isLoading) return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="h-4 w-32 rounded bg-white/10 mb-8 animate-pulse" />
        <div className="h-10 w-3/4 rounded bg-white/10 mb-4 animate-pulse" />
        <div className="h-4 w-full rounded bg-white/10 mb-2 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-white/10 animate-pulse" />
      </div>
    </div>
  );

  if (isError || !post) return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-5xl mb-4">🗺️</div>
        <h1 className="text-xl font-bold mb-2">{t("blog.post_not_found")}</h1>
        <p className="text-muted-foreground text-sm mb-6">{t("blog.post_not_found_desc")}</p>
        <button
          onClick={() => setLocation("/blog")}
          className="text-sm font-semibold px-4 py-2 rounded-lg"
          style={{ background: "rgba(247,176,136,0.15)", color: "hsl(22 79% 75%)" }}
        >
          {t("blog.post_back_guides")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">

      <header
        className="sticky top-0 z-40 border-b border-border/40"
        style={{ background: "hsl(var(--background) / 0.97)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            data-testid="blog-post-home"
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            {t("blog.home_link")}
          </button>
          <ChevronRight className="h-3 w-3 text-border/50" />
          <button
            data-testid="blog-post-back"
            onClick={() => setLocation("/blog")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("blog.post_back_guides")}
          </button>
          {post.country && (
            <>
              <ChevronRight className="h-3 w-3 text-border/50" />
              <span className="text-sm text-muted-foreground">{post.country}</span>
            </>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          {post.hero_image_url ? (
            <div
              className="rounded-2xl mb-6 overflow-hidden"
              style={{ height: 260, position: "relative" }}
            >
              <img
                src={post.hero_image_url}
                alt={post.destination_name ?? post.title}
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.88)" }}
              />
              <div
                className="absolute bottom-3 right-4 text-3xl leading-none"
                style={{ textShadow: "0 1px 8px rgba(0,0,0,0.7)" }}
              >
                {post.hero_emoji}
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-center text-6xl rounded-2xl mb-6"
              style={{
                height: 180,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {post.hero_emoji}
            </div>
          )}

          {catStyle && (
            <span
              className="text-[11px] font-bold px-3 py-1 rounded-full mb-3 inline-block"
              style={{ background: catStyle.bg, color: catStyle.color }}
            >
              <Tag className="h-2.5 w-2.5 inline mr-1" />
              {t(catStyle.labelKey)}
            </span>
          )}

          <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            {displayTitle}
          </h1>

          <p className="text-base text-muted-foreground leading-relaxed mb-5">{displayExcerpt}</p>

          <div className="flex items-center flex-wrap gap-4 text-xs text-muted-foreground py-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            {post.destination_name && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {post.destination_name}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {t("blog.post_min_read").replace("{n}", String(post.reading_time_mins))}
            </span>
            {post.best_time_to_visit && (
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                {t("blog.post_best_prefix")} {post.best_time_to_visit}
              </span>
            )}
          </div>
        </div>

        <article>
          {post.content_json.map((section, i) => (
            <Section key={i} s={section} translated={contentTranslated?.[i]} lang={language} />
          ))}
        </article>

        {post.destination_iata && post.destination_name && (
          <FlightsCTA iata={post.destination_iata} name={post.destination_name} />
        )}

        {post.rental_airport && (
          <CarRentalGateway
            airportCode={post.rental_airport}
            cityName={post.destination_name ?? undefined}
          />
        )}

        {post.hotel_city && (
          <HotelGateway cityName={post.hotel_city} />
        )}

        {post.has_tours && <ActivityWidget />}

        {post.country && (
          <div className="mt-8 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <h3 className="text-sm font-bold mb-1" style={{ color: "hsl(22 79% 75%)" }}>{t("blog.post_verify_title")}</h3>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{t("blog.post_verify_desc").replace("{country}", post.country)}</p>
            <VisaWidget defaultDestination={post.country} />
          </div>
        )}

        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] px-2.5 py-1 rounded-full font-medium"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-bold mb-5" style={{ fontFamily: "var(--font-serif)" }}>
              {t("blog.post_more_from").replace("{country}", post.country ?? "")}
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((rp) => {
                const rc = CATEGORY_STYLE[rp.category] ?? CATEGORY_STYLE["destination-guide"];
                const rTr = getBlogTranslation(rp.slug, language);
                return (
                  <button
                    key={rp.slug}
                    data-testid={`related-post-${rp.slug}`}
                    onClick={() => setLocation(`/blog/${rp.slug}`)}
                    className="text-left rounded-xl p-4 transition-all hover:scale-[1.01]"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <div className="text-2xl mb-2">{rp.hero_emoji}</div>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded mb-2 inline-block"
                      style={{ background: rc.bg, color: rc.color }}
                    >
                      {t(rc.labelKey)}
                    </span>
                    <h3 className="font-bold text-sm leading-snug text-foreground">
                      {rTr.title || rp.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rTr.excerpt || rp.excerpt}</p>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
