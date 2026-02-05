import { Outlet, useLocation, useNavigate } from 'react-router';
import { useContext, useEffect } from 'react';
import AdminContext, { AdminProvider } from './AdminContext';

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
      refreshAdmin();
    }
  }, [location.pathname, navigate, refreshAdmin]);

  return (
    <main>
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
              {admin ? `${admin.first_name} ${admin.last_name}` : ''}
            </div>
            <ul tabIndex={-1} className="dropdown-content menu bg-base-100 rounded-box z-1 w-52 p-2 shadow-sm">
              <li>
                <button onClick={() => { (document.activeElement as HTMLElement)?.blur(); logout(); navigate('/admin/login'); }}>
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
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
