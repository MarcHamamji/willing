import * as jose from 'jose';
import { createContext, useState, useCallback, type ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router';

import requestServer from '../utils/requestServer';

import type { AdminAccountWithoutPassword, NewVolunteerAccount, OrganizationAccountWithoutPassword, VolunteerAccountWithoutPassword } from '../../../server/src/db/tables';
import type { Role, UserJWT } from '../../../server/src/types';

type AccountWithoutPassword = AdminAccountWithoutPassword | OrganizationAccountWithoutPassword | VolunteerAccountWithoutPassword;

const getCurrentUserAccount = async (currentRole?: Role) => {
  if (!currentRole) {
    const token = localStorage.getItem('jwt');
    if (!token) return undefined;

    const decoded = jose.decodeJwt<UserJWT>(token);
    currentRole = decoded.role;
  }

  try {
    if (currentRole === 'admin') {
      const response = await requestServer<{ admin: AdminAccountWithoutPassword }>('/admin/me', {}, true);
      return response.admin;
    }
    if (currentRole === 'organization') {
      const response = await requestServer<{ organization: OrganizationAccountWithoutPassword }>('/organization/me', {}, true);
      return response.organization;
    }
    if (currentRole === 'volunteer') {
      const response = await requestServer<{ volunteer: VolunteerAccountWithoutPassword }>('/volunteer/me', {}, true);
      return response.volunteer;
    }
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return undefined;
  }
};

type AuthContextType = {
  user?: {
    role: Role;
    account?: AccountWithoutPassword;
  };
  loaded: boolean;
  refreshUser: (jwt?: string) => void;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginUser: (email: string, password: string) => Promise<void>;
  createVolunteer: (volunteer: NewVolunteerAccount) => Promise<void>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  restrictRoute: (role: Role, unauthenticatedRedirectPath: string) => AccountWithoutPassword;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  loaded: false,
  refreshUser: () => {},
  loginAdmin: async () => {},
  loginUser: async () => {},
  createVolunteer: async () => {},
  changePassword: async () => {},
  logout: () => {},
  restrictRoute: (() => {
    return undefined as unknown as AccountWithoutPassword;
  }) as AuthContextType['restrictRoute'],
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();

  const [user, setUser] = useState<AuthContextType['user']>(localStorage.getItem('jwt')
    ? {
        role: jose.decodeJwt<UserJWT>(localStorage.getItem('jwt') as string).role,
        account: undefined as AccountWithoutPassword | undefined,
      }
    : undefined);
  const [loaded, setLoaded] = useState(false);

  const refreshUser = useCallback(async (jwt?: string) => {
    const token = jwt || localStorage.getItem('jwt');
    if (!token) {
      setUser(undefined);
      return;
    }

    const { role } = jose.decodeJwt<UserJWT>(token);
    const account = await getCurrentUserAccount(role);

    setUser({ role, account: account });
  }, []);

  useEffect(() => {
    refreshUser().then(() => setLoaded(true));
  }, [refreshUser]);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    console.log('Attempting admin login with email:', email);
    const response = await requestServer<{
      token: string;
      admin: AdminAccountWithoutPassword;
    }>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    localStorage.setItem('jwt', response.token);
    setUser({ role: 'admin', account: response.admin });
  }, []);

  const loginUser = useCallback(async (email: string, password: string) => {
    const response = await requestServer<{
      token: string;
      role: 'organization' | 'volunteer';
      organization?: OrganizationAccountWithoutPassword;
      volunteer?: VolunteerAccountWithoutPassword;
    }>('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    localStorage.setItem('jwt', response.token);
    setUser({
      role: response.role,
      account: response.role === 'organization' ? response.organization : response.volunteer,
    });
  }, []);

  const createVolunteer = async (volunteer: NewVolunteerAccount) => {
    const response = await requestServer<{
      volunteer: VolunteerAccountWithoutPassword;
      token: string;
    }>('/volunteer/create', {
      method: 'POST',
      body: JSON.stringify(volunteer),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    localStorage.setItem('jwt', response.token);
    setUser({
      role: 'volunteer',
      account: response.volunteer,
    });
  };

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    if (!user) return;

    const { token } = await requestServer<{ token: string }>('/' + user?.role + '/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    }, true);

    localStorage.setItem('jwt', token);
    refreshUser(token);
  }, [user]);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setUser(undefined);
  }, [user]);

  const restrictRoute = useCallback((allowedRole: Role, unauthenticatedRedirectPath: string) => {
    if (!user) {
      navigate(unauthenticatedRedirectPath, { replace: true });
    } else if (user.role !== allowedRole) {
      navigate('/' + user.role, { replace: true });
    }

    if (allowedRole === 'admin') {
      return user!.account as AdminAccountWithoutPassword;
    } else if (allowedRole === 'organization') {
      return user!.account as OrganizationAccountWithoutPassword;
    } else if (allowedRole === 'volunteer') {
      return user!.account as VolunteerAccountWithoutPassword;
    }
    return undefined as unknown as AccountWithoutPassword;
  }, [user, navigate]);

  return (
    <AuthContext.Provider value={{ user, loaded, refreshUser, loginAdmin, loginUser, createVolunteer, changePassword, logout, restrictRoute }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
