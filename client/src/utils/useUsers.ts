import { useContext } from 'react';

import AuthContext from '../auth/AuthContext';

import type { AdminAccountWithoutPassword, OrganizationAccountWithoutPassword, VolunteerAccountWithoutPassword } from '../../../server/src/db/tables';

export const useAdmin = () => {
  const { user } = useContext(AuthContext);
  return user?.account as AdminAccountWithoutPassword;
};

export const useOrganization = () => {
  const { user } = useContext(AuthContext);
  return user?.account as OrganizationAccountWithoutPassword;
};

export const useVolunteer = () => {
  const { user } = useContext(AuthContext);
  return user?.account as VolunteerAccountWithoutPassword;
};
