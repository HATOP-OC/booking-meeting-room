module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}"
  ],
  safelist: ["bg-blue-600","text-white","p-3","rounded"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui']
      },
      colors: {
        brand: {
          500: '#2563eb',
          600: '#1e40af'
        }
      }
    },
  },
  plugins: [],
};
