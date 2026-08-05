/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDF9F1',
        ink: '#2B2A28',
        navy: {
          DEFAULT: '#1B3556',
          light: '#274873',
        },
        teal: {
          DEFAULT: '#1F6F66',
          light: '#2E8C80',
          tint: '#E4F1EE',
        },
        clay: {
          DEFAULT: '#E0672F',
          dark: '#B8501F',
        },
        sun: {
          DEFAULT: '#F2A93B',
          soft: '#F6D9A6',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        body: ['var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        soft: '1.25rem',
      },
    },
  },
  plugins: [],
};
