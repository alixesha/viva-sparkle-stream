import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  country: string;
  language: string;
  gender: string;
  level: number;
  xp: number;
  badges: string[];
  followers_count: number;
  following_count: number;
  is_suspended: boolean;
}

export interface Wallet {
  coins: number;
  diamonds: number;
  total_coins_purchased: number;
  total_coins_spent: number;
  total_diamonds_earned: number;
  total_withdrawn: number;
}

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  wallet: Wallet | null;
  isAdmin: boolean;
  isHost: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile(null);
      setWallet(null);
      setIsAdmin(false);
      setIsHost(false);
      return;
    }
    const [p, w, r, h] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("wallets").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("hosts").select("status").eq("user_id", userId).maybeSingle(),
    ]);
    setProfile((p.data as Profile | null) ?? null);
    setWallet((w.data as Wallet | null) ?? null);
    setIsAdmin(Boolean(r.data?.some((row) => row.role === "admin")));
    setIsHost(h.data?.status === "active");
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === "SIGNED_OUT") {
        setProfile(null);
        setWallet(null);
        setIsAdmin(false);
        setIsHost(false);
      } else if (next?.user) {
        void load(next.user.id);
      }
    });

    void (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await load(data.session?.user.id);
      setLoading(false);
    })();

    return () => sub.subscription.unsubscribe();
  }, [load]);

  // keep presence fresh
  useEffect(() => {
    const uid = session?.user.id;
    if (!uid) return;
    const ping = () =>
      void supabase
        .from("profiles")
        .update({ is_online: true, last_seen_at: new Date().toISOString() })
        .eq("id", uid);
    ping();
    const t = setInterval(ping, 120_000);
    return () => clearInterval(t);
  }, [session?.user.id]);

  const refresh = useCallback(async () => {
    await load(session?.user.id);
  }, [load, session?.user.id]);

  const signOut = useCallback(async () => {
    const uid = session?.user.id;
    if (uid) {
      await supabase.from("profiles").update({ is_online: false }).eq("id", uid);
    }
    await supabase.auth.signOut();
  }, [session?.user.id]);

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      wallet,
      isAdmin,
      isHost,
      loading,
      refresh,
      signOut,
    }),
    [session, profile, wallet, isAdmin, isHost, loading, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}