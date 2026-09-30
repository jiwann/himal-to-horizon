import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

export function AuthModal({ open, onClose, defaultTab = "login" }: AuthModalProps) {
  const { t } = useLanguage();
  const { signIn, signUp, signInWithGoogle } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  const { data: config } = useQuery<{ testMode: boolean; googleEnabled: boolean }>({
    queryKey: ["/api/config"],
  });
  const googleEnabled = config?.googleEnabled ?? false;

  const reset = () => {
    setEmail(""); setPassword(""); setName(""); setError(null); setLoading(false); setVerificationSent(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = tab === "login"
        ? await signIn(email, password)
        : await signUp(email, password, name || undefined);
      if (result.error) {
        setError(result.error);
      } else if (tab === "signup" && (result as any).verificationEmailSent) {
        setVerificationSent(true);
      } else {
        reset();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    if (!googleEnabled) return;
    setGoogleLoading(true);
    signInWithGoogle();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose(); } }}>
      <DialogContent
        className="max-w-sm w-full p-0 overflow-hidden border-0"
        aria-describedby={undefined}
        style={{
          background: "hsl(211 60% 8%)",
          border: "1px solid rgba(247,176,136,0.15)",
          borderRadius: "20px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
      >
        <DialogTitle className="sr-only">{t("auth.sign_in")}</DialogTitle>

        {/* Top gradient bar */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(247,176,136,0.6), transparent)" }} />

        <div className="px-8 py-7">
          {/* Logo + heading */}
          <div className="text-center mb-6">
            <div className="font-serif text-xl font-bold mb-1" style={{ color: "#F7B088" }}>
              Himal to Horizon
            </div>
            <h2 className="text-base font-semibold text-foreground">
              {tab === "login" ? t("auth.welcome_back") : t("auth.create_account")}
            </h2>
          </div>

          {/* Verification email sent state */}
          {verificationSent ? (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="w-12 h-12 mx-auto" style={{ color: "#F7B088" }} />
              <div>
                <p className="font-semibold text-foreground mb-1">{t("auth.verify_email_sent_title")}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{t("auth.verify_email_sent_body")}</p>
              </div>
              <button
                type="button"
                onClick={() => { reset(); onClose(); }}
                className="text-xs font-medium px-4 py-2 rounded-lg"
                style={{ background: "rgba(247,176,136,0.15)", color: "#F7B088" }}
              >
                {t("auth.continue_to_app")}
              </button>
            </div>
          ) : (
            <>
              {/* Tab switcher */}
              <div className="flex rounded-xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.04)" }}>
                {(["login", "signup"] as const).map((t2) => (
                  <button
                    key={t2}
                    type="button"
                    data-testid={`auth-tab-${t2}`}
                    onClick={() => { setTab(t2); setError(null); }}
                    className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                    style={{
                      background: tab === t2 ? "rgba(247,176,136,0.18)" : "transparent",
                      color: tab === t2 ? "#F7B088" : "rgba(255,255,255,0.5)",
                    }}
                  >
                    {t2 === "login" ? t("auth.sign_in") : t("auth.sign_up")}
                  </button>
                ))}
              </div>

              {/* Google button */}
              <div className="relative mb-4">
                <button
                  type="button"
                  data-testid="button-google-auth"
                  onClick={handleGoogle}
                  disabled={googleLoading || !googleEnabled}
                  className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: googleEnabled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${googleEnabled ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.06)"}`,
                    color: googleEnabled ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.3)",
                    cursor: googleEnabled ? "pointer" : "not-allowed",
                  }}
                  title={!googleEnabled ? t("auth.google_not_configured") : undefined}
                >
                  {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SiGoogle className="w-4 h-4" />}
                  {t("auth.continue_google")}
                  {!googleEnabled && (
                    <span className="text-[10px] ml-1 opacity-60">{t("auth.coming_soon")}</span>
                  )}
                </button>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {tab === "signup" && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.name_optional")}</Label>
                    <Input
                      data-testid="input-auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("auth.name_placeholder")}
                      className="h-10 text-sm"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.email")}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      data-testid="input-auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="h-10 text-sm pl-9"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">{t("auth.password")}</Label>
                  <div className="relative">
                    <Input
                      data-testid="input-auth-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={tab === "signup" ? t("auth.password_min") : "••••••••"}
                      required
                      className="h-10 text-sm pr-10"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p data-testid="auth-error" className="text-xs text-red-400 text-center py-1">{error}</p>
                )}

                <button
                  type="submit"
                  data-testid="button-auth-submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all mt-1"
                  style={{
                    background: loading ? "rgba(247,176,136,0.5)" : "#F7B088",
                    color: "hsl(211 60% 8%)",
                  }}
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {tab === "login" ? t("auth.sign_in") : t("auth.create_account")}
                </button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-5">
                {tab === "login" ? t("auth.no_account") + " " : t("auth.has_account") + " "}
                <button
                  type="button"
                  data-testid="auth-tab-switch"
                  onClick={() => { setTab(tab === "login" ? "signup" : "login"); setError(null); }}
                  className="font-medium"
                  style={{ color: "#F7B088" }}
                >
                  {tab === "login" ? t("auth.sign_up") : t("auth.sign_in")}
                </button>
              </p>
            </>
          )}
        </div>

        {/* Bottom bar */}
        <div className="h-px w-full" style={{ background: "linear-gradient(90deg, transparent, rgba(247,176,136,0.2), transparent)" }} />
      </DialogContent>
    </Dialog>
  );
}
