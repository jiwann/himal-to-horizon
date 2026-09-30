import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Languages, Flag, Trash2, X, MessageCircle, Send, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { setSEO, resetSEO } from "@/lib/seo";
import { countryFlag, timeAgo, isTranslatableLang } from "@/lib/community";
import { CommunityHeader, StarRating, TypeBadge, VisaOutcomeBadge, LikeButton, COMMUNITY_BG } from "@/components/community-shared";
import type { CommunityPost, CommunityPostTranslation, CommunityComment } from "@shared/schema";

export default function CommunityPostPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showOriginal, setShowOriginal] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [commentBody, setCommentBody] = useState("");

  const { data, isLoading } = useQuery<{ post: CommunityPost; canTranslate: boolean }>({
    queryKey: ["/api/community/posts", id],
    enabled: Number.isFinite(id),
  });

  const { data: comments, isLoading: commentsLoading } = useQuery<CommunityComment[]>({
    queryKey: ["/api/community/posts", id, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/community/posts/${id}/comments`);
      if (!res.ok) throw new Error("Failed to load comments");
      return res.json();
    },
    enabled: Number.isFinite(id),
  });

  const { data: adminMe } = useQuery<{ authenticated: boolean }>({
    queryKey: ["/api/admin/me"],
    queryFn: async () => {
      const res = await fetch("/api/admin/me");
      if (!res.ok) return { authenticated: false };
      return res.json();
    },
  });
  const isAdmin = !!adminMe?.authenticated;

  const post = data?.post;
  const canOfferTranslation =
    !!post && !!data?.canTranslate && language !== post.originalLang && isTranslatableLang(language);

  const { data: translationData, isFetching: translating, isError: translationFailed } = useQuery<{ translation: CommunityPostTranslation }>({
    queryKey: [`/api/community/posts/${id}/translate?lang=${language}`],
    enabled: canOfferTranslation,
    retry: false,
  });

  // When the page language changes, default back to showing the translation.
  useEffect(() => {
    setShowOriginal(false);
  }, [language]);

  useEffect(() => {
    if (post) {
      setSEO({
        title: `${post.title} — ${post.countryName} Travel Story`,
        description: post.story ? post.story.slice(0, 155) : `Traveler recommendations for ${post.countryName} by ${post.authorName}.`,
        path: `/community/post/${post.id}`,
        type: "article",
        article: { publishedTime: post.createdAt, section: post.countryName },
      });
    }
    return () => resetSEO();
  }, [post]);

  const deleteMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/community/posts/${id}`),
    onSuccess: () => {
      toast({ title: "Post deleted" });
      qc.invalidateQueries({ queryKey: ["/api/community/posts"] });
      setLocation("/community");
    },
    onError: () => toast({ title: "Could not delete post", variant: "destructive" }),
  });

  const reportMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/posts/${id}/report`, { reason: reportReason }),
    onSuccess: () => {
      setReportOpen(false);
      setReportReason("");
      toast({ title: "Report submitted", description: "Thanks — our team will review this post." });
    },
    onError: () => toast({ title: "Could not submit report", variant: "destructive" }),
  });

  const addCommentMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/posts/${id}/comments`, { body: commentBody.trim() }),
    onSuccess: () => {
      setCommentBody("");
      qc.invalidateQueries({ queryKey: ["/api/community/posts", id, "comments"] });
    },
    onError: (e: any) => toast({ title: "Could not post comment", description: e?.message?.replace(/^\d+:\s*/, "") ?? "", variant: "destructive" }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) => apiRequest("DELETE", `/api/community/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/community/posts", id, "comments"] });
    },
    onError: () => toast({ title: "Could not delete comment", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COMMUNITY_BG }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: "hsl(22 79% 75%)" }} />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen" style={{ background: COMMUNITY_BG }}>
        <CommunityHeader />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <p className="text-foreground font-semibold">Post not found</p>
          <Button variant="ghost" className="mt-4" onClick={() => setLocation("/community")}>Back to community</Button>
        </div>
      </div>
    );
  }

  const tr = canOfferTranslation && !showOriginal ? translationData?.translation : undefined;
  const displayTitle = tr?.title ?? post.title;
  const displayStory = tr?.story ?? post.story;
  const isOwner = !!user && user.id === post.userId;

  return (
    <div className="min-h-screen" style={{ background: COMMUNITY_BG }}>
      <CommunityHeader />
      <article className="max-w-2xl mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => setLocation(`/community/${post.countryCode}`)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-3"
          data-testid="link-destination"
        >
          <span>{countryFlag(post.countryCode)}</span>
          <MapPin className="h-3 w-3" />
          {post.city ? `${post.city}, ${post.countryName}` : post.countryName}
        </button>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <TypeBadge post={post} />
          {post.type === "recommendation" && post.rating != null && <StarRating value={post.rating} />}
          {post.type === "visa_experience" && post.visaOutcome && <VisaOutcomeBadge outcome={post.visaOutcome} />}
        </div>

        <h1 className="text-2xl font-bold text-foreground leading-tight" data-testid="text-post-title">{displayTitle}</h1>

        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground/80">{post.authorName}</span>
          <span className="opacity-30">·</span>
          <span>{timeAgo(post.createdAt)}</span>
          <span className="opacity-30">·</span>
          <LikeButton post={post} size="md" />
        </div>

        {/* Translate / actions */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {canOfferTranslation && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOriginal((s) => !s)}
              disabled={translating || (!translationData && !translationFailed && !showOriginal)}
              data-testid="button-translate"
            >
              {translating ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Languages className="h-3.5 w-3.5 mr-1.5" />}
              {translating ? "Translating…" : showOriginal ? "See translation" : "See original"}
            </Button>
          )}
          {canOfferTranslation && tr && !showOriginal && (
            <span className="text-xs text-muted-foreground">Translated · machine translation</span>
          )}
          {canOfferTranslation && translationFailed && !showOriginal && (
            <span className="text-xs text-muted-foreground">Couldn't translate — showing original</span>
          )}
          <div className="ml-auto flex items-center gap-2">
            {user && !isOwner && (
              <Button variant="ghost" size="sm" onClick={() => setReportOpen(true)} data-testid="button-report">
                <Flag className="h-3.5 w-3.5 mr-1.5" /> Report
              </Button>
            )}
            {(isOwner || isAdmin) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(`/community/edit/${post.id}`)}
                data-testid="button-edit"
              >
                <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
              </Button>
            )}
            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => { if (confirm("Delete this post? This cannot be undone.")) deleteMutation.mutate(); }}
                disabled={deleteMutation.isPending}
                data-testid="button-delete"
              >
                {deleteMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Photos */}
        {post.photos.length > 0 && (
          <div className={`grid gap-2 mt-5 ${post.photos.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {post.photos.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${post.title} photo ${i + 1}`}
                loading="lazy"
                className="w-full rounded-xl object-cover"
                style={{ maxHeight: post.photos.length === 1 ? 420 : 220 }}
                data-testid={`img-photo-${i}`}
              />
            ))}
          </div>
        )}

        {/* Story */}
        {post.type === "visa_experience" && post.processingTimeReported && (
          <p className="mt-4 text-xs text-muted-foreground" data-testid="text-processing-time-reported">
            Reported processing time: <span className="font-semibold text-foreground/80">{post.processingTimeReported}</span>
          </p>
        )}
        {displayStory && (
          <div className="mt-5 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap" data-testid="text-story">
            {displayStory}
          </div>
        )}

        {!user && (
          <div className="mt-8 rounded-xl border border-border/30 bg-card/40 p-4 text-center">
            <p className="text-sm text-muted-foreground">Have your own tips for {post.countryName}?</p>
            <Button className="mt-2 font-bold" style={{ background: "hsl(22 79% 75%)", color: "#000" }} onClick={() => setLocation("/profile")} data-testid="button-signin-to-post">
              Sign in to share
            </Button>
          </div>
        )}

        {/* Comments */}
        <section className="mt-10 border-t border-border/30 pt-6" data-testid="section-comments">
          <h2 className="flex items-center gap-2 text-lg font-bold" style={{ fontFamily: "Satoshi, sans-serif" }}>
            <MessageCircle className="h-5 w-5" style={{ color: "hsl(22 79% 75%)" }} />
            Comments
            {comments && comments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground" data-testid="text-comment-count">({comments.length})</span>
            )}
          </h2>

          {user ? (
            <div className="mt-4">
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Ask a question or share your thoughts…"
                rows={3}
                maxLength={2000}
                className="resize-none"
                data-testid="input-comment"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  onClick={() => addCommentMutation.mutate()}
                  disabled={!commentBody.trim() || addCommentMutation.isPending}
                  className="font-bold"
                  style={{ background: "hsl(22 79% 75%)", color: "#000" }}
                  data-testid="button-submit-comment"
                >
                  {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span className="ml-2">Post comment</span>
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground" data-testid="text-comment-signin">
              <button className="underline hover:text-foreground" onClick={() => setLocation("/profile")} data-testid="link-comment-signin">Sign in</button> to join the conversation.
            </p>
          )}

          <div className="mt-6 space-y-4">
            {commentsLoading ? (
              <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
            ) : comments && comments.length > 0 ? (
              comments.map((c) => (
                <div key={c.id} className="rounded-xl border border-border/30 bg-card/40 p-4" data-testid={`comment-${c.id}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-foreground" data-testid={`text-comment-author-${c.id}`}>{c.authorName}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{timeAgo(c.createdAt)}</span>
                    </div>
                    {((user && user.id === c.userId) || isAdmin) && (
                      <button
                        onClick={() => deleteCommentMutation.mutate(c.id)}
                        disabled={deleteCommentMutation.isPending}
                        className="text-muted-foreground hover:text-destructive"
                        title="Delete comment"
                        data-testid={`button-delete-comment-${c.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap" data-testid={`text-comment-body-${c.id}`}>{c.body}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground" data-testid="text-no-comments">No comments yet. Be the first to weigh in.</p>
            )}
          </div>
        </section>
      </article>

      {/* Report dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this post</DialogTitle>
            <DialogDescription>Tell us what's wrong so our team can review it.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder="Reason (optional) — e.g. spam, offensive content, wrong information"
            rows={4}
            data-testid="input-report-reason"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}><X className="h-4 w-4 mr-1.5" />Cancel</Button>
            <Button onClick={() => reportMutation.mutate()} disabled={reportMutation.isPending} data-testid="button-submit-report">
              {reportMutation.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Flag className="h-4 w-4 mr-1.5" />}
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
