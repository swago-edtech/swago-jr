import { useState, useEffect } from 'react';

export function useCurrency() {
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timeZone) {
        if (timeZone.toLowerCase().includes('calcutta') || timeZone.toLowerCase().includes('kolkata') || timeZone.toLowerCase().includes('asia/colombo')) {
          setCurrency('INR');
        } else if (timeZone.toLowerCase().includes('dubai') || timeZone.toLowerCase().includes('asia/muscat')) {
          setCurrency('AED');
        } else if (timeZone.toLowerCase().includes('europe/london')) {
          setCurrency('GBP');
        } else {
          setCurrency('USD'); // Default for all others
        }
      }
    } catch (e) {
      // Ignore error, fallback to INR
      setCurrency('INR');
    }
  }, []);

  return { currency, setCurrency };
}

export function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
