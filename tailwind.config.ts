import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        bebas: ["var(--font-bebas)", "Impact", "sans-serif"],
        "dm-sans": ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        "noto-jp": ["var(--font-noto-jp)", "Hiragino Sans", "Yu Gothic", "sans-serif"],
      },
      colors: {
        ink: {
          DEFAULT: "#080D1A",
          card: "#0F1629",
          border: "#1E2D4D",
          muted: "#8899BB",
        },
        crimson: {
          DEFAULT: "#E8192C",
          hover: "#FF2D3F",
          glow: "rgba(232, 25, 44, 0.3)",
          dim: "rgba(232, 25, 44, 0.12)",
        },
        snow: {
          DEFAULT: "#F0F4FF",
          muted: "#8899BB",
          faint: "#3A4A6B",
        },
        gold: {
          DEFAULT: "#F0A500",
          light: "#FFD166",
          dim: "rgba(240, 165, 0, 0.12)",
        },
        success: "#22C55E",
        error: "#EF4444",
        warning: "#F59E0B",
        // Keep for backward compat in components not yet updated
        primary: {
          DEFAULT: "#080D1A",
          800: "#0F1629",
        },
        accent: {
          DEFAULT: "#E8192C",
          600: "#FF2D3F",
        },
      },
      boxShadow: {
        "crimson-glow": "0 0 24px rgba(232, 25, 44, 0.25)",
        "crimson-sm": "0 0 12px rgba(232, 25, 44, 0.2)",
        "card-dark": "0 4px 24px rgba(0, 0, 0, 0.4)",
        "gold-glow": "0 0 16px rgba(240, 165, 0, 0.2)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.5s ease-out",
        "blur-in": "blurIn 0.5s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blurIn: {
          "0%": { opacity: "0", filter: "blur(10px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
