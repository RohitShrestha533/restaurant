import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Category, MenuItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Plus, Edit2, Trash2, UtensilsCrossed } from 'lucide-react';

export default function MenuManagement() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [catName, setCatName] = useState('');
  const [itemForm, setItemForm] = useState({ name: '', description: '', price: '', categoryId: '', available: true });

  const canManage = ['ADMIN', 'MANAGER'].includes(user?.role || '');

  const fetchData = () => {
    api.get('/menu/categories').then(res => { setCategories(res.data); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.post('/menu/categories', { name: catName });
    setCatName('');
    setShowCatModal(false);
    fetchData();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category and all its items?')) return;
    await api.delete(`/menu/categories/${id}`);
    fetchData();
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...itemForm, price: parseFloat(itemForm.price) };
    if (editingItem) {
      await api.put(`/menu/items/${editingItem.id}`, data);
    } else {
      await api.post('/menu/items', data);
    }
    setShowItemModal(false);
    setEditingItem(null);
    setItemForm({ name: '', description: '', price: '', categoryId: '', available: true });
    fetchData();
  };

  const editItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId,
      available: item.available,
    });
    setShowItemModal(true);
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Delete this menu item?')) return;
    await api.delete(`/menu/items/${id}`);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <UtensilsCrossed /> Menu Management
        </h1>
        {canManage && (
          <div className="flex gap-2">
            <button onClick={() => setShowCatModal(true)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">Add Category</button>
            <button onClick={() => { setEditingItem(null); setItemForm({ name: '', description: '', price: '', categoryId: categories[0]?.id || '', available: true }); setShowItemModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
              <Plus size={16} /> Add Item
            </button>
          </div>
        )}
      </div>

      {categories.map(cat => (
        <div key={cat.id} className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">{cat.name}</h2>
            {canManage && (
              <button onClick={() => deleteCategory(cat.id)} className="text-red-500 hover:text-red-700">
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cat.menuItems?.map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    {item.description && <p className="text-sm text-gray-500 mt-1">{item.description}</p>}
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <button onClick={() => editItem(item)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(item.price)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </span>
                </div>
              </div>
            ))}
            {(!cat.menuItems || cat.menuItems.length === 0) && (
              <p className="text-gray-400 text-sm col-span-full">No items in this category</p>
            )}
          </div>
        </div>
      ))}

      {categories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border">
          <UtensilsCrossed size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No menu categories yet</p>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <input type="text" value={catName} onChange={e => setCatName(e.target.value)} className="w-full px-3 py-2 border rounded-lg" placeholder="Category name" required />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowCatModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editingItem ? 'Edit Item' : 'Add Item'}</h2>
            <form onSubmit={handleSaveItem} className="space-y-4">
              <input type="text" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Item name" required />
              <textarea value={itemForm.description} onChange={e => setItemForm({ ...itemForm, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Description" rows={2} />
              <input type="number" step="0.01" value={itemForm.price} onChange={e => setItemForm({ ...itemForm, price: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Price" required />
              <select value={itemForm.categoryId} onChange={e => setItemForm({ ...itemForm, categoryId: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={itemForm.available} onChange={e => setItemForm({ ...itemForm, available: e.target.checked })} />
                <span className="text-sm">Available</span>
              </label>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 bg-gray-100 rounded-lg text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
