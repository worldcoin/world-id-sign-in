const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sora: ["var(--font-sora)", "sans-serif"],
        rubik: ["var(--font-rubik)", "sans-serif"],
        ibm: ["var(--font-mono)", "monospace"],
      },
      colors: {
        background: "#F7F7F7",
        danger: {
          DEFAULT: "#FF6848",
          light: "#FFF0ED",
        },
        text: {
          DEFAULT: "#191C20",
          muted: "#657080",
        },
        gray: {
          100: "#F3F4F5",
          200: "#EBECEF",
          400: "#9BA3AE",
        },
        code: {
          DEFAULT: "#CF5834",
        },
      },
    },
  },
  plugins: [],
};
