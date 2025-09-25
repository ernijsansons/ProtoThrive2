/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}', './pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Enhanced color palette for better design system
      colors: {
        // Primary brand colors
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Success states
        success: {
          50: '#f0fff4',
          500: '#10b981',
          600: '#059669',
        },
        // Warning states
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        // Error states
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Neon theme colors for the "thermonuclear" aesthetic
        neon: {
          cyan: '#00ffff',
          pink: '#ff00ff',
          green: '#39ff14',
          blue: '#1b03a3',
        },
        // Enhanced grays for better contrast ratios
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        }
      },
      // Enhanced typography scale
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
      },
      // Enhanced spacing scale
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Animation and transitions
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-neon': 'pulseNeon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseNeon: {
          '0%, 100%': {
            boxShadow: '0 0 5px #00ffff, 0 0 10px #00ffff, 0 0 15px #00ffff',
          },
          '50%': {
            boxShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #00ffff',
          },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      // Enhanced border radius
      borderRadius: {
        '4xl': '2rem',
      },
      // Enhanced shadows for depth
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 20px 0 rgba(0, 0, 0, 0.12)',
        'hard': '0 8px 30px 0 rgba(0, 0, 0, 0.16)',
        'neon': '0 0 5px theme(colors.neon.cyan), 0 0 10px theme(colors.neon.cyan)',
        'neon-pink': '0 0 5px theme(colors.neon.pink), 0 0 10px theme(colors.neon.pink)',
      },
      // Responsive breakpoints optimization
      screens: {
        'xs': '475px',
        '3xl': '1680px',
      },
    },
  },
  plugins: [
    // Add forms plugin for better form styling
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    // Custom utility plugins for accessibility and modern patterns
    function({ addUtilities, addComponents, theme }) {
      // Focus utilities for accessibility
      addUtilities({
        '.focus-visible-ring': {
          '&:focus-visible': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme('colors.primary.500')}`,
            borderRadius: theme('borderRadius.md'),
          },
        },
        '.sr-only-focusable': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
          '&:active, &:focus': {
            position: 'static',
            width: 'auto',
            height: 'auto',
            padding: 'inherit',
            margin: 'inherit',
            overflow: 'visible',
            clip: 'auto',
            whiteSpace: 'inherit',
          },
        },
        '.neon-glow': {
          boxShadow: theme('boxShadow.neon'),
        },
        '.neon-text': {
          color: theme('colors.neon.cyan'),
          textShadow: `0 0 10px ${theme('colors.neon.cyan')}`,
        },
      });

      // Component patterns
      addComponents({
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: theme('borderRadius.md'),
          fontWeight: theme('fontWeight.medium'),
          fontSize: theme('fontSize.sm'),
          lineHeight: theme('lineHeight.5'),
          padding: `${theme('spacing.2')} ${theme('spacing.4')}`,
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'pointer',
          '&:focus-visible': {
            outline: 'none',
            boxShadow: `0 0 0 2px ${theme('colors.primary.500')}`,
          },
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.soft'),
          padding: theme('spacing.6'),
          border: `1px solid ${theme('colors.gray.200')}`,
        },
        '.card-dark': {
          backgroundColor: theme('colors.gray.800'),
          borderColor: theme('colors.gray.700'),
          color: theme('colors.gray.100'),
        },
      });
    },
  ],
};