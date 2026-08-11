import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AdminSection } from "@/components/admin/AdminSection";
import { DataRow, StatusBadge } from "@/components/admin/DataRow";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState, RowSkeletonList, TestModeBanner } from "@/components/common/States";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { uploadUserFile, resolveMedia } from "@/lib/media";
import { compact } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ANIMATION_KEYS,
  GiftAnimationLayer,
  type GiftEvent,
} from "@/components/gifts/GiftAnimation";
import type { Tables } from "@/integrations/supabase/types";

type Gift = Tables<"gifts">;

const TIERS = ["small", "medium", "large", "premium"] as const;

export const Route = createFileRoute("/admin/gifts")({
  head: () => ({
    meta: [
      { title: "Gift manager — VIVA LIVE admin" },
      { name: "description", content: "Create, edit, price and preview animated test gifts." },
      { property: "og:title", content: "Gift manager — VIVA LIVE admin" },
      { property: "og:description", content: "Manage the animated gift catalog and preview every animation." },
    ],
  }),
  component: AdminGifts,
});

interface Draft {
  id?: string;
  name: string;
  icon: string;
  animation_key: string;
  tier: string;
  coin_price: number;
  diamond_reward: number;
  is_active: boolean;
  sort_order: number;
  animation_url: string | null;
}

const emptyDraft: Draft = {
  name: "",
  icon: "🎁",
  animation_key: "stars",
  tier: "small",
  coin_price: 10,
  diamond_reward: 5,
  is_active: true,
  sort_order: 99,
  animation_url: null,
};

