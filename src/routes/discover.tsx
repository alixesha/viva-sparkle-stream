import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, CardSkeletonGrid, SectionHeader } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { LiveRoomCard, type LiveRoomCardData } from "@/components/discover/LiveRoomCard";
import { HostCard } from "@/components/discover/HostCard";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, LANGUAGES } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover creators — VIVA LIVE" },
      { name: "description", content: "Search hosts, browse categories and find new live rooms on VIVA LIVE." },
      { property: "og:title", content: "Discover creators — VIVA LIVE" },
      { property: "og:description", content: "Search hosts and browse live categories." },
    ],
  }),
  component: DiscoverPage,
});

type Sort = "trending" | "popular" | "new";

function useDebounced<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return debounced;
}

const ROOM_SELECT =
  "id, title, category, viewer_count, likes_count, diamonds_earned, thumbnail_url, country, language, created_at, host_id, profiles:host_id(username, display_name, avatar_url)";

function DiscoverPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query);
  const [category, setCategory] = useState<string | null>(null);
  const [country, setCountry] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("trending");
  const [minViewers, setMinViewers] = useState<string>("0");

  const categoriesQuery = useQuery({
    queryKey: ["discover-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, icon, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const isSearching = debouncedQuery.trim().length > 0;

  const searchQuery = useQuery({
    queryKey: ["discover-search", debouncedQuery],
    enabled: isSearching,
    queryFn: async () => {
      const term = `%${debouncedQuery.trim()}%`;
      const [hostsRes, roomsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, display_name, avatar_url, level, is_online")
          .or(`username.ilike.${term},display_name.ilike.${term}`)
          .limit(20),
        supabase
          .from("live_rooms")
          .select(ROOM_SELECT)
          .eq("status", "live")
          .ilike("title", term)
          .limit(20),
      ]);
      if (hostsRes.error) throw hostsRes.error;
      if (roomsRes.error) throw roomsRes.error;
      return {
        hosts: hostsRes.data ?? [],
        rooms: (roomsRes.data as unknown as LiveRoomCardData[]) ?? [],
      };
    },
  });

  const roomsQuery = useQuery({
    queryKey: ["discover-rooms", category, country, language, sort, minViewers],
    enabled: !isSearching,
    queryFn: async () => {
      let q = supabase.from("live_rooms").select(ROOM_SELECT).eq("status", "live");
      if (category) q = q.eq("category", category);
      if (country !== "all") q = q.eq("country", country);
      if (language !== "all") q = q.eq("language", language);
      const min = Number(minViewers) || 0;
      if (min > 0) q = q.gte("viewer_count", min);
      if (sort === "trending") q = q.order("viewer_count", { ascending: false });
      else if (sort === "popular") q = q.order("diamonds_earned", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      const { data, error } = await q.limit(40);
      if (error) throw error;
      return (data as unknown as LiveRoomCardData[]) ?? [];
    },
  });

  const newHostsQuery = useQuery({
    queryKey: ["discover-new-hosts"],
    enabled: !isSearching,
    queryFn: async () => {
      const { data: hostRows, error } = await supabase
        .from("hosts")
        .select("user_id, created_at")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      const ids = (hostRows ?? []).map((h) => h.user_id);
      if (ids.length === 0) return [];
      const { data: profs, error: profErr } = await supabase
        .from("profiles")
        .select("id, username, display_name, avatar_url, level, is_online")
        .in("id", ids);
      if (profErr) throw profErr;
      const order = new Map(ids.map((id, i) => [id, i]));
      return (profs ?? []).slice().sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    },
  });

  return (
    <AppShell header={<PageHeader title="Discover" back={false} />}>
      <div className="space-y-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hosts or live rooms"
            className="rounded-full pl-9 pr-9"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {isSearching ? (
          <SearchResults query={searchQuery} />
        ) : (
          <>
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              {(["trending", "popular", "new"] as Sort[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={cn(
                    "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold capitalize tap",
                    sort === s ? "brand-gradient text-primary-foreground" : "glass",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <button
                onClick={() => setCategory(null)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold tap",
                  category === null ? "brand-gradient text-primary-foreground" : "glass",
                )}
              >
                All
              </button>
              {categoriesQuery.data?.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold tap",
                    category === c.slug ? "brand-gradient text-primary-foreground" : "glass",
                  )}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2">
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
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="rounded-full text-xs">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minViewers} onValueChange={setMinViewers}>
                <SelectTrigger className="rounded-full text-xs">
                  <SelectValue placeholder="Min viewers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any viewers</SelectItem>
                  <SelectItem value="10">10+</SelectItem>
                  <SelectItem value="50">50+</SelectItem>
                  <SelectItem value="100">100+</SelectItem>
                  <SelectItem value="500">500+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newHostsQuery.data && newHostsQuery.data.length > 0 && (
              <section>
                <SectionHeader title="New hosts" />
                <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
                  {newHostsQuery.data.map((p) => (
                    <HostCard key={p.id} host={p} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionHeader title="Live rooms" />
              {roomsQuery.isLoading ? (
                <CardSkeletonGrid count={6} />
              ) : roomsQuery.isError ? (
                <ErrorState retry={() => void roomsQuery.refetch()} />
              ) : roomsQuery.data && roomsQuery.data.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {roomsQuery.data.map((room) => (
                    <LiveRoomCard key={room.id} room={room} />
                  ))}
                </div>
              ) : (
                <EmptyState icon="📡" title="No live rooms" description="Try a different category or filter." />
              )}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function SearchResults({
  query,
}: {
  query: ReturnType<typeof useQuery<{ hosts: any[]; rooms: LiveRoomCardData[] }>>;
}) {
  if (query.isLoading) return <CardSkeletonGrid count={4} />;
  if (query.isError) return <ErrorState retry={() => void query.refetch()} />;
  const hosts = query.data?.hosts ?? [];
  const rooms = query.data?.rooms ?? [];
  if (hosts.length === 0 && rooms.length === 0) {
    return <EmptyState icon="🔍" title="No results" description="Try a different search term." />;
  }
  return (
    <div className="space-y-4">
      {hosts.length > 0 && (
        <section>
          <SectionHeader title="Hosts" />
          <div className="space-y-2">
            {hosts.map((h) => (
              <Link
                key={h.id}
                to="/u/$username"
                params={{ username: h.username }}
                className="flex items-center gap-3 rounded-2xl glass p-2.5 tap"
              >
                <UserAvatar src={h.avatar_url} name={h.display_name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{h.display_name}</p>
                  <p className="truncate text-xs text-muted-foreground">@{h.username}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {rooms.length > 0 && (
        <section>
          <SectionHeader title="Live rooms" />
          <div className="grid grid-cols-2 gap-3">
            {rooms.map((room) => (
              <LiveRoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
