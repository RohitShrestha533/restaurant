import { useEffect, useState } from 'react';
import api from '../lib/api';
import { DashboardData } from '../types';
import { formatCurrency, formatDateTime, statusColors, cn } from '../lib/utils';
import {
  Table2, ClipboardList, ChefHat, Receipt, Package,
  CalendarDays, Truck, TrendingUp, AlertTriangle
} from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Failed to load dashboard</div>;

  const stats = [
    { label: 'Total Tables', value: data.tables.total, icon: <Table2 />, color: 'bg-blue-500' },
    { label: 'Occupied', value: data.tables.occupied, icon: <Table2 />, color: 'bg-red-500' },
    { label: 'Active Orders', value: data.orders.active, icon: <ClipboardList />, color: 'bg-yellow-500' },
    { label: 'Kitchen Queue', value: data.orders.pendingKitchen, icon: <ChefHat />, color: 'bg-orange-500' },
    { label: 'Ready to Serve', value: data.orders.readyToServe, icon: <ChefHat />, color: 'bg-green-500' },
    { label: "Today's Revenue", value: formatCurrency(data.revenue.today), icon: <TrendingUp />, color: 'bg-emerald-500' },
    { label: 'Menu Items', value: data.menu.totalItems, icon: <Receipt />, color: 'bg-purple-500' },
    { label: 'Low Stock', value: data.inventory.lowStock, icon: <AlertTriangle />, color: data.inventory.lowStock > 0 ? 'bg-red-500' : 'bg-gray-500' },
    { label: 'Pending Deliveries', value: data.deliveries.pending, icon: <Truck />, color: 'bg-indigo-500' },
    { label: "Today's Reservations", value: data.reservations.today, icon: <CalendarDays />, color: 'bg-teal-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className={cn('p-2 rounded-lg text-white', stat.color)}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Table Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Table2 size={20} /> Table Overview
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-700">{data.tables.available}</p>
              <p className="text-sm text-green-600">Available</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-3xl font-bold text-yellow-700">{data.tables.reserved}</p>
              <p className="text-sm text-yellow-600">Reserved</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-3xl font-bold text-red-700">{data.tables.occupied}</p>
              <p className="text-sm text-red-600">Occupied</p>
            </div>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList size={20} /> Recent Orders
          </h2>
          <div className="space-y-3">
            {data.recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">
                    Table {order.table?.number} - {order.waiter?.name}
                  </p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[order.status])}>
                    {order.status}
                  </span>
                  <span className="text-sm font-semibold">{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-gray-400 text-center py-4">No recent orders</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
