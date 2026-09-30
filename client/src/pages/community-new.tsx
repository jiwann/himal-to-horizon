import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams, useSearch } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, ImagePlus, Star, X, Search, BookOpen, MapPin, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setSEO, resetSEO } from "@/lib/seo";
import { CATEGORY_ORDER, CATEGORY_META, VISA_OUTCOME_ORDER, VISA_OUTCOME_META } from "@/lib/community";
import { CommunityHeader, COMMUNITY_BG, COMMUNITY_AMBER } from "@/components/community-shared";
import allCountries from "@/lib/all-countries.json";
import type { CommunityPost, CommunityPostType, RecommendationCategory, VisaOutcome } from "@shared/schema";

type Country = { code: string; name: string; flag: string };
const COUNTRIES = (allCountries as { countries: Country[] }).countries;

const MAX_PHOTOS = 8;

export default function CommunityNewPage() {
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const params = useParams<{ id?: string }>();
  const editId = params.id ? Number(params.id) : null;
  const isEdit = editId != null && Number.isFinite(editId);

  const { data: adminMe, isLoading: adminLoading } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me");
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
  });
  const isAdmin = !!adminMe?.authenticated;

  // /community/new?type=visa_experience (from the community feed's Share
  // button) starts the form on that post type instead of Story.
  const search = useSearch();
  const [type, setType] = useState<CommunityPostType>(() => {
    const requested = new URLSearchParams(search).get("type");
    return requested === "recommendation" || requested === "visa_experience" ? requested : "story";
  });
  const [title, setTitle] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryQuery, setCountryQuery] = useState("");
  const [city, setCity] = useState("");
  const [story, setStory] = useState("");
  const [category, setCategory] = useState<RecommendationCategory>("food");
  const [rating, setRating] = useState(5);
  const [visaOutcome, setVisaOutcome] = useState<VisaOutcome | "">("");
  const [processingTimeReported, setProcessingTimeReported] = useState("");
  const [photos, setPhotos] = useState<{ path: string; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const isRec = type === "recommendation";
  const isVisa = type === "visa_experience";

  const { data: editData, isLoading: loadingPost } = useQuery<{ post: CommunityPost }>({
    queryKey: ["/api/community/posts", editId],
    enabled: isEdit,
  });

  useEffect(() => {
    const p = editData?.post;
    if (!p) return;
    setType(p.type);
    setTitle(p.title);
    setCountryCode(p.countryCode);
    setCity(p.city ?? "");
    setStory(p.story ?? "");
    if (p.category) setCategory(p.category);
    if (p.rating != null) setRating(p.rating);
    if (p.visaOutcome) setVisaOutcome(p.visaOutcome);
    setProcessingTimeReported(p.processingTimeReported ?? "");
    setPhotos((p.photos ?? []).map((path) => ({ path, preview: path })));
  }, [editData]);

  useEffect(() => {
    setSEO({ title: isEdit ? "Edit your post" : "Share your travel experience", description: "Share your travel story or a recommendation with the community.", path: isEdit ? `/community/edit/${editId}` : "/community/new" });
    return () => resetSEO();
  }, [isEdit, editId]);

  useEffect(() => {
    if (loading) return;
    if (isEdit && adminLoading) return;
    if (!user && !(isEdit && isAdmin)) setLocation("/profile");
  }, [user, loading, isEdit, isAdmin, adminLoading, setLocation]);

  // Edit mode: once the post is loaded, block anyone who is neither the owner
  // nor an admin (server enforces this too, but this avoids a dead editor shell).
  useEffect(() => {
    if (!isEdit || loading || adminLoading || loadingPost) return;
    const p = editData?.post;
    if (!p) return;
    const owner = !!user && user.id === p.userId;
    if (!owner && !isAdmin) {
      toast({ title: "You can only edit your own posts", variant: "destructive" });
      setLocation(`/community/post/${p.id}`);
    }
  }, [isEdit, loading, adminLoading, loadingPost, editData, user, isAdmin, setLocation, toast]);

  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES.slice(0, 40);
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q).slice(0, 40);
  }, [countryQuery]);

  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - photos.length;
    const list = Array.from(files).slice(0, room);
    if (list.length === 0) {
      toast({ title: `Up to ${MAX_PHOTOS} photos`, variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      for (const file of list) {
        if (!file.type.startsWith("image/")) continue;
        const res = await apiRequest("POST", "/api/community/photo-url", { contentType: file.type, size: file.size });
        const { uploadURL, objectPath } = await res.json();
        const put = await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
        if (!put.ok) throw new Error("upload failed");
        setPhotos((p) => [...p, { path: objectPath, preview: URL.createObjectURL(file) }]);
      }
    } catch (e: any) {
      toast({ title: "Photo upload failed", description: e?.message?.replace(/^\d+:\s*/, "") || "Please try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {
        type,
        title: title.trim(),
        story: story.trim(),
        countryCode,
        countryName: selectedCountry?.name ?? "",
        city: city.trim(),
        photos: photos.map((p) => p.path),
        originalLang: language,
      };
      if (isRec) {
        body.category = category;
        body.rating = rating;
      }
      if (isVisa) {
        body.visaOutcome = visaOutcome;
        if (processingTimeReported.trim()) body.processingTimeReported = processingTimeReported.trim();
      }
      const res = isEdit
        ? await apiRequest("PUT", `/api/community/posts/${editId}`, body)
        : await apiRequest("POST", "/api/community/posts", body);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/community/posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/destinations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/community/my-posts"] });
      toast({ title: isEdit ? "Post updated!" : isRec ? "Recommendation shared!" : isVisa ? "Visa experience shared!" : "Story shared!" });
      setLocation(`/community/post/${data.post.id}`);
    },
    onError: (e: any) => toast({ title: isEdit ? "Could not save changes" : "Could not share post", description: e?.message?.replace(/^\d+:\s*/, "") ?? "", variant: "destructive" }),
  });

  const contentOk = isRec ? true : story.trim().length > 0;
  const visaOk = !isVisa || !!visaOutcome;
  const canSubmit = title.trim().length >= 3 && !!countryCode && contentOk && visaOk && !createMutation.isPending && !uploading;

  const stillResolving = loading || (isEdit && (adminLoading || loadingPost));
  const canAccess = !!user || (isEdit && isAdmin);
  if (stillResolving || !canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COMMUNITY_BG }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: COMMUNITY_AMBER }} />
      </div>
    );
  }

  const typeOptions: { id: CommunityPostType; label: string; desc: string; icon: typeof BookOpen }[] = [
    { id: "story", label: "Story", desc: "A travel write-up or journal", icon: BookOpen },
    { id: "recommendation", label: "Recommendation", desc: "A specific spot worth rating", icon: MapPin },
    { id: "visa_experience", label: "Visa Experience", desc: "Share an approval, denial, or RFE", icon: Stamp },
  ];

  return (
    <div className="min-h-screen" style={{ background: COMMUNITY_BG }}>
      <CommunityHeader showCompose={false} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-foreground mb-1">{isEdit ? "Edit your post" : "Share your travel experience"}</h1>
        <p className="text-sm text-muted-foreground mb-5">{isEdit ? "Update the details below and save your changes." : "Tell other travelers about your trip, or recommend a great spot."}</p>

        {/* Type toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {typeOptions.map((opt) => {
            const active = type === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                data-testid={`toggle-type-${opt.id}`}
                className="rounded-xl border p-3 text-left transition-all"
                style={
                  active
                    ? { borderColor: COMMUNITY_AMBER, background: "hsl(22 79% 75% / 0.1)" }
                    : { borderColor: "rgba(255,255,255,0.12)", background: "transparent" }
                }
              >
                <div className="flex items-center gap-2">
                  <opt.icon className="h-4 w-4" style={{ color: active ? COMMUNITY_AMBER : "rgba(255,255,255,0.6)" }} />
                  <span className="font-semibold text-foreground">{opt.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{opt.desc}</p>
              </button>
            );
          })}
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div>
            <Label htmlFor="title">{isRec ? "Place name" : isVisa ? "Which visa?" : "Title"}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRec ? "e.g. Or2k Restaurant, Thamel" : isVisa ? "e.g. US B1/B2 Tourist Visa" : "e.g. 5 unforgettable days in Kathmandu"}
              maxLength={160}
              className="mt-1.5"
              data-testid="input-title"
            />
          </div>

          {/* Country + city */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Destination country</Label>
              {selectedCountry ? (
                <div className="mt-1.5 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                  <span className="text-lg">{selectedCountry.flag}</span>
                  <span className="text-sm font-medium flex-1">{selectedCountry.name}</span>
                  <button type="button" onClick={() => { setCountryCode(""); setCountryQuery(""); }} data-testid="button-clear-country"><X className="h-4 w-4 text-muted-foreground" /></button>
                </div>
              ) : (
                <div className="mt-1.5">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} placeholder="Search country" className="pl-8" data-testid="input-country-search" />
                  </div>
                  {countryQuery && (
                    <div className="mt-1 max-h-52 overflow-y-auto rounded-md border border-border/40 bg-card">
                      {filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => { setCountryCode(c.code); setCountryQuery(""); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                          data-testid={`option-country-${c.code}`}
                        >
                          <span className="text-base">{c.flag}</span>{c.name}
                        </button>
                      ))}
                      {filteredCountries.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No match</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="city">City / area {!isRec && <span className="text-muted-foreground font-normal">(optional)</span>}</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Pokhara" maxLength={120} className="mt-1.5" data-testid="input-city" />
            </div>
          </div>

          {/* Recommendation fields */}
          {isRec && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as RecommendationCategory)}>
                  <SelectTrigger className="mt-1.5" data-testid="select-category"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_ORDER.map((c) => (
                      <SelectItem key={c} value={c}>{CATEGORY_META[c].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Your rating</Label>
                <div className="mt-2.5 flex items-center gap-1" data-testid="rating-input">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setRating(n)} data-testid={`star-${n}`}>
                      <Star className="h-6 w-6" color={n <= rating ? "hsl(42 90% 65%)" : "rgba(255,255,255,0.25)"} fill={n <= rating ? "hsl(42 90% 65%)" : "none"} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Visa experience fields */}
          {isVisa && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Outcome</Label>
                <div className="mt-1.5 flex flex-wrap gap-2" data-testid="visa-outcome-input">
                  {VISA_OUTCOME_ORDER.map((o) => {
                    const meta = VISA_OUTCOME_META[o];
                    const active = visaOutcome === o;
                    const Icon = meta.icon;
                    return (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setVisaOutcome(o)}
                        data-testid={`option-outcome-${o}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all capitalize"
                        style={
                          active
                            ? { background: meta.color, color: "#000", borderColor: meta.color }
                            : { background: "transparent", color: meta.color, borderColor: `${meta.color}55` }
                        }
                      >
                        <Icon style={{ width: 12, height: 12 }} />
                        {o === "rfe" ? "Request for evidence" : o}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="processing-time">Processing time <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input
                  id="processing-time"
                  value={processingTimeReported}
                  onChange={(e) => setProcessingTimeReported(e.target.value)}
                  placeholder="e.g. 3 weeks"
                  maxLength={120}
                  className="mt-1.5"
                  data-testid="input-processing-time"
                />
              </div>
            </div>
          )}

          {/* Story / note */}
          <div>
            <Label htmlFor="story">{isRec ? <>Why do you recommend it? <span className="text-muted-foreground font-normal">(optional)</span></> : isVisa ? "What happened?" : "Your story"}</Label>
            <Textarea
              id="story"
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder={isRec ? "What makes this spot special? Tips for fellow travelers." : isVisa ? "Walk other applicants through your timeline, documents, and what you'd do differently." : "What made this trip special? Share the highlights, surprises, and anything fellow travelers should know."}
              rows={isRec ? 4 : 6}
              maxLength={12000}
              className="mt-1.5"
              data-testid="input-story"
            />
          </div>

          {/* Photos */}
          <div>
            <Label>Photos <span className="text-muted-foreground font-normal">(up to {MAX_PHOTOS})</span></Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {photos.map((photo, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border/40">
                  <img src={photo.preview} alt={`upload ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => { URL.revokeObjectURL(p[i].preview); return p.filter((_, idx) => idx !== i); })} className="absolute top-0.5 right-0.5 rounded-full bg-black/70 p-0.5" data-testid={`button-remove-photo-${i}`}>
                    <X className="h-3 w-3 text-white" />
                  </button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="h-20 w-20 rounded-lg border border-dashed border-border/60 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground hover:border-border transition-colors"
                  data-testid="button-add-photo"
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ImagePlus className="h-5 w-5" /><span className="text-[10px] mt-1">Add</span></>}
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} data-testid="input-photo-file" />
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={() => createMutation.mutate()} disabled={!canSubmit} className="font-bold" style={{ background: COMMUNITY_AMBER, color: "#000" }} data-testid="button-publish">
              {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
              {isEdit ? "Save changes" : "Share with community"}
            </Button>
            <Button variant="ghost" onClick={() => setLocation("/community")} data-testid="button-cancel">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
