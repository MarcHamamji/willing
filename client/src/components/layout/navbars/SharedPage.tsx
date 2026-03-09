import { Outlet } from 'react-router';

import UserNavbar from './UserNavbar';
import { RolesOnly } from '../../../auth/guards';

import type { Role } from '../../../../../server/src/types';

function SharedPage({ roles }: { roles: Role[] }) {
  return (
    <RolesOnly roles={roles}>
      <main className="h-screen flex flex-col">
        <UserNavbar />
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </RolesOnly>
  );
}

export default SharedPage;
