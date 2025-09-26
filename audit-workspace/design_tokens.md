# ProtoThrive Design Tokens Specification

**Version:** 1.0.0  
**Date:** September 25, 2025  
**Format:** CSS Custom Properties / Design Tokens  

---

## Design Token Implementation

### CSS Custom Properties (Recommended)

```css
/* design-tokens.css */
:root {
  /* ===============================================
     COLOR TOKENS
     =============================================== */
  
  /* Brand Colors */
  --color-brand-primary: #007AFF;
  --color-brand-secondary: #5856D6;
  --color-brand-tertiary: #FF9500;
  
  /* Primary Palette - Blue */
  --color-primary-50: #E3F2FF;
  --color-primary-100: #BAE0FF;
  --color-primary-200: #8CCBFF;
  --color-primary-300: #5EB5FF;
  --color-primary-400: #3BA5FF;
  --color-primary-500: #007AFF;
  --color-primary-600: #0066DB;
  --color-primary-700: #0052B7;
  --color-primary-800: #003F93;
  --color-primary-900: #002A6F;
  --color-primary-950: #001840;
  
  /* Neutral Palette - Gray */
  --color-neutral-0: #FFFFFF;
  --color-neutral-50: #FAFAFA;
  --color-neutral-100: #F5F5F5;
  --color-neutral-200: #E5E5E5;
  --color-neutral-300: #D4D4D4;
  --color-neutral-400: #A3A3A3;
  --color-neutral-500: #737373;
  --color-neutral-600: #525252;
  --color-neutral-700: #404040;
  --color-neutral-800: #262626;
  --color-neutral-900: #171717;
  --color-neutral-950: #0A0A0A;
  
  /* Semantic Colors - Success */
  --color-success-50: #F0FDF4;
  --color-success-100: #DCFCE7;
  --color-success-200: #BBF7D0;
  --color-success-300: #86EFAC;
  --color-success-400: #4ADE80;
  --color-success-500: #34C759;
  --color-success-600: #16A34A;
  --color-success-700: #15803D;
  --color-success-800: #166534;
  --color-success-900: #14532D;
  
  /* Semantic Colors - Warning */
  --color-warning-50: #FFFBEB;
  --color-warning-100: #FEF3C7;
  --color-warning-200: #FDE68A;
  --color-warning-300: #FCD34D;
  --color-warning-400: #FBBF24;
  --color-warning-500: #FF9500;
  --color-warning-600: #D97706;
  --color-warning-700: #B45309;
  --color-warning-800: #92400E;
  --color-warning-900: #78350F;
  
  /* Semantic Colors - Danger/Error */
  --color-danger-50: #FEF2F2;
  --color-danger-100: #FEE2E2;
  --color-danger-200: #FECACA;
  --color-danger-300: #FCA5A5;
  --color-danger-400: #F87171;
  --color-danger-500: #FF3B30;
  --color-danger-600: #DC2626;
  --color-danger-700: #B91C1C;
  --color-danger-800: #991B1B;
  --color-danger-900: #7F1D1D;
  
  /* Semantic Colors - Info */
  --color-info-50: #EFF6FF;
  --color-info-100: #DBEAFE;
  --color-info-200: #BFDBFE;
  --color-info-300: #93C5FD;
  --color-info-400: #60A5FA;
  --color-info-500: #5856D6;
  --color-info-600: #2563EB;
  --color-info-700: #1D4ED8;
  --color-info-800: #1E40AF;
  --color-info-900: #1E3A8A;
  
  /* Functional Colors */
  --color-background: var(--color-neutral-0);
  --color-background-secondary: var(--color-neutral-50);
  --color-surface: var(--color-neutral-0);
  --color-surface-hover: var(--color-neutral-50);
  --color-surface-active: var(--color-neutral-100);
  --color-border: var(--color-neutral-200);
  --color-border-hover: var(--color-neutral-300);
  --color-border-focus: var(--color-primary-500);
  
  /* Text Colors */
  --color-text-primary: var(--color-neutral-900);
  --color-text-secondary: var(--color-neutral-600);
  --color-text-tertiary: var(--color-neutral-500);
  --color-text-disabled: var(--color-neutral-400);
  --color-text-inverse: var(--color-neutral-0);
  --color-text-link: var(--color-primary-600);
  --color-text-link-hover: var(--color-primary-700);
  --color-text-success: var(--color-success-700);
  --color-text-warning: var(--color-warning-700);
  --color-text-danger: var(--color-danger-700);
  
  /* ===============================================
     TYPOGRAPHY TOKENS
     =============================================== */
  
  /* Font Families */
  --font-family-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Ubuntu', sans-serif;
  --font-family-serif: 'Georgia', 'Cambria', 'Times New Roman', serif;
  --font-family-mono: 'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace;
  
  /* Font Sizes - Desktop */
  --font-size-2xs: 0.625rem;   /* 10px */
  --font-size-xs: 0.75rem;     /* 12px */
  --font-size-sm: 0.875rem;    /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg: 1.125rem;    /* 18px */
  --font-size-xl: 1.25rem;     /* 20px */
  --font-size-2xl: 1.5rem;     /* 24px */
  --font-size-3xl: 1.875rem;   /* 30px */
  --font-size-4xl: 2.25rem;    /* 36px */
  --font-size-5xl: 3rem;       /* 48px */
  --font-size-6xl: 3.75rem;    /* 60px */
  --font-size-7xl: 4.5rem;     /* 72px */
  
  /* Fluid Font Sizes (Responsive) */
  --font-size-fluid-sm: clamp(0.875rem, 0.825rem + 0.25vw, 1rem);
  --font-size-fluid-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --font-size-fluid-lg: clamp(1.125rem, 1.05rem + 0.375vw, 1.25rem);
  --font-size-fluid-xl: clamp(1.5rem, 1.375rem + 0.625vw, 2rem);
  --font-size-fluid-2xl: clamp(2rem, 1.75rem + 1.25vw, 3rem);
  --font-size-fluid-3xl: clamp(2.5rem, 2rem + 2.5vw, 4.5rem);
  
  /* Font Weights */
  --font-weight-thin: 100;
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-extrabold: 800;
  --font-weight-black: 900;
  
  /* Line Heights */
  --line-height-none: 1;
  --line-height-tight: 1.25;
  --line-height-snug: 1.375;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.625;
  --line-height-loose: 1.75;
  --line-height-extra-loose: 2;
  
  /* Letter Spacing */
  --letter-spacing-tighter: -0.05em;
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
  --letter-spacing-wider: 0.05em;
  --letter-spacing-widest: 0.1em;
  
  /* ===============================================
     SPACING TOKENS
     =============================================== */
  
  /* Base Spacing Scale */
  --spacing-0: 0;              /* 0px */
  --spacing-0-25: 0.0625rem;   /* 1px */
  --spacing-0-5: 0.125rem;     /* 2px */
  --spacing-1: 0.25rem;        /* 4px */
  --spacing-1-5: 0.375rem;     /* 6px */
  --spacing-2: 0.5rem;         /* 8px */
  --spacing-2-5: 0.625rem;     /* 10px */
  --spacing-3: 0.75rem;        /* 12px */
  --spacing-3-5: 0.875rem;     /* 14px */
  --spacing-4: 1rem;           /* 16px */
  --spacing-5: 1.25rem;        /* 20px */
  --spacing-6: 1.5rem;         /* 24px */
  --spacing-7: 1.75rem;        /* 28px */
  --spacing-8: 2rem;           /* 32px */
  --spacing-9: 2.25rem;        /* 36px */
  --spacing-10: 2.5rem;        /* 40px */
  --spacing-11: 2.75rem;       /* 44px */
  --spacing-12: 3rem;          /* 48px */
  --spacing-14: 3.5rem;        /* 56px */
  --spacing-16: 4rem;          /* 64px */
  --spacing-20: 5rem;          /* 80px */
  --spacing-24: 6rem;          /* 96px */
  --spacing-28: 7rem;          /* 112px */
  --spacing-32: 8rem;          /* 128px */
  --spacing-36: 9rem;          /* 144px */
  --spacing-40: 10rem;         /* 160px */
  
  /* Component Spacing */
  --spacing-component-xs: var(--spacing-2);
  --spacing-component-sm: var(--spacing-3);
  --spacing-component-md: var(--spacing-4);
  --spacing-component-lg: var(--spacing-6);
  --spacing-component-xl: var(--spacing-8);
  
  /* Layout Spacing */
  --spacing-layout-xs: var(--spacing-4);
  --spacing-layout-sm: var(--spacing-6);
  --spacing-layout-md: var(--spacing-8);
  --spacing-layout-lg: var(--spacing-12);
  --spacing-layout-xl: var(--spacing-16);
  
  /* ===============================================
     SIZE TOKENS
     =============================================== */
  
  /* Container Widths */
  --size-container-xs: 20rem;     /* 320px */
  --size-container-sm: 24rem;     /* 384px */
  --size-container-md: 28rem;     /* 448px */
  --size-container-lg: 32rem;     /* 512px */
  --size-container-xl: 36rem;     /* 576px */
  --size-container-2xl: 42rem;    /* 672px */
  --size-container-3xl: 48rem;    /* 768px */
  --size-container-4xl: 56rem;    /* 896px */
  --size-container-5xl: 64rem;    /* 1024px */
  --size-container-6xl: 72rem;    /* 1152px */
  --size-container-7xl: 80rem;    /* 1280px */
  --size-container-full: 100%;
  
  /* Component Heights */
  --size-height-xs: 1.5rem;       /* 24px */
  --size-height-sm: 2rem;         /* 32px */
  --size-height-md: 2.5rem;       /* 40px */
  --size-height-lg: 3rem;         /* 48px */
  --size-height-xl: 3.5rem;       /* 56px */
  
  /* Icon Sizes */
  --size-icon-xs: 0.75rem;        /* 12px */
  --size-icon-sm: 1rem;           /* 16px */
  --size-icon-md: 1.25rem;        /* 20px */
  --size-icon-lg: 1.5rem;         /* 24px */
  --size-icon-xl: 2rem;           /* 32px */
  --size-icon-2xl: 2.5rem;        /* 40px */
  
  /* Avatar Sizes */
  --size-avatar-xs: 1.5rem;       /* 24px */
  --size-avatar-sm: 2rem;         /* 32px */
  --size-avatar-md: 2.5rem;       /* 40px */
  --size-avatar-lg: 3rem;         /* 48px */
  --size-avatar-xl: 4rem;         /* 64px */
  --size-avatar-2xl: 5rem;        /* 80px */
  
  /* ===============================================
     BORDER TOKENS
     =============================================== */
  
  /* Border Widths */
  --border-width-0: 0;
  --border-width-1: 1px;
  --border-width-2: 2px;
  --border-width-4: 4px;
  --border-width-8: 8px;
  
  /* Border Radius */
  --radius-none: 0;
  --radius-xs: 0.125rem;         /* 2px */
  --radius-sm: 0.25rem;          /* 4px */
  --radius-md: 0.375rem;         /* 6px */
  --radius-lg: 0.5rem;           /* 8px */
  --radius-xl: 0.75rem;          /* 12px */
  --radius-2xl: 1rem;            /* 16px */
  --radius-3xl: 1.5rem;          /* 24px */
  --radius-full: 9999px;
  
  /* Component Border Radius */
  --radius-button: var(--radius-md);
  --radius-input: var(--radius-md);
  --radius-card: var(--radius-lg);
  --radius-modal: var(--radius-xl);
  --radius-badge: var(--radius-full);
  --radius-avatar: var(--radius-full);
  
  /* ===============================================
     SHADOW TOKENS
     =============================================== */
  
  /* Box Shadows */
  --shadow-none: none;
  --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  --shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
  
  /* Colored Shadows */
  --shadow-primary: 0 4px 14px 0 rgba(0, 122, 255, 0.25);
  --shadow-success: 0 4px 14px 0 rgba(52, 199, 89, 0.25);
  --shadow-warning: 0 4px 14px 0 rgba(255, 149, 0, 0.25);
  --shadow-danger: 0 4px 14px 0 rgba(255, 59, 48, 0.25);
  
  /* Focus Shadows */
  --shadow-focus: 0 0 0 3px rgba(0, 122, 255, 0.25);
  --shadow-focus-danger: 0 0 0 3px rgba(255, 59, 48, 0.25);
  
  /* ===============================================
     ANIMATION TOKENS
     =============================================== */
  
  /* Durations */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 350ms;
  --duration-slower: 500ms;
  --duration-slowest: 1000ms;
  
  /* Easings */
  --easing-linear: linear;
  --easing-in: cubic-bezier(0.4, 0, 1, 1);
  --easing-out: cubic-bezier(0, 0, 0.2, 1);
  --easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  --easing-elastic: cubic-bezier(0.68, -0.55, 0.265, 1.55);
  
  /* Transitions */
  --transition-none: none;
  --transition-all: all var(--duration-normal) var(--easing-in-out);
  --transition-colors: background-color var(--duration-normal) var(--easing-in-out),
                      border-color var(--duration-normal) var(--easing-in-out),
                      color var(--duration-normal) var(--easing-in-out),
                      fill var(--duration-normal) var(--easing-in-out),
                      stroke var(--duration-normal) var(--easing-in-out);
  --transition-opacity: opacity var(--duration-normal) var(--easing-in-out);
  --transition-shadow: box-shadow var(--duration-normal) var(--easing-in-out);
  --transition-transform: transform var(--duration-normal) var(--easing-in-out);
  
  /* ===============================================
     Z-INDEX TOKENS
     =============================================== */
  
  --z-index-negative: -1;
  --z-index-0: 0;
  --z-index-10: 10;
  --z-index-20: 20;
  --z-index-30: 30;
  --z-index-40: 40;
  --z-index-50: 50;
  --z-index-dropdown: 1000;
  --z-index-sticky: 1020;
  --z-index-fixed: 1030;
  --z-index-modal-backdrop: 1040;
  --z-index-modal: 1050;
  --z-index-popover: 1060;
  --z-index-tooltip: 1070;
  --z-index-notification: 1080;
  
  /* ===============================================
     BREAKPOINT TOKENS
     =============================================== */
  
  --breakpoint-xs: 0;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
  
  /* ===============================================
     OPACITY TOKENS
     =============================================== */
  
  --opacity-0: 0;
  --opacity-5: 0.05;
  --opacity-10: 0.1;
  --opacity-20: 0.2;
  --opacity-25: 0.25;
  --opacity-30: 0.3;
  --opacity-40: 0.4;
  --opacity-50: 0.5;
  --opacity-60: 0.6;
  --opacity-70: 0.7;
  --opacity-75: 0.75;
  --opacity-80: 0.8;
  --opacity-90: 0.9;
  --opacity-95: 0.95;
  --opacity-100: 1;
}

/* ===============================================
   DARK MODE TOKENS
   =============================================== */

[data-theme="dark"] {
  /* Override colors for dark mode */
  --color-background: var(--color-neutral-900);
  --color-background-secondary: var(--color-neutral-800);
  --color-surface: var(--color-neutral-800);
  --color-surface-hover: var(--color-neutral-700);
  --color-surface-active: var(--color-neutral-600);
  --color-border: var(--color-neutral-700);
  --color-border-hover: var(--color-neutral-600);
  
  --color-text-primary: var(--color-neutral-50);
  --color-text-secondary: var(--color-neutral-300);
  --color-text-tertiary: var(--color-neutral-400);
  --color-text-disabled: var(--color-neutral-600);
  
  /* Adjust shadows for dark mode */
  --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px -1px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -2px rgba(0, 0, 0, 0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
}

/* ===============================================
   MEDIA QUERY HELPERS
   =============================================== */

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-instant: 0ms;
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
    --duration-slower: 0ms;
    --duration-slowest: 0ms;
  }
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* Auto dark mode based on system preference */
    --color-background: var(--color-neutral-900);
    --color-text-primary: var(--color-neutral-50);
    /* ... other dark mode overrides */
  }
}
```

