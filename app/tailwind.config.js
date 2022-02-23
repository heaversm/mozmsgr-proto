module.exports = {
  content: [],
  theme: {
    extend: {},
  },
  plugins: [],
  purge: ["./public/index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"], //remove unused utility classes from tailwind
};
