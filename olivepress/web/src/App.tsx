import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import Layout from './components/Layout';
import { LoadingView } from './components/Feedback';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ClientsScreen from './screens/ClientsScreen';
import ClientFormScreen from './screens/ClientFormScreen';
import ClientDetailScreen from './screens/ClientDetailScreen';
import ApportsScreen from './screens/ApportsScreen';
import ApportFormScreen from './screens/ApportFormScreen';
import ApportDetailScreen from './screens/ApportDetailScreen';
import YieldFormScreen from './screens/YieldFormScreen';
import ProductionScreen from './screens/ProductionScreen';
import StockScreen from './screens/StockScreen';
import LivraisonsScreen from './screens/LivraisonsScreen';
import LivraisonFormScreen from './screens/LivraisonFormScreen';
import FacturesScreen from './screens/FacturesScreen';
import FactureFormScreen from './screens/FactureFormScreen';
import FactureDetailScreen from './screens/FactureDetailScreen';
import EmployeesScreen from './screens/EmployeesScreen';
import EmployeeFormScreen from './screens/EmployeeFormScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import ReportsScreen from './screens/ReportsScreen';
import HistoryScreen from './screens/HistoryScreen';
import ProfileScreen from './screens/ProfileScreen';
import SettingsScreen from './screens/SettingsScreen';

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-brand">
          <div className="spinner" style={{ borderTopColor: '#F7F4EC' }} />
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/clients" element={<ClientsScreen />} />
        <Route path="/clients/nouveau" element={<ClientFormScreen />} />
        <Route path="/clients/:id" element={<ClientDetailScreen />} />
        <Route path="/clients/:id/modifier" element={<ClientFormScreen />} />
        <Route path="/apports" element={<ApportsScreen />} />
        <Route path="/apports/nouveau" element={<ApportFormScreen />} />
        <Route path="/apports/nouveau/:clientId" element={<ApportFormScreen />} />
        <Route path="/apports/:id" element={<ApportDetailScreen />} />
        <Route path="/apports/:id/modifier" element={<ApportFormScreen />} />
        <Route path="/apports/:id/production" element={<YieldFormScreen />} />
        <Route path="/production" element={<ProductionScreen />} />
        <Route path="/stock" element={<StockScreen />} />
        <Route path="/livraisons" element={<LivraisonsScreen />} />
        <Route path="/livraisons/nouvelle" element={<LivraisonFormScreen />} />
        <Route path="/factures" element={<FacturesScreen />} />
        <Route path="/factures/nouvelle" element={<FactureFormScreen />} />
        <Route path="/factures/:id" element={<FactureDetailScreen />} />
        <Route path="/employes" element={<EmployeesScreen />} />
        <Route path="/employes/nouveau" element={<EmployeeFormScreen />} />
        <Route path="/employes/:id/modifier" element={<EmployeeFormScreen />} />
        <Route path="/notifications" element={<NotificationsScreen />} />
        <Route path="/rapports" element={<ReportsScreen />} />
        <Route path="/historique" element={<HistoryScreen />} />
        <Route path="/reglages" element={<SettingsScreen />} />
        <Route path="/profil" element={<ProfileScreen />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export { LoadingView };
