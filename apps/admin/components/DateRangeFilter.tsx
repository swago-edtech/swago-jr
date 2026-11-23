'use client';

import { useState, useCallback } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DatePreset = 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';

export interface DateRange {
  from: string; // ISO date string YYYY-MM-DD
  to: string;   // ISO date string YYYY-MM-DD
  preset: DatePreset;
  label: string;
}

const PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7days', label: 'Last 7 Days' },
  { key: '30days', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'custom', label: 'Custom Range' },
];

/** Today’s calendar date in Asia/Kolkata as YYYY-MM-DD. */
function istTodayKey(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function addDaysKey(dateKey: string, days: number): string {
  const d = new Date(`${dateKey}T12:00:00+05:30`);
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function getPresetDates(preset: DatePreset): { from: string; to: string } {
  const today = istTodayKey();

  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const yesterday = addDaysKey(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case '7days':
      return { from: addDaysKey(today, -6), to: today };
    case '30days':
      return { from: addDaysKey(today, -29), to: today };
    case 'thisMonth': {
      const [y, m] = today.split('-');
      return { from: `${y}-${m}-01`, to: today };
    }
    case 'lastMonth': {
      const [y, m] = today.split('-').map(Number);
      const lastMonthEnd = addDaysKey(`${y}-${String(m).padStart(2, '0')}-01`, -1);
      const [ly, lm] = lastMonthEnd.split('-');
      return { from: `${ly}-${lm}-01`, to: lastMonthEnd };
    }
    default:
      return { from: today, to: today };
  }
}

export function getDefaultDateRange(): DateRange {
  const dates = getPresetDates('30days');
  return {
    from: dates.from,
    to: dates.to,
    preset: '30days',
    label: 'Last 30 Days',
  };
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export default function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(value.from);
  const [customTo, setCustomTo] = useState(value.to);

  const handlePresetClick = useCallback((preset: DatePreset, label: string) => {
    if (preset === 'custom') {
      setIsOpen(true);
      return;
    }
    const dates = getPresetDates(preset);
    onChange({
      from: dates.from,
      to: dates.to,
      preset,
      label,
    });
    setIsOpen(false);
  }, [onChange]);

  const handleCustomApply = useCallback(() => {
    if (customFrom && customTo) {
      onChange({
        from: customFrom,
        to: customTo,
        preset: 'custom',
        label: `${new Date(customFrom).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${new Date(customTo).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
      });
      setIsOpen(false);
    }
  }, [customFrom, customTo, onChange]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
      >
        <Calendar className="w-4 h-4 text-gray-400" />
        <span>{value.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
            {/* Presets */}
            <div className="p-2">
              <p className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick Select</p>
              {PRESETS.filter(p => p.key !== 'custom').map((preset) => (
                <button
                  key={preset.key}
                  onClick={() => handlePresetClick(preset.key, preset.label)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    value.preset === preset.key
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Custom Range */}
            <div className="border-t border-gray-100 p-3 bg-gray-50">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Custom Range</p>
              <div className="flex gap-2 mb-2">
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="self-center text-gray-400 text-sm">to</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={handleCustomApply}
                className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Range
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
