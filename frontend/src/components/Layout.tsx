import { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Table2, ClipboardList, ChefHat, Receipt,
  UtensilsCrossed, Package, CalendarDays, Truck, BarChart3,
  Users, LogOut, Menu, X, ChevronDown, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
  group?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} />, group: 'Main' },
  { label: 'Tables', path: '/tables', icon: <Table2 size={20} />, group: 'Operations', roles: ['ADMIN', 'MANAGER', 'WAITER', 'CASHIER'] },
  { label: 'Orders', path: '/orders', icon: <ClipboardList size={20} />, group: 'Operations', roles: ['ADMIN', 'MANAGER', 'WAITER', 'KITCHEN', 'CASHIER', 'DELIVERY'] },
  { label: 'Kitchen Display', path: '/kitchen', icon: <ChefHat size={20} />, group: 'Operations', roles: ['ADMIN', 'MANAGER', 'KITCHEN'] },
  { label: 'Billing', path: '/billing', icon: <Receipt size={20} />, group: 'Operations', roles: ['ADMIN', 'MANAGER', 'CASHIER'] },
  { label: 'Menu', path: '/menu', icon: <UtensilsCrossed size={20} />, group: 'Management', roles: ['ADMIN', 'MANAGER', 'WAITER', 'KITCHEN'] },
  { label: 'Inventory', path: '/inventory', icon: <Package size={20} />, group: 'Management', roles: ['ADMIN', 'MANAGER'] },
  { label: 'Reservations', path: '/reservations', icon: <CalendarDays size={20} />, group: 'Management', roles: ['ADMIN', 'MANAGER', 'WAITER'] },
  { label: 'Delivery', path: '/delivery', icon: <Truck size={20} />, group: 'Management', roles: ['ADMIN', 'MANAGER', 'DELIVERY'] },
  { label: 'Reports', path: '/reports', icon: <BarChart3 size={20} />, group: 'Analytics', roles: ['ADMIN', 'MANAGER'] },
  { label: 'User Management', path: '/users', icon: <Users size={20} />, group: 'Analytics', roles: ['ADMIN'] },
];

export default function Layout() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    Main: true,
    Operations: true,
    Management: true,
    Analytics: true,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const filteredItems = navItems.filter(
    item => !item.roles || item.roles.includes(user.role)
  );

  const groups = [...new Set(filteredItems.map(item => item.group))];

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300 flex flex-col',
        sidebarOpen ? 'w-64' : 'w-16'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="text-blue-600" size={24} />
              <span className="font-bold text-lg text-gray-800">RMS</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {groups.map(group => {
            const groupItems = filteredItems.filter(item => item.group === group);
            if (groupItems.length === 0) return null;

            return (
              <div key={group} className="mb-2">
                {sidebarOpen && group && (
                  <button
                    onClick={() => toggleGroup(group!)}
                    className="flex items-center justify-between w-full px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
                  >
                    {group}
                    {expandedGroups[group!] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>
                )}
                {(expandedGroups[group!] || !sidebarOpen) && groupItems.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-3 mx-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      location.pathname === item.path
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    {item.icon}
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                ))}
              </div>
            );
          })}
        </nav>

        {/* User info */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">{user.name}</p>
                <p className="text-xs text-gray-500">{user.role}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-red-600"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={cn(
        'flex-1 overflow-auto transition-all duration-300',
        sidebarOpen ? 'ml-64' : 'ml-16'
      )}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
