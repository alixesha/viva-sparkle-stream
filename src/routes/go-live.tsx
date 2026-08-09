import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, TestModeBanner } from "@/components/common/States";

export const Route = createFileRoute("/go-live")({
  head: () => ({
    meta: [
      { title: "Go live — VIVA LIVE" },
      { name: "description", content: "Start your own live room on VIVA LIVE and receive animated gifts." },
      { property: "og:title", content: "Go live — VIVA LIVE" },
      { property: "og:description", content: "Start your own live room in seconds." },
    ],
  }),
  component: () => (
    <AppShell header={<PageHeader title="Go live" back={false} />}>
      <TestModeBanner label="TEST STREAM — LOCAL PREVIEW ONLY" />
      <EmptyState className="mt-4" icon="🎥" title="Broadcast setup coming next" description="Camera preview and room creation are wired in the next pass." />
    </AppShell>
  ),
});