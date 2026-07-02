import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for flash sale countdown timer
 * Formats time as HH:MM:SS and updates every second
 * Automatically resets when reaching 0
 * 
 * @param {number} initialSeconds - Initial countdown time in seconds (default: 24h 35m)
 * @returns {string} Formatted countdown string (HH:MM:SS)
 */
export function useFlashCountdown(initialSeconds = 24 * 3600 + 35 * 60) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const timerRef = useRef(null);

  /**
   * Format seconds to HH:MM:SS format
   */
  const formatCountdown = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')} : ${mins.toString().padStart(2, '0')} : ${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 0) {
          // Reset to 24 hours when countdown ends
          return 24 * 3600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return formatCountdown(secondsLeft);
}

export default useFlashCountdown;
