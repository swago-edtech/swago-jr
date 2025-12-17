'use client';

import { useState, useEffect } from 'react';
import { formatDateIST, formatAdminDate, formatTableDate, formatTableTime, getRelativeTime } from '@swago/utils';

/**
 * Hook for formatting dates in admin dashboard
 * Prevents hydration mismatches by formatting on client-side only
 */
export function useFormattedDate(
  date: Date | string,
  format: 'full' | 'admin' | 'table' | 'relative' = 'admin'
) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    // Only format on client side to avoid hydration mismatch
    if (!date) {
      setFormattedDate('N/A');
      return;
    }

    switch (format) {
      case 'admin':
        setFormattedDate(formatAdminDate(date));
        break;
      case 'table':
        setFormattedDate(formatTableDate(date));
        break;
      case 'relative':
        setFormattedDate(getRelativeTime(date));
        break;
      case 'full':
      default:
        setFormattedDate(formatDateIST(date, 'full'));
    }
  }, [date, format]);

  return formattedDate || 'Loading...';
}

/**
 * Hook for formatting date and time separately (for tables)
 */
export function useFormattedDateTime(date: Date | string) {
  const [dateStr, setDateStr] = useState<string>('');
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    if (!date) {
      setDateStr('N/A');
      setTimeStr('N/A');
      return;
    }

    setDateStr(formatTableDate(date));
    setTimeStr(formatTableTime(date));
  }, [date]);

  return { date: dateStr || 'Loading...', time: timeStr || 'Loading...' };
}

/**
 * Hook for relative time that auto-updates
 * Updates every minute for recent dates
 */
export function useRelativeTime(date: Date | string, autoUpdate = false) {
  const [relativeTime, setRelativeTime] = useState<string>('');

  useEffect(() => {
    if (!date) {
      setRelativeTime('N/A');
      return;
    }

    const updateTime = () => {
      setRelativeTime(getRelativeTime(date));
    };

    // Initial update
    updateTime();

    // Auto-update every minute if enabled
    if (autoUpdate) {
      const interval = setInterval(updateTime, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [date, autoUpdate]);

  return relativeTime || 'Loading...';
}
