import { Router } from 'express';
import { setUserJWT } from './authorization.js';
import adminRouter from './routes/admin/index.js';
import userRouter from './routes/user.js';
import volunteerRouter from './routes/volunteer.js';
import orgRouter from './routes/organization.js';

const api = Router();
api.use(setUserJWT);

api.use('/user', userRouter);
api.use('/admin', adminRouter);
api.use('/volunteer', volunteerRouter);
api.use('/organization', orgRouter);

export default api;
