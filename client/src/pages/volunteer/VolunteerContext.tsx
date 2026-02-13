import { createContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { VolunteerAccountWithoutPassword } from '../../../../server/src/db/tables';
import requestServer from '../../requestServer';

type VolunteerContextType = {
  volunteer?: VolunteerAccountWithoutPassword;
  refreshVolunteer: () => void;
  logout: () => void;
};

const VolunteerContext = createContext<VolunteerContextType>({
  volunteer: undefined,
  refreshVolunteer: () => {},
  logout: () => {},
});

export const VolunteerProvider = ({ children }: { children: ReactNode }) => {
  const [volunteer, setVolunteer] = useState<VolunteerAccountWithoutPassword | undefined>(undefined);

  const refreshVolunteer = useCallback(() => {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) {
      setVolunteer(undefined);
      return;
    }

    requestServer<{ volunteer: VolunteerAccountWithoutPassword }>('/volunteer/me', {}, true)
      .then(response => setVolunteer(response.volunteer))
      .catch(() => setVolunteer(undefined));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwt');
    setVolunteer(undefined);
  }, []);

  useEffect(() => {
    refreshVolunteer();
  }, [refreshVolunteer]);

  return (
    <VolunteerContext.Provider value={{ volunteer, refreshVolunteer, logout }}>
      {children}
    </VolunteerContext.Provider>
  );
};

export default VolunteerContext;
