"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/** Minimal neutral tile for `placeholder="blur"` (scales with layout). */
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iIzkyOTI5MiIgZmlsbC1vcGFjaXR5PSIwLjE1Ii8+PC9zdmc+";

type Props = {
  src: string;
  alt: string;
  /** Responsive width hint for the optimizer — keep aligned with `max-w-lg` feed column. */
  sizes: string;
  priority?: boolean;
  /** Slightly sharper default for photos; still optimized by Next. */
  quality?: number;
  className?: string;
};

/**
 * Next/Image wrapper for Supabase Storage public URLs: blur-up placeholder,
 * pulse skeleton until decode, tuned quality/sizes for mobile feeds.
 */
export function SupabaseFillImage({
  src,
  alt,
  sizes,
  priority = false,
  quality = 82,
  className,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-muted/30", className)}>
      <div
        className={cn(
          "absolute inset-0 z-0 animate-pulse bg-muted transition-opacity duration-300",
          loaded ? "pointer-events-none opacity-0" : "opacity-100"
        )}
        aria-hidden
      />
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cn(
          "relative z-[1] object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0"
        )}
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        priority={priority}
        quality={quality}
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
