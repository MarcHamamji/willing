import * as jose from 'jose';
import { ChevronDown, LogOut, ShieldUser } from 'lucide-react';
import { useCallback, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import AdminContext, { AdminProvider } from './AdminContext';
import Navbar from '../../components/Navbar';

import type { UserJWT } from '../../../../server/src/types';

function AdminPageInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { admin, logout, refreshAdmin } = useContext(AdminContext);

  useEffect(() => {
    if (location.pathname === '/admin/login') return;
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      navigate('/admin/login');
    } else {
      const { role } = jose.decodeJwt<UserJWT>(jwt);
      if (role === 'admin') {
        refreshAdmin();
      } else {
        navigate('/' + role);
      }
    }
  }, []);

  const handleLogout = useCallback(() => {
    (document.activeElement as HTMLElement)?.blur();
    logout();
    navigate('/');
  }, [logout, navigate]);

  return (
    <main className="h-screen flex flex-col">
      <Navbar right={admin && (
        <div className="dropdown dropdown-bottom dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost m-1">
            <ShieldUser size={20} />
            {`${admin.first_name} ${admin.last_name}`}
            <ChevronDown size={14} className="opacity-50" />
          </div>
          <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
            <li>
              <button onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
      />
      <Outlet />
    </main>
  );
}

function AdminPage() {
  return (
    <AdminProvider>
      <AdminPageInner />
    </AdminProvider>
  );
}

export default AdminPage;
