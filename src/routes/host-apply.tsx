import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { AppShell, PageHeader } from "@/components/layout/AppShell";
import { EmptyState, ErrorState, RowSkeletonList } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, timeAgo } from "@/lib/format";

export const Route = createFileRoute("/host-apply")({
  head: () => ({
    meta: [
      { title: "Apply to become a host — VIVA LIVE" },
      { name: "description", content: "Submit your host application on VIVA LIVE." },
      { property: "og:title", content: "Apply to become a host — VIVA LIVE" },
      { property: "og:description", content: "Tell us about yourself to start hosting." },
    ],
  }),
  component: HostApplyPage,
});

const schema = z.object({
  real_name: z.string().trim().min(2, "Enter your real name").max(80),
  age: z.coerce.number().int().min(16, "Must be at least 16").max(100),
  country: z.string().min(1, "Select a country"),
  experience: z.string().trim().min(10, "Tell us a bit more (10+ chars)").max(1000),
  social_link: z.string().trim().url("Enter a valid URL").optional().or(z.literal("")),
});

type FormState = {
  real_name: string;
  age: string;
  country: string;
  experience: string;
  social_link: string;
};

const emptyForm: FormState = { real_name: "", age: "", country: "", experience: "", social_link: "" };

function HostApplyPage() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const appQuery = useQuery({
    queryKey: ["host-application", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("host_applications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(user),
  });

  const submit = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = String(issue.path[0] ?? "form");
          fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        throw new Error("Please fix the form errors.");
      }
      setErrors({});
      const { error } = await supabase.from("host_applications").insert({
        user_id: user!.id,
        real_name: parsed.data.real_name,
        age: parsed.data.age,
        country: parsed.data.country,
        experience: parsed.data.experience,
        social_link: parsed.data.social_link || null,
        status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Application submitted!");
      setForm(emptyForm);
      void queryClient.invalidateQueries({ queryKey: ["host-application", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not submit application."),
  });

  if (loading) {
    return (
      <AppShell header={<PageHeader title="Become a host" />}>
        <RowSkeletonList count={4} />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell header={<PageHeader title="Become a host" />}>
        <EmptyState
          icon="🔒"
          title="Sign in required"
          description="Sign in to apply for a host account."
          action={
            <Link to="/auth" className="rounded-full brand-gradient px-4 py-2 text-sm font-bold text-primary-foreground tap">
              Sign in
            </Link>
          }
        />
      </AppShell>
    );
  }

  const application = appQuery.data;
  const canApply = !application || application.status === "rejected";

  return (
    <AppShell header={<PageHeader title="Become a host" />}>
      {appQuery.isLoading && <RowSkeletonList count={4} />}
      {appQuery.isError && <ErrorState retry={() => void appQuery.refetch()} />}

      {!appQuery.isLoading && application && !canApply && (
        <div className="rounded-3xl glass p-5">
          <p className="text-xs text-muted-foreground">Application status</p>
          <p
            className={
              "mt-1 inline-flex rounded-full px-3 py-1 text-sm font-bold capitalize " +
              (application.status === "approved"
                ? "bg-live/15 text-live"
                : "bg-warning/15 text-warning")
            }
          >
            {application.status}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">Submitted {timeAgo(application.created_at)}</p>
          {application.admin_note && (
            <div className="mt-3 rounded-2xl bg-surface-2 p-3 text-sm">
              <p className="text-xs font-bold text-muted-foreground">Admin note</p>
              <p className="mt-1">{application.admin_note}</p>
            </div>
          )}
          {application.status === "approved" && (
            <Link to="/go-live" className="mt-4 block rounded-full brand-gradient px-4 py-2 text-center text-sm font-bold text-primary-foreground tap">
              Go live now
            </Link>
          )}
        </div>
      )}

      {!appQuery.isLoading && canApply && (
        <form
          className="space-y-4 rounded-3xl glass p-5"
          onSubmit={(e) => {
            e.preventDefault();
            submit.mutate();
          }}
        >
          {application?.status === "rejected" && application.admin_note && (
            <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">
              Previous application was rejected: {application.admin_note}
            </div>
          )}
          <div>
            <Label htmlFor="real_name">Real name</Label>
            <Input id="real_name" value={form.real_name} onChange={(e) => setForm((f) => ({ ...f, real_name: e.target.value }))} maxLength={80} />
            {errors["real_name"] && <p className="mt-1 text-xs text-destructive">{errors["real_name"]}</p>}
          </div>
          <div>
            <Label htmlFor="age">Age</Label>
            <Input id="age" type="number" min={16} max={100} value={form.age} onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))} />
            {errors["age"] && <p className="mt-1 text-xs text-destructive">{errors["age"]}</p>}
          </div>
          <div>
            <Label>Country</Label>
            <Select value={form.country} onValueChange={(v) => setForm((f) => ({ ...f, country: v }))}>
              <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors["country"] && <p className="mt-1 text-xs text-destructive">{errors["country"]}</p>}
          </div>
          <div>
            <Label htmlFor="experience">Experience</Label>
            <Textarea id="experience" rows={4} value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))} maxLength={1000} />
            {errors["experience"] && <p className="mt-1 text-xs text-destructive">{errors["experience"]}</p>}
          </div>
          <div>
            <Label htmlFor="social_link">Social link (optional)</Label>
            <Input id="social_link" placeholder="https://..." value={form.social_link} onChange={(e) => setForm((f) => ({ ...f, social_link: e.target.value }))} />
            {errors["social_link"] && <p className="mt-1 text-xs text-destructive">{errors["social_link"]}</p>}
          </div>
          <Button type="submit" disabled={submit.isPending} className="w-full rounded-full brand-gradient font-bold text-primary-foreground">
            {submit.isPending ? "Submitting…" : "Submit application"}
          </Button>
        </form>
      )}
    </AppShell>
  );
}
