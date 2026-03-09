import { useContext, type ReactNode } from 'react';
import { Navigate } from 'react-router';

import AuthContext from './AuthContext';
import Loading from '../components/Loading';

import type { Role } from '../../../server/src/types';

const getRoleHomePage = (role?: Role) => ({
  none: '/',
  admin: '/admin',
  organization: '/organization',
  volunteer: '/volunteer',
}[role || 'none']);

const AuthLoading = () => (
  <div className="flex items-center justify-center mt-6">
    <Loading size="xl" />
  </div>
);

export function LoggedOutOnly({ children }: { children?: ReactNode }) {
  const auth = useContext(AuthContext);

  return (
    !auth.loaded
      ? <AuthLoading />
      : auth.user
        ? <Navigate to={'/' + auth.user.role} replace={true} />
        : children
  );
}

export function AdminOnly({ children, redirectUrl }: { children?: ReactNode; redirectUrl?: string }) {
  return (
    <RolesOnly roles={['admin']} redirectUrl={redirectUrl}>
      {children}
    </RolesOnly>
  );
}

export function OrganizationOnly({ children, redirectUrl }: { children?: ReactNode; redirectUrl?: string }) {
  return (
    <RolesOnly roles={['organization']} redirectUrl={redirectUrl}>
      {children}
    </RolesOnly>
  );
}

export function VolunteerOnly({ children, redirectUrl }: { children?: ReactNode; redirectUrl?: string }) {
  return (
    <RolesOnly roles={['volunteer']} redirectUrl={redirectUrl}>
      {children}
    </RolesOnly>
  );
}

export function RolesOnly({
  children,
  roles,
  redirectUrl,
}: {
  children?: ReactNode;
  roles: Role[];
  redirectUrl?: string;
}) {
  const auth = useContext(AuthContext);

  if (!auth.loaded) {
    return <AuthLoading />;
  }

  if (!auth.user?.role || !roles.includes(auth.user.role)) {
    return <Navigate to={redirectUrl || getRoleHomePage(auth.user?.role)} replace={true} />;
  }

  return children;
}
