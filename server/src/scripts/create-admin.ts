import database from '../db/index.js';
import bcrypt from 'bcrypt';

await database.insertInto('admin_account').values({
  first_name: 'John',
  last_name: 'Doe',
  email: 'admin@willing.com',
  password: await bcrypt.hash('changeme', 10),
}).execute();

console.log('Admin account successfully created!');
