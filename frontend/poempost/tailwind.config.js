/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)'],
        greatvibes: ['var(--font-greatvibes)'],
        cinzel: ['var(--font-cinzel)'],
        indie: ['var(--font-indie)'],
      },
    },
  },
  plugins: [],
}
