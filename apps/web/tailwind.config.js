/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        brand: 'var(--brand)',
        'accent-saffron': 'var(--accent-saffron)',
        'status-fresh': 'var(--status-fresh)',
        'status-stale': 'var(--status-stale)',
        'status-demo': 'var(--status-demo)',
        'status-warning': 'var(--status-warning)',
        'status-caution': 'var(--status-caution)',
        'aqi-good': 'var(--aqi-good)',
        'aqi-satisfactory': 'var(--aqi-satisfactory)',
        'aqi-moderate': 'var(--aqi-moderate)',
        'aqi-poor': 'var(--aqi-poor)',
        'aqi-very-poor': 'var(--aqi-very-poor)',
        'aqi-severe': 'var(--aqi-severe)',
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
        'fade-in': 'fade-in 0.15s ease-out',
        shimmer: 'shimmer 1.5s infinite linear',
      },
    },
  },
  plugins: [],
};
