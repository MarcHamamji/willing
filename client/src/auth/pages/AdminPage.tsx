import { Outlet } from 'react-router';

import UserNavbar from '../../components/layout/navbars/UserNavbar';
import { AdminOnly } from '../guards';

function AdminPage() {
  return (
    <AdminOnly redirectUrl="/admin/login">
      <main className="h-screen flex flex-col">
        <UserNavbar />
        <Outlet />
      </main>
    </AdminOnly>
  );
}

export default AdminPage;
