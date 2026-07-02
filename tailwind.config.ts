import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // dark NEUTRAL base (warm-graphite, deliberately not generic dark-blue)
        bg: "#0B0C0E",
        bg2: "#101216",
        panel: "#15181C",
        panel2: "#1B1F24",
        line: "#262B31",
        line2: "#333A42",
        ink: "#E8EBEF",
        muted: "#9BA4AE",
        faint: "#5C656F",
        // status colors (carry meaning only)
        critical: "#F2544B",
        degraded: "#E7A23B",
        verified: "#41C083",
        evidence: "#46B7C6",
        signal: "#8E9BFF", // restrained accent for selection/primary
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Inter", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "Liberation Mono", "monospace"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }],
      },
      borderRadius: { DEFAULT: "4px", md: "6px", lg: "8px" },
      boxShadow: {
        panel: "0 1px 0 rgba(255,255,255,0.02) inset, 0 8px 24px -16px rgba(0,0,0,0.8)",
        pop: "0 24px 60px -24px rgba(0,0,0,0.85)",
        glowsel: "0 0 0 1px rgba(142,155,255,0.5), 0 0 22px -6px rgba(142,155,255,0.45)",
      },
      keyframes: {
        shimmer: { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        pulsedot: { "0%,100%": { opacity: "0.35" }, "50%": { opacity: "1" } },
        riseIn: { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        pulsedot: "pulsedot 1.5s ease-in-out infinite",
        riseIn: "riseIn 0.28s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
