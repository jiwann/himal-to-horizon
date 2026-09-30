import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Star, MapPin, ArrowLeft, PenLine, BookOpen, Heart, MessageCircle, Stamp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import logoImg from "@/assets/logo.png";
import { CATEGORY_META, VISA_OUTCOME_META, countryFlag, timeAgo } from "@/lib/community";
import { communityUI, categoryUIKey, outcomeUIKey } from "@/lib/community-ui-i18n";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CommunityPost, RecommendationCategory, VisaOutcome } from "@shared/schema";

const BG = "#060D17";
const AMBER = "hsl(22 79% 75%)";

export function CommunityHeader({ showCompose = true }: { showCompose?: boolean }) {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const cui = communityUI(language);
  return (
    <header
      className="sticky top-0 z-40 border-b"
      style={{ background: "rgba(6,13,23,0.95)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()} data-testid="button-back">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <button
          type="button"
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 mr-auto"
          data-testid="link-home"
        >
          <img src={logoImg} alt="Himal to Horizon" className="h-7 w-auto" />
        </button>
        {showCompose && (
          <Button
            onClick={() => setLocation("/community/new")}
            className="font-bold"
            style={{ background: AMBER, color: "#000" }}
            data-testid="button-share-story"
          >
            <PenLine className="h-4 w-4 mr-1.5" />
            {cui("cta_share")}
          </Button>
        )}
      </div>
    </header>
  );
}

export function StarRating({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          style={{ width: size, height: size }}
          className={n <= value ? "fill-current" : ""}
          color={n <= value ? "hsl(42 90% 65%)" : "rgba(255,255,255,0.25)"}
          fill={n <= value ? "hsl(42 90% 65%)" : "none"}
        />
      ))}
    </span>
  );
}

export function CategoryBadge({ category }: { category: RecommendationCategory }) {
  const { language } = useLanguage();
  const meta = CATEGORY_META[category];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color: meta.color, background: `${meta.color}1a` }}
    >
      <Icon style={{ width: 11, height: 11 }} />
      {communityUI(language)(categoryUIKey(category))}
    </span>
  );
}

export function TypeBadge({ post }: { post: CommunityPost }) {
  const { language } = useLanguage();
  if (post.type === "recommendation" && post.category) {
    return <CategoryBadge category={post.category} />;
  }
  if (post.type === "visa_experience") {
    return (
      <span
        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
        style={{ color: "hsl(205 80% 68%)", background: "hsl(205 80% 68% / 0.12)" }}
      >
        <Stamp style={{ width: 11, height: 11 }} />
        {communityUI(language)("type_visa_experience")}
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color: AMBER, background: "hsl(22 79% 75% / 0.12)" }}
    >
      <BookOpen style={{ width: 11, height: 11 }} />
      {communityUI(language)("type_story")}
    </span>
  );
}

// A self-reported visa outcome badge (approved/denied/more-info-requested/
// pending) shown next to TypeBadge on a "visa_experience" post -- mirrors
// how StarRating sits next to TypeBadge on a "recommendation" post.
export function VisaOutcomeBadge({ outcome }: { outcome: VisaOutcome }) {
  const { language } = useLanguage();
  const meta = VISA_OUTCOME_META[outcome];
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className="inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded"
      style={{ color: meta.color, background: `${meta.color}1a` }}
      data-testid={`badge-outcome-${outcome}`}
    >
      <Icon style={{ width: 12, height: 12 }} />
      {communityUI(language)(outcomeUIKey(outcome))}
    </span>
  );
}

export function LikeButton({ post, size = "sm" }: { post: CommunityPost; size?: "sm" | "md" }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [liked, setLiked] = useState(post.likedByMe);
  const [count, setCount] = useState(post.likeCount);

  useEffect(() => {
    setLiked(post.likedByMe);
    setCount(post.likeCount);
  }, [post.id, post.likedByMe, post.likeCount]);

  const mut = useMutation({
    mutationFn: () => apiRequest("POST", `/api/community/posts/${post.id}/like`),
    onSuccess: async (res) => {
      const data = await res.json();
      setLiked(data.liked);
      setCount(data.likeCount);
    },
    onError: () => {
      setLiked(post.likedByMe);
      setCount(post.likeCount);
      toast({ title: "Couldn't update like", description: "Please try again.", variant: "destructive" });
    },
  });

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in to like posts", description: "Log in to react to traveler stories." });
      return;
    }
    setLiked((p) => !p);
    setCount((c) => (liked ? c - 1 : c + 1));
    mut.mutate();
  };

  const iconSize = size === "md" ? 18 : 14;
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={`button-like-${post.id}`}
      aria-pressed={liked}
      className="inline-flex items-center gap-1.5 transition-colors"
      style={{ color: liked ? "hsl(352 80% 62%)" : "rgba(255,255,255,0.55)" }}
    >
      <Heart style={{ width: iconSize, height: iconSize }} fill={liked ? "currentColor" : "none"} />
      <span className={size === "md" ? "text-sm font-semibold" : "text-[11px] font-semibold"} data-testid={`text-like-count-${post.id}`}>
        {count}
      </span>
    </button>
  );
}

export function PostCard({ post }: { post: CommunityPost }) {
  const [, setLocation] = useLocation();
  const cover = post.photos[0];
  const isRec = post.type === "recommendation";
  const go = () => setLocation(`/community/post/${post.id}`);
  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`card-post-${post.id}`}
      onClick={go}
      onKeyDown={(e) => { if (e.target !== e.currentTarget) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }}
      className="group text-left w-full cursor-pointer rounded-xl border border-border/30 bg-card/60 hover:bg-card hover:border-border/60 transition-all duration-150 overflow-hidden"
    >
      {cover && (
        <div className="relative w-full overflow-hidden" style={{ height: 150 }}>
          <img
            src={cover}
            alt={post.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ filter: "brightness(0.85)" }}
          />
          {post.photos.length > 1 && (
            <span className="absolute top-2 right-2 text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.6)", color: "#fff" }}>
              +{post.photos.length - 1}
            </span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
          <span>{countryFlag(post.countryCode)}</span>
          <MapPin className="h-3 w-3 opacity-60" />
          <span className="truncate">{post.city ? `${post.city}, ${post.countryName}` : post.countryName}</span>
        </div>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <TypeBadge post={post} />
          {isRec && post.rating != null && <StarRating value={post.rating} />}
          {post.type === "visa_experience" && post.visaOutcome && <VisaOutcomeBadge outcome={post.visaOutcome} />}
        </div>
        <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
          {post.title}
        </h3>
        {post.story && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">{post.story}</p>
        )}
        <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
          <span className="font-medium text-foreground/80">{post.authorName}</span>
          <span className="opacity-30">·</span>
          <span>{timeAgo(post.createdAt)}</span>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/30">
          <LikeButton post={post} />
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.55)" }} data-testid={`text-comment-count-${post.id}`}>
            <MessageCircle style={{ width: 14, height: 14 }} />
            {post.commentCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export const COMMUNITY_BG = BG;
export const COMMUNITY_AMBER = AMBER;
