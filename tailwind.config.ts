import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        card: "var(--card)",
        border: "var(--border)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        "accent-muted": "var(--accent-muted)",
      },
      fontFamily: {
        sans: ["var(--font-outfit)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-outfit)", "serif"],
      },
      boxShadow: {
        city: "0 12px 40px var(--city-glow)",
        "city-lg": "0 20px 60px -12px var(--city-glow), 0 8px 24px -8px rgba(15, 23, 42, 0.08)",
      },
      backgroundImage: {
        "city-hero-mesh":
          "radial-gradient(ellipse 90% 60% at 50% -20%, var(--city-glow), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 0%, var(--accent-muted), transparent 50%)",
      },
      keyframes: {
        "city-pulse": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
      },
      animation: {
        "city-pulse": "city-pulse 2.4s ease-in-out infinite",
      },
      spacing: {
        nav: "4.25rem",
      },
    },
  },
  plugins: [],
} satisfies Config;
