import { useEffect, useState } from 'react';
import api from '../lib/api';
import { User } from '../types';
import { Users, Plus, Edit2, Trash2 } from 'lucide-react';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'WAITER', phone: '' });

  const fetchData = () => {
    api.get('/users').then(res => { setUsers(res.data); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const data: Record<string, unknown> = { email: form.email, name: form.name, role: form.role, phone: form.phone || undefined };
      if (form.password) data.password = form.password;
      await api.put(`/users/${editing.id}`, data);
    } else {
      await api.post('/users', form);
    }
    setShowModal(false);
    setEditing(null);
    setForm({ email: '', password: '', name: '', role: 'WAITER', phone: '' });
    fetchData();
  };

  const editUser = (user: User) => {
    setEditing(user);
    setForm({ email: user.email, password: '', name: user.name, role: user.role, phone: user.phone || '' });
    setShowModal(true);
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Deactivate this user?')) return;
    await api.delete(`/users/${id}`);
    fetchData();
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>;

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-700',
    MANAGER: 'bg-blue-100 text-blue-700',
    WAITER: 'bg-green-100 text-green-700',
    KITCHEN: 'bg-orange-100 text-orange-700',
    CASHIER: 'bg-purple-100 text-purple-700',
    DELIVERY: 'bg-teal-100 text-teal-700',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users /> User Management
        </h1>
        <button onClick={() => { setEditing(null); setForm({ email: '', password: '', name: '', role: 'WAITER', phone: '' }); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Phone</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100'}`}>{user.role}</span>
                </td>
                <td className="px-4 py-3">{user.phone || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button onClick={() => editUser(user)} className="p-1 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={() => deleteUser(user.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">{editing ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSave} className="space-y-3">
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Name" required />
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Email" required />
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder={editing ? 'New password (optional)' : 'Password'} required={!editing} />
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="ADMIN">Admin</option>
                <option value="MANAGER">Manager</option>
                <option value="WAITER">Waiter</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="CASHIER">Cashier</option>
                <option value="DELIVERY">Delivery</option>
              </select>
              <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border rounded-lg" placeholder="Phone" />
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
