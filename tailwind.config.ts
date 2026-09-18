import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0c0c0e",
        panel: "#151517",
        panel2: "#1b1b1f",
        line: "#2a2a31",
        ink: "#eceae4",
        muted: "#98958c",
        faint: "#6a675f",
        accent: "#c9a25e",
        ok: "#79b892",
        danger: "#d3705d",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
