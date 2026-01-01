import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  safelist: [
    'bg-blue-50',
    'text-blue-600',
    'bg-amber-50',
    'text-amber-600',
    'bg-rose-50',
    'text-rose-600',
    'bg-emerald-50',
    'text-emerald-600',
    'bg-violet-50',
    'text-violet-600',
    'bg-slate-50',
    'text-slate-600',
    'bg-orange-50',
    'text-orange-600',
    'bg-cyan-50',
    'text-cyan-600',
    'bg-lime-50',
    'text-lime-600',
    'bg-pink-50',
    'text-pink-600',
    'bg-teal-50',
    'text-teal-600',
    'ring-2',
    'ring-orange-500',
  ],
  plugins: [
    typography,
  ],
}
