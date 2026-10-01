import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Globe, Users, PenLine, Loader2, User } from "lucide-react";
import { NavTabs } from "@/components/nav-tabs";
import logoImg from "@/assets/logo.png";
import { AuthModal } from "@/components/auth-modal";
import { UserMenu } from "@/components/user-menu";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { setSEO, resetSEO } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { countryFlag, CATEGORY_META, CATEGORY_ORDER } from "@/lib/community";
import { communityUI, categoryUIKey } from "@/lib/community-ui-i18n";
import { PostCard, COMMUNITY_AMBER } from "@/components/community-shared";
import type { CommunityPost, CommunityDestination, RecommendationCategory } from "@shared/schema";

const AMBER = "hsl(22 79% 75%)";
type TypeFilter = "all" | "story" | "recommendation" | "visa_experience";
const PAGE_SIZE = 12;

export default function CommunityPage() {
  const [, setLocation] = useLocation();
  const { language, t } = useLanguage();
  const cui = communityUI(language);
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();

  // ── Community feed state ────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [category, setCategory] = useState<RecommendationCategory | "all">("all");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [cursor, setCursor] = useState<number | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setSEO({
      title: "Traveler Community — Real Stories & Honest Recommendations | Himal to Horizon",
      description: "Tips, stories and honest recommendations from real travelers. Discover the best food, stays, activities and guides by destination — then share your own.",
      path: "/community",
    });
    return () => { resetSEO(); };
  }, []);

  const params = new URLSearchParams();
  params.set("limit", String(PAGE_SIZE));
  params.set("sort", sort);
  if (typeFilter !== "all") params.set("type", typeFilter);
  if (typeFilter === "recommendation" && category !== "all") params.set("category", category);
  if (language !== "en") params.set("lang", language);

  const { data: feed, isLoading: feedLoading } = useQuery<{ posts: CommunityPost[]; nextCursor: number | null }>({
    queryKey: ["/api/community/posts", typeFilter, typeFilter === "recommendation" ? category : "all", sort, language],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    },
  });

  useEffect(() => {
    if (feed) {
      setPosts(feed.posts);
      setCursor(feed.nextCursor);
      setReachedEnd(feed.nextCursor == null || feed.posts.length < PAGE_SIZE);
    }
  }, [feed]);

  const { data: destinations } = useQuery<CommunityDestination[]>({
    queryKey: ["/api/community/destinations"],
  });

  async function loadMore() {
    if (cursor == null || loadingMore || feedLoading) return;
    setLoadingMore(true);
    try {
      const more = new URLSearchParams(params);
      more.set(sort === "popular" ? "offset" : "before", String(cursor));
      const res = await fetch(`/api/community/posts?${more.toString()}`);
      const data: { posts: CommunityPost[]; nextCursor: number | null } = await res.json();
      setPosts((prev) => [...prev, ...data.posts]);
      setCursor(data.nextCursor);
      if (data.posts.length < PAGE_SIZE) setReachedEnd(true);
    } finally {
      setLoadingMore(false);
    }
  }

  // "Share" opens the new-post form pre-set to whichever post type the
  // reader is browsing, so Visa Experiences -> Share lands on the visa form.
  const shareHref = typeFilter === "all" ? "/community/new" : `/community/new?type=${typeFilter}`;

  const typeTabs: { id: TypeFilter; label: string }[] = [
    { id: "all", label: cui("filter_all") },
    { id: "story", label: cui("filter_stories") },
    { id: "recommendation", label: cui("filter_recommendations") },
    { id: "visa_experience", label: cui("filter_visa_experience") },
  ];

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

      <main className="flex-1 max-w-5xl mx-auto px-4 py-10 w-full">

        {/* ── Page title ── */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(247,176,136,0.12)", border: "1px solid rgba(247,176,136,0.25)" }}
            >
              <Users className="h-5 w-5" style={{ color: AMBER }} />
            </div>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: "var(--font-serif)" }}>
              {cui("hero_line1")} {cui("hero_line2")}
            </h1>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            {cui("hero_subtitle")}
          </p>
          <div className="mt-4">
            <Button
              onClick={() => setLocation(shareHref)}
              className="font-bold"
              style={{ background: COMMUNITY_AMBER, color: "#000" }}
              data-testid="hero-cta-share"
            >
              <PenLine className="h-4 w-4 mr-1.5" /> {cui("cta_share_story")}
            </Button>
          </div>
        </div>

        {/* Destinations */}
        {destinations && destinations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{cui("browse_destination")}</h2>
            </div>
            <div className="flex flex-col gap-2 pb-1">
              {[...destinations]
                .sort((a, b) => a.countryName.localeCompare(b.countryName))
                .map((d) => (
                <button
                  key={d.countryCode}
                  type="button"
                  data-testid={`chip-destination-${d.countryCode}`}
                  onClick={() => setLocation(`/community/${d.countryCode}`)}
                  className="flex items-center gap-2 w-full rounded-full border border-border/40 bg-card/60 hover:bg-card hover:border-border/70 px-3.5 py-2 transition-all"
                >
                  <span className="text-base">{countryFlag(d.countryCode)}</span>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{d.countryName}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{d.postCount}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type filters */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {typeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              data-testid={`filter-type-${tab.id}`}
              onClick={() => { setTypeFilter(tab.id); if (tab.id !== "recommendation") setCategory("all"); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={
                typeFilter === tab.id
                  ? { background: COMMUNITY_AMBER, color: "#000", borderColor: COMMUNITY_AMBER }
                  : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)" }
              }
            >
              {tab.label}
            </button>
          ))}
          <Button
            onClick={() => setLocation(shareHref)}
            className="ml-auto h-8 font-bold"
            style={{ background: COMMUNITY_AMBER, color: "#000" }}
            data-testid="button-share-story"
          >
            <PenLine className="h-3.5 w-3.5 mr-1.5" /> {cui("cta_share")}
          </Button>
        </div>

        {/* Category filters (recommendations only) */}
        {typeFilter === "recommendation" && (
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              data-testid="filter-category-all"
              onClick={() => setCategory("all")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all"
              style={
                category === "all"
                  ? { background: "rgba(255,255,255,0.9)", color: "#000", borderColor: "rgba(255,255,255,0.9)" }
                  : { background: "transparent", color: "rgba(255,255,255,0.7)", borderColor: "rgba(255,255,255,0.15)" }
              }
            >
              {cui("all_categories")}
            </button>
            {CATEGORY_ORDER.map((c) => {
              const meta = CATEGORY_META[c];
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  data-testid={`filter-category-${c}`}
                  onClick={() => setCategory(c)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full border transition-all inline-flex items-center gap-1"
                  style={
                    active
                      ? { background: meta.color, color: "#000", borderColor: meta.color }
                      : { background: "transparent", color: meta.color, borderColor: `${meta.color}55` }
                  }
                >
                  <meta.icon style={{ width: 12, height: 12 }} />
                  {cui(categoryUIKey(c))}
                </button>
              );
            })}
          </div>
        )}

        {/* Feed */}
        <div className="flex items-center justify-between gap-3 mb-3 mt-4 flex-wrap">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            {sort === "popular" ? cui("feed_popular") : cui("feed_latest")}
          </h2>
          <div className="flex items-center gap-1 p-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
            {([
              { id: "recent", label: cui("sort_recent") },
              { id: "popular", label: cui("sort_popular") },
            ] as const).map((opt) => (
              <button
                key={opt.id}
                type="button"
                data-testid={`button-sort-${opt.id}`}
                onClick={() => { setSort(opt.id); setCursor(null); setReachedEnd(false); }}
                className="text-xs font-bold px-3.5 py-1.5 rounded-full transition-all"
                style={
                  sort === opt.id
                    ? { background: COMMUNITY_AMBER, color: "#000" }
                    : { background: "transparent", color: "rgba(255,255,255,0.7)" }
                }
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {feedLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border/30 bg-card/40">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-foreground font-semibold">{cui("empty_title")}</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{cui("empty_subtitle")}</p>
            <Button onClick={() => setLocation(shareHref)} className="font-bold" style={{ background: COMMUNITY_AMBER, color: "#000" }} data-testid="button-share-first">
              <PenLine className="h-4 w-4 mr-1.5" /> {cui("cta_share_story")}
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
            {!reachedEnd && cursor != null && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  data-testid="button-load-more"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                  {cui("load_more")}
                </Button>
              </div>
            )}
          </>
        )}
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
