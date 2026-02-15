import { Building2, LogOut, ChevronDown } from 'lucide-react';
import { useCallback, useContext } from 'react';
import { Outlet } from 'react-router';

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

export default OrganizationPage;
