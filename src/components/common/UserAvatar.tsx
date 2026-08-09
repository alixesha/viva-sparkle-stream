import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveMedia } from "@/lib/media";

interface Props {
  src?: string | null | undefined;
  name?: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  ring?: boolean;
  className?: string;
}

const sizes: Record<NonNullable<Props["size"]>, string> = {
  xs: "size-7 text-[10px]",
  sm: "size-9 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
};

export function UserAvatar({ src, name, size = "md", ring, className }: Props) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    void resolveMedia(src).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [src]);

  const initials = (name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-secondary font-semibold text-secondary-foreground",
        sizes[size],
        ring && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={name ?? "User avatar"} className="size-full object-cover" loading="lazy" />
      ) : (
        <span className="brand-text">{initials}</span>
      )}
    </span>
  );
}