import { useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  LogOut,
  Pencil,
  Radio,
  Shield,
  Trophy,
  UserPlus,
  Wallet as WalletIcon,
} from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { UserAvatar } from "@/components/common/UserAvatar";
import { EmptyState } from "@/components/common/States";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { compact, full, COUNTRIES, LANGUAGES, GENDERS } from "@/lib/format";
import { uploadUserFile } from "@/lib/media";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your profile — VIVA LIVE" },
      { name: "description", content: "Manage your VIVA LIVE profile, wallet and host application." },
      { property: "og:title", content: "Your profile — VIVA LIVE" },
      { property: "og:description", content: "Manage your profile, wallet and host status." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, wallet, session, user, isAdmin, isHost, refresh, signOut } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [country, setCountry] = useState(profile?.country ?? "Other");
  const [language, setLanguage] = useState(profile?.language ?? "en");
  const [gender, setGender] = useState(profile?.gender ?? "unspecified");
  const [saving, setSaving] = useState(false);

  if (!session) {
    return (
      <AppShell header={<PageHeader title="Profile" back={false} />}>
        <EmptyState icon="👤" title="Sign in to continue" description="Create an account to follow hosts and send gifts." />
      </AppShell>
    );
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ref = await uploadUserFile("avatars", user.id, file);
      const { error } = await supabase.from("profiles").update({ avatar_url: ref }).eq("id", user.id);
      if (error) throw error;
      await refresh();
      toast.success("Avatar updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function openEdit() {
    setDisplayName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
    setCountry(profile?.country ?? "Other");
    setLanguage(profile?.language ?? "en");
    setGender(profile?.gender ?? "unspecified");
    setEditOpen(true);
  }

  async function saveEdits() {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || profile?.username || "User",
          bio: bio.slice(0, 300),
          country,
          language,
          gender,
        })
        .eq("id", user.id);
      if (error) throw error;
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ["public-profile"] });
      toast.success("Profile updated");
      setEditOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    toast.success("Signed out");
  }

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const nextLevel = 100 * level * level;
  const xpPct = nextLevel > 0 ? Math.min(100, (xp / nextLevel) * 100) : 0;

  return (
    <AppShell header={<PageHeader title="Profile" back={false} />}>
      <div className="space-y-4">
        <div className="flex flex-col items-center gap-3 rounded-3xl glass p-6 text-center">
          <div className="relative">
            <UserAvatar size="xl" src={profile?.avatar_url} name={profile?.display_name} ring />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full brand-gradient text-primary-foreground tap"
              aria-label="Change avatar"
            >
              <Pencil className="size-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleAvatarChange(e)} />
          </div>

          <div>
            <p className="text-lg font-bold">{profile?.display_name ?? "New user"}</p>
            <p className="text-sm text-muted-foreground">@{profile?.username ?? "…"}</p>
          </div>

          {profile?.badges && profile.badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1">
              {profile.badges.map((b) => (
                <span key={b} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold">
                  {b}
                </span>
              ))}
            </div>
          )}

          <div className="w-full space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Level {level}</span>
              <span>{full(xp)} / {full(nextLevel)} XP</span>
            </div>
            <Progress value={xpPct} className="h-1.5" />
          </div>

          {profile?.bio && <p className="text-sm text-muted-foreground">{profile.bio}</p>}

          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="rounded-full gap-1.5" onClick={openEdit}>
                <Pencil className="size-3.5" /> Edit profile
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Display name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
                </div>
                <div className="space-y-1.5">
                  <Label>Bio</Label>
                  <Textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={300} />
                </div>
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Gender</Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDERS.map((g) => (
                        <SelectItem key={g} value={g} className="capitalize">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => void saveEdits()} disabled={saving} className="w-full rounded-full">
                  {saving ? "Saving…" : "Save changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-4 gap-2 text-sm">
          <Stat label="Followers" value={compact(profile?.followers_count ?? 0)} />
          <Stat label="Following" value={compact(profile?.following_count ?? 0)} />
          <Stat label="Coins" value={compact(wallet?.coins ?? 0)} />
          <Stat label="Diamonds" value={compact(wallet?.diamonds ?? 0)} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <QuickLink to="/wallet" icon={<WalletIcon className="size-4" />} label="Wallet" />
          {isHost && <QuickLink to="/host" icon={<Radio className="size-4" />} label="Host dashboard" />}
          {!isHost && <QuickLink to="/host-apply" icon={<UserPlus className="size-4" />} label="Become a host" />}
          <QuickLink to="/rankings" icon={<Trophy className="size-4" />} label="Rankings" />
          <QuickLink to="/notifications" icon={<Bell className="size-4" />} label="Notifications" />
          <QuickLink to="/agency" icon={<Building2 className="size-4" />} label="Agency" />
          {isAdmin && <QuickLink to="/admin" icon={<Shield className="size-4" />} label="Admin" />}
        </div>

        <ConfirmDialog
          trigger={
            <Button variant="secondary" className="w-full gap-2 rounded-full text-destructive">
              <LogOut className="size-4" /> Sign out
            </Button>
          }
          title="Sign out?"
          description="You can sign back in anytime."
          confirmLabel="Sign out"
          destructive
          onConfirm={() => void handleSignOut()}
        />
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-2 py-3 text-center">
      <p className="font-bold coin-text">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-2xl glass p-3 text-sm font-semibold tap">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2">{icon}</span>
      <span className="min-w-0 truncate">{label}</span>
    </Link>
  );
}
