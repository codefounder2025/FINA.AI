import type { Config } from 'tailwindcss';

const config: Config = {
  // Theme is driven by a `dark` class on <html>, set before first paint by an
  // inline script in app/layout.tsx so reloads never flash the wrong palette.
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        source: {
          bank: '#2563eb',
          octopus: '#f97316',
          investment: '#16a34a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
