import { Outlet, useLocation, useNavigate } from 'react-router';
import { useCallback, useContext, useEffect } from 'react';
import VolunteerContext, { VolunteerProvider } from './VolunteerContext';

function VolunteerPageInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const { volunteer, logout, refreshVolunteer } = useContext(VolunteerContext);

  useEffect(() => {
    if (location.pathname === '/volunteer/create') return;

    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      navigate('/user/login');
    } else {
      refreshVolunteer();
    }
  }, [location.pathname, navigate, refreshVolunteer]);

  const handleLogout = useCallback(() => {
    (document.activeElement as HTMLElement)?.blur();
    logout();
    navigate('/user/login');
  }, [logout, navigate]);

  return (
    <main className="h-screen flex flex-col">
      <div className="navbar bg-base-100 shadow-md">
        <div className="navbar-start">
          <a className="btn btn-ghost text-xl" href="/">
            <img src="/willing.svg" className="h-6" />
            Willing
          </a>
        </div>
        <div className="navbar-end">
          <div className="dropdown dropdown-bottom dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost m-1">
              {volunteer ? `${volunteer.first_name} ${volunteer.last_name}` : ''}
            </div>
            <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
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
