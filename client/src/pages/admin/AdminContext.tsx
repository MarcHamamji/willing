import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { AdminAccount } from '../../../../server/src/db/types';
import requestServer from '../../requestServer';

type AdminContextType = {
  admin?: AdminAccount;
  refreshAdmin: () => void;
  logout: () => void;
};

const AdminContext = createContext<AdminContextType>({
  admin: undefined,
  refreshAdmin: () => {},
  logout: () => {},
});

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminAccount | undefined>(undefined);

  const refreshAdmin = useCallback(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setAdmin(undefined);
      return;
    }

    requestServer<{ admin: AdminAccount }>('/admin/me', {}, true)
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
