import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Order, Table, MenuItem, Category } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn, statusColors, formatCurrency, formatDateTime } from '../lib/utils';
import { Plus, Eye, ChevronDown, ChevronUp } from 'lucide-react';

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [newOrder, setNewOrder] = useState({
    tableId: '',
    type: 'DINE_IN',
    notes: '',
    items: [] as { menuItemId: string; quantity: number; name: string; price: number }[],
  });

  const canCreate = ['ADMIN', 'MANAGER', 'WAITER'].includes(user?.role || '');

  const fetchData = () => {
    Promise.all([
      api.get('/orders' + (statusFilter ? `?status=${statusFilter}` : '')),
      api.get('/tables'),
      api.get('/menu/categories'),
    ]).then(([ordersRes, tablesRes, catRes]) => {
      setOrders(ordersRes.data);
      setTables(tablesRes.data);
      setCategories(catRes.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const addItem = (item: MenuItem) => {
    setNewOrder(prev => {
      const existing = prev.items.find(i => i.menuItemId === item.id);
      if (existing) {
        return { ...prev, items: prev.items.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
      }
      return { ...prev, items: [...prev.items, { menuItemId: item.id, quantity: 1, name: item.name, price: item.price }] };
    });
  };

  const removeItem = (menuItemId: string) => {
    setNewOrder(prev => ({ ...prev, items: prev.items.filter(i => i.menuItemId !== menuItemId) }));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) { removeItem(menuItemId); return; }
    setNewOrder(prev => ({ ...prev, items: prev.items.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i) }));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.tableId || newOrder.items.length === 0) { alert('Select a table and add items'); return; }
    await api.post('/orders', {
      tableId: newOrder.tableId,
      type: newOrder.type,
      notes: newOrder.notes || undefined,
      items: newOrder.items.map(i => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
    });
    setShowCreate(false);
    setNewOrder({ tableId: '', type: 'DINE_IN', notes: '', items: [] });
    fetchData();
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const orderTotal = newOrder.items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PREPARING">Preparing</option>
            <option value="READY">Ready</option>
            <option value="SERVED">Served</option>
            <option value="BILLED">Billed</option>
            <option value="COMPLETED">Completed</option>
          </select>
          {canCreate && (
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Plus size={16} /> New Order
            </button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}>
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-semibold text-gray-900">Table {order.table?.number}</span>
                  <span className="text-sm text-gray-500 ml-2">#{order.id.slice(0, 8)}</span>
                </div>
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[order.status])}>{order.status}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{order.type}</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(order.totalAmount)}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
                {expandedOrder === order.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </div>

            {expandedOrder === order.id && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="mb-4">
                  <p className="text-sm text-gray-600">Waiter: <span className="font-medium">{order.waiter?.name}</span></p>
                  {order.notes && <p className="text-sm text-gray-600 mt-1">Notes: {order.notes}</p>}
                </div>

                <table className="w-full text-sm mb-4">
                  <thead>
                    <tr className="text-left text-gray-500">
                      <th className="pb-2">Item</th>
                      <th className="pb-2">Qty</th>
                      <th className="pb-2">Price</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map(item => (
                      <tr key={item.id} className="border-t border-gray-200">
                        <td className="py-2">{item.menuItem?.name}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">{formatCurrency(item.price * item.quantity)}</td>
                        <td className="py-2">
                          <span className={cn('px-2 py-0.5 rounded-full text-xs', statusColors[item.status])}>{item.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex gap-2">
                  {order.status === 'READY' && canCreate && (
                    <button onClick={() => updateOrderStatus(order.id, 'SERVED')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm">Mark Served</button>
                  )}
                  {order.status === 'SERVED' && ['ADMIN', 'MANAGER', 'CASHIER'].includes(user?.role || '') && (
                    <button onClick={() => updateOrderStatus(order.id, 'BILLED')} className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm">Generate Bill</button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Eye size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No orders found</p>
          </div>
        )}
      </div>

      {/* Create Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4">
            <h2 className="text-lg font-bold mb-4">New Order</h2>
            <form onSubmit={handleCreateOrder}>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                  <select value={newOrder.tableId} onChange={e => setNewOrder({ ...newOrder, tableId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                    <option value="">Select table</option>
                    {tables.filter(t => t.status !== 'AVAILABLE' || true).map(t => (
                      <option key={t.id} value={t.id}>Table {t.number} ({t.status})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={newOrder.type} onChange={e => setNewOrder({ ...newOrder, type: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                    <option value="DINE_IN">Dine In</option>
                    <option value="TAKEAWAY">Takeaway</option>
                    <option value="DELIVERY">Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input type="text" value={newOrder.notes} onChange={e => setNewOrder({ ...newOrder, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Menu items */}
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <h3 className="font-medium text-sm mb-2">Menu Items</h3>
                  {categories.map(cat => (
                    <div key={cat.id} className="mb-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{cat.name}</p>
                      {cat.menuItems?.filter(i => i.available).map(item => (
                        <button key={item.id} type="button" onClick={() => addItem(item)} className="flex items-center justify-between w-full px-2 py-1.5 hover:bg-blue-50 rounded text-sm text-left">
                          <span>{item.name}</span>
                          <span className="text-gray-500">{formatCurrency(item.price)}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Selected items */}
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium text-sm mb-2">Order Items ({newOrder.items.length})</h3>
                  {newOrder.items.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Click menu items to add</p>
                  ) : (
                    <div className="space-y-2">
                      {newOrder.items.map(item => (
                        <div key={item.menuItemId} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <span className="text-sm">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)} className="w-6 h-6 bg-gray-200 rounded text-sm">-</button>
                            <span className="text-sm w-6 text-center">{item.quantity}</span>
                            <button type="button" onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)} className="w-6 h-6 bg-gray-200 rounded text-sm">+</button>
                            <span className="text-sm text-gray-500 w-16 text-right">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        </div>
                      ))}
                      <div className="border-t pt-2 mt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{formatCurrency(orderTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
