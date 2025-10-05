/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#1a1a1a",
        surface: "#2c2c2c",
        primary: "#4a90e2",
        "text-primary": "#ffffff",
        "text-secondary": "#a0a0a0",
        positive: "#4caf50",
        negative: "#f44336",
        warning: "#ffc107",
      },
      fontFamily: { sans: ["Inter", "sans-serif"] },
    },
  },
  plugins: [],
}