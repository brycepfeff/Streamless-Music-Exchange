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
        primary: '	#0052FF',   // Indigo-like
        secondary: '	#0052FF', // Darker Indigo
      },
    },
  },
  plugins: [],
};
