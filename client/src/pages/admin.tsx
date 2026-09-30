import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus, Edit2, Trash2, Eye, EyeOff, LogOut, ArrowLeft,
  Globe, Star, Clock, BookOpen, ChevronDown, ChevronUp, Flag, ExternalLink,
  Users, MessageSquare, FileText, BadgeCheck
} from "lucide-react";
import { SiGoogle } from "react-icons/si";
import type { CommunityReport, AdminUser } from "@shared/schema";

// ── Types ──────────────────────────────────────────────────────────────────────
type ContentSection =
  | { t: "p";     v: string }
  | { t: "h2";    v: string }
  | { t: "h3";    v: string }
  | { t: "ul";    v: string[] }
  | { t: "ol";    v: string[] }
  | { t: "tip";   v: string }
  | { t: "warn";  v: string }
  | { t: "quote"; v: string }
  | { t: "facts"; v: { k: string; val: string }[] };

type Post = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  destination_name: string | null;
  destination_iata: string | null;
  country: string | null;
  region: string | null;
  continent: string | null;
  hero_emoji: string;
  content_json: ContentSection[];
  best_time_to_visit: string | null;
  tags: string[];
  seo_title: string;
  seo_description: string;
  reading_time_mins: number;
  featured: boolean;
  published: boolean;
  published_at: string;
};

// ── Markdown ↔ ContentSection helpers ─────────────────────────────────────────
function textToContent(text: string): ContentSection[] {
  const lines = text.split("\n");
  const out: ContentSection[] = [];
  let ul: string[] = [];
  let ol: string[] = [];

  const flushUl = () => { if (ul.length) { out.push({ t: "ul", v: [...ul] }); ul = []; } };
  const flushOl = () => { if (ol.length) { out.push({ t: "ol", v: [...ol] }); ol = []; } };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushUl(); flushOl(); continue; }
    if (line.startsWith("## "))       { flushUl(); flushOl(); out.push({ t: "h2",    v: line.slice(3) }); }
    else if (line.startsWith("### ")) { flushUl(); flushOl(); out.push({ t: "h3",    v: line.slice(4) }); }
    else if (line.startsWith("- "))   { flushOl(); ul.push(line.slice(2)); }
    else if (/^\d+\. /.test(line))    { flushUl(); ol.push(line.replace(/^\d+\. /, "")); }
    else if (line.startsWith("[tip] "))   { flushUl(); flushOl(); out.push({ t: "tip",   v: line.slice(6) }); }
    else if (line.startsWith("[warn] "))  { flushUl(); flushOl(); out.push({ t: "warn",  v: line.slice(7) }); }
    else if (line.startsWith("[quote] ")) { flushUl(); flushOl(); out.push({ t: "quote", v: line.slice(8) }); }
    else { flushUl(); flushOl(); out.push({ t: "p", v: line }); }
  }
  flushUl(); flushOl();
  return out;
}

function contentToText(sections: ContentSection[]): string {
  return sections.map((s) => {
    if (s.t === "h2")    return `## ${s.v}`;
    if (s.t === "h3")    return `### ${s.v}`;
    if (s.t === "p")     return s.v;
    if (s.t === "ul")    return (s.v as string[]).map((x) => `- ${x}`).join("\n");
    if (s.t === "ol")    return (s.v as string[]).map((x, i) => `${i + 1}. ${x}`).join("\n");
    if (s.t === "tip")   return `[tip] ${s.v}`;
    if (s.t === "warn")  return `[warn] ${s.v}`;
    if (s.t === "quote") return `[quote] ${s.v}`;
    if (s.t === "facts") return (s.v as { k: string; val: string }[]).map((f) => `${f.k}: ${f.val}`).join(" | ");
    return "";
  }).filter(Boolean).join("\n\n");
}

function slugify(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const CATEGORIES = ["destination-guide", "trek-report", "travel-tips", "travel-story"];
const CONTINENTS = ["Asia", "Europe", "North America", "South America", "Africa", "Oceania", "Middle East"];

// ── Blank post template ────────────────────────────────────────────────────────
function blankPost(): Omit<Post, "id" | "published_at"> {
  return {
    slug: "", title: "", excerpt: "", category: "destination-guide",
    destination_name: "", destination_iata: "", country: "", region: "",
    continent: "Asia", hero_emoji: "✈️", content_json: [],
    best_time_to_visit: "", tags: [], seo_title: "", seo_description: "",
    reading_time_mins: 8, featured: false, published: false,
  };
}

// ── Login screen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      await apiRequest("POST", "/api/admin/login", { password: pw });
      toast({ title: "Welcome back", description: "Admin panel unlocked." });
      onLogin();
    } catch {
      setErr("Wrong password. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🏔️</div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif)" }}>
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Himal to Horizon</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="admin-pw">Password</Label>
            <Input
              id="admin-pw"
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Admin password"
              className="mt-1"
              data-testid="input-admin-password"
              autoFocus
            />
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <Button type="submit" className="w-full" disabled={loading} data-testid="button-admin-login">
            {loading ? "Checking…" : "Sign in"}
          </Button>
        </form>
        <div className="text-center mt-6">
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">← Back to site</Link>
        </div>
      </div>
    </div>
  );
}

