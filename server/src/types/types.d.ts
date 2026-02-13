import { JWTPayload } from 'jose';

import { UserJWT } from '../types.js';

type UserJWTPayload = JWTPayload & UserJWT;

declare global {
  namespace Express {
    export interface Request {
      userJWT?: UserJWT;
    }
  }
}
