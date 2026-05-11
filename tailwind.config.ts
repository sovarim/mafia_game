/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:       { DEFAULT: '#0a0a0f', card: '#111827', input: '#1f2937' },
        mafia:    { DEFAULT: '#dc2626', glow: 'rgba(220,38,38,0.25)' },
        civilian: { DEFAULT: '#3b82f6', glow: 'rgba(59,130,246,0.25)' },
        maniac:   { DEFAULT: '#9333ea', glow: 'rgba(147,51,234,0.25)' },
        doctor:   { DEFAULT: '#22c55e', glow: 'rgba(34,197,94,0.25)' },
        warn:     '#eab308',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'serif'],
        body:    ['"Outfit"', 'sans-serif'],
        mono:    ['"Space Mono"', 'monospace'],
      },
      borderRadius: { card: '14px' },
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'fade-in':    'fadeIn 0.4s ease-out forwards',
        'slide-up':   'slideUp 0.4s ease-out forwards',
        'flip':       'flip 0.6s ease-in-out forwards',
        'glow':       'glow 2s ease-in-out infinite alternate',
        'confetti':   'confettiFall 1.5s ease-in forwards',
      },
      keyframes: {
        fadeIn:   { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:  { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        flip:     { '0%': { transform: 'rotateY(0deg)' }, '100%': { transform: 'rotateY(180deg)' } },
        glow:     { from: { boxShadow: '0 0 20px var(--glow-color, rgba(220,38,38,0.2))' }, to: { boxShadow: '0 0 40px var(--glow-color, rgba(220,38,38,0.4))' } },
        confettiFall: { '0%': { transform: 'translateY(-100%) rotate(0deg)', opacity: '1' }, '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' } },
      },
    },
  },
  plugins: [],
};
