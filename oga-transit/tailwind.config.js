/** @type {import('tailwindcss').Config} */
export default {
  // Tell Tailwind WHERE your components are
  // so it only generates the CSS classes you actually use
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // You can add custom colors, fonts, etc. here later
    },
  },
  plugins: [],
}
