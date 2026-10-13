import React from 'react';
import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export function ProductStats({ products = [], onFilterStock }) {
  const total = products.length;
  const inStock = products.filter((p) => (p.stock || 0) > (p.lowStockThreshold || 0)).length;
  const lowStock = products.filter(
    (p) => (p.stock || 0) > 0 && (p.stock || 0) <= (p.lowStockThreshold || 0)
  ).length;
  const outOfStock = products.filter((p) => (p.stock || 0) === 0).length;

  const stats = [
    {
      id: 'All',
      title: 'Total Products',
      count: total,
      icon: Package,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300',
      iconColor: 'bg-slate-100 text-slate-700',
      badge: 'All Catalog',
    },
    {
      id: 'inStock',
      title: 'In Stock',
      count: inStock,
      icon: CheckCircle2,
      color: 'bg-emerald-50/50 text-emerald-900 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50',
      iconColor: 'bg-emerald-100 text-emerald-700',
      badge: `${total ? Math.round((inStock / total) * 100) : 0}% available`,
    },
    {
      id: 'lowStock',
      title: 'Low Stock Alert',
      count: lowStock,
      icon: AlertTriangle,
      color: 'bg-amber-50/50 text-amber-900 border-amber-200 hover:border-amber-300 hover:bg-amber-50',
      iconColor: 'bg-amber-100 text-amber-700',
      badge: 'Restock Soon',
    },
    {
      id: 'outOfStock',
      title: 'Out of Stock',
      count: outOfStock,
      icon: XCircle,
      color: 'bg-rose-50/50 text-rose-900 border-rose-200 hover:border-rose-300 hover:bg-rose-50',
      iconColor: 'bg-rose-100 text-rose-700',
      badge: 'Critical (0 Stock)',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => onFilterStock && onFilterStock(item.id)}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${item.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                  {item.title}
                </span>
                <div className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  {formatNumber(item.count)}
                </div>
              </div>

              <div className={`p-2 rounded-lg ${item.iconColor} shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>{item.badge}</span>
              <span className="text-amber-600 hover:underline">Filter →</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
