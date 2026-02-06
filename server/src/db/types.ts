import {
  Generated,
  Insertable,
  Selectable,
  Updateable,
} from 'kysely';

export interface Database {
  volunteer_account: VolunteerAccountTable;
  organization_request: OrganizationRequestTable;
  organization_account: OrganizationAccountTable;
  admin_account: AdminAccountTable;
}

export interface VolunteerAccountTable {
  id: Generated<number>;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'other';
}
export type VolunteerAccount = Selectable<VolunteerAccountTable>;
export type NewVolunteerAccount = Insertable<VolunteerAccountTable>;
export type VolunteerAccountUpdate = Updateable<VolunteerAccountTable>;
export type VolunteerAccountWithoutPassword = Omit<VolunteerAccount, 'password'>;

export interface OrganizationRequestTable {
  id: Generated<number>;
  name: string;
  email: string;
  phone_number: string;
  url: string;
  latitude: string;
  longitude: string;
  location_name: string;
}
export type OrganizationRequest = Selectable<OrganizationRequestTable>;
export type NewOrganizationRequest = Insertable<OrganizationRequestTable>;
export type OrganizationRequestUpdate = Updateable<OrganizationRequestTable>;

export interface OrganizationAccountTable {
  id: Generated<number>;
  name: string;
  email: string;
  password: string;
  phone_number: string;
  url: string;
  latitude: number;
  longitude: number;
  location_name: string;
}

export type OrganizationAccount = Selectable<OrganizationAccountTable>;
export type NewOrganizationAccount = Insertable<OrganizationAccountTable>;
export type OrganizationAccountUpdate = Updateable<OrganizationAccountTable>;
export type OrganizationAccountWithoutPassword = Omit<OrganizationAccount, 'password'>;

export interface AdminAccountTable {
  id: Generated<number>;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}
export type AdminAccount = Selectable<AdminAccountTable>;
export type NewAdminAccount = Selectable<AdminAccountTable>;
export type AdminAccountUpdate = Selectable<AdminAccountTable>;
export type AdminAccountWithoutPassword = Omit<AdminAccount, 'password'>;
