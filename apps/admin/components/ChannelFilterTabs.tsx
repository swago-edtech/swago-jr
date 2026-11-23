'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { parseSalesChannel, type SalesChannel } from '@/lib/sales-channel';

export { parseSalesChannel };

const ALL_OPTIONS: { value: SalesChannel; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'website', label: 'Website' },
  { value: 'amazon', label: 'Amazon' },
  { value: 'flipkart', label: 'Flipkart' },
];

const DEFAULT_ALLOWED: SalesChannel[] = ['all', 'website', 'amazon', 'flipkart'];

type ChannelFilterTabsProps = {
  value: SalesChannel;
  onChange: (channel: SalesChannel) => void;
  /** Active tab text color, e.g. text-blue-600 */
  accentClass?: string;
  /** Subset of channels (default: all four) */
  channels?: SalesChannel[];
};

export default function ChannelFilterTabs({
  value,
  onChange,
  accentClass = 'text-blue-600',
  channels,
}: ChannelFilterTabsProps) {
  const options = channels
    ? ALL_OPTIONS.filter((o) => channels.includes(o.value))
    : ALL_OPTIONS;

  return (
    <div className="flex bg-gray-100 p-1 rounded-lg">
      {options.map(({ value: option, label }) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === option
              ? `bg-white ${accentClass} shadow-sm`
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/** URL-synced channel filter for analytics pages (`?channel=`). */
export function useAnalyticsChannel(allowed: SalesChannel[] = DEFAULT_ALLOWED) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Stabilize identity when callers omit `allowed` (default array would be new each render)
  const allowedKey = allowed.join(',');
  const allowedList = allowedKey === DEFAULT_ALLOWED.join(',') ? DEFAULT_ALLOWED : allowed;

  const read = useCallback((): SalesChannel => {
    const parsed = parseSalesChannel(searchParams.get('channel'));
    return allowedList.includes(parsed) ? parsed : allowedList[0] || 'all';
  }, [allowedList, searchParams]);

  const [channel, setChannel] = useState<SalesChannel>(read);

  useEffect(() => {
    setChannel(read());
  }, [read]);

  const selectChannel = useCallback(
    (value: SalesChannel) => {
      const next = allowedList.includes(value) ? value : allowedList[0] || 'all';
      setChannel(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === 'all') params.delete('channel');
      else params.set('channel', next);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [allowedList, pathname, router, searchParams]
  );

  return { channel, selectChannel };
}
