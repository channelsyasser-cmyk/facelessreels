import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0D0F13",
          50: "#F5F5F6",
          800: "#171922",
          900: "#0D0F13",
        },
        surface: {
          DEFAULT: "#15171F",
          raised: "#1C1F2A",
          border: "#272A35",
        },
        ember: {
          DEFAULT: "#FF6A3D",
          soft: "#FFB199",
          dim: "#7A3320",
        },
        mint: "#35C28F",
        amberwarn: "#F5B94D",
        danger: "#FF5C6C",
        ink2: "#9195A3",
      },
      fontFamily: {
        display: [
          "ui-sans-serif",
          "-apple-system",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        body: [
          "-apple-system",
          "Segoe UI",
          "system-ui",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        tightest: "-0.045em",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,106,61,0.25), 0 8px 30px -8px rgba(255,106,61,0.35)",
      },
      borderRadius: {
        xl2: "1.15rem",
      },
    },
  },
  plugins: [],
};

export default config;
