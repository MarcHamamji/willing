import { Outlet } from 'react-router';

import UserNavbar from '../../components/layout/navbars/UserNavbar';
import { OrganizationOnly } from '../guards';

function OrganizationPage() {
  return (
    <OrganizationOnly>
      <main className="h-screen flex flex-col">
        <UserNavbar />
        <Outlet />
      </main>
    </OrganizationOnly>
  );
}

export default OrganizationPage;
