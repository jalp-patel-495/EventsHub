/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: 'var(--bg-color)',
          card: 'var(--card-color)',
          border: 'var(--border-color)',
          text: 'var(--text-color)',
          muted: 'var(--muted-color)'
        },
        brand: {
          primary: '#F84464',  // BookMyShow Rose Red
          secondary: '#3B82F6',// Sapphire Blue
          purple: '#8B5CF6',   // Deep purple accent
        },
        emerald: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#F84464', // BookMyShow Rose Red
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        teal: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          300: '#fda4af',
          400: '#fb7185',
          500: '#f43f5e', // Darker rose for gradient
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-hover': '0 8px 32px 0 rgba(16, 185, 129, 0.15)',
      }
    },
  },
  plugins: [],
}
