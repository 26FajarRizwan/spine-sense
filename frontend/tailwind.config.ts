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
        brand: {
          DEFAULT: "#005AF1",
          hover: "#0048C9",
          soft: "#E8F0FF",
          muted: "#7AA7FF",
        },
        spine: {
          DEFAULT: "#01AA6C",
          hover: "#01915C",
          soft: "#E6F7F0",
          deep: "#0F766E",
        },
        accent: {
          DEFAULT: "#005AF1",
          soft: "#E8F0FF",
          muted: "#7AA7FF",
        },
        posture: {
          good: "#01AA6C",
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
        sans: [
          "var(--font-plus-jakarta)",
          "Plus Jakarta Sans",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        mono: ["Cascadia Mono", "ui-monospace", "Segoe UI Mono", "monospace"],
      },
    },
  },
};

export default config;
