/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          accent: 'var(--color-text-accent)',
          inverse: 'var(--color-text-inverse)',
        },
        bg: {
          page: 'var(--color-bg-page)',
          card: 'var(--color-bg-card)',
          sunken: 'var(--color-bg-sunken)',
        },
        border: {
          hairline: 'var(--color-border-hairline)',
          strong: 'var(--color-border-strong)',
        },
        accent: {
          DEFAULT: 'var(--color-accent-primary)',
          muted: 'var(--color-accent-muted)',
          soft: 'var(--color-accent-soft)',
          consultora: 'var(--color-accent-consultora)',
        },
        status: {
          success: 'var(--color-status-success)',
          'success-bg': 'var(--color-status-success-bg)',
          warning: 'var(--color-status-warning)',
          'warning-bg': 'var(--color-status-warning-bg)',
          error: 'var(--color-status-error)',
          'error-bg': 'var(--color-status-error-bg)',
          info: 'var(--color-status-info)',
          'info-bg': 'var(--color-status-info-bg)',
        },
      },
      fontFamily: {
        sans: ['var(--font-brand)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['60px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '600' }],
        'display-lg': ['48px', { lineHeight: '1.08', letterSpacing: '-0.02em', fontWeight: '600' }],
        'h1':         ['36px', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        'h2':         ['24px', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h3':         ['18px', { lineHeight: '1.4',  letterSpacing: '0',        fontWeight: '600' }],
        'body-lg':    ['17px', { lineHeight: '1.6',  letterSpacing: '0',        fontWeight: '400' }],
        'body':       ['15px', { lineHeight: '1.6',  letterSpacing: '0',        fontWeight: '400' }],
        'body-sm':    ['13px', { lineHeight: '1.55', letterSpacing: '0',        fontWeight: '400' }],
        'caption':    ['12px', { lineHeight: '1.5',  letterSpacing: '0',        fontWeight: '400' }],
        'kicker':     ['11px', { lineHeight: '1.4',  letterSpacing: '0.14em',   fontWeight: '500' }],
        'stat-xl':    ['56px', { lineHeight: '1',    letterSpacing: '-0.025em', fontWeight: '700' }],
        'stat-lg':    ['40px', { lineHeight: '1',    letterSpacing: '-0.02em',  fontWeight: '700' }],
      },
      boxShadow: {
        'soft': 'var(--shadow-soft)',
        'soft-hover': 'var(--shadow-soft-hover)',
      },
      borderRadius: {
        'sm': '2px',
      },
      transitionTimingFunction: {
        'out-soft': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
      maxWidth: {
        'measure': '68ch',
        'shell': '1280px',
      },
      keyframes: {
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        'ai-cursor': {
          '0%, 60%':      { opacity: '1' },
          '60.01%, 100%': { opacity: '0.2' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      animation: {
        'skeleton-pulse':  'skeleton-pulse 1.6s ease-in-out infinite',
        'ai-cursor':       'ai-cursor 1.1s steps(2) infinite',
        'fade-in':         'fade-in 200ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
        'slide-in-right':  'slide-in-right 240ms cubic-bezier(0.22, 0.61, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};
