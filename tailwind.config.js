/** tailwind.config.js */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Example custom colors for theming
      colors: {
        primary: '#080c1b',   // Indigo-like
        secondary: '#080c1b', // Darker Indigo
      },
    },
  },
  plugins: [],
};
