import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  HelpCircle,
  Package,
  FileText,
  Clock,
  Check,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { Button } from '../../components/common/Button';
import { formatRelativeTime, formatDate } from '../../utils/formatters';

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const [filter, setFilter] = useState('all'); // 'all' | 'unread'

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const getIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-blue-600" />;
      case 'enquiry':
        return <HelpCircle className="w-5 h-5 text-amber-600" />;
      case 'stock':
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case 'quotation':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      default:
        return <Package className="w-5 h-5 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Notifications & System Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational notifications for purchase orders, high-value RFQs, low stock triggers, and verification updates
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllAsRead} leftIcon={Check}>
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          All Alerts ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filter === 'unread'
              ? 'bg-emerald-600 text-white font-bold shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No notifications matching this filter.
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                markAsRead(n.id);
                if (n.link) navigate(n.link);
              }}
              className={`p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                !n.read ? 'bg-emerald-50/40 border-l-4 border-emerald-600' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {n.title}
                    </h3>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    {formatDate(n.createdAt, true)} ({formatRelativeTime(n.createdAt)})
                  </span>
                </div>
              </div>

              {n.link && (
                <span className="text-xs font-bold text-emerald-700 hover:text-emerald-800 shrink-0 hidden sm:block">
                  View Detail →
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
