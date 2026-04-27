import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Reservation, Table } from '../types';
import { cn, statusColors, formatDate } from '../lib/utils';
import { CalendarDays, Plus, Edit2, Trash2 } from 'lucide-react';

export default function Reservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Reservation | null>(null);
  const [form, setForm] = useState({ tableId: '', customerName: '', customerPhone: '', partySize: '', date: '', time: '', notes: '' });

  const fetchData = () => {
    Promise.all([api.get('/reservations'), api.get('/tables')]).then(([resRes, tablesRes]) => {
      setReservations(resRes.data);
      setTables(tablesRes.data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, partySize: parseInt(form.partySize) };
    if (editing) {
      await api.put(`/reservations/${editing.id}`, data);
    } else {
      await api.post('/reservations', data);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ tableId: '', customerName: '', customerPhone: '', partySize: '', date: '', time: '', notes: '' });
    fetchData();
  };

  const editReservation = (res: Reservation) => {
    setEditing(res);
    setForm({
      tableId: res.tableId,
      customerName: res.customerName,
      customerPhone: res.customerPhone || '',
      partySize: res.partySize.toString(),
      date: res.date.split('T')[0],
      time: res.time,
      notes: res.notes || '',
    });
    setShowModal(true);
  };

  const updateStatus = async (id: string, status: string) => {
    await api.put(`/reservations/${id}`, { status });
    fetchData();
  };

  const deleteReservation = async (id: string) => {
    if (!confirm('Delete this reservation?')) return;
    await api.delete(`/reservations/${id}`);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays /> Reservations
        </h1>
        <button onClick={() => { setEditing(null); setForm({ tableId: '', customerName: '', customerPhone: '', partySize: '', date: '', time: '', notes: '' }); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> New Reservation
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Table</th>
              <th className="text-center px-4 py-3 font-medium text-gray-500">Party</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Time</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map(res => (
              <tr key={res.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{res.customerName}</td>
                <td className="px-4 py-3">{res.customerPhone || '-'}</td>
                <td className="px-4 py-3">Table {res.table?.number}</td>
                <td className="px-4 py-3 text-center">{res.partySize}</td>
                <td className="px-4 py-3">{formatDate(res.date)}</td>
                <td className="px-4 py-3">{res.time}</td>
                <td className="px-4 py-3">
                  <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[res.status])}>{res.status}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {res.status === 'CONFIRMED' && (
                      <>
                        <button onClick={() => updateStatus(res.id, 'COMPLETED')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Complete</button>
                        <button onClick={() => updateStatus(res.id, 'CANCELLED')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Cancel</button>
                      </>
                    )}
                    <button onClick={() => editReservation(res)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={() => deleteReservation(res.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reservations.length === 0 && <p className="text-gray-400 text-center py-8">No reservations</p>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Reservation' : 'New Reservation'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input type="text" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Customer Name" required />
              <input type="text" value={form.customerPhone} onChange={e => setForm({ ...form, customerPhone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Phone" />
              <select value={form.tableId} onChange={e => setForm({ ...form, tableId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Select table</option>
                {tables.map(t => <option key={t.id} value={t.id}>Table {t.number} ({t.capacity} seats)</option>)}
              </select>
              <input type="number" value={form.partySize} onChange={e => setForm({ ...form, partySize: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Party Size" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
                <input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Notes" rows={2} />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
