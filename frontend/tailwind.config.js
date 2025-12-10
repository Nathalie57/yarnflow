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
          50: '#fef8f4',   // Crème pêche
          100: '#fceee5',  // Pêche très pâle
          200: '#f8d9c5',  // Abricot pâle
          300: '#f2b899',  // Saumon clair
          400: '#e9956b',  // Terracotta clair
          500: '#dd7a4a',  // Terracotta chaud (couleur principale)
          600: '#c86438',  // Terre cuite orangée
          700: '#a8502d',  // Brique chaude
          800: '#884024',  // Rouille
          900: '#6d331e',  // Chocolat chaud
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
