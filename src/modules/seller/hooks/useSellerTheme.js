import { useState, useEffect } from 'react';

export const useSellerTheme = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('seller-theme') === 'dark';
  });

  useEffect(() => {
    localStorage.setItem('seller-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Color scheme: Green (#10B981), Black (#000000), White (#FFFFFF), Red (#EF4444)
  const themeClasses = {
    // Backgrounds
    bg: {
      primary: darkMode ? 'bg-black' : 'bg-white',
      secondary: darkMode ? 'bg-gray-900' : 'bg-gray-50',
      tertiary: darkMode ? 'bg-gray-800' : 'bg-gray-100',
      accent: 'bg-emerald-500',
      success: darkMode ? 'bg-emerald-900/20' : 'bg-emerald-50',
      danger: darkMode ? 'bg-red-900/20' : 'bg-red-50',
      warning: darkMode ? 'bg-amber-900/20' : 'bg-amber-50',
      info: darkMode ? 'bg-blue-900/20' : 'bg-blue-50',
    },
    // Text colors
    text: {
      primary: darkMode ? 'text-white' : 'text-gray-900',
      secondary: darkMode ? 'text-gray-300' : 'text-gray-600',
      tertiary: darkMode ? 'text-gray-400' : 'text-gray-500',
      accent: darkMode ? 'text-emerald-400' : 'text-emerald-600',
      success: darkMode ? 'text-emerald-400' : 'text-emerald-700',
      danger: darkMode ? 'text-red-400' : 'text-red-700',
      warning: darkMode ? 'text-amber-400' : 'text-amber-700',
      info: darkMode ? 'text-blue-400' : 'text-blue-700',
    },
    // Borders
    border: {
      primary: darkMode ? 'border-gray-700' : 'border-gray-200',
      secondary: darkMode ? 'border-gray-600' : 'border-gray-100',
      accent: darkMode ? 'border-emerald-500/30' : 'border-emerald-200',
      danger: darkMode ? 'border-red-500/30' : 'border-red-200',
    },
    // Cards
    card: darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200',
    // Buttons
    button: {
      primary: darkMode 
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
        : 'bg-emerald-500 hover:bg-emerald-600 text-white',
      secondary: darkMode
        ? 'bg-gray-700 hover:bg-gray-600 text-white'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-900',
      danger: darkMode
        ? 'bg-red-600 hover:bg-red-700 text-white'
        : 'bg-red-500 hover:bg-red-600 text-white',
      outline: darkMode
        ? 'border border-gray-600 text-white hover:bg-gray-800'
        : 'border border-gray-300 text-gray-900 hover:bg-gray-50',
    },
    // Status badges
    status: {
      success: darkMode ? 'bg-emerald-900/30 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200',
      danger: darkMode ? 'bg-red-900/30 text-red-400 border-red-500/30' : 'bg-red-50 text-red-700 border-red-200',
      warning: darkMode ? 'bg-amber-900/30 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200',
      info: darkMode ? 'bg-blue-900/30 text-blue-400 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200',
      pending: darkMode ? 'bg-gray-900/30 text-gray-400 border-gray-500/30' : 'bg-gray-50 text-gray-700 border-gray-200',
    },
  };

  return {
    darkMode,
    toggleDarkMode,
    themeClasses,
  };
};
