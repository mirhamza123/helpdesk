import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: { 900: "#16202a", 700: "#334155", 500: "#64748b", 300: "#cbd5e1", 100: "#eef1f0", 50: "#f6f7f6" },
        brand: { 700: "#0b5f59", 600: "#0f766e", 500: "#14958b", 100: "#d5efec" },
      },
    },
  },
  plugins: [],
} satisfies Config;
