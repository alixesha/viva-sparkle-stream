import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — VIVA LIVE" },
      { name: "description", content: "VIVA LIVE administration panel." },
      { property: "og:title", content: "Admin — VIVA LIVE" },
      { property: "og:description", content: "Manage users, hosts, rooms, coins, gifts and more." },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AppShell header={<PageHeader title="Admin" back={false} />}>
      <AdminGate>
        <AdminNav />
        <Outlet />
      </AdminGate>
    </AppShell>
  );
}
