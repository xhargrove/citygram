import Image from "next/image";
import { cn } from "@/lib/utils";

type AvatarProps = {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = { sm: 36, md: 44, lg: 72 };

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const dim = sizes[size];
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        width={dim}
        height={dim}
        className={cn("rounded-full object-cover ring-2 ring-border", className)}
        sizes={`${dim}px`}
      />
    );
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-accent/15 text-sm font-semibold text-accent ring-2 ring-border",
        size === "sm" && "h-9 w-9 text-xs",
        size === "md" && "h-11 w-11",
        size === "lg" && "h-[72px] w-[72px] text-xl",
        className
      )}
      aria-hidden
    >
      {alt.slice(0, 1).toUpperCase()}
    </div>
  );
}
