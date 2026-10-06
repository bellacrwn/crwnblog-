import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        display: ["var(--font-display)"],
        serif: ["var(--font-serif)"],
        masthead: ["var(--font-blackletter)"],
      },
      colors: {
        // Theme-aware tokens: resolve differently under .theme-newsprint / .theme-walnut
        bg: "var(--bg)",
        bgalt: "var(--bg-alt)",
        panel: "var(--panel)",
        panel2: "var(--panel-2)",
        inset: "var(--panel-inset)",
        ink: "var(--fg)",
        inkstrong: "var(--fg-strong)",
        muted: "var(--muted)",
        faint: "var(--faint)",
        rule: "var(--rule)",
        rulemid: "var(--rule-mid)",
        accent: "var(--accent)",
        brass: "var(--brass)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        bad: "var(--bad)",
        link: "var(--link)",
      },
      letterSpacing: {
        kicker: "0.16em",
      },
    },
  },
  plugins: [],
};
export default config;
