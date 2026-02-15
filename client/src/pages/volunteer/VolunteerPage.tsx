import * as jose from 'jose';
import { User, ChevronDown, LogOut } from 'lucide-react';
import { useCallback, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';

import VolunteerContext, { VolunteerProvider } from './VolunteerContext';
import Navbar from '../../components/Navbar';

import type { UserJWT } from '../../../../server/src/types';

function VolunteerPageInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { volunteer, logout, refreshVolunteer } = useContext(VolunteerContext);

  useEffect(() => {
    if (location.pathname === '/volunteer/create') return;

    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      navigate('/login');
    } else {
      const { role } = jose.decodeJwt<UserJWT>(jwt);
      if (role === 'volunteer') {
        refreshVolunteer();
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
      <Navbar right={volunteer && (
        <div className="dropdown dropdown-bottom dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost m-1">
            <User size={18} />
            {`${volunteer.first_name} ${volunteer.last_name}`}
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

function VolunteerPage() {
  return (
    <VolunteerProvider>
      <VolunteerPageInner />
    </VolunteerProvider>
  );
}

export default VolunteerPage;
