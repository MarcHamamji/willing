export const organizationProfileResponseColumns = [
  'id',
  'name',
  'email',
  'phone_number',
  'url',
  'latitude',
  'longitude',
  'location_name',
  'created_at',
  'updated_at',
] as const;

export const organizationPrivateResponseColumns = [
  'id',
  'name',
  'email',
  'phone_number',
  'url',
  'latitude',
  'longitude',
  'location_name',
] as const;

export const organizationPostingResponseColumns = [
  'organization_posting.id',
  'organization_posting.organization_id',
  'organization_posting.title',
  'organization_posting.description',
  'organization_posting.latitude',
  'organization_posting.longitude',
  'organization_posting.max_volunteers',
  'organization_posting.start_timestamp',
  'organization_posting.end_timestamp',
  'organization_posting.minimum_age',
  'organization_posting.is_open',
  'organization_posting.location_name',
  'organization_posting.created_at',
  'organization_posting.updated_at',
] as const;

export const volunteerResponseColumns = [
  'id',
  'first_name',
  'last_name',
  'email',
  'date_of_birth',
  'gender',
  'cv_path',
  'description',
  'privacy',
] as const;

export const organizationLoginColumns = [
  'id',
  'name',
  'email',
  'phone_number',
  'url',
  'latitude',
  'longitude',
  'location_name',
  'password',
] as const;

export const volunteerLoginColumns = [
  'id',
  'first_name',
  'last_name',
  'email',
  'password',
  'date_of_birth',
  'gender',
  'cv_path',
  'description',
  'privacy',
] as const;
