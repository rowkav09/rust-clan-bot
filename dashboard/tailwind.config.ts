import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        rust: {
          50:  '#fff5f0',
          100: '#ffe6d9',
          200: '#ffc5a8',
          300: '#ff9d72',
          400: '#ff6b35',
          500: '#e8622a',
          600: '#c94e1c',
          700: '#a83c12',
          800: '#872e0d',
          900: '#6e2509',
        },
        dark: {
          900: '#07080a',
          800: '#0a0b0e',
          700: '#0f1014',
          600: '#131519',
          500: '#1a1c22',
          400: '#22252e',
          300: '#2d3140',
          200: '#3d4255',
          100: '#4f546a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'rust-gradient': 'linear-gradient(135deg, #e8622a 0%, #c94e1c 100%)',
        'dark-gradient': 'linear-gradient(180deg, #0a0b0e 0%, #0f1014 100%)',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-orange': 'pulseOrange 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(232, 98, 42, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(232, 98, 42, 0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
