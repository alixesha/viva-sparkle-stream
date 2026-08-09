export function compact(n: number | null | undefined): string {
  const v = Number(n ?? 0);
  if (v < 1000) return String(v);
  if (v < 1_000_000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  if (v < 1_000_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  return `${(v / 1_000_000_000).toFixed(1)}B`;
}

export function full(n: number | null | undefined): string {
  return Number(n ?? 0).toLocaleString("en-US");
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(diff / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function duration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${rest}s`;
  return `${rest}s`;
}

export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export const COUNTRIES = [
  "Pakistan",
  "India",
  "Bangladesh",
  "Indonesia",
  "Malaysia",
  "Turkey",
  "Egypt",
  "Saudi Arabia",
  "United Arab Emirates",
  "United States",
  "United Kingdom",
  "Brazil",
  "Philippines",
  "Vietnam",
  "Nigeria",
  "Kenya",
  "Germany",
  "France",
  "Spain",
  "Other",
];

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ur", label: "Urdu" },
  { code: "hi", label: "Hindi" },
  { code: "ar", label: "Arabic" },
  { code: "id", label: "Indonesian" },
  { code: "tr", label: "Turkish" },
  { code: "es", label: "Spanish" },
  { code: "pt", label: "Portuguese" },
];

export const GENDERS = ["female", "male", "other", "unspecified"];

export const REPORT_CATEGORIES = [
  "Harassment",
  "Spam",
  "Scam",
  "Sexual content",
  "Violence",
  "Hate speech",
  "Illegal activity",
  "Other",
];