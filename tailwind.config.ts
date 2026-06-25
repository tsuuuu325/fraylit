import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0b0d',
          900: '#111114',
          800: '#1a1a1f',
          700: '#26262d',
          600: '#3a3a44'
        },
        parchment: {
          DEFAULT: '#f4f1ea',
          muted: '#b9b4a8',
          dim: '#8a857a'
        },
        accent: {
          DEFAULT: '#c8a35b',
          soft: '#e0c485'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-playfair)', 'Georgia', 'serif']
      },
      maxWidth: {
        prose: '42rem'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out'
      }
    }
  },
  plugins: []
};

export default config;
