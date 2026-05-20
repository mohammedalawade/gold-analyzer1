/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf9e7',
          100: '#faf0c4',
          200: '#f5e18f',
          300: '#f0d35a',
          400: '#ebc53a',
          500: '#d4af37',
          600: '#b5902f',
          700: '#8f7026',
          800: '#6b541c',
          900: '#463812',
        },
        dark: {
          bg: '#0b0b0f',
          card: '#13131f',
          border: '#2a2a3c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
