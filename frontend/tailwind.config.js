/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          50: "#EEF2F8",
          100: "#D7E1EF",
          200: "#AFC3DF",
          300: "#7E9CC6",
          400: "#4E6FA0",
          500: "#2D4A78",
          600: "#1E3458",
          700: "#172A46",
          800: "#14213D", // brand primary
          900: "#0F1B33",
          950: "#0A1224",
        },
        gold: {
          50: "#FFF8EB",
          100: "#FEEDC7",
          200: "#FDD98A",
          300: "#FCC44C",
          400: "#FCA311", // brand accent
          500: "#E08E00",
          600: "#B97200",
          700: "#8C5700",
        },
        paper: "#F7F6F3",
        ink: "#1B1F27",
        success: { DEFAULT: "#15803D", light: "#DCFCE7" },
        danger: { DEFAULT: "#DC2626", light: "#FEE2E2" },
        warning: { DEFAULT: "#B45309", light: "#FEF3C7" },
        border: {
          DEFAULT: "#E5E7EB",
          dark: "#22304A",
        },
      },
      fontFamily: {
        display: ["var(--font-sora)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(20, 33, 61, 0.04), 0 1px 6px -1px rgba(20, 33, 61, 0.06)",
        elevated: "0 4px 16px -4px rgba(20, 33, 61, 0.12), 0 2px 6px -2px rgba(20, 33, 61, 0.08)",
        stamp: "0 0 0 2px rgba(252, 163, 17, 0.15)",
      },
      keyframes: {
        "fade-in": { from: { opacity: 0 }, to: { opacity: 1 } },
        "slide-up": { from: { opacity: 0, transform: "translateY(6px)" }, to: { opacity: 1, transform: "translateY(0)" } },
        shimmer: { "0%": { backgroundPosition: "-700px 0" }, "100%": { backgroundPosition: "700px 0" } },
        "stamp-in": {
          "0%": { opacity: 0, transform: "scale(1.5) rotate(-18deg)" },
          "60%": { opacity: 1, transform: "scale(0.95) rotate(-12deg)" },
          "100%": { opacity: 1, transform: "scale(1) rotate(-8deg)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-up": "slide-up 0.25s ease-out",
        shimmer: "shimmer 1.8s infinite linear",
        "stamp-in": "stamp-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [],
};
