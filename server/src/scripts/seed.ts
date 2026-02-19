import bcrypt from 'bcrypt';
import config from '../config.js';
import database from '../db/index.js';
import { sql } from 'kysely';

const PASSWORD_PLAIN = 'Willing123';

async function seed() {
  if (config.NODE_ENV === 'production') {
    throw new Error('Refusing to seed in production.');
  }

  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

  await sql`
    TRUNCATE TABLE
      posting_skill,
      volunteer_skill,
      organization_posting,
      organization_request,
      volunteer_account,
      organization_account,
      admin_account
    RESTART IDENTITY CASCADE
  `.execute(database);

  await database.insertInto('admin_account').values({
    first_name: 'Admin',
    last_name: 'User',
    email: 'admin@willing.com',
    password: passwordHash,
  }).execute();

  const orgs = await database.insertInto('organization_account')
    .values([
      {
        name: 'Org One',
        email: 'org1@willing.com',
        phone_number: '+96181000001',
        url: 'https://org1.willing.test',
        latitude: 33.8938,
        longitude: 35.5018,
        location_name: 'Beirut',
        password: passwordHash,
      },
      {
        name: 'Org Two',
        email: 'org2@willing.com',
        phone_number: '+96181000002',
        url: 'https://org2.willing.test',
        latitude: 33.3547,
        longitude: 35.4955,
        location_name: 'Saida',
        password: passwordHash,
      },
      {
        name: 'Org Three',
        email: 'org3@willing.com',
        phone_number: '+96181000003',
        url: 'https://org3.willing.test',
        latitude: 34.4367,
        longitude: 35.8333,
        location_name: 'Tripoli',
        password: passwordHash,
      },
    ])
    .returning(['id', 'name'])
    .execute();

  const orgByName = new Map(orgs.map(o => [o.name, o.id]));

  await database.insertInto('organization_request').values([
    {
      name: 'Request One',
      email: 'request1@willing.com',
      phone_number: '+96181000111',
      url: 'https://request1.willing.test',
      latitude: 33.9,
      longitude: 35.5,
      location_name: 'Beirut',
    },
    {
      name: 'Request Two',
      email: 'request2@willing.com',
      phone_number: '+96181000112',
      url: 'https://request2.willing.test',
      latitude: 33.27,
      longitude: 35.2,
      location_name: 'Tyre',
    },
  ]).execute();

  const volunteers = await database.insertInto('volunteer_account')
    .values([
      {
        first_name: 'Vol',
        last_name: 'One',
        email: 'vol1@willing.com',
        password: passwordHash,
        gender: 'male',
        date_of_birth: '2001-01-01',
        description: 'Likes helping. Easy to remember.',
      },
      {
        first_name: 'Vol',
        last_name: 'Two',
        email: 'vol2@willing.com',
        password: passwordHash,
        gender: 'female',
        date_of_birth: '2002-02-02',
        description: 'Also likes helping.',
      },
      {
        first_name: 'Vol',
        last_name: 'Three',
        email: 'vol3@willing.com',
        password: passwordHash,
        gender: 'other',
        date_of_birth: '2003-03-03',
        description: 'Friendly volunteer.',
      },
      {
        first_name: 'Vol',
        last_name: 'Four',
        email: 'vol4@willing.com',
        password: passwordHash,
        gender: 'female',
        date_of_birth: '2004-04-04',
        description: 'Shows up on time (allegedly).',
      },
    ])
    .returning(['id', 'email'])
    .execute();

  const volByEmail = new Map(volunteers.map(v => [v.email, v.id]));

  const nowYear = 2026;
  const postings = await database.insertInto('organization_posting')
    .values([
      {
        organization_id: orgByName.get('Org One')!,
        title: 'Food Packing',
        description: 'Pack food boxes for families.',
        latitude: 33.8938,
        longitude: 35.5018,
        location_name: 'Beirut',
        max_volunteers: 10,
        start_timestamp: new Date(`${nowYear}-01-10T10:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-10T14:00:00Z`),
        minimum_age: 16,
        is_open: true,
      },
      {
        organization_id: orgByName.get('Org One')!,
        title: 'Beach Cleanup',
        description: 'Clean up the beach area.',
        latitude: 33.905,
        longitude: 35.48,
        location_name: 'Beirut Coast',
        max_volunteers: 25,
        start_timestamp: new Date(`${nowYear}-01-12T08:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-12T12:00:00Z`),
        minimum_age: 14,
        is_open: true,
      },

      {
        organization_id: orgByName.get('Org Two')!,
        title: 'Tutor Kids',
        description: 'Basic homework support for kids.',
        latitude: 33.3547,
        longitude: 35.4955,
        location_name: 'Saida',
        max_volunteers: 6,
        start_timestamp: new Date(`${nowYear}-01-15T15:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-15T17:00:00Z`),
        minimum_age: 18,
        is_open: true,
      },
      {
        organization_id: orgByName.get('Org Two')!,
        title: 'Community Kitchen',
        description: 'Help cook and serve meals.',
        latitude: 33.34,
        longitude: 35.47,
        location_name: 'Saida Center',
        max_volunteers: 12,
        start_timestamp: new Date(`${nowYear}-01-18T09:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-18T13:00:00Z`),
        minimum_age: 16,
        is_open: true,
      },
      {
        organization_id: orgByName.get('Org Three')!,
        title: 'Sort Donations',
        description: 'Sort clothes and supplies.',
        latitude: 34.4367,
        longitude: 35.8333,
        location_name: 'Tripoli',
        max_volunteers: 8,
        start_timestamp: new Date(`${nowYear}-01-20T10:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-20T13:00:00Z`),
        minimum_age: 16,
        is_open: true,
      },
      {
        organization_id: orgByName.get('Org Three')!,
        title: 'Elder Visit',
        description: 'Spend time with elderly residents.',
        latitude: 34.44,
        longitude: 35.84,
        location_name: 'Tripoli Home',
        max_volunteers: 5,
        start_timestamp: new Date(`${nowYear}-01-22T11:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-22T12:30:00Z`),
        minimum_age: 18,
        is_open: true,
      },
    ])
    .returning(['id', 'title'])
    .execute();

  const postingByTitle = new Map(postings.map(p => [p.title, p.id]));
  await database.insertInto('posting_skill').values([
    { posting_id: postingByTitle.get('Food Packing')!, name: 'Packing' },
    { posting_id: postingByTitle.get('Food Packing')!, name: 'Teamwork' },

    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Cleanup' },
    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Stamina' },

    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Teaching' },
    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Patience' },

    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Cooking' },
    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Hygiene' },

    { posting_id: postingByTitle.get('Sort Donations')!, name: 'Sorting' },
    { posting_id: postingByTitle.get('Sort Donations')!, name: 'Organization' },

    { posting_id: postingByTitle.get('Elder Visit')!, name: 'Communication' },
    { posting_id: postingByTitle.get('Elder Visit')!, name: 'Empathy' },
  ]).execute();
  await database.insertInto('volunteer_skill').values([
    { volunteer_id: volByEmail.get('vol1@willing.com')!, name: 'Packing' },
    { volunteer_id: volByEmail.get('vol1@willing.com')!, name: 'Cleanup' },

    { volunteer_id: volByEmail.get('vol2@willing.com')!, name: 'Teaching' },
    { volunteer_id: volByEmail.get('vol2@willing.com')!, name: 'Communication' },

    { volunteer_id: volByEmail.get('vol3@willing.com')!, name: 'Cooking' },
    { volunteer_id: volByEmail.get('vol3@willing.com')!, name: 'Teamwork' },

    { volunteer_id: volByEmail.get('vol4@willing.com')!, name: 'Organization' },
    { volunteer_id: volByEmail.get('vol4@willing.com')!, name: 'Empathy' },
  ]).execute();

  console.log('✅ Seed complete.');
  console.log('Login creds (same password for all):', PASSWORD_PLAIN);
  console.log('Admin:', 'admin@willing.com');
  console.log('Orgs:', 'org1@willing.com', 'org2@willing.com', 'org3@willing.com');
  console.log('Volunteers:', 'vol1@willing.com', 'vol2@willing.com', 'vol3@willing.com', 'vol4@willing.com');

  await database.destroy();
}

seed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try {
    await database.destroy();
  } catch (err) {
  // ignore
  }
  process.exit(1);
});
