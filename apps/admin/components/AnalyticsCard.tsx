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
    <div className="bg-[#ffffff]/80 shadow-sm backdrop-blur-xl rounded-2xl border border-[#e2e8f0]/80 p-5 lg:p-6 transition-all duration-300 hover:shadow-md hover:border-[#6366f1]/30 group relative overflow-hidden">
      {/* Decorative gradient blob in the background */}
      <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-[0.04] group-hover:opacity-[0.08] transition-opacity blur-2xl ${color}`} />
      
      <div className="flex items-start justify-between relative z-10 gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-bold text-[#64748b] tracking-wide uppercase mb-1.5 line-clamp-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl lg:text-3xl font-black tracking-tight truncate ${textColor || 'text-[#0f172a]'}`}>
              {value}
            </h3>
          </div>
          
          {subtitle && (
            <p className="text-[11px] font-semibold text-[#94a3b8] mt-1.5 truncate">{subtitle}</p>
          )}

          {trend && (
            <div className={`flex items-center gap-1.5 mt-3 text-[12px] font-bold ${trend.isPositive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              <span className={`flex items-center justify-center w-4 h-4 rounded-full ${trend.isPositive ? 'bg-[#10b981]/10' : 'bg-[#ef4444]/10'}`}>
                {trend.isPositive ? '↑' : '↓'}
              </span>
              <span>{Math.abs(trend.value).toFixed(1)}%</span>
              <span className="text-[#94a3b8] font-medium ml-1 truncate">vs last period</span>
            </div>
          )}
        </div>
        
        <div className={`flex items-center justify-center w-12 h-12 rounded-[14px] border shadow-sm transition-transform duration-300 group-hover:scale-110 flex-shrink-0 ${color} border-white/20`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}
