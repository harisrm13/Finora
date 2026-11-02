import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        finora: {
          bg: "#F7F8FA",
          card: "#FFFFFF",
          primary: "#2563EB",
          primaryHover: "#1D4ED8",
          primaryLight: "#EFF6FF",
          text: "#111827",
          textMuted: "#6B7280",
          border: "#E5E7EB",
          income: "#16A34A",
          incomeHover: "#15803D",
          incomeLight: "#DCFCE7",
          expense: "#DC2626",
          expenseHover: "#B91C1C",
          expenseLight: "#FEE2E2",
          warning: "#F59E0B",
          warningLight: "#FEF3C7",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