---

## JavaScript/TypeScript Token Export

```typescript
// design-tokens.ts

export const tokens = {
  colors: {
    primary: {
      50: '#E3F2FF',
      100: '#BAE0FF',
      200: '#8CCBFF',
      300: '#5EB5FF',
      400: '#3BA5FF',
      500: '#007AFF',
      600: '#0066DB',
      700: '#0052B7',
      800: '#003F93',
      900: '#002A6F',
    },
    neutral: {
      0: '#FFFFFF',
      50: '#FAFAFA',
      100: '#F5F5F5',
      200: '#E5E5E5',
      300: '#D4D4D4',
      400: '#A3A3A3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
    },
    success: {
      light: '#86EFAC',
      main: '#34C759',
      dark: '#15803D',
    },
    warning: {
      light: '#FCD34D',
      main: '#FF9500',
      dark: '#B45309',
    },
    danger: {
      light: '#FCA5A5',
      main: '#FF3B30',
      dark: '#991B1B',
    },
  },
  
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
      mono: '"SF Mono", "Monaco", "Inconsolata", monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  
  spacing: {
    0: '0',
    1: '0.25rem',
    2: '0.5rem',
    3: '0.75rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    8: '2rem',
    10: '2.5rem',
    12: '3rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
  },
  
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px',
  },
  
  shadows: {
    none: 'none',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms',
    },
    easing: {
      linear: 'linear',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
  },
} as const;

export type DesignTokens = typeof tokens;
```

