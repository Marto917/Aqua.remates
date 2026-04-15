import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#14b8a8",
          dark: "#0f766e",
          light: "#ccfbf1",
          muted: "#f0fdfa",
        },
      },
    },
  },
  plugins: [],
};

export default config;
