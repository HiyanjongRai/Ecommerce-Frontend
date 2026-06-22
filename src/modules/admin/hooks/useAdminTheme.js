import { useState, useEffect } from 'react';

export const useAdminTheme = () => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('admin-theme');
    // Default to dark mode if no saved preference
    const isDark = savedTheme === 'dark' || !savedTheme;
    
    // Apply dark class immediately on initialization
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return isDark;
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', darkMode ? 'dark' : 'light');
    
    // Apply dark class to HTML element for Tailwind dark mode
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Color scheme: Green (#10B981), Black (#000000), White (#FFFFFF), Red (#EF4444)
  // Matches seller theme for consistency
  const themeClasses = {
    // Backgrounds
    bg: {
      primary: darkMode ? 'bg-[#0d1117]' : 'bg-white',
      secondary: darkMode ? 'bg-[#080b14]' : 'bg-[#F8FAF7]',
      tertiary: darkMode ? 'bg-white/5' : 'bg-gray-150',
      accent: 'bg-emerald-500',
      success: darkMode ? 'bg-emerald-950/30' : 'bg-emerald-50/40',
      danger: darkMode ? 'bg-red-950/30' : 'bg-red-50/40',
      warning: darkMode ? 'bg-amber-950/30' : 'bg-amber-50/40',
      info: darkMode ? 'bg-blue-950/30' : 'bg-blue-50/40',
    },
    // Text colors
    text: {
      primary: darkMode ? 'text-[#f0f4ff]' : 'text-slate-800',
      secondary: darkMode ? 'text-[#cbd5e1]' : 'text-gray-600',
      tertiary: darkMode ? 'text-[#8892a4]' : 'text-gray-400',
      accent: darkMode ? 'text-emerald-400' : 'text-emerald-600',
      success: darkMode ? 'text-emerald-400' : 'text-emerald-700',
      danger: darkMode ? 'text-red-400' : 'text-red-700',
      warning: darkMode ? 'text-amber-400' : 'text-amber-700',
      info: darkMode ? 'text-blue-400' : 'text-blue-700',
    },
    // Borders
    border: {
      primary: darkMode ? 'border-white/8' : 'border-gray-200/80',
      secondary: darkMode ? 'border-white/5' : 'border-gray-100/80',
      accent: darkMode ? 'border-emerald-500/30' : 'border-emerald-200',
      danger: darkMode ? 'border-red-500/30' : 'border-red-200',
    },
    // Cards
    card: darkMode ? 'bg-[#0d1117] border-white/8 shadow-2xl' : 'bg-white border-gray-200/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)]',
    // Buttons
    button: {
      primary: darkMode 
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
        : 'bg-emerald-500 hover:bg-emerald-600 text-white',
      secondary: darkMode
        ? 'bg-gray-700 hover:bg-gray-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-950',
      danger: darkMode
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-red-500 hover:bg-red-600 text-white',
      outline: darkMode
        ? 'border border-white/10 text-white hover:bg-white/5'
        : 'border border-gray-300 text-gray-900 hover:bg-gray-50',
    },
    // Status badges
    status: {
      success: darkMode ? 'bg-emerald-950/45 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      danger: darkMode ? 'bg-red-950/45 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200',
      warning: darkMode ? 'bg-amber-950/45 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
      info: darkMode ? 'bg-blue-950/45 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
      pending: darkMode ? 'bg-white/5 text-gray-400 border-white/8' : 'bg-gray-50 text-gray-700 border-gray-200',
    },
  };

  return {
    darkMode,
    toggleDarkMode,
    themeClasses,
  };
};
