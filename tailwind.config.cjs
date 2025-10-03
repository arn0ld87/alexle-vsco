/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{astro,html,js,ts,jsx,tsx,md,mdx}'
  ],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Inter"',
          '"IBM Plex Sans"',
          'system-ui',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif'
        ]
      },
      colors: {
        surface: {
          DEFAULT: '#0b0c10',
          subtle: '#11131a'
        }
      },
      maxWidth: {
        copy: '65ch'
      }
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
