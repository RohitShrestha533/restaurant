import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import Kitchen from './pages/Kitchen';
import Billing from './pages/Billing';
import MenuManagement from './pages/MenuManagement';
import Inventory from './pages/Inventory';
import Reservations from './pages/Reservations';
import DeliveryManagement from './pages/DeliveryManagement';
import Reports from './pages/Reports';
import UserManagement from './pages/UserManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tables" element={<Tables />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/kitchen" element={<Kitchen />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/menu" element={<MenuManagement />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/delivery" element={<DeliveryManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
