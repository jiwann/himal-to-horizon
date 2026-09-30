import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { NavTabs } from "@/components/nav-tabs";
import { useQuery } from "@tanstack/react-query";
import { Home, Clock, Globe, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/language-context";
import type { TranslationKey } from "@/lib/i18n";
import { getBlogTranslation } from "@/lib/blog-i18n";
import type { BlogPost } from "../../../server/blog";
import { setSEO, resetSEO } from "@/lib/seo";

// ── Config ───────────────────────────────────────────────────────────────────

type ContinentKey = "All" | "Asia" | "South America" | "Europe" | "North America";

const CONTINENT_KEYS: { key: ContinentKey; labelKey: TranslationKey; emoji: string }[] = [
  { key: "All",           labelKey: "blog.filter_all",            emoji: "🌍" },
  { key: "Asia",          labelKey: "blog.filter_asia",           emoji: "🌏" },
  { key: "South America", labelKey: "blog.filter_south_america",  emoji: "🌎" },
  { key: "Europe",        labelKey: "blog.filter_europe",         emoji: "🏰" },
  { key: "North America", labelKey: "blog.filter_north_america",  emoji: "🌮" },
];

const COUNTRY_FLAGS: Record<string, string> = {
  "Nepal":          "🇳🇵", "India":              "🇮🇳", "China":           "🇨🇳",
  "Argentina":      "🇦🇷", "Brazil":             "🇧🇷", "Peru":            "🇵🇪",
  "Uruguay":        "🇺🇾", "Argentina / Brazil": "🌊",  "Italy":           "🇮🇹",
  "Portugal":       "🇵🇹", "Spain":              "🇪🇸", "United Kingdom":  "🇬🇧",
  "France":         "🇫🇷", "Switzerland":        "🇨🇭", "Mexico":          "🇲🇽",
  "Costa Rica":     "🇨🇷", "Panama":             "🇵🇦",
};

const CATEGORY_COLOR: Record<string, string> = {
  "trek-report":       "hsl(22 79% 75%)",
  "destination-guide": "hsl(42 90% 65%)",
  "travel-tips":       "hsl(200 80% 65%)",
  "travel-story":      "hsl(145 65% 55%)",
  "flight-hack":       "hsl(200 80% 65%)",
};

const CATEGORY_LABEL_KEYS: Record<string, TranslationKey> = {
  "trek-report":       "blog.cat_trek",
  "destination-guide": "blog.cat_guide",
  "travel-tips":       "blog.cat_tips",
  "travel-story":      "blog.cat_story",
  "flight-hack":       "blog.cat_hack",
};

const INITIAL_VISIBLE = 3;

// ── Post card ────────────────────────────────────────────────────────────────

function PostCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const { t, language } = useLanguage();
  const tr = getBlogTranslation(post.slug, language);
  const displayTitle = tr.title || post.title;
  const catColor = CATEGORY_COLOR[post.category] ?? "hsl(42 90% 65%)";
  const catLabelKey = CATEGORY_LABEL_KEYS[post.category] ?? "blog.cat_guide";
  const catLabel = t(catLabelKey);
  return (
    <button
      type="button"
      data-testid={`blog-card-${post.slug}`}
      onClick={onClick}
      className="group text-left w-full rounded-xl border border-border/30 bg-card/60 hover:bg-card hover:border-border/60 transition-all duration-150 overflow-hidden"
    >
      {post.hero_image_url && (
        <div className="relative w-full overflow-hidden" style={{ height: 120 }}>
          <img
            src={post.hero_image_url}
            alt={post.destination_name ?? post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ filter: "brightness(0.82)" }}
          />
          <div
            className="absolute bottom-2 left-3 text-xl leading-none"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
          >
            {post.hero_emoji}
          </div>
          <span
            className="absolute top-2 right-2 text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded"
            style={{ color: catColor, background: `rgba(0,0,0,0.55)`, backdropFilter: "blur(4px)" }}
          >
            {catLabel}
          </span>
        </div>
      )}
      <div className="p-3 flex items-start gap-2">
        {!post.hero_image_url && (
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
            style={{ background: "rgba(255,255,255,0.06)" }}
          >
            {post.hero_emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          {!post.hero_image_url && (
            <span
              className="inline-block text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded mb-1"
              style={{ color: catColor, background: `${catColor}18` }}
            >
              {catLabel}
            </span>
          )}
          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {displayTitle}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3 opacity-60" />
              {post.reading_time_mins} {t("blog.min_label")}
            </span>
            {post.best_time_to_visit && (
              <>
                <span className="opacity-30">·</span>
                <span className="truncate opacity-75">
                  {post.best_time_to_visit.split("(")[0].trim()}
                </span>
              </>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
      </div>
    </button>
  );
}

function FeaturedCard({ post, onClick }: { post: BlogPost; onClick: () => void }) {
  const { t, language } = useLanguage();
  const tr = getBlogTranslation(post.slug, language);
  const displayTitle = tr.title || post.title;
  return (
    <button
      type="button"
      data-testid={`blog-featured-${post.slug}`}
      onClick={onClick}
      className="group text-left w-full rounded-xl border border-amber-500/25 bg-amber-950/20 hover:bg-amber-950/35 hover:border-amber-500/45 transition-all duration-150 overflow-hidden"
    >
      {post.hero_image_url ? (
        <div className="relative w-full overflow-hidden" style={{ height: 140 }}>
          <img
            src={post.hero_image_url}
            alt={post.destination_name ?? post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ filter: "brightness(0.72)" }}
          />
          <div className="absolute inset-0 p-3 flex flex-col justify-end"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }}>
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400 mb-0.5">
              ★ {t("blog.featured_badge")}
            </span>
            <h3 className="text-sm font-bold text-white leading-snug line-clamp-2 group-hover:text-amber-200 transition-colors">
              {displayTitle}
            </h3>
          </div>
          <div
            className="absolute top-2 left-3 text-2xl leading-none"
            style={{ textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
          >
            {post.hero_emoji}
          </div>
        </div>
      ) : (
        <div className="p-4 flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
            style={{ background: "rgba(245,158,11,0.14)" }}
          >
            {post.hero_emoji}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-bold tracking-widest uppercase text-amber-400">
              ★ {t("blog.featured_badge")}
            </span>
            <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors">
              {displayTitle}
            </h3>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400/40 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
        </div>
      )}
      {post.hero_image_url && (
        <div className="px-3 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Clock className="h-3 w-3" />{post.reading_time_mins} {t("blog.min_read")}
            </span>
            {post.best_time_to_visit && (
              <span className="opacity-70 truncate max-w-[130px]">
                · {post.best_time_to_visit.split("(")[0].trim()}
              </span>
            )}
          </div>
          <ChevronRight className="h-4 w-4 text-amber-400/40 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
        </div>
      )}
    </button>
  );
}

// ── Country section with collapse ────────────────────────────────────────────

function CountrySection({
  country,
  posts,
  onPost,
}: {
  country: string;
  posts: BlogPost[];
  onPost: (slug: string) => void;
}) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const flag = COUNTRY_FLAGS[country] ?? "🌍";

  const sorted = [...posts].sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.reading_time_mins - a.reading_time_mins;
  });

  const visible = expanded ? sorted : sorted.slice(0, INITIAL_VISIBLE);
  const hidden = sorted.length - INITIAL_VISIBLE;
  const hasMore = hidden > 0;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl leading-none">{flag}</span>
        <h2 className="text-sm font-bold text-foreground tracking-wide">{country}</h2>
        <span className="text-xs text-muted-foreground/50">
          {posts.length} {posts.length !== 1 ? t("blog.guides_plural") : t("blog.guide_singular")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {visible.map((p) =>
          p.featured ? (
            <FeaturedCard key={p.slug} post={p} onClick={() => onPost(p.slug)} />
          ) : (
            <PostCard key={p.slug} post={p} onClick={() => onPost(p.slug)} />
          )
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          data-testid={`expand-${country.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => setExpanded((e) => !e)}
          className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3.5 w-3.5" />
              {t("blog.show_fewer")}
            </>
          ) : (
            <>
              <ChevronDown className="h-3.5 w-3.5" />
              {t("blog.show_more").replace("{n}", String(hidden)).replace("{country}", country)}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function BlogPage() {
  const [location, setLocation] = useLocation();
  const { t } = useLanguage();
  const [activeContinent, setActiveContinent] = useState<ContinentKey>("All");

  useEffect(() => {
    setSEO({
      title: "Travel Guides — 47 Destination Guides Worldwide",
      description: "Expert destination guides covering Asia, Europe, South America and more. Free travel tips, visa info, and flight hacks from Himal to Horizon.",
      path: "/blog",
    });
    return () => { resetSEO(); };
  }, []);

  const { data: rawPosts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog/posts"],
    queryFn: async () => {
      const r = await fetch("/api/blog/posts");
      if (!r.ok) throw new Error(`Failed to load blog posts (${r.status})`);
      return r.json();
    },
  });
  const posts: BlogPost[] = Array.isArray(rawPosts) ? rawPosts : [];

  const filtered =
    activeContinent === "All"
      ? posts
      : posts.filter((p) => p.continent === activeContinent);

  const byCountry: Record<string, BlogPost[]> = {};
  for (const p of filtered) {
    const key = p.country ?? "Other";
    if (!byCountry[key]) byCountry[key] = [];
    byCountry[key].push(p);
  }

  const countByContinent = (key: ContinentKey) =>
    key === "All" ? posts.length : posts.filter((p) => p.continent === key).length;

  const totalCountries = Object.keys(byCountry).length;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: "linear-gradient(180deg, rgba(11,20,33,0.97) 0%, rgba(16,28,45,0.97) 100%)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(247,176,136,0.18)" }}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            data-testid="blog-home"
            onClick={() => setLocation("/")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="h-4 w-4" />
            {t("blog.home_link")}
          </button>
          <span className="text-border/40">·</span>
          <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: "hsl(22 79% 75%)" }}>
            <Globe className="h-4 w-4" />
            {t("blog.travel_guides_label")}
          </span>
        </div>
        <NavTabs />
      </header>

      {/* ── Hero ── */}
      <div className="max-w-5xl mx-auto px-4 pt-7 pb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("blog.destination_guides")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("blog.subtitle").replace("{count}", String(posts.length)).replace("{countries}", totalCountries > 0 ? String(totalCountries) : "—")}
        </p>
      </div>

      {/* ── Continent tabs ── */}
      <div
        className="sticky top-[52px] z-30 border-b border-border/25"
        style={{ background: "linear-gradient(180deg, rgba(11,20,33,0.97) 0%, rgba(16,28,45,0.97) 100%)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(247,176,136,0.18)" }}
      >
        <div className="max-w-5xl mx-auto px-4">
          <div
            className="flex gap-1 overflow-x-auto py-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CONTINENT_KEYS.map((c) => {
              const count = countByContinent(c.key);
              const active = activeContinent === c.key;
              return (
                <button
                  key={c.key}
                  type="button"
                  data-testid={`tab-${c.key.replace(/\s+/g, "-").toLowerCase()}`}
                  onClick={() => setActiveContinent(c.key)}
                  className={`flex items-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-150 flex-shrink-0 ${
                    active
                      ? "text-background font-semibold shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                  style={active ? { background: "hsl(22 79% 58%)" } : {}}
                >
                  <span>{c.emoji}</span>
                  <span>{t(c.labelKey)}</span>
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        active
                          ? "bg-black/20 text-white/90"
                          : "bg-white/8 text-muted-foreground"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="max-w-5xl mx-auto px-4 pt-5 pb-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{t("blog.no_guides")}</p>
          </div>
        ) : (
          <div>
            {Object.entries(byCountry).map(([country, countryPosts]) => (
              <CountrySection
                key={country}
                country={country}
                posts={countryPosts}
                onPost={(slug) => setLocation(`/blog/${slug}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/20 mt-2 py-6">
        <p className="text-xs text-muted-foreground/40 text-center">
          {t("blog.footer_text")}
        </p>
      </footer>
    </div>
  );
}
