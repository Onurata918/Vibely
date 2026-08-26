/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Birebir Vibely-prototip.html :root renkleri
        vbg: '#08050f',
        vbg2: '#0c0817',
        vsurface: '#141020',
        vsurface2: '#1b1629',
        vinput: '#171326',
        vline: 'rgba(255,255,255,.07)',
        vline2: 'rgba(255,255,255,.12)',
        vtxt: '#ffffff',
        vmuted: '#8e879f',
        vmuted2: '#635c73',
        vblue: '#3b82f6',
        vpurple: '#8b5cf6',
        vpink: '#ec4899',
        vred: '#ef4444',
        vgreen: '#22c55e',
      },
    },
  },
  plugins: [],
};
