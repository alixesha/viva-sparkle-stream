import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Gift } from "./live-types";

const QUANTITIES = [1, 5, 10, 99];

export function GiftPanel({
  open,
  onOpenChange,
  roomId,
  receiverId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roomId: string;
  receiverId: string;
}) {
  const { user, wallet, refresh } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Gift | null>(null);
  const [qty, setQty] = useState(1);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    void supabase
      .from("gifts")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (!alive) return;
        setGifts(data ?? []);
        setSelected((data ?? [])[0] ?? null);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  const grouped = useMemo(() => {
    const map = new Map<string, Gift[]>();
    for (const g of gifts) {
      const list = map.get(g.tier) ?? [];
      list.push(g);
      map.set(g.tier, list);
    }
    return Array.from(map.entries());
  }, [gifts]);

  const send = async () => {
    if (!user || !selected || sending) return;
    setSending(true);
    try {
      const { data, error } = await supabase.rpc("send_gift", {
        _gift_id: selected.id,
        _receiver_id: receiverId,
        _room_id: roomId,
        _quantity: qty,
      });
      if (error) throw error;
      const res = data as { ok?: boolean } | null;
      if (!res?.ok) throw new Error("Gift could not be sent");
      toast.success(`Sent ${qty}x ${selected.name} 🎁`);
      await refresh();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send gift";
      if (/not enough coins/i.test(message)) {
        toast.error("Not enough coins", {
          description: "Top up your test wallet to keep gifting.",
          action: { label: "Wallet", onClick: () => window.location.assign("/wallet") },
        });
      } else {
        toast.error(message);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader className="pb-1">
          <DrawerTitle>Send a gift</DrawerTitle>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>TEST COINS — NO REAL MONEY</span>
            <Link to="/wallet" className="coin-text font-bold">
              💰 {compact(wallet?.coins ?? 0)}
            </Link>
          </div>
        </DrawerHeader>

        <div className="max-h-[45vh] overflow-y-auto px-4 pb-2">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading gifts…</p>
          ) : gifts.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No gifts available yet.</p>
          ) : (
            grouped.map(([tier, list]) => (
              <div key={tier} className="mb-3">
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{tier}</p>
                <div className="grid grid-cols-4 gap-2">
                  {list.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setSelected(g)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-2xl glass p-2 tap",
                        selected?.id === g.id && "ring-2 ring-primary",
                      )}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="truncate text-[10px] font-semibold">{g.name}</span>
                      <span className="coin-text text-[10px] font-bold">{g.coin_price}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3 border-t border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            {QUANTITIES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setQty(n)}
                className={cn(
                  "flex-1 rounded-full py-1.5 text-xs font-bold tap",
                  qty === n ? "brand-gradient text-primary-foreground" : "glass",
                )}
              >
                x{n}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={99}
              value={qty}
              onChange={(e) => setQty(Math.min(99, Math.max(1, Number(e.target.value) || 1)))}
              className="w-14 rounded-full bg-surface-2 px-2 py-1.5 text-center text-xs"
            />
          </div>
          <button
            type="button"
            disabled={!user || !selected || sending}
            onClick={() => void send()}
            className="w-full rounded-full brand-gradient py-3 text-sm font-bold text-primary-foreground tap disabled:opacity-50"
          >
            {sending ? "Sending…" : selected ? `Send ${selected.name} · ${selected.coin_price * qty} coins` : "Select a gift"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
