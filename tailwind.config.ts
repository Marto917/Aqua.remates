import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "var(--color-brand, #14b8a8)",
          dark: "var(--color-brand-dark, #0f766e)",
          light: "var(--color-brand-light, #ccfbf1)",
          muted: "var(--color-brand-muted, #f0fdfa)",
        },
      },
    },
  },
  plugins: [],
};

export default config;
