import { Router } from 'express';
import database from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import zod from 'zod';
import config from '../config.js';

const api = Router();

// GET /signin
// POST /signup
// ...

// Example:
/*api.get('/', async (req, res) => {
  const query = database.selectFrom('volunteer_account').selectAll();
  const rows = await query.execute();

  res.json({
    volunteers: rows,
  });
});
*/
api.post('/admin/login', async (req, res) => {
  const body = zod.object({
    email: zod.email(),
    password: zod.string(),
  }).parse(req.body);

  const account = await database
    .selectFrom('admin_account')
    .selectAll()
    .where('admin_account.email', '=', body.email)
    .executeTakeFirst();

  if (!account) {
    res.status(403);
    throw new Error('Invalid login');
  }

  const match = await bcrypt.compare(body.password, account.password);

  if (!match) {
    res.status(403);
    throw new Error('Invalid login');
  }

  const token = jwt.sign({
    id: account.id,
    type: 'admin',
  }, config.JWT_SECRET);

  res.json({
    token,
  });
});


api.post('/user/login', async (req, res) => {
  const body = zod.object({
    email: zod.email(),
    password: zod.string(),
  }).parse(req.body);

  let organizationAccount;
  let volunteerAccount;

  organizationAccount = await database
    .selectFrom('organization_account')     
    .selectAll()
    .where('organization_account.email', '=', body.email)
    .executeTakeFirst();


  if (!organizationAccount) {
    volunteerAccount = await database
    .selectFrom('volunteer_account')     
    .selectAll()
    .where('volunteer_account.email', '=', body.email)
    .executeTakeFirst(); 
  }

  if((!organizationAccount) && (!volunteerAccount)){
      res.status(403);
      throw new Error('Invalid login');
  }

  let valid;
  if(organizationAccount)
    valid = await bcrypt.compare(body.password, organizationAccount.password);

  if(volunteerAccount)
    valid = await bcrypt.compare(body.password, volunteerAccount.password);

  if (!valid) {
    res.status(403);
    throw new Error('Invalid login');
  }

  const token = jwt.sign({
    id: (organizationAccount || volunteerAccount)?.id ,
    type: organizationAccount ? 'organization' : 'volunteer',
  }, config.JWT_SECRET);

  res.json({
    token,
  });
});
export default api;
