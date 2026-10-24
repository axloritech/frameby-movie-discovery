import type { Config } from "tailwindcss";

// Tailwind provides the project's base layer; the cinematic component styling
// is intentionally kept in app/globals.css to avoid a runtime styling dependency.
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#080b0e", panel: "#101519", accent: "#f04452" } } },
};
export default config;
