import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wally / Risiti palette pulled directly from the design source
        ink: "#16261B",
        forest: "#1C4A2A",
        "forest-deep": "#102A1B",
        leaf: "#52B16A",
        "leaf-deep": "#2F8C4B",
        amber: "#EFA03C",
        coral: "#F2885E",
        "coral-bg": "#FDEDE4",
        "coral-border": "#F6C9B2",
        "coral-text": "#9E3A14",
        "coral-text-soft": "#B5552E",
        mist: "#F5F8F5",
        "mist-border": "#E5EBE5",
        "tint-green": "#E5F4E8",
        "tint-green-border": "#BFE6C9",
        "soft-green": "#F2F7F2",
        muted: "#8B948C",
        "muted-2": "#9AA39C",
        "muted-3": "#6A7A6E",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        phone: "48px",
      },
    },
  },
  plugins: [],
};

export default config;
