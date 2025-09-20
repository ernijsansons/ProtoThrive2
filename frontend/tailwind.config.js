/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom Neon Colors
        'neon-blue': {
          primary: '#00D2FF',
          secondary: '#0099CC', 
          light: '#33DDFF',
          dark: '#0088BB',
        },
        'neon-green': {
          primary: '#00FF88',
          secondary: '#00CC66',
          light: '#33FF99',
          dark: '#00BB55',
        },
        'neon-purple': '#BB00FF',
        'neon-cyan': '#00FFDD',
        'neon-pink': '#FF0088',
        'neon-orange': '#FF6600',
      },
      backgroundImage: {
        'gradient-blue': 'linear-gradient(135deg, #00D2FF 0%, #0099CC 100%)',
        'gradient-green': 'linear-gradient(135deg, #00FF88 0%, #00CC66 100%)',
        'gradient-dark': 'linear-gradient(135deg, #0A0A0B 0%, #1A1A1B 100%)',
        'gradient-neon-mix': 'linear-gradient(135deg, #00D2FF 0%, #00FF88 100%)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow-blue': '0 0 20px #00D2FF',
        'glow-green': '0 0 20px #00FF88',
        'glow-purple': '0 0 20px #BB00FF',
        'glow-intense-blue': '0 0 40px #00D2FF, 0 0 80px #00D2FF',
        'glow-intense-green': '0 0 40px #00FF88, 0 0 80px #00FF88',
        'glow-neon': '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
      },
      animation: {
        'neon-glow': 'neonGlow 2s ease-in-out infinite',
        'neon-pulse': 'neonPulse 2s ease-in-out infinite',
        'neon-flicker': 'neonFlicker 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 4s ease-in-out infinite',
        'slide-in-left': 'slideInFromLeft 0.8s ease-out forwards',
        'slide-in-right': 'slideInFromRight 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'scale-in': 'scaleIn 0.6s ease-out forwards',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounce 2s infinite',
      },
      keyframes: {
        neonGlow: {
          '0%, 100%': {
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor'
          },
          '50%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor'
          }
        },
        neonPulse: {
          '0%, 100%': {
            boxShadow: '0 0 20px #00D2FF'
          },
          '50%': {
            boxShadow: '0 0 40px #00D2FF, 0 0 80px #00D2FF'
          }
        },
        neonFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' }
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        },
        slideInFromLeft: {
          '0%': {
            transform: 'translateX(-100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        slideInFromRight: {
          '0%': {
            transform: 'translateX(100%)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateX(0)',
            opacity: '1'
          }
        },
        fadeInUp: {
          '0%': {
            transform: 'translateY(30px)',
            opacity: '0'
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1'
          }
        },
        scaleIn: {
          '0%': {
            transform: 'scale(0.8)',
            opacity: '0'
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1'
          }
        }
      },
      fontFamily: {
        'elite': ['Inter', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
      backgroundSize: {
        '300%': '300%',
        '400%': '400%',
      }
    },
  },
  plugins: [],
};