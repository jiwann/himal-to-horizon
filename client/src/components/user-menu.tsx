import { useState } from "react";
import { useLocation } from "wouter";
import { User, LogOut, Bell, Star, Home as HomeIcon, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import type { User as UserType } from "@shared/schema";

interface UserMenuProps {
  user: UserType;
}

export function UserMenu({ user }: UserMenuProps) {
  const { t } = useLanguage();
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user.email[0].toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        data-testid="button-user-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all"
        style={{
          background: "rgba(247,176,136,0.1)",
          border: "1px solid rgba(247,176,136,0.2)",
        }}
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "#F7B088", color: "hsl(211 60% 8%)" }}
        >
          {initials}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block max-w-[100px] truncate">
          {user.name ?? user.email.split("@")[0]}
        </span>
        <ChevronDown className="w-3 h-3 text-muted-foreground hidden sm:block" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-52 rounded-xl py-1 z-50"
            style={{
              background: "hsl(211 60% 8%)",
              border: "1px solid rgba(247,176,136,0.15)",
              boxShadow: "0 16px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-sm font-medium text-foreground truncate">{user.name ?? user.email.split("@")[0]}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              {user.homeAirport && (
                <div className="flex items-center gap-1 mt-1">
                  <HomeIcon className="w-3 h-3" style={{ color: "#F7B088" }} />
                  <span className="text-xs" style={{ color: "#F7B088" }}>{user.homeAirport}</span>
                </div>
              )}
            </div>

            {[
              { icon: User, label: t("auth.profile"), action: () => { setOpen(false); setLocation("/profile"); }, testId: "menu-profile" },
              { icon: Bell, label: t("auth.price_alerts"), action: () => { setOpen(false); setLocation("/profile?tab=alerts"); }, testId: "menu-alerts" },
              { icon: Star, label: t("auth.favorite_routes"), action: () => { setOpen(false); setLocation("/profile?tab=favorites"); }, testId: "menu-favorites" },
            ].map(({ icon: Icon, label, action, testId }) => (
              <button
                key={testId}
                type="button"
                data-testid={testId}
                onClick={action}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors"
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                {label}
              </button>
            ))}

            <div className="h-px mx-4 my-1" style={{ background: "rgba(255,255,255,0.06)" }} />

            <button
              type="button"
              data-testid="menu-logout"
              onClick={async () => { setOpen(false); await signOut(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-white/5 transition-colors text-red-400"
            >
              <LogOut className="w-4 h-4" />
              {t("auth.sign_out")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
