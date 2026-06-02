import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#151311',
        ivory: '#f7f2ea',
        champagne: '#d8bea1',
        moss: '#5a6b57',
        ruby: '#8c2f39',
      },
      boxShadow: {
        luxury: '0 24px 80px rgba(21, 19, 17, 0.14)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;

