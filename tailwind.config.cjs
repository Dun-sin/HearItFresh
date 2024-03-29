/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#008080",
        darkest: "#000A07",
        dark: "#001911",
        medium: "#1A664F",
        gray:"#798683",
        lightest: "#FAFFFD"
      },
      fontSize: {
        f2xs: "var(--step--2)",
        fxs: "var(--step--1)",
        fsm: "var(--step-0)",
        fmd: "var(--step-1)",
        flg: "var(--step-2)",
        fxl: "var(--step-3)",
        f2xl: "var(--step-4)",
        f3xl: "var(--step-5)"
      }
    },
  },
  plugins: [require("@tailwindcss/typography"), require('@tailwindcss/forms')],
}