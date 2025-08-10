/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'brand-primary': {
          '50': 'rgb(var(--color-brand-primary-50) / <alpha-value>)',
          '100': 'rgb(var(--color-brand-primary-100) / <alpha-value>)',
          '200': 'rgb(var(--color-brand-primary-200) / <alpha-value>)',
          '300': 'rgb(var(--color-brand-primary-300) / <alpha-value>)',
          '400': 'rgb(var(--color-brand-primary-400) / <alpha-value>)',
          '500': 'rgb(var(--color-brand-primary-500) / <alpha-value>)',
          '600': 'rgb(var(--color-brand-primary-600) / <alpha-value>)',
          '700': 'rgb(var(--color-brand-primary-700) / <alpha-value>)',
          '800': 'rgb(var(--color-brand-primary-800) / <alpha-value>)',
          '900': 'rgb(var(--color-brand-primary-900) / <alpha-value>)',
          '950': 'rgb(var(--color-brand-primary-950) / <alpha-value>)',
        },
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': theme('colors.slate[600]'),
            '--tw-prose-headings': theme('colors.slate[800]'),
            '--tw-prose-invert-body': theme('colors.slate[300]'),
            '--tw-prose-invert-headings': theme('colors.white'),
          },
        },
      }),
    }
  },
  plugins: [
    import('@tailwindcss/typography'),
  ],
}