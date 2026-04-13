import Image from "next/image";
import { cn } from "@/lib/utils";

type CitygramLogoProps = {
  /** Pixel width/height (square asset). */
  size?: number;
  className?: string;
  /** When false, image is decorative (use next to visible “CITYGRAM” text). */
  decorative?: boolean;
  priority?: boolean;
};

export function CitygramLogo({
  size = 28,
  className,
  decorative = true,
  priority = false,
}: CitygramLogoProps) {
  return (
    <Image
      src="/citygram-logo.png"
      alt={decorative ? "" : "CITYGRAM"}
      width={size}
      height={size}
      className={cn("shrink-0 rounded-lg object-cover", className)}
      priority={priority}
    />
  );
}
