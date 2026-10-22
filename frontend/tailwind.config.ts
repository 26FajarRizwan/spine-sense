import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        mist: "#F8FAFC",
        ink: {
          DEFAULT: "#0F172A",
          soft: "#475569",
        },
        line: "#E2E8F0",
        brand: "#2563EB",
        accent: {
          DEFAULT: "#6366F1",
          soft: "#EEF2FF",
          muted: "#A5B4FC",
        },
        posture: {
          good: "#10B981",
          warning: "#F59E0B",
          slump: "#EF4444",
          "good-ink": "#047857",
          "warning-ink": "#92400E",
          "slump-ink": "#B91C1C",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 0.05), 0 16px 40px rgb(15 23 42 / 0.06)",
      },
      fontFamily: {
        sans: ["Segoe UI", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["Cascadia Mono", "ui-monospace", "Segoe UI Mono", "monospace"],
      },
    },
  },
};

export default config;
