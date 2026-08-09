import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/messages")({
  head: () => ({
    meta: [
      { title: "Messages — VIVA LIVE" },
      { name: "description", content: "Your private conversations with hosts and friends on VIVA LIVE." },
      { property: "og:title", content: "Messages — VIVA LIVE" },
      { property: "og:description", content: "Private conversations with hosts and friends." },
    ],
  }),
  component: () => (
    <AppShell header={<PageHeader title="Messages" back={false} />}>
      <EmptyState icon="💬" title="No conversations yet" description="Direct messaging arrives in the next pass." />
    </AppShell>
  ),
});