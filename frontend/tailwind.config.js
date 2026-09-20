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
        },
        // [AI:Claude] 2026-09-18 — Palette de la charte graphique YarnFlow
        // (voir memoire yarnflow_ui_charte_graphique), valeurs exactes de la
        // section 6. Remplace les anciens hex de `flow.*` qui ne
        // correspondaient pas a la charte. Cree en plus de `primary`/`sage`/
        // `warm` (deja utilises dans l'app) plutot qu'a leur place, pour ne
        // rien casser tant que les ecrans n'ont pas ete repris un par un.
        flow: {
          sage: '#A9C9B0',
          mint: '#DCEBE0',
          coral: '#F59B9B',
          yellow: '#F5C96B',
          blue: '#A9CDD8',
          peach: '#F8D9B4',
          lavender: '#D8D2EA',
          cream: '#FFF8EA',
          ink: '#26363B',
        },
      },
      // Rayons de la charte (section 9) : cards 16-20px, boutons/champs
      // 12-16px, badges tres arrondis (pill deja couvert par rounded-full).
      borderRadius: {
        card: '1.25rem',
        control: '0.875rem',
      },
      fontFamily: {
        // Section 8 : sans-serif ronde mais adulte, recommandation Nunito
        // Sans. Fallback sur la pile sans par defaut de Tailwind si la
        // police Google ne charge pas.
        sans: ['"Nunito Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
