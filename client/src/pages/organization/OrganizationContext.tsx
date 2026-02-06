import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { OrganizationAccount } from '../../../../server/src/db/types';
import requestServer from '../../requestServer';

type OrganizationContextType = {
  organization?: OrganizationAccount;
  refreshOrganization: () => void;
  logout: () => void;
};

const OrganizationContext = createContext<OrganizationContextType>({
  organization: undefined,
  refreshOrganization: () => {},
  logout: () => {},
});

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<OrganizationAccount | undefined>(undefined);

  const refreshOrganization = useCallback(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setOrganization(undefined);
      return;
    }

    requestServer<{ organization: OrganizationAccount }>('/organization/me', {}, true)
      .then(response => setOrganization(response.organization))
      .catch(() => setOrganization(undefined));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setOrganization(undefined);
  }, []);

  useEffect(() => {
    refreshOrganization();
  }, [refreshOrganization]);

  return (
    <OrganizationContext.Provider value={{ organization, refreshOrganization, logout }}>
      {children}
    </OrganizationContext.Provider>
  );
};

export default OrganizationContext;
