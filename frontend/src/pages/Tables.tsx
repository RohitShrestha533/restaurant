import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Table } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn, statusColors } from '../lib/utils';
import { Plus, Users, Merge, Unlink } from 'lucide-react';

export default function Tables() {
  const { user } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [form, setForm] = useState({ number: '', capacity: '', section: '' });

  const canManage = ['ADMIN', 'MANAGER'].includes(user?.role || '');

  const fetchTables = () => {
    api.get('/tables').then(res => { setTables(res.data); setLoading(false); });
  };

  useEffect(() => { fetchTables(); }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/tables', { number: parseInt(form.number), capacity: parseInt(form.capacity), section: form.section || undefined });
    setShowAdd(false);
    setForm({ number: '', capacity: '', section: '' });
    fetchTables();
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/tables/${id}/status`, { status });
      fetchTables();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Failed to update status');
    }
  };

  const toggleMergeSelection = (id: string) => {
    setSelectedForMerge(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleMerge = async () => {
    if (selectedForMerge.length < 2) { alert('Select at least 2 tables'); return; }
    await api.post('/tables/merge', { tableIds: selectedForMerge });
    setMergeMode(false);
    setSelectedForMerge([]);
    fetchTables();
  };

  const handleUnmerge = async (table: Table) => {
    if (!table.mergedWith) return;
    const ids = table.mergedWith.split(',');
    await api.post('/tables/unmerge', { tableIds: ids });
    fetchTables();
  };

  const deleteTable = async (id: string) => {
    if (!confirm('Delete this table?')) return;
    await api.delete(`/tables/${id}`);
    fetchTables();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tables</h1>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setMergeMode(!mergeMode)} className={cn('px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2', mergeMode ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200')}>
              <Merge size={16} /> {mergeMode ? 'Cancel Merge' : 'Merge Tables'}
            </button>
            {mergeMode && selectedForMerge.length >= 2 && (
              <button onClick={handleMerge} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600">
                Merge Selected ({selectedForMerge.length})
              </button>
            )}
            <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Plus size={16} /> Add Table
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map(table => (
          <div
            key={table.id}
            onClick={() => mergeMode && table.status === 'AVAILABLE' ? toggleMergeSelection(table.id) : undefined}
            className={cn(
              'bg-white rounded-xl border-2 p-6 transition-all',
              mergeMode && table.status === 'AVAILABLE' ? 'cursor-pointer' : '',
              selectedForMerge.includes(table.id) ? 'border-yellow-400 bg-yellow-50' : 'border-gray-200',
              table.status === 'AVAILABLE' ? 'hover:border-green-300' : '',
              table.status === 'OCCUPIED' ? 'hover:border-red-300' : '',
              table.status === 'RESERVED' ? 'hover:border-yellow-300' : '',
            )}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Table {table.number}</h3>
                {table.section && <p className="text-xs text-gray-500">{table.section}</p>}
              </div>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', statusColors[table.status])}>
                {table.status}
              </span>
            </div>

            <div className="flex items-center gap-1 text-gray-500 mb-4">
              <Users size={14} />
              <span className="text-sm">{table.capacity} seats</span>
            </div>

            {table.mergedWith && (
              <div className="mb-3 flex items-center gap-1 text-yellow-600 text-xs">
                <Merge size={12} /> Merged
                {canManage && (
                  <button onClick={() => handleUnmerge(table)} className="ml-auto text-red-500 hover:text-red-700">
                    <Unlink size={14} />
                  </button>
                )}
              </div>
            )}

            {table.orders && table.orders.length > 0 && (
              <p className="text-xs text-blue-600 mb-3">{table.orders.length} active order(s)</p>
            )}

            {!mergeMode && (
              <div className="flex gap-1 flex-wrap">
                {table.status === 'AVAILABLE' && (
                  <>
                    <button onClick={() => updateStatus(table.id, 'OCCUPIED')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Seat</button>
                    <button onClick={() => updateStatus(table.id, 'RESERVED')} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200">Reserve</button>
                  </>
                )}
                {table.status === 'RESERVED' && (
                  <>
                    <button onClick={() => updateStatus(table.id, 'OCCUPIED')} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200">Seat</button>
                    <button onClick={() => updateStatus(table.id, 'AVAILABLE')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Free</button>
                  </>
                )}
                {table.status === 'OCCUPIED' && (
                  <button onClick={() => updateStatus(table.id, 'AVAILABLE')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">Free</button>
                )}
                {canManage && (
                  <button onClick={() => deleteTable(table.id)} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs hover:bg-gray-200 ml-auto">Delete</button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Table Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add New Table</h2>
            <form onSubmit={handleAddTable} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
                <input type="number" value={form.number} onChange={e => setForm({ ...form, number: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                <input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                <input type="text" value={form.section} onChange={e => setForm({ ...form, section: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="e.g., Indoor, Outdoor" />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add Table</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
