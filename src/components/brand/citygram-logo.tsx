import Image from "next/image";
import { cn } from "@/lib/utils";

/** Source asset dimensions (portrait lockup: mark + wordmark). */
const LOGO_SRC_WIDTH = 819;
const LOGO_SRC_HEIGHT = 1024;

type CitygramLogoProps = {
  /** Rendered height in CSS pixels; width follows the lockup aspect ratio. */
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
      src="/citygram-logo.jpg"
      alt={decorative ? "" : "CITYGRAM"}
      width={LOGO_SRC_WIDTH}
      height={LOGO_SRC_HEIGHT}
      className={cn("w-auto shrink-0 object-contain", className)}
      style={{ height: size, width: "auto" }}
      priority={priority}
      sizes={`${Math.round((size * LOGO_SRC_WIDTH) / LOGO_SRC_HEIGHT)}px`}
    />
  );
}
