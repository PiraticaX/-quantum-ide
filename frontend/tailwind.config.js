/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0B0F14',
          secondary: '#121821',
          panel: '#161C26',
          elevated: '#1A2234',
        },
        accent: {
          blue: '#4F8CFF',
          green: '#7CFFB2',
          warn: '#FFB84F',
          err: '#FF5F5F',
        },
        text: {
          primary: '#E6EDF3',
          secondary: '#9AA4B2',
          muted: '#6B7280',
        },
        border: {
          DEFAULT: '#1E2A3A',
          strong: '#243048',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(4px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        glow: { '0%, 100%': { boxShadow: '0 0 4px rgba(79,140,255,0.3)' }, '50%': { boxShadow: '0 0 12px rgba(79,140,255,0.6)' } },
      },
    },
  },
  plugins: [],
}
