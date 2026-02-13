import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AdminAccountWithoutPassword } from '../../../../server/src/db/tables';
import requestServer from '../../requestServer';

type AdminContextType = {
  admin?: AdminAccountWithoutPassword;
  refreshAdmin: () => void;
  logout: () => void;
};

const AdminContext = createContext<AdminContextType>({
  admin: undefined,
  refreshAdmin: () => {},
  logout: () => {},
});

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminAccountWithoutPassword | undefined>(undefined);

  const refreshAdmin = useCallback(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setAdmin(undefined);
      return;
    }

    requestServer<{ admin: AdminAccountWithoutPassword }>('/admin/me', {}, true)
      .then(response => setAdmin(response.admin))
      .catch(() => setAdmin(undefined));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setAdmin(undefined);
  }, []);

  useEffect(() => {
    refreshAdmin();
  }, [refreshAdmin]);

  return (
    <AdminContext.Provider value={{ admin, refreshAdmin, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
