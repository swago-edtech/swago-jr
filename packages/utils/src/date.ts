/**
 * Date Utility Functions for Swago Jr
 * Handles timezone conversions from UTC (MongoDB) to IST
 * All dates in MongoDB are stored in UTC, displayed in IST
 */

/**
 * Format UTC date to IST with various format options
 * @param date - Date object or ISO string from MongoDB (UTC)
 * @param format - Display format type
 * @returns Formatted date string in IST
 */
export function formatDateIST(
  date: Date | string,
  format: 'full' | 'date' | 'time' | 'relative' | 'datetime' = 'full'
): string {
  if (!date) return 'N/A';

  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check for invalid date
  if (isNaN(dateObj.getTime())) return 'Invalid Date';

  // Convert to IST (UTC+5:30)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata', // IST timezone
  };

  switch (format) {
    case 'full':
      // e.g., "6 Dec 2025, 1:30 PM IST"
      return dateObj.toLocaleString('en-IN', {
        ...options,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }) + ' IST';

    case 'date':
      // e.g., "6 Dec 2025"
      return dateObj.toLocaleString('en-IN', {
        ...options,
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

    case 'time':
      // e.g., "1:30 PM"
      return dateObj.toLocaleString('en-IN', {
        ...options,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    case 'datetime':
      // e.g., "06/12/2025, 1:30 PM"
      return dateObj.toLocaleString('en-IN', {
        ...options,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

    case 'relative':
      // e.g., "2 hours ago", "just now"
      return getRelativeTime(dateObj);

    default:
      return dateObj.toLocaleString('en-IN', options);
  }
}

/**
 * Get relative time (e.g., "2 hours ago", "just now")
 * Works in both server and client components
 */
export function getRelativeTime(date: Date | string): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  if (diffWeek < 4) return `${diffWeek} ${diffWeek === 1 ? 'week' : 'weeks'} ago`;
  if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
  return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
}

/**
 * Format date for admin dashboard (more detailed with seconds)
 * @param date - Date object or ISO string
 * @returns Detailed formatted date in IST
 */
export function formatAdminDate(date: Date | string): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }) + ' IST';
}

/**
 * Format date for customer-facing pages (clean, no IST label)
 * @param date - Date object or ISO string
 * @returns Clean formatted date
 */
export function formatCustomerDate(date: Date | string): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format date for tables (compact format)
 * @param date - Date object or ISO string
 * @returns Compact date format
 */
export function formatTableDate(date: Date | string): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format time only (no date)
 * @param date - Date object or ISO string
 * @returns Time in IST
 */
export function formatTableTime(date: Date | string): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  return dateObj.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Convert IST to UTC for API requests (if needed)
 * @param istDate - Date in IST
 * @returns Date in UTC
 */
export function convertISTtoUTC(istDate: Date | string): Date {
  const dateObj = typeof istDate === 'string' ? new Date(istDate) : istDate;
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date provided');
  }
  
  // IST is UTC+5:30, so subtract 5 hours 30 minutes
  return new Date(dateObj.getTime() - (5.5 * 60 * 60 * 1000));
}

/**
 * Get current time in IST
 * @returns Current date in IST
 */
export function getCurrentIST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

/**
 * Check if date is today (in IST)
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return false;
  
  const today = getCurrentIST();
  const checkDate = new Date(dateObj.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}
