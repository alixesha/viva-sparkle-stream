import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";
import { DataRow, StatusBadge } from "@/components/admin/DataRow";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { full } from "@/lib/format";

export const Route = createFileRoute("/admin/packages")({
  head: () => ({
    meta: [
      { title: "Coin Packages — Admin — VIVA LIVE" },
      { name: "description", content: "Manage TEST coin packages." },
      { property: "og:title", content: "Coin Packages — Admin — VIVA LIVE" },
      { property: "og:description", content: "Create and edit TEST coin packages." },
    ],
  }),
  component: AdminPackages,
});

interface PkgForm {
  id?: string;
  name: string;
  coins: string;
  bonus_coins: string;
  display_price: string;
  is_active: boolean;
  sort_order: string;
}

const EMPTY: PkgForm = { name: "", coins: "", bonus_coins: "0", display_price: "$0.00", is_active: true, sort_order: "0" };

function AdminPackages() {
  const [form, setForm] = useState<PkgForm | null>(null);

  const query = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coin_packages").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const save = async () => {
    if (!form) return;
    const payload = {
      name: form.name,
      coins: Number(form.coins),
      bonus_coins: Number(form.bonus_coins || 0),
      display_price: form.display_price,
      is_active: form.is_active,
      sort_order: Number(form.sort_order || 0),
    };
    if (!payload.name || !(payload.coins > 0)) return toast.error("Name and coins are required");
    const { error } = form.id
      ? await supabase.from("coin_packages").update(payload).eq("id", form.id)
      : await supabase.from("coin_packages").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("Package saved");
    setForm(null);
    void query.refetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("coin_packages").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Package removed");
    void query.refetch();
  };

  const rows = query.data ?? [];

  return (
    <div className="space-y-4">
      <TestModeBanner label="TEST PRICES — NOT REAL MONEY" />
      <AdminSection
        title={`Packages (${full(rows.length)})`}
        action={
          <Dialog open={!!form} onOpenChange={(o) => setForm(o ? form ?? { ...EMPTY } : null)}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 rounded-full text-xs" onClick={() => setForm({ ...EMPTY })}>
                + Add
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-3xl">
              <DialogHeader>
                <DialogTitle>{form?.id ? "Edit package" : "New package"}</DialogTitle>
              </DialogHeader>
              {form && (
                <div className="space-y-2">
                  <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Input placeholder="Coins" type="number" value={form.coins} onChange={(e) => setForm({ ...form, coins: e.target.value })} />
                  <Input placeholder="Bonus coins" type="number" value={form.bonus_coins} onChange={(e) => setForm({ ...form, bonus_coins: e.target.value })} />
                  <Input placeholder="Display price (TEST)" value={form.display_price} onChange={(e) => setForm({ ...form, display_price: e.target.value })} />
                  <Input placeholder="Sort order" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
                  <div className="flex items-center justify-between rounded-2xl glass px-3 py-2">
                    <span className="text-sm">Active</span>
                    <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">Price is TEST only — no real transactions occur.</p>
                </div>
              )}
              <DialogFooter>
                <Button onClick={() => void save()}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        {query.isLoading ? (
          <RowSkeletonList />
        ) : rows.length === 0 ? (
          <EmptyState icon="📦" title="No packages" />
        ) : (
          <div>
            {rows.map((p) => (
              <DataRow
                key={p.id}
                left={
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{p.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {full(p.coins)} + {full(p.bonus_coins)} bonus · {p.display_price} (TEST)
                    </p>
                  </div>
                }
                sub={<StatusBadge status={p.is_active ? "active" : "suspended"} />}
                right={
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-7 rounded-full px-3 text-[11px]"
                      onClick={() =>
                        setForm({
                          id: p.id,
                          name: p.name,
                          coins: String(p.coins),
                          bonus_coins: String(p.bonus_coins),
                          display_price: p.display_price,
                          is_active: p.is_active,
                          sort_order: String(p.sort_order),
                        })
                      }
                    >
                      Edit
                    </Button>
                    <ConfirmDialog
                      trigger={
                        <Button size="sm" variant="destructive" className="h-7 rounded-full px-3 text-[11px]">
                          Delete
                        </Button>
                      }
                      title="Delete this package?"
                      onConfirm={() => void remove(p.id)}
                      destructive
                    />
                  </>
                }
              />
            ))}
          </div>
        )}
      </AdminSection>
    </div>
  );
}
