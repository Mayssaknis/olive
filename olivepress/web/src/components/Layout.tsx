import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Download,
  Droplets,
  Package,
  Truck,
  FileText,
  UserCog,
  Bell,
  BarChart3,
  History,
  User,
  Menu,
  LogOut,
  X,
  Settings,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { notificationsApi } from '../api/services';
import { useI18n } from '../i18n';
import { initials } from '../utils/format';

const NAV: {
  section: string;
  items: { to: string; label: string; icon: typeof LayoutGrid; permission?: any }[];
}[] = [
  {
    section: 'Pilotage',
    items: [{ to: '/', label: 'Tableau de bord', icon: LayoutGrid }],
  },
  {
    section: 'Exploitation',
    items: [
      { to: '/clients', label: 'Clients', icon: Users, permission: 'CLIENT_READ' },
      { to: '/apports', label: 'Apports', icon: Download, permission: 'APPORT_READ' },
      { to: '/production', label: 'Production', icon: Droplets, permission: 'PRODUCTION_READ' },
      { to: '/stock', label: 'Stock', icon: Package, permission: 'STOCK_READ' },
      { to: '/livraisons', label: 'Livraisons', icon: Truck, permission: 'LIVRAISON_READ' },
    ],
  },
  {
    section: 'Gestion',
    items: [
      { to: '/factures', label: 'Factures', icon: FileText, permission: 'FACTURE_READ' },
      { to: '/employes', label: 'Employés', icon: UserCog, permission: 'EMPLOYEE_READ' },
      { to: '/reglages', label: 'Réglages', icon: Settings, permission: 'SETTING_WRITE' },
    ],
  },
  {
    section: 'Suivi & analyse',
    items: [
      { to: '/rapports', label: 'Rapports', icon: BarChart3, permission: 'REPORT_READ' },
      { to: '/historique', label: 'Historique', icon: History, permission: 'HISTORY_READ' },
      { to: '/notifications', label: 'Notifications', icon: Bell, permission: 'NOTIFICATION_READ' },
    ],
  },
];

const TITLES: Record<string, string> = {
  '/': 'Tableau de bord',
  '/clients': 'Clients',
  '/apports': 'Apports',
  '/production': 'Production',
  '/stock': "Stock d'huile",
  '/livraisons': 'Livraisons',
  '/factures': 'Factures',
  '/employes': 'Employés',
  '/rapports': 'Rapports',
  '/historique': 'Historique',
  '/notifications': 'Notifications',
  '/reglages': 'Réglages',
  '/profil': 'Mon profil',
};

export default function Layout() {
  const { user, logout, can } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      notificationsApi
        .unreadCount()
        .then((n) => alive && setUnread(typeof n === 'number' ? n : 0))
        .catch(() => {});
    load();
    const id = setInterval(load, 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const title = t(
    TITLES[location.pathname] ??
      (location.pathname.startsWith('/clients/')
        ? 'Fiche client'
        : location.pathname.startsWith('/apports/')
          ? 'Détail de l’apport'
          : location.pathname.startsWith('/factures/')
            ? 'Détail de la facture'
            : location.pathname.startsWith('/nouveau-') || location.pathname.includes('/modifier')
              ? ''
              : 'OlivePress'),
  );

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#F7F4EC"
            strokeWidth="1.8"
          >
            <path d="M12 2C7 7 5 11 5 14a7 7 0 0 0 14 0c0-3-2-7-7-12z" />
            <path d="M12 22V12" />
          </svg>
          <div>
            <h1>OlivePress</h1>
            <p>{t("Gestion d'huilerie")}</p>
          </div>
          <button
            className="icon-btn no-print sidebar-close"
            style={{ marginLeft: 'auto', color: '#cfd8c3' }}
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {NAV.map((sec) => {
            const items = sec.items.filter((i) => !i.permission || can(i.permission));
            if (!items.length) return null;
            return (
              <div key={sec.section}>
                <div className="nav-section">{t(sec.section)}</div>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  >
                    <item.icon size={18} />
                    <span>{t(item.label)}</span>
                    {item.to === '/notifications' && unread > 0 && (
                      <span className="badge-count">{unread}</span>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">{initials(user?.fullName)}</div>
          <div className="meta">
            <strong>{user?.fullName}</strong>
            <span>{user?.role === 'ADMIN' ? t('Administrateur') : t('Employé')}</span>
          </div>
          <button
            className="icon-btn"
            style={{ color: '#cfd8c3' }}
            title={t('Se déconnecter')}
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-btn no-print menu-toggle" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <h2>{title}</h2>
          <NavLink
            to="/profil"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ color: 'var(--text-primary)' }}
          >
            <User size={17} /> <span className="no-sm">{t('Profil')}</span>
          </NavLink>
        </header>
        <div className="page">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
