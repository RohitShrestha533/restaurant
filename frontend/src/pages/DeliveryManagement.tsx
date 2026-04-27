import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Delivery } from '../types';
import { cn, statusColors, formatDateTime } from '../lib/utils';
import { Truck, MapPin, Phone, User } from 'lucide-react';

export default function DeliveryManagement() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    api.get('/delivery').then(res => { setDeliveries(res.data); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/delivery/${id}/status`, { status });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Truck /> Delivery Management
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveries.map(delivery => (
          <div key={delivery.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Order #{delivery.orderId.slice(0, 8)}</span>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[delivery.status])}>{delivery.status}</span>
            </div>

            <div className="space-y-2 text-sm mb-4">
              <div className="flex items-center gap-2 text-gray-600">
                <User size={14} /> {delivery.customerName}
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone size={14} /> {delivery.customerPhone}
              </div>
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin size={14} className="mt-0.5" /> {delivery.customerAddress}
              </div>
              {delivery.driver && (
                <div className="flex items-center gap-2 text-blue-600">
                  <Truck size={14} /> Driver: {delivery.driver.name}
                </div>
              )}
              {delivery.estimatedTime && (
                <p className="text-gray-500">ETA: {delivery.estimatedTime}</p>
              )}
              {delivery.deliveredAt && (
                <p className="text-green-600 text-xs">Delivered: {formatDateTime(delivery.deliveredAt)}</p>
              )}
            </div>

            <div className="flex gap-1">
              {delivery.status === 'ASSIGNED' && (
                <button onClick={() => updateStatus(delivery.id, 'PICKED_UP')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs">Pick Up</button>
              )}
              {delivery.status === 'PICKED_UP' && (
                <button onClick={() => updateStatus(delivery.id, 'DELIVERED')} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs">Mark Delivered</button>
              )}
            </div>
          </div>
        ))}

        {deliveries.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-xl border">
            <Truck size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No deliveries</p>
          </div>
        )}
      </div>
    </div>
  );
}
