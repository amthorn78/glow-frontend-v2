/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dating app color palette
        glow: {
          pink: '#ec4899',      // Primary pink
          purple: '#8b5cf6',    // Secondary purple  
          orange: '#f97316',    // Accent orange
          rose: '#f43f5e',      // Rose accent
        },
        // Dark theme colors
        dark: {
          bg: '#0f0f23',        // Dark background
          surface: '#1a1a2e',   // Dark surface
          border: '#16213e',    // Dark borders
        }
      },
      animation: {
        // Dating app specific animations
        'swipe-left': 'swipeLeft 0.3s ease-out forwards',
        'swipe-right': 'swipeRight 0.3s ease-out forwards',
        'match-celebration': 'matchCelebration 1s ease-out',
        'heart-beat': 'heartBeat 1.5s ease-in-out infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        swipeLeft: {
          'to': { 
            transform: 'translateX(-100%) rotate(-30deg)', 
            opacity: '0' 
          }
        },
        swipeRight: {
          'to': { 
            transform: 'translateX(100%) rotate(30deg)', 
            opacity: '0' 
          }
        },
        matchCelebration: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' }
        },
        heartBeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' }
        },
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' }
        },
        slideUp: {
          'from': { transform: 'translateY(100%)' },
          'to': { transform: 'translateY(0)' }
        },
        slideDown: {
          'from': { transform: 'translateY(-100%)' },
          'to': { transform: 'translateY(0)' }
        }
      },
      screens: {
        'xs': '475px',
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 600px)' },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(236, 72, 153, 0.3)',
        'glow-lg': '0 0 40px rgba(236, 72, 153, 0.4)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [
    // Add form plugin for better form styling
    function({ addUtilities }) {
      addUtilities({
        '.touch-target': {
          'min-height': '44px',
          'min-width': '44px',
        },
        '.gradient-glow': {
          'background': 'linear-gradient(135deg, #ec4899, #8b5cf6)',
        },
        '.gradient-glow-orange': {
          'background': 'linear-gradient(135deg, #f97316, #f43f5e)',
        },
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #ec4899, #8b5cf6)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
      })
    }
  ],
}

