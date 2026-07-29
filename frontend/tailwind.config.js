/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FAF7F0",
        ink: "#1C1B19",
        accent: "#0F6B5C",
        accentDark: "#0B4F44",
        rust: "#B3401D",
        muted: "#8A8478",
        line: "#DEDACD",
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'Space Grotesk'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