---

## Tailwind CSS Config with Tokens

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          200: 'var(--color-primary-200)',
          300: 'var(--color-primary-300)',
          400: 'var(--color-primary-400)',
          500: 'var(--color-primary-500)',
          600: 'var(--color-primary-600)',
          700: 'var(--color-primary-700)',
          800: 'var(--color-primary-800)',
          900: 'var(--color-primary-900)',
        },
        neutral: {
          0: 'var(--color-neutral-0)',
          50: 'var(--color-neutral-50)',
          100: 'var(--color-neutral-100)',
          200: 'var(--color-neutral-200)',
          300: 'var(--color-neutral-300)',
          400: 'var(--color-neutral-400)',
          500: 'var(--color-neutral-500)',
          600: 'var(--color-neutral-600)',
          700: 'var(--color-neutral-700)',
          800: 'var(--color-neutral-800)',
          900: 'var(--color-neutral-900)',
        },
      },
      fontFamily: {
        sans: 'var(--font-family-sans)',
        mono: 'var(--font-family-mono)',
      },
      spacing: {
        'component-xs': 'var(--spacing-component-xs)',
        'component-sm': 'var(--spacing-component-sm)',
        'component-md': 'var(--spacing-component-md)',
        'component-lg': 'var(--spacing-component-lg)',
        'component-xl': 'var(--spacing-component-xl)',
      },
      animation: {
        'fade-in': 'fadeIn var(--duration-normal) var(--easing-out)',
        'slide-up': 'slideUp var(--duration-normal) var(--easing-out)',
        'scale-in': 'scaleIn var(--duration-fast) var(--easing-out)',
      },
    },
  },
  plugins: [],
};
```

---

## Usage Examples

### React Component

```tsx
// Button.tsx
import styled from 'styled-components';

