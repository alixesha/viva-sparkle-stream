import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { compact, COUNTRIES } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — VIVA LIVE" },
      { name: "description", content: "See the top gifters and top hosts on VIVA LIVE." },
      { property: "og:title", content: "Rankings — VIVA LIVE" },
      { property: "og:description", content: "Top gifters and top hosts leaderboard." },
    ],
  }),
  component: RankingsPage,
});

type Kind = "gifters" | "hosts";
type Period = "daily" | "weekly" | "monthly" | "all-time";

interface RankRow {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  score: number;
  country: string;
}

const PERIODS: { value: Period; label: string }[] = [
  { value: "daily", label: "Today" },
  { value: "weekly", label: "This week" },
  { value: "monthly", label: "This month" },
  { value: "all-time", label: "All-time" },
];

function RankingsPage() {
  const [kind, setKind] = useState<Kind>("gifters");
  const [period, setPeriod] = useState<Period>("weekly");
  const [country, setCountry] = useState<string>("all");

  const rankQuery = useQuery({
    queryKey: ["rankings", kind, period, country],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_rankings", {
        _kind: kind,
        _period: period,
        _country: country === "all" ? undefined : country,
        _limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as RankRow[];
    },
  });

  const rows = rankQuery.data ?? [];
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const scoreLabel = kind === "gifters" ? "coins" : "diamonds";

  return (
    <AppShell header={<PageHeader title="Rankings" back={false} />}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {(["gifters", "hosts"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full py-2 text-sm font-bold capitalize tap",
                kind === k ? "brand-gradient text-primary-foreground" : "glass",
              )}
            >
              Top {k === "gifters" ? "Gifters" : "Hosts"}
            </button>
          ))}
        </div>

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold tap",
                period === p.value ? "brand-gradient text-primary-foreground" : "glass",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="rounded-full text-xs">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {COUNTRIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {rankQuery.isLoading ? (
          <RowSkeletonList count={6} />
        ) : rankQuery.isError ? (
          <ErrorState retry={() => void rankQuery.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon="🏆" title="No rankings yet" description="Check back once activity picks up." />
        ) : (
          <>
            {podium.length > 0 && (
              <div className="flex items-end justify-center gap-3 rounded-3xl glass px-3 py-6">
                {[podium[1], podium[0], podium[2]].map((p, i) =>
                  p ? (
                    <PodiumSpot key={p.user_id} row={p} place={i === 1 ? 1 : i === 0 ? 2 : 3} scoreLabel={scoreLabel} />
                  ) : (
                    <div key={i} className="w-20" />
                  ),
                )}
              </div>
            )}
            <div className="space-y-2">
              {rest.map((r, i) => (
                <Link
                  key={r.user_id}
                  to="/u/$username"
                  params={{ username: r.username }}
                  className="flex items-center gap-3 rounded-2xl glass p-2.5 tap"
                >
                  <span className="w-6 shrink-0 text-center text-sm font-bold text-muted-foreground">{i + 4}</span>
                  <UserAvatar src={r.avatar_url} name={r.display_name} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.display_name}</p>
                    <p className="text-xs text-muted-foreground">Lv.{r.level}</p>
                  </div>
                  <span className="shrink-0 text-sm font-bold coin-text">
                    {compact(r.score)} {scoreLabel}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function PodiumSpot({ row, place, scoreLabel }: { row: RankRow; place: 1 | 2 | 3; scoreLabel: string }) {
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  return (
    <Link
      to="/u/$username"
      params={{ username: row.username }}
      className={cn("flex flex-col items-center gap-1 tap", place === 1 && "-translate-y-3")}
    >
      <span className="text-xl">{medal}</span>
      <UserAvatar src={row.avatar_url} name={row.display_name} size={place === 1 ? "xl" : "lg"} ring />
      <p className="max-w-20 truncate text-xs font-bold">{row.display_name}</p>
      <p className="text-[10px] text-muted-foreground">{compact(row.score)} {scoreLabel}</p>
    </Link>
  );
}
