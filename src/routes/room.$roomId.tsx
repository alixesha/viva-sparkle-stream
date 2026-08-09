import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, TestModeBanner } from "@/components/common/States";

export const Route = createFileRoute("/room/$roomId")({
  head: () => ({
    meta: [
      { title: "Live room — VIVA LIVE" },
      { name: "description", content: "Join the live room, chat in realtime and send animated gifts." },
      { property: "og:title", content: "Live room — VIVA LIVE" },
      { property: "og:description", content: "Join the live room and send animated gifts." },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { roomId } = Route.useParams();
  return (
    <AppShell header={<PageHeader title="Live room" />} nav={false}>
      <TestModeBanner label="TEST STREAM — NO REAL BROADCAST" />
      <EmptyState
        className="mt-4"
        icon="🎬"
        title="Room player coming next"
        description={`Realtime chat, gifts and PK battles for room ${roomId.slice(0, 8)} land in the next pass.`}
      />
    </AppShell>
  );
}