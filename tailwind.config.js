/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stitch: {
          teal: '#00897B',
          'teal-dark': '#00796B',
          'teal-light': '#E0F2F1',
          bg: '#F8F9FA',
          border: '#E0E3E7',
          dark: '#202124',
          grey: '#5F6368',
        },
        brand: {
          green: '#00897B', // Redefining brand-green to Stitch Teal
          red: '#ff4b4b',
          yellow: '#FB8C00',
          blue: '#1967D2',
          purple: '#ce82ff',
          text: '#202124',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'stitch': '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1)',
        'stitch-hover': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      }
    },
  },
  plugins: [],
}
