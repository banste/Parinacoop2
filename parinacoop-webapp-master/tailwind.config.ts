import { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    fontFamily: {
      sans: ['Roboto', 'Helvetica Neue', 'sans-serif'],
    },
    extend: {
      colors: {
        primary: {
          50: '#fef8ee',
          100: '#fdf0d7',
          200: '#f9ddaf',
          300: '#f5c37c',
          400: '#f0a047',
          500: '#ec8523',
          600: '#dd6b19',
          700: '#b85216',
          800: '#92411a',
          900: '#763718',
          950: '#401a0a',
        },
        secondary: {
          '50': '#fdf3f3',
          '100': '#fbe6e5',
          '200': '#f8d1d0',
          '300': '#f2b1af',
          '400': '#e88481',
          '500': '#d9534f',
          '600': '#c73f3b',
          '700': '#a7322e',
          '800': '#8a2d2a',
          '900': '#742a28',
          '950': '#3e1211',
        },
        'nav-color': '#F4F3F3',
        body: '#52677b',
      },
    },
  },
  plugins: [],
};

export default config;
