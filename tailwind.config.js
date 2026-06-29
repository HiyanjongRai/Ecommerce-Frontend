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
        // Seller registration design tokens
        'reg-primary': '#16A34A',
        'reg-primary-dark': '#15803D',
        'reg-primary-light': '#DCFCE7',
        'reg-accent': '#111827',
        'reg-bg': '#F8FAFC',
        'reg-border': '#E5E7EB',
        'reg-text-sec': '#6B7280',
        'reg-placeholder': '#9CA3AF',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xs': '6px',
        'card': '12px',
        'pill': '24px',
      },
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [],
};
