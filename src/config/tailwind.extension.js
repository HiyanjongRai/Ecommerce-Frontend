/**
 * Tailwind CSS Configuration Extension
 * Add to your tailwind.config.js or create as separate config file
 */

module.exports = {
  theme: {
    extend: {
      colors: {
        green: '#0F9D58',
        'green-dark': '#0b7a44',
        'green-light': '#e8f5ee',
        red: '#E53935',
        'red-light': '#fdecea',
        black: '#111111',
        white: '#FFFFFF',
        'gray-50': '#F5F5F5',
        'gray-100': '#EEEEEE',
        'gray-200': '#E0E0E0',
        'gray-400': '#9E9E9E',
        'gray-600': '#444444',
      },
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        'dm-sans': ['DM Sans', 'sans-serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      transitionTimingFunction: {
        'cubic': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        float: 'float 3s ease-in-out infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
      },
      spacing: {
        '8': '8px',
        '16': '16px',
        '24': '24px',
        '32': '32px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevated': '0 4px 12px rgba(0, 0, 0, 0.15)',
        'layered': '0 2px 8px rgba(0, 0, 0, 0.12), 0 8px 24px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
