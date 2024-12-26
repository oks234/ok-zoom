/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{pug,js}"],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
  ],
};
