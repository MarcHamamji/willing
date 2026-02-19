import { Building2, LogOut, ChevronDown, Home, Settings } from 'lucide-react';
import { useCallback, useContext } from 'react';
import { NavLink, Outlet } from 'react-router';

import AuthContext from '../../auth/AuthContext';
import { useOrganization } from '../../auth/useUsers';
import Navbar from '../../components/Navbar';

function OrganizationPage() {
  const auth = useContext(AuthContext);

  const organization = useOrganization();

  const handleLogout = useCallback(() => {
    (document.activeElement as HTMLElement)?.blur();
    auth.logout();
  }, [auth]);

  const softTabStyle = ({ isActive }: { isActive: boolean }) =>
    `btn btn-md border-none rounded-lg font-bold transition-all ${
      isActive
        ? 'bg-primary/10 text-primary hover:bg-primary/20'
        : 'btn-ghost opacity-70 hover:opacity-100'
    }`;

  return (
    <main className="h-screen flex flex-col">
      <Navbar
        center={organization && (
          <>
            <div className="flex gap-2">
              <NavLink to="/organization" end className={softTabStyle}>
                <Home size={20} />
                Home
              </NavLink>
              <NavLink to="/organization/settings" className={softTabStyle}>
                <Settings size={20} />
                Settings
              </NavLink>
            </div>
          </>
        )}
        right={organization && (
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

export default OrganizationPage;
