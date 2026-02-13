import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { OrganizationAccountWithoutPassword } from '../../../../server/src/db/tables';
import requestServer from '../../requestServer';

type OrganizationContextType = {
  organization?: OrganizationAccountWithoutPassword;
  refreshOrganization: () => void;
  logout: () => void;
};

const OrganizationContext = createContext<OrganizationContextType>({
  organization: undefined,
  refreshOrganization: () => {},
  logout: () => {},
});

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<OrganizationAccountWithoutPassword | undefined>(undefined);

  const refreshOrganization = useCallback(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setOrganization(undefined);
      return;
    }

    requestServer<{ organization: OrganizationAccountWithoutPassword }>('/organization/me', {}, true)
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
