// apps/admin/components/AnalyticsCard.tsx

import { LucideIcon } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string; // Tailwind bg color class, e.g. 'bg-green-500'
  textColor?: string; // Tailwind text color class for value
  trend?: {
    value: number; // percentage change
    isPositive: boolean;
  };
}

export default function AnalyticsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  textColor,
  trend,
}: AnalyticsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className={`text-2xl font-bold mt-1.5 ${textColor || 'text-gray-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-1.5 text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-500'}`}>
              <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%</span>
              <span className="text-gray-400 ml-1">vs last period</span>
            </div>
          )}
        </div>
        <div className={`${color} p-2.5 rounded-lg flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
