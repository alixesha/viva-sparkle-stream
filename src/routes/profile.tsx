import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { UserAvatar } from "@/components/common/UserAvatar";
import { EmptyState } from "@/components/common/States";
import { useAuth } from "@/hooks/useAuth";
import { compact } from "@/lib/format";

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
  const { profile, wallet, session } = useAuth();

  if (!session) {
    return (
      <AppShell header={<PageHeader title="Profile" back={false} />}>
        <EmptyState icon="👤" title="Sign in to continue" description="Create an account to follow hosts and send gifts." />
      </AppShell>
    );
  }

  return (
    <AppShell header={<PageHeader title="Profile" back={false} />}>
      <div className="flex flex-col items-center gap-3 rounded-3xl glass p-6 text-center">
        <UserAvatar size="xl" src={profile?.avatar_url} name={profile?.display_name} ring />
        <div>
          <p className="text-lg font-bold">{profile?.display_name ?? "New user"}</p>
          <p className="text-sm text-muted-foreground">@{profile?.username ?? "…"}</p>
        </div>
        <div className="grid w-full grid-cols-3 gap-2 text-sm">
          <Stat label="Followers" value={compact(profile?.followers_count ?? 0)} />
          <Stat label="Following" value={compact(profile?.following_count ?? 0)} />
          <Stat label="Coins" value={compact(wallet?.coins ?? 0)} />
        </div>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-2 py-3">
      <p className="font-bold">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}