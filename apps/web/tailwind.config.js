/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF8F5',
        surface: '#FFFFFF',
        'surface-2': '#F3EFE8',
        border: '#E7E1D6',
        ink: '#14142B',
        muted: '#5B5B73',
        brand: {
          indigo: '#4338CA',
        },
        accent: {
          saffron: '#F59E0B',
        },
        status: {
          fresh: '#16A34A',
          stale: '#D97706',
          demo: '#475569',
        },
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
      },
    },
  },
  plugins: [],
};
