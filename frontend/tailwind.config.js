/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f6f8f6',   // Vert sauge très clair
          100: '#e8ede8',  // Sauge pâle
          200: '#d1dcd1',  // Sauge doux
          300: '#b3c4b3',  // Sauge moyen clair
          400: '#8fa68f',  // Sauge moyen
          500: '#6d8a6d',  // Sauge principal
          600: '#557055',  // Sauge profond (boutons)
          700: '#445944',  // Sauge sombre (hover)
          800: '#364636',  // Forêt profonde
          900: '#2b372b',  // Très sombre
        },
        warm: {
          50: '#fdfaf8',
          100: '#faf5f0',
          200: '#f5ebe0',
          300: '#e8d5c4',
          400: '#d4b5a0',
          500: '#b8917a',
          600: '#9d7461',
          700: '#7f5d4d',
          800: '#624a3e',
          900: '#4a3930',
        },
        sage: {
          50: '#f6f8f6',
          100: '#e8ede8',
          200: '#d1dcd1',
          300: '#b3c4b3',
          400: '#8fa68f',
          500: '#6d8a6d',
          600: '#557055',
          700: '#445944',
          800: '#364636',
          900: '#2b372b',
        }
      },
    },
  },
  plugins: [],
}
