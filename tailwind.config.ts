import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Warm editorial travel palette
        cream: {
          DEFAULT: "#f6f0e2",
          50: "#fbf8f0",
          100: "#f6f0e2",
          200: "#ece2cb",
        },
        forest: {
          DEFAULT: "#274233",
          700: "#2f4e3d",
          600: "#3a6049",
          500: "#4a7359",
          100: "#dde9e0",
        },
        clay: {
          DEFAULT: "#b5532a",
          600: "#a4471f",
          400: "#cf7048",
          100: "#f2ddd0",
        },
        gold: {
          DEFAULT: "#c9a227",
          400: "#d9b94f",
          100: "#f3e9c6",
        },
        ink: "#2b261f",
        muted: "#6f6655",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(43,38,31,0.04), 0 8px 24px -12px rgba(43,38,31,0.18)",
        lift: "0 2px 4px rgba(43,38,31,0.06), 0 18px 40px -16px rgba(43,38,31,0.28)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
    },
  },
  plugins: [],
};

export default config;
