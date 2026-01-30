import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Forever Fields Color Palette
        sage: {
          DEFAULT: "#a7c9a2",
          primary: "#a7c9a2",
          dark: "#8bb085",
          light: "#c5d9c1",
          pale: "#e8f5e9",
        },
        cream: {
          DEFAULT: "#fff8f0",
          warm: "#fff3e0",
        },
        "warm-white": "#fffef9",
        gray: {
          body: "#6b6b6b",
          dark: "#4a4a4a",
          light: "#b0b0b0",
        },
        gold: {
          DEFAULT: "#b38f1f",
          muted: "#b38f1f",
          primary: "#b38f1f",
          light: "#e8dcc4",
          warm: "#c9a227",
          dark: "#8a6d17",
          pale: "#fdf6e3",
        },
        rose: {
          DEFAULT: "#c97b7b",
          dark: "#a85858",
          light: "#e8b4b4",
          pale: "#fdf2f2",
        },
        coral: {
          DEFAULT: "#e07c5f",
          dark: "#c4603f",
          light: "#f0a890",
          pale: "#fef5f2",
        },
        lavender: {
          DEFAULT: "#9b8bbf",
          subtle: "#e0d7ed",
          pale: "#f5f2fa",
        },
        twilight: "#5a6b7c",
        error: "#c62828",
        success: "#2e7d32",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        full: "50px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(167, 201, 162, 0.15)",
        medium: "0 4px 12px rgba(74, 74, 74, 0.08)",
        gold: "0 4px 20px rgba(212, 175, 55, 0.15)",
        hover: "0 8px 30px rgba(167, 201, 162, 0.25)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
};
export default config;
