import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Users, PenLine, MapPin, FileCheck, Plane, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { setSEO, resetSEO } from "@/lib/seo";
import { countryFlag } from "@/lib/community";
import { CommunityHeader, PostCard, COMMUNITY_BG, COMMUNITY_AMBER } from "@/components/community-shared";
import type { CommunityPost, CommunityCity } from "@shared/schema";

export default function CommunityDestinationPage() {
  const params = useParams<{ cc: string; city?: string }>();
  const [, setLocation] = useLocation();
  const cc = (params.cc || "").toUpperCase();
  const city = params.city ? decodeURIComponent(params.city) : "";

  const qs = new URLSearchParams({ country: cc });
  if (city) qs.set("city", city);

  const { data: feed, isLoading } = useQuery<{ posts: CommunityPost[]; nextCursor: number | null }>({
    queryKey: ["/api/community/posts", "destination", cc, city],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed to load destination feed");
      return res.json();
    },
  });

  const { data: cities } = useQuery<CommunityCity[]>({
    queryKey: ["/api/community/destinations", cc, "cities"],
    queryFn: async () => {
      const res = await fetch(`/api/community/destinations/${cc}/cities`);
      if (!res.ok) throw new Error("Failed to load cities");
      return res.json();
    },
    enabled: !city,
  });

  const posts = feed?.posts ?? [];
  const countryName = posts[0]?.countryName ?? cc;

  useEffect(() => {
    const place = city ? `${city}, ${countryName}` : countryName;
    setSEO({
      title: `${place} — Traveler Tips & Recommendations`,
      description: `Real traveler stories and recommendations for ${place}: where to eat, stay, and what to do, from people who've been.`,
      path: city ? `/community/${cc}/${encodeURIComponent(city)}` : `/community/${cc}`,
    });
    return () => resetSEO();
  }, [cc, city, countryName]);

  return (
    <div className="min-h-screen" style={{ background: COMMUNITY_BG }}>
      <CommunityHeader />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <button type="button" onClick={() => setLocation("/community")} className="hover:text-foreground" data-testid="link-all-community">
            All destinations
          </button>
          <ChevronRight className="h-3 w-3 opacity-50" />
          <button type="button" onClick={() => setLocation(`/community/${cc}`)} className="hover:text-foreground" data-testid="link-country">
            {countryName}
          </button>
          {city && (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="text-foreground">{city}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 mb-5">
          <span className="text-4xl">{countryFlag(cc)}</span>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{city ? `${city}, ${countryName}` : countryName}</h1>
            <p className="text-sm text-muted-foreground">{posts.length} traveler {posts.length === 1 ? "post" : "posts"}</p>
          </div>
        </div>

        {/* Visa / flight context panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setLocation("/visa-guides")}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/60 hover:bg-card hover:border-border/70 p-3.5 text-left transition-all"
            data-testid="link-visa-context"
          >
            <div className="rounded-lg p-2" style={{ background: "hsl(168 60% 45% / 0.15)" }}>
              <FileCheck className="h-5 w-5" style={{ color: "hsl(168 60% 55%)" }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Visa requirements</p>
              <p className="text-xs text-muted-foreground truncate">Check entry rules for {countryName}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => setLocation("/flights")}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/60 hover:bg-card hover:border-border/70 p-3.5 text-left transition-all"
            data-testid="link-flights-context"
          >
            <div className="rounded-lg p-2" style={{ background: "hsl(22 79% 75% / 0.15)" }}>
              <Plane className="h-5 w-5" style={{ color: COMMUNITY_AMBER }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Find flights</p>
              <p className="text-xs text-muted-foreground truncate">Search deals to {countryName}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </button>
        </div>

        {/* Cities */}
        {!city && cities && cities.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Browse by city</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  data-testid={`chip-city-${c.city}`}
                  onClick={() => setLocation(`/community/${cc}/${encodeURIComponent(c.city)}`)}
                  className="flex items-center gap-2 rounded-full border border-border/40 bg-card/60 hover:bg-card hover:border-border/70 px-3.5 py-2 transition-all"
                >
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">{c.city}</span>
                  <span className="text-xs text-muted-foreground">{c.postCount}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-border/30 bg-card/40">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-foreground font-semibold">No posts for {city ? city : countryName} yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Been here? Help fellow travelers out.</p>
            <Button onClick={() => setLocation("/community/new")} className="font-bold" style={{ background: COMMUNITY_AMBER, color: "#000" }} data-testid="button-share-destination">
              <PenLine className="h-4 w-4 mr-1.5" /> Share your story
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </div>
    </div>
  );
}
