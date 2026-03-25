/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["'JetBrains Mono'", "monospace"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: "#18181b",
        elevated: "#27272a",
        overlay: "#3f3f46",
      },
      animation: {
        "pulse-ring": "pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "dash-flow": "dash-flow 1s linear infinite",
        "slide-up-fade": "slide-up-fade 0.3s ease forwards",
        "slide-left-fade": "slide-left-fade 0.2s ease forwards",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)" },
          "70%": { boxShadow: "0 0 0 10px rgba(59, 130, 246, 0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(59, 130, 246, 0)" },
        },
        "dash-flow": {
          to: { strokeDashoffset: "-20" },
        },
        "slide-up-fade": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-left-fade": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
      },
    },
  },
  plugins: [],
};
