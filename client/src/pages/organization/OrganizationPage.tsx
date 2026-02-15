import * as jose from 'jose';
import { Building2, LogOut, ChevronDown } from 'lucide-react';
import { useCallback, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import OrganizationContext, { OrganizationProvider } from './OrganizationContext';
import Navbar from '../../components/Navbar';

import type { UserJWT } from '../../../../server/src/types';

function OrganizationPageInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { organization, logout, refreshOrganization } = useContext(OrganizationContext);

  useEffect(() => {
    if (location.pathname === '/organization/request') return;

    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      navigate('/organization/request');
    } else {
      const { role } = jose.decodeJwt<UserJWT>(jwt);
      if (role === 'organization') {
        refreshOrganization();
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
      <Navbar right={organization && (
        <div className="dropdown dropdown-bottom dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost m-1">
            <Building2 size={18} />
            {organization.name}
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

function OrganizationPage() {
  return (
    <OrganizationProvider>
      <OrganizationPageInner />
    </OrganizationProvider>
  );
}

export default OrganizationPage;
