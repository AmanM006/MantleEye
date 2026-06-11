import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#080808',
        surface: '#0F0F0F',
        elevated: '#161616',
        border: '#1E1E1E',
        'accent-green': '#00FF87',
        'accent-red': '#FF3B5C',
        'accent-yellow': '#FFB800',
        'accent-teal': '#00D2C8',
        'accent-orange': '#ff5005',
        'accent-beige': '#dbba95',
        'accent-lavender': '#d0bce1',
        'text-primary': '#F0F0F0',
        'text-muted': '#555555',
      },
      fontFamily: {
        mono: ['Space Mono', 'monospace'],
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        khteka: ['Khteka', 'Plus Jakarta Sans', 'sans-serif'],
        animo: ['Animo', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
