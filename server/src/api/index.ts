import { Router } from 'express';

import { setUserJWT } from './authorization.js';
import adminRouter from './routes/admin/index.js';
import organizationRouter from './routes/organization/index.js';
import userRouter from './routes/user.js';
import volunteerRouter from './routes/volunteer.js';

const api = Router();
api.use(setUserJWT);

api.use('/user', userRouter);
api.use('/admin', adminRouter);
api.use('/volunteer', volunteerRouter);

api.use('/organization', organizationRouter);

export default api;
