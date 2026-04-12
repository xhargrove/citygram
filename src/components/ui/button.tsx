import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:pointer-events-none disabled:opacity-40",
        variant === "primary" &&
          "bg-accent text-accent-foreground shadow-city hover:opacity-95",
        variant === "secondary" &&
          "bg-foreground/5 text-foreground hover:bg-foreground/10 dark:bg-white/10",
        variant === "ghost" && "text-foreground hover:bg-foreground/5",
        variant === "outline" &&
          "border border-border bg-transparent hover:bg-foreground/5",
        size === "sm" && "min-h-10 px-3 text-sm",
        size === "md" && "min-h-12 px-4 text-sm",
        size === "lg" && "min-h-14 px-6 text-base",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
