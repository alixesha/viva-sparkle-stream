import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, RowSkeletonList } from "@/components/common/States";
import { CameraPreview, useCameraPreview } from "@/components/host/CameraPreview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { uploadUserFile } from "@/lib/media";
import { COUNTRIES, LANGUAGES } from "@/lib/format";

export const Route = createFileRoute("/go-live")({
  head: () => ({
    meta: [
      { title: "Go live — VIVA LIVE" },
      { name: "description", content: "Start your own live room on VIVA LIVE and receive animated gifts." },
      { property: "og:title", content: "Go live — VIVA LIVE" },
      { property: "og:description", content: "Start your own live room in seconds." },
    ],
  }),
  component: GoLivePage,
});

function GoLivePage() {
  const { user, profile, isHost, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <AppShell header={<PageHeader title="Go live" back={false} />}>
        <RowSkeletonList count={3} />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell header={<PageHeader title="Go live" back={false} />}>
        <EmptyState
          icon="🔒"
          title="Sign in required"
          description="Sign in to start a live room."
          action={
            <Link to="/auth" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Sign in
            </Link>
          }
        />
      </AppShell>
    );
  }

  if (!isHost && !isAdmin) {
    return (
      <AppShell header={<PageHeader title="Go live" back={false} />}>
        <EmptyState
          icon="🎙️"
          title="Host approval required"
          description="Only approved hosts can go live. Apply to become a host to unlock broadcasting."
          action={
            <Link to="/host-apply" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Apply to host
            </Link>
          }
        />
      </AppShell>
    );
  }

  return <GoLiveForm userId={user.id} country={profile?.country ?? ""} language={profile?.language ?? ""} />;
}

function GoLiveForm({ userId, country, language }: { userId: string; country: string; language: string }) {
  const navigate = useNavigate();
  const channelId = useMemo(() => crypto.randomUUID(), []);
  const { session, setSession } = useCameraPreview(channelId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(country);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbRef, setThumbRef] = useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("is_active", true).order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!thumbFile) return;
    const url = URL.createObjectURL(thumbFile);
    setThumbPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [thumbFile]);

  const uploadThumb = useMutation({
    mutationFn: async (file: File) => uploadUserFile("thumbnails", userId, file),
    onSuccess: (ref) => {
      setThumbRef(ref);
      toast.success("Thumbnail uploaded");
    },
    onError: (e: Error) => toast.error(e.message || "Upload failed"),
  });

  const goLive = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error("Title is required.");
      if (title.length > 80) throw new Error("Title must be 80 characters or fewer.");
      if (!category) throw new Error("Select a category.");
      const { data, error } = await supabase
        .from("live_rooms")
        .insert({
          host_id: userId,
          title: title.trim(),
          category,
          thumbnail_url: thumbRef,
          country: selectedCountry || "Other",
          language: selectedLanguage || "en",
          stream_channel_id: crypto.randomUUID(),
          status: "live",
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (roomId) => {
      toast.success("You're live!");
      void navigate({ to: "/room/$roomId", params: { roomId } });
    },
    onError: (e: Error) => toast.error(e.message || "Could not start live room."),
  });

  return (
    <AppShell header={<PageHeader title="Go live" back={false} />}>
      <div className="space-y-4">
        <CameraPreview session={session} onSessionChange={setSession} />

        <div className="space-y-4 rounded-3xl glass p-5">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} placeholder="What's your stream about?" />
            <p className="mt-1 text-right text-[11px] text-muted-foreground">{title.length}/80</p>
          </div>

          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categoriesQuery.data?.map((c) => (
                  <SelectItem key={c.id} value={c.slug}>{c.icon} {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country</Label>
              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="thumb">Thumbnail</Label>
            <Input
              id="thumb"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setThumbFile(file);
                uploadThumb.mutate(file);
              }}
            />
            {thumbPreview && (
              <img src={thumbPreview} alt="Thumbnail preview" className="mt-2 aspect-video w-full rounded-2xl object-cover" />
            )}
          </div>

          <Button
            type="button"
            disabled={goLive.isPending || uploadThumb.isPending}
            onClick={() => goLive.mutate()}
            className="w-full rounded-full brand-gradient font-bold text-primary-foreground"
          >
            {goLive.isPending ? "Starting…" : "Go live"}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
