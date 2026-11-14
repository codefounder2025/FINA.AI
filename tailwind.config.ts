import type { Config } from 'tailwindcss';

const config: Config = {
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
