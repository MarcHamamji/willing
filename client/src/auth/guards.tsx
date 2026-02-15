import { useContext, type ReactNode } from 'react';
import { Navigate } from 'react-router';

import AuthContext from './AuthContext';

import type { Role } from '../../../server/src/types';

export function LoggedOutOnly({ children }: { children?: ReactNode }) {
  const auth = useContext(AuthContext);

  return (
    !auth.loaded
      ? 'loading'
      : auth.user
        ? <Navigate to={'/' + auth.user.role} replace={true} />
        : children

  );
}

const getRoleHomePage = (role?: Role) => ({
  none: '/',
  admin: '/admin',
  organization: '/organization',
  volunteer: '/volunteer',
}[role || 'none']);

export function AdminOnly({ children, redirectUrl }: { children?: ReactNode; redirectUrl?: string }) {
  const auth = useContext(AuthContext);

  return (
    !auth.loaded
      ? 'loading'
      : auth.user?.role !== 'admin'
        ? <Navigate to={redirectUrl || getRoleHomePage(auth.user?.role)} replace={true} />
        : children
  );
}

export function OrganizationOnly({ children, redirectUrl }: { children?: ReactNode; redirectUrl?: string }) {
  const auth = useContext(AuthContext);

  return (
    !auth.loaded
      ? 'loading'
      : auth.user?.role !== 'organization'
        ? <Navigate to={redirectUrl || getRoleHomePage(auth.user?.role)} replace={true} />
        : children
  );
}

export function VolunteerOnly({ children, redirectUrl }: { children?: ReactNode; redirectUrl?: string }) {
  const auth = useContext(AuthContext);

  return (
    !auth.loaded
      ? 'loading'
      : auth.user?.role !== 'volunteer'
        ? <Navigate to={redirectUrl || getRoleHomePage(auth.user?.role)} replace={true} />
        : children
  );
}
