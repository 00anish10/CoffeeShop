import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        espresso: {
          DEFAULT: '#1C0A00',
          light: '#3D1A00',
        },
        caramel: {
          DEFAULT: '#C68642',
          light: '#D4A057',
          dark: '#A06C2E',
          50: '#FDF0E0',
        },
        cream: {
          DEFAULT: '#FDF6E3',
          dark: '#F0E6CC',
        },
        latte: {
          DEFAULT: '#E8D5B7',
          dark: '#D4BE97',
        },
        matcha: {
          DEFAULT: '#4A7C59',
          light: '#6B9E78',
          50: '#E8F5ED',
        },
        berry: {
          DEFAULT: '#C0392B',
          50: '#FDECEA',
        },
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        cursive: ['Dancing Script', 'cursive'],
      },
      animation: {
        steam: 'steam 3s ease-in-out infinite',
        'steam-delayed': 'steam 3s ease-in-out 0.5s infinite',
        'steam-slow': 'steam 3s ease-in-out 1s infinite',
        'fade-up': 'fadeUp 0.6s ease-out both',
        'fade-up-delayed': 'fadeUp 0.6s ease-out 0.2s both',
        shimmer: 'shimmer 1.5s infinite linear',
        'pulse-ring': 'pulseRing 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both',
        'slide-in-right': 'slideInRight 0.35s cubic-bezier(0.4,0,0.2,1)',
        'check-draw': 'checkDraw 0.6s ease-out 0.3s both',
      },
      keyframes: {
        steam: {
          '0%,100%': { opacity: '0.3', transform: 'translateY(0) scaleX(1)' },
          '50%': { opacity: '0.7', transform: 'translateY(-16px) scaleX(1.3)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(198,134,66,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(198,134,66,0)' },
        },
        bounceIn: {
          from: { opacity: '0', transform: 'scale(0.6)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        checkDraw: {
          from: { strokeDashoffset: '100' },
          to: { strokeDashoffset: '0' },
        },
      },
      boxShadow: {
        card: '0 4px 16px -4px rgba(28,10,0,0.08)',
        'card-hover': '0 20px 40px -8px rgba(28,10,0,0.15)',
        drawer: '-8px 0 32px rgba(28,10,0,0.12)',
        caramel: '0 4px 16px rgba(198,134,66,0.3)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
} satisfies Config
