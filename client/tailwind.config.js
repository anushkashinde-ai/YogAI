/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Wellness palette — sage green, cream, lavender
        sage: {
          50: '#f3f7f4',
          100: '#e3ede6',
          200: '#c7dbcd',
          300: '#a1c1ab',
          400: '#759f83',
          500: '#548262',
          600: '#3f6a4d',
          700: '#33543e',
          800: '#2a4333',
          900: '#22372b',
        },
        lavender: {
          50: '#f7f5fc',
          100: '#efeaf9',
          200: '#ddd3f2',
          300: '#c3b1e7',
          400: '#a68ad8',
          500: '#8b68c7',
          600: '#7450b0',
          700: '#614194',
          800: '#513878',
          900: '#443164',
        },
        cream: {
          50: '#fffefb',
          100: '#fdfaf3',
          200: '#f9f3e6',
          300: '#f3e8d0',
          400: '#e9d6ad',
          500: '#dcbe83',
        },
        // Theme-aware tokens (driven by CSS variables in index.css)
        surface: 'rgb(var(--surface) / <alpha-value>)',
        card: 'rgb(var(--card) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.75rem',
      },
      boxShadow: {
        soft: '0 10px 30px -12px rgb(34 55 43 / 0.18)',
        lift: '0 22px 50px -22px rgb(34 55 43 / 0.35)',
        glow: '0 0 0 1px rgb(139 104 199 / 0.25), 0 18px 40px -18px rgb(139 104 199 / 0.45)',
      },
      backgroundImage: {
        'sage-mist': 'linear-gradient(135deg, #f3f7f4 0%, #efeaf9 55%, #fdfaf3 100%)',
        'aurora': 'radial-gradient(60% 60% at 15% 20%, rgba(139,104,199,0.28) 0%, transparent 60%), radial-gradient(50% 50% at 85% 10%, rgba(117,159,131,0.32) 0%, transparent 62%), radial-gradient(60% 60% at 60% 95%, rgba(233,214,173,0.35) 0%, transparent 65%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.35)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out both',
        breathe: 'breathe 8s ease-in-out infinite',
        float: 'float 7s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
}
