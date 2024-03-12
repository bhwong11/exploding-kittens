import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
        // that is animation class
        animation: {
          zoomIn: 'zoomIn 0.3s ease-in-out',
        },
  
        keyframes: {
          zoomIn: {
            '0%': { transform: 'scale(0, 0)' },
            '100%': { transform: 'scale(1, 1)' },
          },
        }
    },
  },
  plugins: [],
}
export default config
