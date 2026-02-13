import bcrypt from 'bcrypt';

import database from '../db/index.js';

await database.insertInto('admin_account').values({
  first_name: 'John',
  last_name: 'Doe',
  email: 'admin@willing.com',
  password: await bcrypt.hash('changeme', 10),
}).execute();

console.log('Admin account successfully created!');
await database.destroy();
