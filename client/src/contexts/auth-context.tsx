import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@shared/schema";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string; verificationEmailSent?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (updates: { name?: string; homeAirport?: string; homeAirportLabel?: string }) => Promise<{ error?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const signUp = async (email: string, password: string, name?: string) => {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Signup failed" };
    setUser(data.user);
    return { verificationEmailSent: data.verificationEmailSent ?? false };
  };

  const signIn = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Login failed" };
    setUser(data.user);
    return {};
  };

  const signInWithGoogle = () => {
    window.location.href = "/api/auth/google";
  };

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const updateProfile = async (updates: { name?: string; homeAirport?: string; homeAirportLabel?: string }) => {
    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error ?? "Update failed" };
    setUser(data.user);
    return {};
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut, refreshUser, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
