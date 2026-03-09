import { Outlet } from 'react-router';

import UserNavbar from '../../components/layout/navbars/UserNavbar';
import { RolesOnly } from '../guards';

import type { Role } from '../../../../server/src/types';

function SharedPage({ roles }: { roles: Role[] }) {
  return (
    <RolesOnly roles={roles}>
      <main className="h-screen flex flex-col">
        <UserNavbar />
        <Outlet />
      </main>
    </RolesOnly>
  );
}

export default SharedPage;
