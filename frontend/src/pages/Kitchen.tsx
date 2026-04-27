import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Order } from '../types';
import { cn, statusColors, formatDateTime } from '../lib/utils';
import { ChefHat, Clock, PlayCircle } from 'lucide-react';

export default function Kitchen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = () => {
    api.get('/kitchen/queue').then(res => { setOrders(res.data); setLoading(false); });
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  const startPreparing = async (orderId: string) => {
    await api.put(`/kitchen/orders/${orderId}/start`);
    fetchQueue();
  };

  const updateItemStatus = async (itemId: string, status: string) => {
    try {
      await api.put(`/kitchen/items/${itemId}/status`, { status });
      fetchQueue();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const preparingOrders = orders.filter(o => o.status === 'PREPARING');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ChefHat /> Kitchen Display
        </h1>
        <div className="flex gap-4 text-sm">
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">{pendingOrders.length} Pending</span>
          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">{preparingOrders.length} Preparing</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div>
          <h2 className="text-lg font-semibold text-yellow-700 mb-3 flex items-center gap-2">
            <Clock size={18} /> Pending Orders
          </h2>
          <div className="space-y-3">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border-2 border-yellow-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-lg">Table {order.table?.number}</span>
                    <span className="text-xs text-gray-500 ml-2">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <button onClick={() => startPreparing(order.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1 hover:bg-blue-700">
                    <PlayCircle size={14} /> Start
                  </button>
                </div>
                <div className="space-y-1">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1 px-2 bg-yellow-50 rounded">
                      <span className="text-sm">{item.quantity}x {item.menuItem?.name}</span>
                      {item.notes && <span className="text-xs text-gray-500 italic">{item.notes}</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {pendingOrders.length === 0 && <p className="text-gray-400 text-center py-8">No pending orders</p>}
          </div>
        </div>

        {/* Preparing Orders */}
        <div>
          <h2 className="text-lg font-semibold text-blue-700 mb-3 flex items-center gap-2">
            <ChefHat size={18} /> Preparing
          </h2>
          <div className="space-y-3">
            {preparingOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border-2 border-blue-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-lg">Table {order.table?.number}</span>
                    <span className="text-xs text-gray-500 ml-2">{formatDateTime(order.createdAt)}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  {order.items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-1.5 px-2 bg-blue-50 rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.quantity}x {item.menuItem?.name}</span>
                        <span className={cn('px-1.5 py-0.5 rounded text-xs', statusColors[item.status])}>{item.status}</span>
                      </div>
                      <div className="flex gap-1">
                        {item.status === 'PREPARING' && (
                          <button onClick={() => updateItemStatus(item.id, 'READY')} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700">Ready</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {preparingOrders.length === 0 && <p className="text-gray-400 text-center py-8">No orders being prepared</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
