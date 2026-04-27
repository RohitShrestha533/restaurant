import { useEffect, useState } from 'react';
import api from '../lib/api';
import { ReportSummary } from '../types';
import { formatCurrency, cn, statusColors } from '../lib/utils';
import { BarChart3, TrendingUp, ClipboardList, DollarSign } from 'lucide-react';

interface PopularItem {
  menuItem: { name: string; price: number };
  totalQuantity: number;
  orderCount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
}

export default function Reports() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/reports/summary'),
      api.get('/reports/popular-items'),
      api.get('/reports/daily-revenue'),
    ]).then(([summaryRes, itemsRes, revenueRes]) => {
      setSummary(summaryRes.data);
      setPopularItems(itemsRes.data);
      setDailyRevenue(revenueRes.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!summary) return <div className="text-center py-20 text-gray-500">Failed to load reports</div>;

  const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <BarChart3 /> Reports & Analytics
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg"><ClipboardList className="text-blue-600" size={20} /></div>
            <span className="text-sm text-gray-500">Total Orders</span>
          </div>
          <p className="text-3xl font-bold">{summary.totalOrders}</p>
          <p className="text-sm text-gray-500 mt-1">{summary.completedOrders} completed</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="text-green-600" size={20} /></div>
            <span className="text-sm text-gray-500">Total Revenue</span>
          </div>
          <p className="text-3xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="text-purple-600" size={20} /></div>
            <span className="text-sm text-gray-500">Avg Order Value</span>
          </div>
          <p className="text-3xl font-bold">
            {summary.completedOrders > 0 ? formatCurrency(summary.totalRevenue / summary.completedOrders) : '$0.00'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {summary.ordersByStatus.map(s => (
              <div key={s.status} className="flex items-center justify-between">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[s.status])}>{s.status}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${(s.count / summary.totalOrders) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="font-semibold text-sm w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Items */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Popular Items</h2>
          <div className="space-y-3">
            {popularItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="font-medium text-sm">{item.menuItem?.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{item.totalQuantity} sold</p>
                  <p className="text-xs text-gray-500">{item.orderCount} orders</p>
                </div>
              </div>
            ))}
            {popularItems.length === 0 && <p className="text-gray-400 text-center py-4">No data yet</p>}
          </div>
        </div>

        {/* Daily Revenue Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Daily Revenue</h2>
          {dailyRevenue.length > 0 ? (
            <div className="flex items-end gap-1 h-48">
              {dailyRevenue.slice(-30).map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center justify-end">
                  <div
                    className="bg-blue-500 rounded-t w-full min-h-[4px] hover:bg-blue-600 transition-colors"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                    title={`${day.date}: ${formatCurrency(day.revenue)}`}
                  />
                  {dailyRevenue.length <= 10 && (
                    <span className="text-xs text-gray-400 mt-1 -rotate-45">{day.date.slice(5)}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-12">No revenue data yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
