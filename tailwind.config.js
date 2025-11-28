import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ios: {
          background: '#f2f2f7',
          surface: '#ffffff',
          border: '#d1d1d6',
          text: '#1c1c1e',
          muted: '#8e8e93',
          primary: '#ff7d41',
          primaryMuted: '#ffe4d4',
          secondary: '#0a84ff',
          success: '#34c759',
          danger: '#ff3b30',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          ...defaultTheme.fontFamily.sans,
        ],
      },
      boxShadow: {
        card: '0 15px 30px rgba(28, 28, 30, 0.08)',
        soft: '0 8px 20px rgba(28, 28, 30, 0.06)',
        inset: 'inset 0 1px 0 rgba(255, 255, 255, 0.6)',
      },
      borderRadius: {
        ios: '24px',
        pill: '999px',
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
        safeTop: 'env(safe-area-inset-top)',
      },
    },
  },
  plugins: [],
}

