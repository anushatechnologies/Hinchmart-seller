import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  IndianRupee,
  ShoppingCart,
  HelpCircle,
  Eye,
  Percent,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { useProducts } from '../../hooks/useProducts';
import { useOrders } from '../../hooks/useOrders';
import { useEnquiries } from '../../hooks/useEnquiries';
import { useCustomers } from '../../hooks/useCustomers';
import { StatsCard, ChartCard } from '../../components/common/StatsCard';
import { Button } from '../../components/common/Button';
import { exportToCsv } from '../../utils/exportUtils';
import { formatCurrency, formatNumber } from '../../utils/formatters';

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const { analytics, isLoading } = useAnalytics(timeRange);
  const { products = [] } = useProducts();
  const { orders = [] } = useOrders();
  const { enquiries = [] } = useEnquiries();
  const { customers = [] } = useCustomers();

  const kpis = analytics?.kpis || {};
  const effectiveRevenue = Number(kpis.totalRevenue) || orders.reduce((sum, o) => sum + Number(o.totalAmount || o.total || 0), 0);
  const effectiveOrders = Number(kpis.totalOrders) || orders.length;

  const effectiveRevenueData = useMemo(() => {
    if (analytics?.revenueOverview && analytics.revenueOverview.length > 0) {
      return analytics.revenueOverview;
    }
    if (orders.length > 0) {
      const map = {};
      orders.forEach((o) => {
        const d = o.createdAt ? new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recent';
        if (!map[d]) {
          map[d] = { month: d, date: d, revenue: 0, orders: 0, enquiries: 0 };
        }
        map[d].revenue += Number(o.totalAmount || o.total || 0);
        map[d].orders += 1;
      });
      return Object.values(map);
    }
    return [];
  }, [analytics?.revenueOverview, orders]);

  const effectiveCategoryData = useMemo(() => {
    if (analytics?.categoryBreakdown && analytics.categoryBreakdown.length > 0) {
      return analytics.categoryBreakdown;
    }
    if (!products || products.length === 0) return [];
    const catMap = {};
    const palette = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];
    products.forEach((p) => {
      const cat = p.category || 'General';
      catMap[cat] = (catMap[cat] || 0) + 1;
    });
    const total = products.length;
    return Object.entries(catMap).map(([name, count], idx) => ({
      name,
      value: Math.round((count / total) * 100),
      revenue: 0,
      color: palette[idx % palette.length],
    }));
  }, [analytics?.categoryBreakdown, products]);

  const effectiveFunnelData = useMemo(() => {
    if (analytics?.conversionFunnel && analytics.conversionFunnel.length > 0) {
      return analytics.conversionFunnel;
    }
    return [
      { stage: 'Catalog Products', count: products.length },
      { stage: 'Inquiries / RFQs', count: enquiries.length },
      { stage: 'Purchase Orders', count: orders.length },
    ];
  }, [analytics?.conversionFunnel, products.length, enquiries.length, orders.length]);

  const handleExport = () => {
    const exportRows = effectiveRevenueData.map((r) => ({
      Period: r.month || r.date || '',
      GrossRevenue: r.revenue || 0,
      OrdersCompleted: r.orders || 0,
      RFQsReceived: r.enquiries || 0,
    }));
    exportToCsv('HinchMart_Commercial_Analytics_Report', exportRows);
  };

  const topMaterials = useMemo(() => {
    if (!products || products.length === 0) return [];
    return [...products]
      .sort((a, b) => (Number(b.totalSales || b.salesCount || 0)) - (Number(a.totalSales || a.salesCount || 0)))
      .slice(0, 5);
  }, [products]);

  const mobileChartData = useMemo(() => {
    if (effectiveRevenueData.length > 0) {
      return effectiveRevenueData.map((r) => ({
        date: r.month || r.date || '',
        value: Number(r.revenue || 0),
      }));
    }
    return [{ date: 'Today', value: effectiveRevenue }];
  }, [effectiveRevenueData, effectiveRevenue]);

  return (
    <>
      {/* ================= PHONE VIEW REPORTS (Matches Phone Screenshot 8 Exactly) ================= */}
      <div className="block md:hidden space-y-3.5 pb-2">
        {/* Sales Report Card */}
        <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-2xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Sales Report</h3>
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="text-xs bg-white border border-slate-200 text-slate-700 py-1 px-2.5 rounded-lg focus:outline-none appearance-none pr-6 cursor-pointer shadow-2xs"
              >
                <option value="30d">This Month</option>
                <option value="7d">Last 7 Days</option>
                <option value="90d">Last 90 Days</option>
                <option value="1y">This Year</option>
              </select>
              <ChevronRight className="w-3 h-3 text-slate-400 absolute right-2 top-2.5 pointer-events-none rotate-90" />
            </div>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(effectiveRevenue)}
            </span>
            {kpis.revenueGrowth != null ? (
              <span className="text-[11px] font-semibold bg-[#ECFDF5] text-emerald-600 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                {`${kpis.revenueGrowth >= 0 ? '+' : ''}${kpis.revenueGrowth}%`}
              </span>
            ) : (
              <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5">
                Live Sales
              </span>
            )}
          </div>

          {/* Smooth Blue Gradient Chart */}
          <div className="h-44 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mobileChartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reportsSalesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 9.5, fill: '#94a3b8' }}
                />
                <Tooltip
                  formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Sales']}
                  contentStyle={{ borderRadius: '8px', fontSize: '11px', border: '1px solid #e2e8f0' }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#reportsSalesGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3 Metric Summary Cards in a Row */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs text-center">
            <p className="text-lg font-bold text-slate-900">{effectiveOrders}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Total Orders</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs text-center">
            <p className="text-lg font-bold text-slate-900">{products.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Total Products</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-2xs text-center">
            <p className="text-lg font-bold text-slate-900">{kpis.newCustomers ?? kpis.totalCustomers ?? customers.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Total Customers</p>
          </div>
        </div>
      </div>

      {/* ================= LAPTOP / DESKTOP REPORTS (100% Unchanged) ================= */}
      <div className="hidden md:block space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Commercial Analytics & Performance Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Turnover trends, RFQ conversion funnel, material category demand, and institutional buyer analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs text-xs font-semibold text-slate-700">
            {['today', '7d', '30d', '3m', '1y'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  timeRange === range
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <Button variant="secondary" size="sm" onClick={handleExport} leftIcon={Download}>
            Export Report CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Gross Merchandise Value (GMV)"
          value={formatCurrency(effectiveRevenue)}
          icon={IndianRupee}
          color="emerald"
        />

        <StatsCard
          title="Purchase Orders Placed"
          value={effectiveOrders}
          icon={ShoppingCart}
          color="blue"
          subtext={`Avg Order Value: ${formatCurrency(kpis.averageOrderValue || (effectiveOrders > 0 ? Math.round(effectiveRevenue / effectiveOrders) : 0))}`}
        />

        <StatsCard
          title="RFQ-to-Order Conversion Rate"
          value={`${kpis.conversionRate != null ? kpis.conversionRate : (enquiries.length > 0 ? ((orders.length / enquiries.length) * 100).toFixed(1) : 0)}%`}
          icon={Percent}
          color="amber"
          subtext={enquiries.length > 0 ? `From ${enquiries.length} inquiries` : 'Live conversion rate'}
        />

        <StatsCard
          title="Unique Material Inquiries"
          value={kpis.totalEnquiries != null ? kpis.totalEnquiries : enquiries.length}
          icon={HelpCircle}
          color="purple"
        />
      </div>

      {/* Trajectory Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Revenue Area Chart (8 cols) */}
        <div className="lg:col-span-8">
          <ChartCard
            title="Gross Revenue & Orders Trajectory"
            subtitle="Monthly turnover in INR (Lakhs) and PO fulfillment count"
          >
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={effectiveRevenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickFormatter={(val) =>
                      val >= 100000
                        ? `₹${(val / 100000).toFixed(1)}L`
                        : `₹${(val / 1000).toFixed(0)}k`
                    }
                  />
                  <Tooltip
                    formatter={(val) => [formatCurrency(val), 'Gross Revenue']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#f59e0b"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#salesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Category Breakdown (4 cols) */}
        <div className="lg:col-span-4">
          <ChartCard
            title="Revenue by Category Share"
            subtitle="Turnover contribution by category"
          >
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={effectiveCategoryData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {effectiveCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name, item) => [
                      `${val}% (${formatCurrency(item.payload.revenue)})`,
                      item.payload.name,
                    ]}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => (
                      <span className="text-[11px] text-slate-600">{val}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Funnel & Top Selling Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFQ to Order Conversion Funnel */}
        <ChartCard
          title="B2B Procurement Conversion Funnel"
          subtitle="Buyer journey from initial material views to delivered purchase orders"
        >
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={effectiveFunnelData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                  axisLine={false}
                  width={110}
                />
                <Tooltip
                  formatter={(val) => [formatNumber(val), 'Count']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#d97706" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Top Selling Construction Materials */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Top Grossing Construction Materials
              </h3>
              <p className="text-xs text-slate-500">Highest volume SKUs by overall unit turnover</p>
            </div>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-50 font-bold text-[11px] text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Material</th>
                  <th className="py-2 px-3">Unit Price</th>
                  <th className="py-2 px-3">Total Sold</th>
                  <th className="py-2 px-3 text-right">Gross Turn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {topMaterials.length > 0 ? (
                  topMaterials.map((m) => {
                    const unitsSold = Number(m.totalSales || m.salesCount || 0);
                    const unitPrice = Number(m.sellingPrice || m.price || 0);
                    const turnover = unitsSold * unitPrice;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[200px]">
                            {m.name}
                          </span>
                          {m.sku && <span className="text-[10px] text-slate-400 font-mono">{m.sku}</span>}
                        </td>
                        <td className="py-2.5 px-3">
                          {formatCurrency(unitPrice)} {m.unit ? `/ ${m.unit}` : ''}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {formatNumber(unitsSold)} {m.unit || 'units'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">
                          {formatCurrency(turnover)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-400">
                      No sales data recorded yet for catalog products
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
