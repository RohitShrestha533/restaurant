import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Billing as BillingType, Order } from '../types';
import { cn, statusColors, formatCurrency, formatDateTime } from '../lib/utils';
import { Receipt, CreditCard, DollarSign } from 'lucide-react';

export default function Billing() {
  const [bills, setBills] = useState<BillingType[]>([]);
  const [servedOrders, setServedOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showPay, setShowPay] = useState<BillingType | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [discount, setDiscount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  const fetchData = () => {
    Promise.all([
      api.get('/billing'),
      api.get('/orders?status=SERVED'),
    ]).then(([billsRes, ordersRes]) => {
      setBills(billsRes.data);
      setServedOrders(ordersRes.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const generateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/billing/generate', {
      orderId: selectedOrderId,
      discount: parseFloat(discount),
    });
    setShowGenerate(false);
    setSelectedOrderId('');
    setDiscount('0');
    fetchData();
  };

  const processPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPay) return;
    await api.put(`/billing/${showPay.id}/pay`, { paymentMethod });
    setShowPay(null);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Receipt /> Billing
        </h1>
        {servedOrders.length > 0 && (
          <button onClick={() => setShowGenerate(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
            <DollarSign size={16} /> Generate Bill
          </button>
        )}
      </div>

      {/* Bills Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Cashier</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Subtotal</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Tax</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Discount</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Payment</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bills.map(bill => (
              <tr key={bill.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">#{bill.orderId.slice(0, 8)}</td>
                <td className="px-4 py-3">Table {bill.order?.table?.number}</td>
                <td className="px-4 py-3">{bill.cashier?.name}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(bill.subtotal)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(bill.tax)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(bill.discount)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(bill.total)}</td>
                <td className="px-4 py-3">{bill.paymentMethod || '-'}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[bill.paymentStatus])}>{bill.paymentStatus}</span>
                </td>
                <td className="px-4 py-3">
                  {bill.paymentStatus === 'PENDING' && (
                    <button onClick={() => setShowPay(bill)} className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1">
                      <CreditCard size={12} /> Pay
                    </button>
                  )}
                  {bill.paidAt && <span className="text-xs text-gray-500">{formatDateTime(bill.paidAt)}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p className="text-gray-400 text-center py-8">No bills found</p>}
      </div>

      {/* Generate Bill Modal */}
      {showGenerate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Generate Bill</h2>
            <form onSubmit={generateBill} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Served Order</label>
                <select value={selectedOrderId} onChange={e => setSelectedOrderId(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select order</option>
                  {servedOrders.map(o => (
                    <option key={o.id} value={o.id}>Table {o.table?.number} - {formatCurrency(o.totalAmount)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Discount ($)</label>
                <input type="number" step="0.01" min="0" value={discount} onChange={e => setDiscount(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Process Payment</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-center">{formatCurrency(showPay.total)}</p>
            </div>
            <form onSubmit={processPayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowPay(null)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Confirm Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
