import { Router } from 'express';

import { setUserJWT } from './authorization.js';
import adminRouter from './routes/admin/index.js';
import geocodingRouter from './routes/geocoding.js';
import organizationRouter from './routes/organization/index.js';
import publicRouter from './routes/public.js';
import userRouter from './routes/user.js';
import volunteerRouter from './routes/volunteer/index.js';

const api = Router();
api.use(setUserJWT);

api.use('/user', userRouter);
api.use('/public', publicRouter);
api.use('/admin', adminRouter);
api.use('/volunteer', volunteerRouter);
api.use('/organization', organizationRouter);

api.use('/geocoding', geocodingRouter);

export default api;
