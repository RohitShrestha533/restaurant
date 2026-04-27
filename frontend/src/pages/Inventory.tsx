import { useEffect, useState } from 'react';
import api from '../lib/api';
import { InventoryItem } from '../types';
import { formatCurrency } from '../lib/utils';
import { Package, Plus, Edit2, Trash2, AlertTriangle } from 'lucide-react';

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState({ name: '', quantity: '', unit: 'KG', minStock: '', costPerUnit: '', supplier: '' });

  const fetchData = () => {
    api.get('/inventory').then(res => { setItems(res.data); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, quantity: parseFloat(form.quantity), minStock: parseFloat(form.minStock), costPerUnit: parseFloat(form.costPerUnit) };
    if (editing) {
      await api.put(`/inventory/${editing.id}`, data);
    } else {
      await api.post('/inventory', data);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', quantity: '', unit: 'KG', minStock: '', costPerUnit: '', supplier: '' });
    fetchData();
  };

  const editItem = (item: InventoryItem) => {
    setEditing(item);
    setForm({
      name: item.name,
      quantity: item.quantity.toString(),
      unit: item.unit,
      minStock: item.minStock.toString(),
      costPerUnit: item.costPerUnit.toString(),
      supplier: item.supplier || '',
    });
    setShowModal(true);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this inventory item?')) return;
    await api.delete(`/inventory/${id}`);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package /> Inventory
        </h1>
        <button onClick={() => { setEditing(null); setForm({ name: '', quantity: '', unit: 'KG', minStock: '', costPerUnit: '', supplier: '' }); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Add Item
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Quantity</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Unit</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Min Stock</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Cost/Unit</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Supplier</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-right">{item.quantity}</td>
                <td className="px-4 py-3">{item.unit}</td>
                <td className="px-4 py-3 text-right">{item.minStock}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(item.costPerUnit)}</td>
                <td className="px-4 py-3">{item.supplier || '-'}</td>
                <td className="px-4 py-3">
                  {item.quantity <= item.minStock ? (
                    <span className="flex items-center gap-1 text-red-600 text-xs font-medium"><AlertTriangle size={12} /> Low Stock</span>
                  ) : (
                    <span className="text-green-600 text-xs font-medium">In Stock</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => editItem(item)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={() => deleteItem(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <p className="text-gray-400 text-center py-8">No inventory items</p>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Name" required />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Quantity" required />
                <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                  <option value="KG">KG</option>
                  <option value="LITERS">Liters</option>
                  <option value="PIECES">Pieces</option>
                  <option value="BOXES">Boxes</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" step="0.01" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Min Stock" required />
                <input type="number" step="0.01" value={form.costPerUnit} onChange={e => setForm({ ...form, costPerUnit: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Cost/Unit" required />
              </div>
              <input type="text" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Supplier" />
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
