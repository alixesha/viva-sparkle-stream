import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/discover")({
  head: () => ({
    meta: [
      { title: "Discover creators — VIVA LIVE" },
      { name: "description", content: "Search hosts, browse categories and find new live rooms on VIVA LIVE." },
      { property: "og:title", content: "Discover creators — VIVA LIVE" },
      { property: "og:description", content: "Search hosts and browse live categories." },
    ],
  }),
  component: () => (
    <AppShell header={<PageHeader title="Discover" back={false} />}>
      <EmptyState icon="🔍" title="Discover is coming next" description="Search, categories and rankings land in the next pass." />
    </AppShell>
  ),
});