function AdminGifts() {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<Gift[] | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<GiftEvent | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("gifts")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setGifts(data ?? []);
  };

  useEffect(() => {
    void load();
  }, []);

  const queue = useMemo(() => (preview ? [preview] : []), [preview]);

  const previewGift = async (g: Pick<Draft, "name" | "icon" | "animation_key" | "tier" | "animation_url">, qty = 1) => {
    const url = g.animation_url ? await resolveMedia(g.animation_url) : null;
    setPreview({
      id: `preview-${Date.now()}`,
      giftName: g.name || "Preview",
      icon: g.icon || "🎁",
      animationKey: g.animation_key,
      animationUrl: url,
      tier: g.tier,
      quantity: qty,
      senderName: "You",
      receiverName: "Test host",
    });
  };

  const save = async () => {
    if (!draft || saving) return;
    if (!draft.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    const payload = {
      name: draft.name.trim(),
      icon: draft.icon || "🎁",
      animation_key: draft.animation_key,
      tier: draft.tier,
      coin_price: Math.max(0, Math.round(draft.coin_price)),
      diamond_reward: Math.max(0, Math.round(draft.diamond_reward)),
      is_active: draft.is_active,
      sort_order: Math.round(draft.sort_order),
      animation_url: draft.animation_url,
    };
    const { error } = draft.id
      ? await supabase.from("gifts").update(payload).eq("id", draft.id)
      : await supabase.from("gifts").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(draft.id ? "Gift updated" : "Gift created");
    setDraft(null);
    await load();
  };

  const toggleActive = async (g: Gift) => {
    const { error } = await supabase.from("gifts").update({ is_active: !g.is_active }).eq("id", g.id);
    if (error) toast.error(error.message);
    else await load();
  };

  const remove = async (g: Gift) => {
    const { error } = await supabase.from("gifts").delete().eq("id", g.id);
    if (error) toast.error("Gift is used in transactions — deactivate it instead.");
    else {
      toast.success("Gift deleted");
      await load();
    }
  };

  const onUpload = async (file: File) => {
    if (!user || !draft) return;
    setUploading(true);
    try {
      const ref = await uploadUserFile("gifts", user.id, file);
      setDraft({ ...draft, animation_url: ref });
      toast.success("Animation asset uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <TestModeBanner label="TEST GIFTS — COINS HAVE NO REAL MONEY VALUE" />

      <AdminSection
        className="mt-4"
        title="Animation library"
        action={
          <button
            type="button"
            onClick={() => setDraft({ ...emptyDraft })}
            className="rounded-full brand-gradient px-3 py-1.5 text-xs font-bold text-primary-foreground tap"
          >
            New gift
          </button>
        }
      >
        <p className="mb-2 text-xs text-muted-foreground">
          Tap any animation to preview it full screen exactly as viewers see it in a live room.
        </p>
        <div className="grid grid-cols-4 gap-2">
          {ANIMATION_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() =>
                void previewGift({
                  name: k,
                  icon: "🎁",
                  animation_key: k,
                  tier: k === "legendary" || k === "castle" ? "premium" : "large",
                  animation_url: null,
                })
              }
              className="rounded-2xl glass px-2 py-2 text-[10px] font-bold uppercase tracking-wide tap"
            >
              {k}
            </button>
          ))}
        </div>
      </AdminSection>

      <AdminSection title={`Gift catalog${gifts ? ` · ${gifts.length}` : ""}`}>
        {!gifts ? (
          <RowSkeletonList />
        ) : gifts.length === 0 ? (
          <EmptyState icon="🎁" title="No gifts yet" description="Create your first animated gift." />
        ) : (
          gifts.map((g) => (
            <DataRow
              key={g.id}
              left={
                <p className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-xl">{g.icon}</span>
                  {g.name}
                  <StatusBadge status={g.is_active ? "active" : "inactive"} />
                </p>
              }
              sub={
                <p className="text-[11px] text-muted-foreground">
                  {g.tier} · {g.animation_key} · <span className="coin-text">💰 {compact(g.coin_price)}</span> ·{" "}
                  <span className="text-diamond">💎 {compact(g.diamond_reward)}</span> · #{g.sort_order}
                </p>
              }
              right={
                <>
                  <button
                    type="button"
                    onClick={() => void previewGift(g, 5)}
                    className="rounded-full glass px-3 py-1.5 text-xs font-bold tap"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({
                        id: g.id,
                        name: g.name,
                        icon: g.icon,
                        animation_key: g.animation_key,
                        tier: g.tier,
                        coin_price: g.coin_price,
                        diamond_reward: g.diamond_reward,
                        is_active: g.is_active,
                        sort_order: g.sort_order,
                        animation_url: g.animation_url,
                      })
                    }
                    className="rounded-full glass px-3 py-1.5 text-xs font-bold tap"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(g)}
                    className="rounded-full glass px-3 py-1.5 text-xs font-bold tap"
                  >
                    {g.is_active ? "Disable" : "Enable"}
                  </button>
                  <ConfirmDialog
                    destructive
                    title={`Delete ${g.name}?`}
                    description="Gifts already sent cannot be deleted — disable them instead."
                    confirmLabel="Delete"
                    onConfirm={() => remove(g)}
                    trigger={
                      <button type="button" className="rounded-full bg-destructive/15 px-3 py-1.5 text-xs font-bold text-destructive tap">
                        Delete
                      </button>
                    }
                  />
                </>
              }
            />
          ))
        )}
      </AdminSection>

      {/* Preview stage */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-background/95" onClick={() => setPreview(null)}>
          <div className="relative mx-auto h-dvh w-full max-w-md overflow-hidden">
            <GiftAnimationLayer queue={queue} onConsume={() => setPreview(null)} />
            <p className="absolute inset-x-0 top-4 text-center text-xs font-bold text-muted-foreground">
              Tap anywhere to close preview
            </p>
          </div>
        </div>
      )}

      {/* Editor */}
      <Dialog open={Boolean(draft)} onOpenChange={(v) => !v && setDraft(null)}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit gift" : "New gift"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-3">
              <Field label="Name">
                <input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="h-10 w-full rounded-full bg-surface-2 px-4 text-sm outline-none"
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Emoji icon">
                  <input
                    value={draft.icon}
                    onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                    className="h-10 w-full rounded-full bg-surface-2 px-4 text-center text-lg outline-none"
                  />
                </Field>
                <Field label="Sort order">
                  <input
                    type="number"
                    value={draft.sort_order}
                    onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) || 0 })}
                    className="h-10 w-full rounded-full bg-surface-2 px-4 text-sm outline-none"
                  />
                </Field>
              </div>

              <Field label="Animation">
                <div className="flex flex-wrap gap-1.5">
                  {ANIMATION_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDraft({ ...draft, animation_key: k })}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tap",
                        draft.animation_key === k ? "brand-gradient text-primary-foreground" : "glass",
                      )}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Tier (controls size & screen takeover)">
                <div className="flex gap-1.5">
                  {TIERS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setDraft({ ...draft, tier: t })}
                      className={cn(
                        "flex-1 rounded-full py-1.5 text-[10px] font-bold uppercase tap",
                        draft.tier === t ? "brand-gradient text-primary-foreground" : "glass",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Coin price (TEST)">
                  <input
                    type="number"
                    value={draft.coin_price}
                    onChange={(e) => setDraft({ ...draft, coin_price: Number(e.target.value) || 0 })}
                    className="h-10 w-full rounded-full bg-surface-2 px-4 text-sm outline-none"
                  />
                </Field>
                <Field label="Diamond reward">
                  <input
                    type="number"
                    value={draft.diamond_reward}
                    onChange={(e) => setDraft({ ...draft, diamond_reward: Number(e.target.value) || 0 })}
                    className="h-10 w-full rounded-full bg-surface-2 px-4 text-sm outline-none"
                  />
                </Field>
              </div>

              <Field label="Custom asset (GIF / MP4 / WEBM — optional)">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept="image/gif,image/png,image/webp,video/mp4,video/webm"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onUpload(f);
                    }}
                    className="min-w-0 flex-1 text-xs"
                  />
                  {draft.animation_url && (
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, animation_url: null })}
                      className="rounded-full glass px-3 py-1.5 text-xs font-bold tap"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {uploading && <p className="mt-1 text-[11px] text-muted-foreground">Uploading…</p>}
              </Field>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                />
                Active in gift panel
              </label>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void previewGift(draft, 3)}
                  className="flex-1 rounded-full glass py-2.5 text-sm font-bold tap"
                >
                  Preview
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void save()}
                  className="flex-1 rounded-full brand-gradient py-2.5 text-sm font-bold text-primary-foreground tap disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save gift"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