// ── Post editor ───────────────────────────────────────────────────────────────
function PostEditor({
  initial, onSave, onCancel,
}: {
  initial: Omit<Post, "id" | "published_at"> & { id?: number };
  onSave: (data: any, publish: boolean) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({ ...initial });
  const [bodyText, setBodyText] = useState(() => contentToText(initial.content_json ?? []));
  const [tagsText, setTagsText] = useState((initial.tags ?? []).join(", "));
  const [showSeo, setShowSeo] = useState(false);

  const set = (key: string, val: any) => setForm((f) => ({ ...f, [key]: val }));

  function handleTitleBlur() {
    if (!form.slug) set("slug", slugify(form.title));
    if (!form.seo_title) set("seo_title", form.title);
  }

  function collect(publish: boolean) {
    const content_json = textToContent(bodyText);
    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    onSave({ ...form, content_json, tags, published: publish }, publish);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to posts
        </button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => collect(false)} data-testid="button-save-draft">
            Save draft
          </Button>
          <Button size="sm" onClick={() => collect(true)} data-testid="button-publish-post">
            Publish
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} onBlur={handleTitleBlur} placeholder="Post title" data-testid="input-post-title" />
        </div>
        <div className="space-y-1">
          <Label>Slug *</Label>
          <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="url-slug" data-testid="input-post-slug" />
        </div>
        <div className="space-y-1 md:col-span-2">
          <Label>Excerpt *</Label>
          <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={2} placeholder="One or two sentence summary shown in cards and previews." data-testid="input-post-excerpt" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <Label>Emoji</Label>
          <Input value={form.hero_emoji} onChange={(e) => set("hero_emoji", e.target.value)} placeholder="🏔️" maxLength={4} data-testid="input-post-emoji" />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            data-testid="select-post-category"
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Continent</Label>
          <select
            value={form.continent ?? ""}
            onChange={(e) => set("continent", e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
            data-testid="select-post-continent"
          >
            <option value="">— select —</option>
            {CONTINENTS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label>Read time (min)</Label>
          <Input type="number" min={1} max={60} value={form.reading_time_mins} onChange={(e) => set("reading_time_mins", Number(e.target.value))} data-testid="input-post-readtime" />
        </div>
        <div className="space-y-1">
          <Label>Destination name</Label>
          <Input value={form.destination_name ?? ""} onChange={(e) => set("destination_name", e.target.value)} placeholder="Bangkok" data-testid="input-post-dest-name" />
        </div>
        <div className="space-y-1">
          <Label>Destination IATA</Label>
          <Input value={form.destination_iata ?? ""} onChange={(e) => set("destination_iata", e.target.value)} placeholder="BKK" maxLength={3} data-testid="input-post-dest-iata" />
        </div>
        <div className="space-y-1">
          <Label>Country</Label>
          <Input value={form.country ?? ""} onChange={(e) => set("country", e.target.value)} placeholder="Thailand" data-testid="input-post-country" />
        </div>
        <div className="space-y-1">
          <Label>Best time to visit</Label>
          <Input value={form.best_time_to_visit ?? ""} onChange={(e) => set("best_time_to_visit", e.target.value)} placeholder="Nov – Feb" data-testid="input-post-best-time" />
        </div>
      </div>

      <div className="space-y-1">
        <Label>Tags (comma-separated)</Label>
        <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="hiking, budget, solo" data-testid="input-post-tags" />
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="chk-featured" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="rounded" data-testid="checkbox-post-featured" />
        <Label htmlFor="chk-featured" className="cursor-pointer">Featured post (shown prominently on home page)</Label>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between mb-1">
          <Label>Article content</Label>
          <span className="text-xs text-muted-foreground">
            ## Heading · ### Sub · - List · 1. Numbered · [tip] · [warn] · [quote]
          </span>
        </div>
        <Textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={20}
          className="font-mono text-sm"
          placeholder={"## Introduction\n\nStart writing your article here.\n\n- Bullet point one\n- Bullet point two\n\n[tip] A helpful tip for your readers."}
          data-testid="textarea-post-content"
        />
      </div>

      <div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3"
          onClick={() => setShowSeo(!showSeo)}
        >
          {showSeo ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          SEO fields
        </button>
        {showSeo && (
          <div className="space-y-3 p-4 rounded-lg border border-border/60 bg-card/40">
            <div className="space-y-1">
              <Label>SEO title</Label>
              <Input value={form.seo_title} onChange={(e) => set("seo_title", e.target.value)} placeholder="Page title for search engines" data-testid="input-post-seo-title" />
            </div>
            <div className="space-y-1">
              <Label>SEO description</Label>
              <Textarea value={form.seo_description} onChange={(e) => set("seo_description", e.target.value)} rows={2} placeholder="150–160 character description for search results" data-testid="textarea-post-seo-desc" />
              <p className="text-xs text-muted-foreground">{form.seo_description.length} / 160</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button variant="outline" onClick={() => collect(false)} data-testid="button-save-draft-bottom">Save draft</Button>
        <Button onClick={() => collect(true)} data-testid="button-publish-post-bottom">Publish</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// ── Main admin panel ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [view, setView] = useState<"list" | "new" | "edit">("list");
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [search, setSearch] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => setAuthed(d.authenticated))
      .catch(() => setAuthed(false));
  }, []);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/admin/posts"],
    enabled: authed === true,
    queryFn: () => fetch("/api/admin/posts").then((r) => {
      if (!r.ok) throw new Error("Unauthorized");
      return r.json();
    }),
  });

  const saveMutation = useMutation({
    mutationFn: (data: { id?: number; body: any }) =>
      data.id
        ? apiRequest("PUT", `/api/admin/posts/${data.id}`, data.body)
        : apiRequest("POST", "/api/admin/posts", data.body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({ title: "Saved!", description: "Post updated successfully." });
      setView("list");
    },
    onError: (err: any) => toast({ title: "Error", description: err?.message ?? "Save failed", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/blog/posts"] });
      toast({ title: "Deleted", description: "Post removed." });
    },
    onError: () => toast({ title: "Error", description: "Delete failed", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      apiRequest("PUT", `/api/admin/posts/${id}`, { published }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/posts"] });
      qc.invalidateQueries({ queryKey: ["/api/blog/posts"] });
    },
  });

  const { data: reports = [], isLoading: reportsLoading } = useQuery<CommunityReport[]>({
    queryKey: ["/api/admin/community/reports"],
    enabled: authed === true,
    queryFn: () => fetch("/api/admin/community/reports").then((r) => {
      if (!r.ok) throw new Error("Unauthorized");
      return r.json();
    }),
  });

  const { data: members = [], isLoading: membersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    enabled: authed === true,
    queryFn: () => fetch("/api/admin/users").then((r) => {
      if (!r.ok) throw new Error("Unauthorized");
      return r.json();
    }),
  });

  const removePostMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/admin/community/posts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/community/reports"] });
      qc.invalidateQueries({ queryKey: ["/api/community/posts"] });
      toast({ title: "Post removed", description: "The community post is no longer public." });
    },
    onError: () => toast({ title: "Error", description: "Could not remove post", variant: "destructive" }),
  });

  async function logout() {
    await apiRequest("POST", "/api/admin/logout");
    setAuthed(false);
  }

  function handleSave(data: any, _publish: boolean) {
    saveMutation.mutate({ id: editingPost?.id, body: data });
  }

  if (authed === null) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground text-sm">Loading…</div>;
  }
  if (!authed) {
    return <LoginScreen onLogin={() => setAuthed(true)} />;
  }

  const filtered = posts.filter((p) =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) ||
    (p.country ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const published = posts.filter((p) => p.published).length;
  const drafts = posts.length - published;

  if (view === "new") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <PostEditor
            initial={blankPost()}
            onSave={handleSave}
            onCancel={() => setView("list")}
          />
        </div>
      </div>
    );
  }

  if (view === "edit" && editingPost) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <PostEditor
            initial={editingPost}
            onSave={handleSave}
            onCancel={() => setView("list")}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-serif)" }}>
              🏔️ Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Himal to Horizon · Blog Management</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Globe className="h-4 w-4" /> View site
            </Link>
            <button onClick={logout} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1" data-testid="button-admin-logout">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: <BookOpen className="h-5 w-5" />, label: "Total posts", value: posts.length },
            { icon: <Eye className="h-5 w-5" />, label: "Published", value: published },
            { icon: <EyeOff className="h-5 w-5" />, label: "Drafts", value: drafts },
            { icon: <Users className="h-5 w-5" />, label: "Members", value: members.length },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/60 bg-card/60 p-4 flex items-center gap-3">
              <span className="text-primary">{s.icon}</span>
              <div>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4">
          <Input
            placeholder="Search posts by title or country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
            data-testid="input-admin-search"
          />
          <Button
            onClick={() => { setEditingPost(null); setView("new"); }}
            className="ml-auto gap-1.5"
            data-testid="button-new-post"
          >
            <Plus className="h-4 w-4" /> New post
          </Button>
        </div>

        {/* Post list */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading posts…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            {search ? "No posts match your search." : "No posts yet. Create your first one!"}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/40 hover:bg-card/70 transition-colors"
                data-testid={`admin-post-${post.id}`}
              >
                <span className="text-2xl shrink-0 mt-0.5">{post.hero_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-foreground truncate">{post.title}</span>
                    {post.featured && <Star className="h-3.5 w-3.5 text-yellow-400 shrink-0" />}
                    <Badge variant={post.published ? "default" : "secondary"} className="text-xs shrink-0">
                      {post.published ? "Live" : "Draft"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    {post.country && <span>{post.country}</span>}
                    {post.continent && <span>{post.continent}</span>}
                    <span>{post.category}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{post.reading_time_mins}m</span>
                    <span className="font-mono opacity-60">/blog/{post.slug}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    title={post.published ? "Unpublish" : "Publish"}
                    onClick={() => toggleMutation.mutate({ id: post.id, published: !post.published })}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    data-testid={`button-toggle-${post.id}`}
                  >
                    {post.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <a
                    href={`/blog/${post.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title="Preview post"
                    data-testid={`link-preview-${post.id}`}
                  >
                    <Globe className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => { setEditingPost(post); setView("edit"); }}
                    className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    data-testid={`button-edit-${post.id}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${post.title}"? This cannot be undone.`)) {
                        deleteMutation.mutate(post.id);
                      }
                    }}
                    className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                    data-testid={`button-delete-${post.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Members */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>Members</h2>
            {members.length > 0 && <Badge variant="secondary" className="text-xs">{members.length}</Badge>}
          </div>
          {membersLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading members…</div>
          ) : members.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border/60 bg-card/40">
              No signed-up members yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
              <table className="w-full text-sm" data-testid="table-members">
                <thead>
                  <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Joined</th>
                    <th className="px-4 py-3 font-medium text-center" title="Posts"><FileText className="h-3.5 w-3.5 inline" /></th>
                    <th className="px-4 py-3 font-medium text-center" title="Comments"><MessageSquare className="h-3.5 w-3.5 inline" /></th>
                    <th className="px-4 py-3 font-medium text-center" title="Reports filed"><Flag className="h-3.5 w-3.5 inline" /></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-border/40 last:border-0 hover:bg-muted/30" data-testid={`row-member-${m.id}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground" data-testid={`text-member-name-${m.id}`}>
                            {m.name || "—"}
                          </span>
                          {m.emailVerified && (
                            <span title="Email verified"><BadgeCheck className="h-3.5 w-3.5 text-emerald-400" /></span>
                          )}
                          {m.hasGoogle && (
                            <span title="Google account"><SiGoogle className="h-3 w-3 text-muted-foreground" /></span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5" data-testid={`text-member-email-${m.id}`}>{m.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(m.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </td>
                      <td className="px-4 py-3 text-center font-mono" data-testid={`text-member-posts-${m.id}`}>{m.postCount}</td>
                      <td className="px-4 py-3 text-center font-mono" data-testid={`text-member-comments-${m.id}`}>{m.commentCount}</td>
                      <td className="px-4 py-3 text-center font-mono" data-testid={`text-member-reports-${m.id}`}>{m.reportCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Community moderation */}
        <div className="mt-12">
          <div className="flex items-center gap-2 mb-4">
            <Flag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-serif)" }}>Community moderation</h2>
            {reports.length > 0 && <Badge variant="secondary" className="text-xs">{reports.length}</Badge>}
          </div>
          {reportsLoading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Loading reports…</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm rounded-xl border border-border/60 bg-card/40">
              No reported posts. All clear.
            </div>
          ) : (
            <div className="space-y-2">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card/40"
                  data-testid={`report-${r.id}`}
                >
                  <Flag className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">{r.postTitle ?? `Post #${r.postId}`}</span>
                      {r.postStatus === "removed" && <Badge variant="secondary" className="text-xs shrink-0">Removed</Badge>}
                      {r.countryName && <span className="text-xs text-muted-foreground">{r.countryName}</span>}
                    </div>
                    {r.reason && <p className="text-sm text-muted-foreground mt-1">“{r.reason}”</p>}
                    <p className="text-xs text-muted-foreground/60 mt-1">Reported by user #{r.userId}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/community/post/${r.postId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                      title="View post"
                      data-testid={`link-view-report-${r.id}`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    {r.postStatus !== "removed" && (
                      <button
                        onClick={() => { if (confirm("Remove this community post from public view?")) removePostMutation.mutate(r.postId); }}
                        disabled={removePostMutation.isPending}
                        className="p-2 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-400"
                        title="Remove post"
                        data-testid={`button-remove-report-${r.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
