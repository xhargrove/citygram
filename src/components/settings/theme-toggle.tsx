"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button type="button" variant="outline" size="sm" disabled>
        Theme
      </Button>
    );
  }

  const current = theme === "system" ? resolvedTheme : theme;

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(current === "dark" ? "light" : "dark")}
    >
      {current === "dark" ? "Light mode" : "Dark mode"}
    </Button>
  );
}
