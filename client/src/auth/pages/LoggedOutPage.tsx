import { Outlet } from 'react-router';

import UserNavbar from '../../components/layout/navbars/UserNavbar';
import { LoggedOutOnly } from '../guards';

function LoggedOutPage() {
  return (
    <LoggedOutOnly>
      <main className="h-screen flex flex-col">
        <UserNavbar />
        <Outlet />
      </main>
    </LoggedOutOnly>
  );
}

export default LoggedOutPage;