const Button = styled.button`
  /* Using CSS variables */
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-button);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
  
  &:hover {
    background-color: var(--color-primary-600);
    box-shadow: var(--shadow-md);
  }
  
  &:focus {
    box-shadow: var(--shadow-focus);
  }
  
  &:disabled {
    background-color: var(--color-neutral-300);
    color: var(--color-text-disabled);
  }
`;
```

### SCSS Usage

```scss
// _button.scss
.btn {
  background-color: var(--color-primary-500);
  color: var(--color-text-inverse);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--radius-button);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-colors);
  
  &:hover {
    background-color: var(--color-primary-600);
    box-shadow: var(--shadow-md);
  }
  
  &--large {
    padding: var(--spacing-3) var(--spacing-6);
    font-size: var(--font-size-lg);
  }
  
  &--secondary {
    background-color: var(--color-neutral-200);
    color: var(--color-text-primary);
  }
}
```

---

## Token Documentation Template

```markdown
## Color Token: Primary-500

**Value:** #007AFF  
**Usage:** Primary brand color, CTAs, links, focus states  
**Accessibility:** Passes WCAG AA against white background  
**Notes:** Apple system blue, recognizable and trusted  

### Examples:
- Primary buttons
- Link text
- Selected states
- Progress indicators
- Focus rings

### Don't use for:
- Error states (use danger tokens)
- Success states (use success tokens)
- Body text (insufficient contrast)
```
