import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, User, Bell, Star, Home as HomeIcon, Trash2, Loader2,
  CheckCircle2, Plane, Save, Search, X, Users, PenLine, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import logoImg from "@/assets/logo.png";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { useCurrency } from "@/contexts/currency-context";
import { formatDate, formatCurrency } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import type { FavoriteRoute, PriceAlert, CommunityPost } from "@shared/schema";
import { countryFlag, timeAgo } from "@/lib/community";

type TabId = "profile" | "alerts" | "favorites" | "myposts";

export default function ProfilePage() {
  const { t } = useLanguage();
  const { currency } = useCurrency();
  const { user, updateProfile, signOut, loading } = useAuth();
  const [, setLocation] = useLocation();
  const search = useSearch();
  const qc = useQueryClient();

  const initialTab = (new URLSearchParams(search).get("tab") as TabId) ?? "profile";
  const [tab, setTab] = useState<TabId>(initialTab);

  const [name, setName] = useState(user?.name ?? "");
  const [homeAirport, setHomeAirport] = useState(user?.homeAirport ?? "");
  const [homeAirportLabel, setHomeAirportLabel] = useState(user?.homeAirportLabel ?? "");
  const [airportSuggestions, setAirportSuggestions] = useState<any[]>([]);
  const [airportQuery, setAirportQuery] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setHomeAirport(user.homeAirport ?? "");
      setHomeAirportLabel(user.homeAirportLabel ?? "");
    }
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) setLocation("/");
  }, [user, loading, setLocation]);

  // Airport search for home airport
  useEffect(() => {
    if (!airportQuery || airportQuery.length < 2) { setAirportSuggestions([]); return; }
    const ctrl = new AbortController();
    fetch(`/api/places/suggestions?query=${encodeURIComponent(airportQuery)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setAirportSuggestions((d.data ?? []).slice(0, 5)))
      .catch(() => {});
    return () => ctrl.abort();
  }, [airportQuery]);

  const { data: alertsData, isLoading: alertsLoading } = useQuery<{ alerts: PriceAlert[] }>({
    queryKey: ["/api/alerts"],
    enabled: !!user && tab === "alerts",
  });

  const { data: favData, isLoading: favLoading } = useQuery<{ routes: FavoriteRoute[] }>({
    queryKey: ["/api/favorites"],
    enabled: !!user && tab === "favorites",
  });

  const { data: myPosts, isLoading: myPostsLoading } = useQuery<CommunityPost[]>({
    queryKey: ["/api/community/my-posts"],
    enabled: !!user && tab === "myposts",
  });

  const deletePost = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/community/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community/my-posts"] });
      qc.invalidateQueries({ queryKey: ["/api/community/posts"] });
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/alerts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/alerts"] }),
  });

  const deleteFav = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/favorites/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/favorites"] }),
  });

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    await updateProfile({ name, homeAirport: homeAirport || undefined, homeAirportLabel: homeAirportLabel || undefined });
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#060D17" }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "#F7B088" }} />
      </div>
    );
  }

  if (!user) return null;

  const tabs: { id: TabId; label: string; icon: typeof User }[] = [
    { id: "profile", label: t("auth.profile"), icon: User },
    { id: "alerts", label: t("auth.price_alerts"), icon: Bell },
    { id: "favorites", label: t("auth.favorite_routes"), icon: Star },
    { id: "myposts", label: "My posts", icon: Users },
  ];

  return (
    <div className="min-h-screen" style={{ background: "#060D17" }}>
      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: "rgba(6,13,23,0.95)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2 bg-transparent border-0 p-0 cursor-pointer"
          >
            <img src={logoImg} alt="Himal to Horizon" className="w-7 h-7 rounded-full object-cover" />
            <span className="font-bold hidden sm:block" style={{ fontFamily: "var(--font-serif)", color: "hsl(var(--foreground))" }}>
              Himal to Horizon
            </span>
          </button>
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => { await signOut(); setLocation("/"); }}
              data-testid="button-signout"
              className="text-muted-foreground text-xs"
            >
              {t("auth.sign_out")}
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile summary */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold shrink-0"
            style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
          >
            {(user.name ?? user.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
              {user.name ?? user.email.split("@")[0]}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-xl p-1 mb-8" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              data-testid={`profile-tab-${id}`}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 flex-1 justify-center py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: tab === id ? "rgba(247,176,136,0.15)" : "transparent",
                color: tab === id ? "#F7B088" : "rgba(255,255,255,0.5)",
              }}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="space-y-6">
            <div
              className="rounded-2xl p-6 space-y-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("auth.personal_info")}</h2>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.display_name")}</Label>
                <Input
                  data-testid="input-profile-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.name_placeholder")}
                  className="h-10 text-sm"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.email")}</Label>
                <Input
                  value={user.email}
                  disabled
                  className="h-10 text-sm opacity-50"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                />
              </div>
            </div>

            <div
              className="rounded-2xl p-6 space-y-5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-1">{t("auth.home_airport")}</h2>
                <p className="text-xs text-muted-foreground">{t("auth.home_airport_desc")}</p>
              </div>

              {homeAirport ? (
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(247,176,136,0.08)", border: "1px solid rgba(247,176,136,0.2)" }}>
                  <HomeIcon className="w-5 h-5 shrink-0" style={{ color: "#F7B088" }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: "#F7B088" }}>{homeAirport}</p>
                    {homeAirportLabel && <p className="text-xs text-muted-foreground truncate">{homeAirportLabel}</p>}
                  </div>
                  <button
                    type="button"
                    data-testid="button-clear-home-airport"
                    onClick={() => { setHomeAirport(""); setHomeAirportLabel(""); setAirportQuery(""); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      data-testid="input-home-airport"
                      value={airportQuery}
                      onChange={(e) => setAirportQuery(e.target.value)}
                      placeholder={t("auth.search_airport")}
                      className="h-10 text-sm pl-9"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                  {airportSuggestions.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 mt-1 rounded-xl z-10 overflow-hidden"
                      style={{ background: "hsl(211 60% 8%)", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 16px 48px rgba(0,0,0,0.5)" }}
                    >
                      {airportSuggestions.map((s: any) => (
                        <button
                          key={s.id}
                          type="button"
                          data-testid={`airport-suggestion-${s.iata_code}`}
                          onClick={() => {
                            setHomeAirport(s.iata_code);
                            setHomeAirportLabel(`${s.name} (${s.iata_code})`);
                            setAirportQuery("");
                            setAirportSuggestions([]);
                          }}
                          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-white/5 transition-colors border-b last:border-0"
                          style={{ borderColor: "rgba(255,255,255,0.06)" }}
                        >
                          <Plane className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold text-sm" style={{ color: "#F7B088" }}>{s.iata_code}</span>
                            <span className="text-sm text-foreground ml-2 truncate">{s.name}</span>
                            {s.city_name && <span className="text-xs text-muted-foreground ml-1">· {s.city_name}</span>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              data-testid="button-save-profile"
              onClick={handleSaveProfile}
              disabled={profileSaving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all"
              style={{ background: profileSaved ? "rgba(52,211,153,0.2)" : "#F7B088", color: profileSaved ? "#34D399" : "hsl(211 60% 8%)", border: profileSaved ? "1px solid #34D399" : "none" }}
            >
              {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : profileSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {profileSaved ? t("auth.saved") : t("auth.save_changes")}
            </button>
          </div>
        )}

        {/* Alerts Tab */}
        {tab === "alerts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("auth.price_alerts")}</h2>
            </div>
            {user && !user.emailVerified && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
                data-testid="alert-verify-email-notice"
                style={{ background: "rgba(251,191,36,0.07)", border: "1px solid rgba(251,191,36,0.25)" }}
              >
                <span className="text-base shrink-0 mt-0.5">⚠️</span>
                <div>
                  <p className="font-semibold text-foreground">Verify your email to receive alerts</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Your flights are being tracked, but price drop emails won't be sent until you confirm your email address. Check your inbox for the verification link.
                  </p>
                </div>
              </div>
            )}
            {alertsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : !alertsData?.alerts?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("auth.no_alerts")}</p>
                <button
                  type="button"
                  onClick={() => setLocation("/results?origin=JFK&destination=LHR&departureDate=2026-05-01&returnDate=2026-05-15&adults=1&cabinClass=economy&tripType=round_trip")}
                  className="mt-3 text-xs font-medium"
                  style={{ color: "#F7B088" }}
                >
                  {t("auth.search_flights")} →
                </button>
              </div>
            ) : (
              alertsData.alerts.map((alert) => (
                <div
                  key={alert.id}
                  data-testid={`alert-row-${alert.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm" style={{ fontFamily: "var(--font-serif)" }}>
                        {alert.origin} → {alert.destination}
                      </span>
                      <Badge variant="secondary" className="text-xs capitalize">{alert.cabinClass.replace("_", " ")}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(alert.departureDate, "d MMM yyyy")}
                      {alert.returnDate && ` → ${formatDate(alert.returnDate, "d MMM yyyy")}`}
                    </p>
                    <p className="text-xs mt-1">
                      <span className="text-muted-foreground">{t("auth.tracking_from")} </span>
                      <span className="font-semibold" style={{ color: "#F7B088" }}>
                        {formatCurrency(alert.baselinePrice, alert.currency)}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid={`button-delete-alert-${alert.id}`}
                    onClick={() => deleteAlert.mutate(alert.id)}
                    disabled={deleteAlert.isPending}
                    className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {tab === "favorites" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">{t("auth.favorite_routes")}</h2>
            </div>
            {favLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : !favData?.routes?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">{t("auth.no_favorites")}</p>
              </div>
            ) : (
              favData.routes.map((route) => (
                <div
                  key={route.id}
                  data-testid={`fav-row-${route.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onClick={() => setLocation(`/results?origin=${route.origin}&destination=${route.destination}&departureDate=${new Date(Date.now() + 30 * 86400000).toISOString().slice(0,10)}&adults=1&cabinClass=economy&tripType=one_way`)}
                >
                  <Star className="w-4 h-4 shrink-0" style={{ color: "#F7B088" }} />
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-sm" style={{ fontFamily: "var(--font-serif)" }}>
                      {route.origin} → {route.destination}
                    </span>
                    {(route.originLabel || route.destinationLabel) && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {route.originLabel ?? route.origin} → {route.destinationLabel ?? route.destination}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Plane className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    <button
                      type="button"
                      data-testid={`button-delete-fav-${route.id}`}
                      onClick={(e) => { e.stopPropagation(); deleteFav.mutate(route.id); }}
                      disabled={deleteFav.isPending}
                      className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* My Posts Tab */}
        {tab === "myposts" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">My posts</h2>
              <Button size="sm" onClick={() => setLocation("/community/new")} className="font-bold" style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }} data-testid="button-new-community-post">
                <PenLine className="w-4 h-4 mr-1.5" /> Share
              </Button>
            </div>
            {myPostsLoading ? (
              <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
            ) : !myPosts?.length ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">You haven't shared anything yet.</p>
                <button type="button" onClick={() => setLocation("/community/new")} className="mt-3 text-xs font-medium" style={{ color: "#F7B088" }}>
                  Share your first story →
                </button>
              </div>
            ) : (
              myPosts.map((post) => (
                <div
                  key={post.id}
                  data-testid={`mypost-row-${post.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl cursor-pointer hover:bg-white/5 transition-colors group"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onClick={() => setLocation(`/community/post/${post.id}`)}
                >
                  <span className="text-xl shrink-0">{countryFlag(post.countryCode)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm truncate" style={{ fontFamily: "var(--font-serif)" }}>{post.title}</span>
                      {post.status === "removed" && <Badge variant="secondary" className="text-xs">Removed</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{post.city ? `${post.city}, ${post.countryName}` : post.countryName}</span>
                      <span className="opacity-30">·</span>
                      <span>{timeAgo(post.createdAt)}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    data-testid={`button-delete-mypost-${post.id}`}
                    onClick={(e) => { e.stopPropagation(); if (confirm("Delete this post? This cannot be undone.")) deletePost.mutate(post.id); }}
                    disabled={deletePost.isPending}
                    className="text-muted-foreground hover:text-red-400 transition-colors p-1 rounded shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <footer className="text-center py-8 text-xs text-muted-foreground">
        © Himal to Horizon · <a href="https://himaltohorizon.com" style={{ color: "#F7B088" }}>himaltohorizon.com</a>
      </footer>
    </div>
  );
}
