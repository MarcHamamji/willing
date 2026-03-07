import bcrypt from 'bcrypt';
import { sql } from 'kysely';

import config from '../config.js';
import database from '../db/index.js';

const PASSWORD_PLAIN = 'Willing123';

async function seed() {
  if (config.NODE_ENV === 'production') {
    throw new Error('Refusing to seed in production.');
  }

  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

  await sql`
  TRUNCATE TABLE
    enrollment_application,
    enrollment,
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
        first_name: 'Marc',
        last_name: 'Hamamji',
        email: 'vol1@willing.com',
        password: passwordHash,
        gender: 'male',
        date_of_birth: '2001-01-01',
        description: 'Likes helping. Easy to remember.',
        privacy: 'public',
      },
      {
        first_name: 'Marca',
        last_name: 'Hamamjian',
        email: 'vol2@willing.com',
        password: passwordHash,
        gender: 'female',
        date_of_birth: '2002-02-02',
        description: 'Also likes helping.',
        privacy: 'public',
      },
      {
        first_name: 'Marc',
        last_name: 'Hamamjiany',
        email: 'vol3@willing.com',
        password: passwordHash,
        gender: 'other',
        date_of_birth: '2003-03-03',
        description: 'Friendly volunteer.',
        privacy: 'public',
      },
      {
        first_name: 'Marc',
        last_name: 'Mamji',
        email: 'vol4@willing.com',
        password: passwordHash,
        gender: 'female',
        date_of_birth: '2004-04-04',
        description: 'Shows up on time (allegedly).',
        privacy: 'public',
      },
      {
        first_name: 'Maya',
        last_name: 'Khalil',
        email: 'vol5@willing.com',
        password: passwordHash,
        gender: 'female',
        date_of_birth: '1999-05-12',
        description: 'Enjoys community work and teaching kids.',
        privacy: 'public',
      },
      {
        first_name: 'Omar',
        last_name: 'Nassar',
        email: 'vol6@willing.com',
        password: passwordHash,
        gender: 'male',
        date_of_birth: '1998-09-21',
        description: 'Reliable and usually calm under pressure.',
        privacy: 'public',
      },
      {
        first_name: 'Lea',
        last_name: 'Haddad',
        email: 'vol7@willing.com',
        password: passwordHash,
        gender: 'female',
        date_of_birth: '2000-07-08',
        description: 'Interested in logistics and social support.',
        privacy: 'public',
      },
      {
        first_name: 'Karim',
        last_name: 'Farah',
        email: 'vol8@willing.com',
        password: passwordHash,
        gender: 'male',
        date_of_birth: '1997-11-30',
        description: 'Can handle physical tasks and coordination.',
        privacy: 'public',
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
        organization_id: orgByName.get('Org One')!,
        title: 'Winter Clothes Drive',
        description: 'Collect, fold, and prepare winter clothes for distribution.',
        latitude: 33.89,
        longitude: 35.50,
        location_name: 'Hamra',
        max_volunteers: 14,
        start_timestamp: new Date(`${nowYear}-01-14T09:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-14T15:00:00Z`),
        minimum_age: 16,
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
        organization_id: orgByName.get('Org Two')!,
        title: 'Homework Hotline',
        description: 'Remote academic support for school students.',
        latitude: 33.36,
        longitude: 35.49,
        location_name: 'Saida Office',
        max_volunteers: 9,
        start_timestamp: new Date(`${nowYear}-01-19T16:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-19T19:00:00Z`),
        minimum_age: 18,
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
      {
        organization_id: orgByName.get('Org Three')!,
        title: 'Medical Supply Sorting',
        description: 'Organize basic medical supplies for distribution.',
        latitude: 34.43,
        longitude: 35.82,
        location_name: 'Tripoli Depot',
        max_volunteers: 7,
        start_timestamp: new Date(`${nowYear}-01-24T09:30:00Z`),
        end_timestamp: new Date(`${nowYear}-01-24T13:30:00Z`),
        minimum_age: 18,
        is_open: true,
      },
      {
        organization_id: orgByName.get('Org One')!,
        title: 'Library Reading Hour',
        description: 'Read stories and help children during reading activities.',
        latitude: 33.887,
        longitude: 35.49,
        location_name: 'Beirut Library',
        max_volunteers: 4,
        start_timestamp: new Date(`${nowYear}-01-25T10:00:00Z`),
        end_timestamp: new Date(`${nowYear}-01-25T12:00:00Z`),
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
    { posting_id: postingByTitle.get('Food Packing')!, name: 'Attention to Detail' },
    { posting_id: postingByTitle.get('Food Packing')!, name: 'Organization' },
    { posting_id: postingByTitle.get('Food Packing')!, name: 'Inventory Handling' },

    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Cleanup' },
    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Stamina' },
    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Teamwork' },
    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Time Management' },
    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Coordination' },
    { posting_id: postingByTitle.get('Beach Cleanup')!, name: 'Safety Awareness' },

    { posting_id: postingByTitle.get('Winter Clothes Drive')!, name: 'Sorting' },
    { posting_id: postingByTitle.get('Winter Clothes Drive')!, name: 'Organization' },
    { posting_id: postingByTitle.get('Winter Clothes Drive')!, name: 'Packing' },
    { posting_id: postingByTitle.get('Winter Clothes Drive')!, name: 'Inventory Handling' },
    { posting_id: postingByTitle.get('Winter Clothes Drive')!, name: 'Attention to Detail' },

    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Teaching' },
    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Patience' },
    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Communication' },
    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Child Engagement' },
    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Explaining Concepts' },
    { posting_id: postingByTitle.get('Tutor Kids')!, name: 'Listening' },

    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Cooking' },
    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Hygiene' },
    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Teamwork' },
    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Time Management' },
    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Food Preparation' },
    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Serving' },
    { posting_id: postingByTitle.get('Community Kitchen')!, name: 'Cleanliness' },

    { posting_id: postingByTitle.get('Homework Hotline')!, name: 'Teaching' },
    { posting_id: postingByTitle.get('Homework Hotline')!, name: 'Communication' },
    { posting_id: postingByTitle.get('Homework Hotline')!, name: 'Listening' },
    { posting_id: postingByTitle.get('Homework Hotline')!, name: 'Explaining Concepts' },
    { posting_id: postingByTitle.get('Homework Hotline')!, name: 'Problem Solving' },
    { posting_id: postingByTitle.get('Homework Hotline')!, name: 'Remote Support' },

    { posting_id: postingByTitle.get('Sort Donations')!, name: 'Sorting' },
    { posting_id: postingByTitle.get('Sort Donations')!, name: 'Organization' },
    { posting_id: postingByTitle.get('Sort Donations')!, name: 'Attention to Detail' },
    { posting_id: postingByTitle.get('Sort Donations')!, name: 'Inventory Handling' },

    { posting_id: postingByTitle.get('Elder Visit')!, name: 'Communication' },
    { posting_id: postingByTitle.get('Elder Visit')!, name: 'Empathy' },
    { posting_id: postingByTitle.get('Elder Visit')!, name: 'Patience' },
    { posting_id: postingByTitle.get('Elder Visit')!, name: 'Listening' },
    { posting_id: postingByTitle.get('Elder Visit')!, name: 'Emotional Support' },

    { posting_id: postingByTitle.get('Medical Supply Sorting')!, name: 'Organization' },
    { posting_id: postingByTitle.get('Medical Supply Sorting')!, name: 'Attention to Detail' },
    { posting_id: postingByTitle.get('Medical Supply Sorting')!, name: 'Inventory Handling' },
    { posting_id: postingByTitle.get('Medical Supply Sorting')!, name: 'Label Checking' },
    { posting_id: postingByTitle.get('Medical Supply Sorting')!, name: 'Accuracy' },

    { posting_id: postingByTitle.get('Library Reading Hour')!, name: 'Reading' },
    { posting_id: postingByTitle.get('Library Reading Hour')!, name: 'Communication' },
    { posting_id: postingByTitle.get('Library Reading Hour')!, name: 'Patience' },
    { posting_id: postingByTitle.get('Library Reading Hour')!, name: 'Child Engagement' },
    { posting_id: postingByTitle.get('Library Reading Hour')!, name: 'Storytelling' },
    { posting_id: postingByTitle.get('Library Reading Hour')!, name: 'Creativity' },
  ]).execute();
  await database.insertInto('volunteer_skill').values([
    { volunteer_id: volByEmail.get('vol1@willing.com')!, name: 'Packing' },
    { volunteer_id: volByEmail.get('vol1@willing.com')!, name: 'Cleanup' },
    { volunteer_id: volByEmail.get('vol1@willing.com')!, name: 'Teamwork' },
    { volunteer_id: volByEmail.get('vol1@willing.com')!, name: 'Organization' },
    { volunteer_id: volByEmail.get('vol1@willing.com')!, name: 'Attention to Detail' },

    { volunteer_id: volByEmail.get('vol2@willing.com')!, name: 'Teaching' },
    { volunteer_id: volByEmail.get('vol2@willing.com')!, name: 'Communication' },
    { volunteer_id: volByEmail.get('vol2@willing.com')!, name: 'Patience' },
    { volunteer_id: volByEmail.get('vol2@willing.com')!, name: 'Listening' },
    { volunteer_id: volByEmail.get('vol2@willing.com')!, name: 'Explaining Concepts' },

    { volunteer_id: volByEmail.get('vol3@willing.com')!, name: 'Cooking' },
    { volunteer_id: volByEmail.get('vol3@willing.com')!, name: 'Teamwork' },
    { volunteer_id: volByEmail.get('vol3@willing.com')!, name: 'Food Preparation' },
    { volunteer_id: volByEmail.get('vol3@willing.com')!, name: 'Serving' },

    { volunteer_id: volByEmail.get('vol4@willing.com')!, name: 'Organization' },
    { volunteer_id: volByEmail.get('vol4@willing.com')!, name: 'Empathy' },
    { volunteer_id: volByEmail.get('vol4@willing.com')!, name: 'Communication' },
    { volunteer_id: volByEmail.get('vol4@willing.com')!, name: 'Patience' },
    { volunteer_id: volByEmail.get('vol4@willing.com')!, name: 'Emotional Support' },

    { volunteer_id: volByEmail.get('vol5@willing.com')!, name: 'Teaching' },
    { volunteer_id: volByEmail.get('vol5@willing.com')!, name: 'Reading' },
    { volunteer_id: volByEmail.get('vol5@willing.com')!, name: 'Child Engagement' },
    { volunteer_id: volByEmail.get('vol5@willing.com')!, name: 'Storytelling' },
    { volunteer_id: volByEmail.get('vol5@willing.com')!, name: 'Creativity' },
    { volunteer_id: volByEmail.get('vol5@willing.com')!, name: 'Communication' },

    { volunteer_id: volByEmail.get('vol6@willing.com')!, name: 'Stamina' },
    { volunteer_id: volByEmail.get('vol6@willing.com')!, name: 'Cleanup' },
    { volunteer_id: volByEmail.get('vol6@willing.com')!, name: 'Inventory Handling' },
    { volunteer_id: volByEmail.get('vol6@willing.com')!, name: 'Coordination' },
    { volunteer_id: volByEmail.get('vol6@willing.com')!, name: 'Safety Awareness' },
    { volunteer_id: volByEmail.get('vol6@willing.com')!, name: 'Accuracy' },

    { volunteer_id: volByEmail.get('vol7@willing.com')!, name: 'Cooking' },
    { volunteer_id: volByEmail.get('vol7@willing.com')!, name: 'Organization' },
    { volunteer_id: volByEmail.get('vol7@willing.com')!, name: 'Listening' },
    { volunteer_id: volByEmail.get('vol7@willing.com')!, name: 'Problem Solving' },
    { volunteer_id: volByEmail.get('vol7@willing.com')!, name: 'Remote Support' },
    { volunteer_id: volByEmail.get('vol7@willing.com')!, name: 'Time Management' },

    { volunteer_id: volByEmail.get('vol8@willing.com')!, name: 'Sorting' },
    { volunteer_id: volByEmail.get('vol8@willing.com')!, name: 'Packing' },
    { volunteer_id: volByEmail.get('vol8@willing.com')!, name: 'Attention to Detail' },
    { volunteer_id: volByEmail.get('vol8@willing.com')!, name: 'Inventory Handling' },
    { volunteer_id: volByEmail.get('vol8@willing.com')!, name: 'Label Checking' },
    { volunteer_id: volByEmail.get('vol8@willing.com')!, name: 'Organization' },
  ]).execute();

  await database.insertInto('enrollment_application').values([
    {
      volunteer_id: volByEmail.get('vol2@willing.com')!,
      posting_id: postingByTitle.get('Winter Clothes Drive')!,
      message: 'Happy to help with folding and sorting clothes.',
    },
    {
      volunteer_id: volByEmail.get('vol5@willing.com')!,
      posting_id: postingByTitle.get('Tutor Kids')!,
      message: 'I have experience helping children with reading and schoolwork.',
    },
    {
      volunteer_id: volByEmail.get('vol6@willing.com')!,
      posting_id: postingByTitle.get('Beach Cleanup')!,
      message: 'Available and comfortable with physically demanding tasks.',
    },
    {
      volunteer_id: volByEmail.get('vol7@willing.com')!,
      posting_id: postingByTitle.get('Homework Hotline')!,
      message: 'I can help students stay focused and explain tasks clearly.',
    },
    {
      volunteer_id: volByEmail.get('vol8@willing.com')!,
      posting_id: postingByTitle.get('Medical Supply Sorting')!,
      message: 'Strong attention to detail and good with sorting supplies.',
    },
  ]).execute();
  await database.insertInto('enrollment').values([
    {
      volunteer_id: volByEmail.get('vol1@willing.com')!,
      posting_id: postingByTitle.get('Food Packing')!,
      message: 'Comfortable with packing tasks and working in a team.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol1@willing.com')!,
      posting_id: postingByTitle.get('Beach Cleanup')!,
      message: 'Can help with cleanup, lifting, and staying organized during the event.',
      attended: false,
    },
    {
      volunteer_id: volByEmail.get('vol2@willing.com')!,
      posting_id: postingByTitle.get('Tutor Kids')!,
      message: 'Enjoy helping students with homework and explaining things clearly.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol2@willing.com')!,
      posting_id: postingByTitle.get('Library Reading Hour')!,
      message: 'Happy to read with children and keep them engaged during activities.',
      attended: false,
    },
    {
      volunteer_id: volByEmail.get('vol3@willing.com')!,
      posting_id: postingByTitle.get('Community Kitchen')!,
      message: 'Can support with food prep, serving, and keeping the space clean.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol3@willing.com')!,
      posting_id: postingByTitle.get('Winter Clothes Drive')!,
      message: 'Good with sorting items and helping maintain order during distribution.',
      attended: false,
    },
    {
      volunteer_id: volByEmail.get('vol4@willing.com')!,
      posting_id: postingByTitle.get('Elder Visit')!,
      message: 'Patient, communicative, and comfortable spending time with elderly residents.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol4@willing.com')!,
      posting_id: postingByTitle.get('Sort Donations')!,
      message: 'Can help sort donations carefully and keep sections organized.',
      attended: false,
    },
    {
      volunteer_id: volByEmail.get('vol5@willing.com')!,
      posting_id: postingByTitle.get('Homework Hotline')!,
      message: 'Confident supporting students remotely with reading and homework structure.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol5@willing.com')!,
      posting_id: postingByTitle.get('Tutor Kids')!,
      message: 'Would be happy to help younger students stay focused and understand tasks.',
      attended: false,
    },
    {
      volunteer_id: volByEmail.get('vol6@willing.com')!,
      posting_id: postingByTitle.get('Medical Supply Sorting')!,
      message: 'Strong attention to detail and comfortable handling sorted supplies accurately.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol6@willing.com')!,
      posting_id: postingByTitle.get('Beach Cleanup')!,
      message: 'Can handle physically demanding outdoor tasks and work well in a coordinated team.',
      attended: false,
    },
    {
      volunteer_id: volByEmail.get('vol7@willing.com')!,
      posting_id: postingByTitle.get('Community Kitchen')!,
      message: 'Happy to assist with prep, serving, and keeping the workflow smooth.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol7@willing.com')!,
      posting_id: postingByTitle.get('Homework Hotline')!,
      message: 'Can listen carefully to students and help them work through problems step by step.',
      attended: false,
    },
    {
      volunteer_id: volByEmail.get('vol8@willing.com')!,
      posting_id: postingByTitle.get('Food Packing')!,
      message: 'Comfortable with repetitive tasks, packing, and keeping materials organized.',
      attended: true,
    },
    {
      volunteer_id: volByEmail.get('vol8@willing.com')!,
      posting_id: postingByTitle.get('Winter Clothes Drive')!,
      message: 'Can sort, fold, and organize donated items efficiently.',
      attended: false,
    },
  ]).execute();

  console.log('âœ… Seed complete.');
  console.log('Login creds (same password for all):', PASSWORD_PLAIN);
  console.log('Admin:', 'admin@willing.com');
  console.log('Orgs:', 'org1@willing.com', 'org2@willing.com', 'org3@willing.com');
  console.log(
    'Volunteers:',
    'vol1@willing.com',
    'vol2@willing.com',
    'vol3@willing.com',
    'vol4@willing.com',
    'vol5@willing.com',
    'vol6@willing.com',
    'vol7@willing.com',
    'vol8@willing.com',
  );
  await database.destroy();
}

seed().catch(async (err) => {
  console.error('âŒ Seed failed:', err);
  try {
    await database.destroy();
  } catch (_error) {
    // Ignore
  }
  process.exit(1);
});
