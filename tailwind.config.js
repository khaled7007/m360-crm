/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#2f48f5',
          'blue-alt': '#3548EC',
          'blue-light': '#818DE5',
          navy: '#1a1a3e',
          dark: '#06081e',
          teal: '#0ea5a0',
        },
      },
      fontFamily: {
        arabic: ['Effra', 'Tajawal', 'sans-serif'],
      },
      animation: {
        'float-slow': 'floatY 14s ease-in-out infinite',
        'float-alt': 'floatYAlt 18s ease-in-out infinite',
        'mesh-pulse': 'meshPulse 10s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
      },
      keyframes: {
        floatY: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-22px) rotate(4deg)' },
        },
        floatYAlt: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(18px) rotate(-5deg)' },
        },
        meshPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '0.9' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(6px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
