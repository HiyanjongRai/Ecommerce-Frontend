module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        'forest-black': '#111827',
        'linen': '#FFFFFF',
        'sage': '#E8F5EE',
        'moss': '#10B981',
        'brand-blue': '#2563EB',
        'stone': '#6B7280',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xs': '6px',
        'card': '12px',
        'pill': '24px',
      },
    },
  },
  plugins: [],
};
