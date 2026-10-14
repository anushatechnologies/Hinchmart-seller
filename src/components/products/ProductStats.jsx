import React from 'react';
import { Package, CheckCircle2, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';

export function ProductStats({ products = [], activeStatus, onFilterStatus, onFilterStock }) {
  const total = products.length;
  const approved = products.filter((p) => p.status === 'APPROVED' || p.approvalStatus === 'APPROVED').length;
  const pending = products.filter((p) => p.status === 'PENDING' || p.approvalStatus === 'PENDING').length;
  const rejected = products.filter((p) => p.status === 'REJECTED' || p.approvalStatus === 'REJECTED').length;
  const lowOrOut = products.filter(
    (p) => (p.stock || 0) <= (p.lowStockThreshold || 10)
  ).length;

  const stats = [
    {
      id: 'All',
      title: 'Total Products',
      count: total,
      icon: Package,
      color: 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300',
      iconColor: 'bg-slate-100 text-slate-700',
      badge: 'Seller Catalog',
      onClick: () => onFilterStatus && onFilterStatus('All'),
      isActive: !activeStatus || activeStatus === 'All',
    },
    {
      id: 'APPROVED',
      title: 'Approved (Live)',
      count: approved,
      icon: CheckCircle2,
      color: 'bg-emerald-50/60 text-emerald-900 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-50',
      iconColor: 'bg-emerald-100 text-emerald-700',
      badge: `${total ? Math.round((approved / total) * 100) : 0}% Active`,
      onClick: () => onFilterStatus && onFilterStatus('APPROVED'),
      isActive: activeStatus === 'APPROVED',
    },
    {
      id: 'PENDING',
      title: 'Pending Review',
      count: pending,
      icon: Clock,
      color: 'bg-amber-50/60 text-amber-900 border-amber-200 hover:border-amber-300 hover:bg-amber-50',
      iconColor: 'bg-amber-100 text-amber-700',
      badge: 'Waiting for Admin',
      onClick: () => onFilterStatus && onFilterStatus('PENDING'),
      isActive: activeStatus === 'PENDING',
    },
    {
      id: 'REJECTED',
      title: 'Rejected',
      count: rejected,
      icon: XCircle,
      color: 'bg-rose-50/70 text-rose-900 border-rose-200 hover:border-rose-300 hover:bg-rose-50',
      iconColor: 'bg-rose-100 text-rose-700',
      badge: rejected > 0 ? 'Needs Revision' : 'None',
      onClick: () => onFilterStatus && onFilterStatus('REJECTED'),
      isActive: activeStatus === 'REJECTED',
    },
    {
      id: 'lowStock',
      title: 'Low / Out of Stock',
      count: lowOrOut,
      icon: AlertTriangle,
      color: 'bg-orange-50/50 text-orange-900 border-orange-200 hover:border-orange-300 hover:bg-orange-50',
      iconColor: 'bg-orange-100 text-orange-700',
      badge: 'Inventory Alert',
      onClick: () => onFilterStock && onFilterStock('lowStock'),
      isActive: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={item.onClick}
            className={`p-4 rounded-xl border transition-all cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between ${item.color} ${
              item.isActive ? 'ring-2 ring-emerald-600 shadow-md font-semibold' : ''
            }`}
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
