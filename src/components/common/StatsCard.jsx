import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel = 'vs last month',
  subtext,
  badge,
  badgeVariant = 'default',
  color = 'emerald', // 'emerald' | 'green' | 'orange' | 'amber' | 'blue' | 'rose' | 'purple' | 'slate'
  onClick,
  className,
}) {
  const colorStyles = {
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    green: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    amber: 'text-amber-600 bg-amber-50 border-amber-200',
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    rose: 'text-rose-600 bg-rose-50 border-rose-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    slate: 'text-slate-700 bg-slate-100 border-slate-200',
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white border border-slate-200 rounded-lg p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between',
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </span>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
          </div>
        </div>

        {Icon && (
          <div
            className={cn(
              'p-2.5 rounded-lg border flex items-center justify-center shrink-0 shadow-2xs',
              colorStyles[color] || colorStyles.amber
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(trend !== undefined || subtext || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {trend !== undefined ? (
            <div className="flex items-center gap-1">
              {trend >= 0 ? (
                <span className="inline-flex items-center text-emerald-600 font-semibold gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{trend}%
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-600 font-semibold gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {trend}%
                </span>
              )}
              <span className="text-slate-400 text-[11px]">{trendLabel}</span>
            </div>
          ) : subtext ? (
            <span className="text-slate-500 text-xs">{subtext}</span>
          ) : (
            <div />
          )}

          {badge && (
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  children,
  action,
  className,
}) {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-lg p-5 shadow-xs', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}
