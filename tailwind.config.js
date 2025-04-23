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
        primary: '#041320',   // Indigo-like
        secondary: '#041320', // Darker Indigo
      },
    },
  },
  plugins: [],
};
