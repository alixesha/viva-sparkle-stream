import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — VIVA LIVE" },
      { name: "description", content: "Follows, gifts and approvals — everything happening on your VIVA LIVE account." },
      { property: "og:title", content: "Notifications — VIVA LIVE" },
      { property: "og:description", content: "Follows, gifts and approvals in one place." },
    ],
  }),
  component: () => (
    <AppShell header={<PageHeader title="Notifications" />}>
      <EmptyState icon="🔔" title="Nothing new" description="Your activity feed will show up here." />
    </AppShell>
  ),
});