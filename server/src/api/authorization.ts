import { RequestHandler } from 'express';
import * as jose from 'jose';

import config from '../config.js';
import { UserJWT } from '../types.js';

export const authorizeOnly = (...roles: ('admin' | 'organization' | 'volunteer')[]) => {
  return ((req, res, next) => {
    if (!req.userJWT || !roles.includes(req.userJWT.role)) {
      res.status(403);
      next(new Error ('Unauthorized'));
    } else {
      next();
    }
  }) as RequestHandler;
};

export const setUserJWT = (async (req, res, next) => {
  if (!req.headers.authorization) {
    next();
    return;
  };

  const token = req.headers.authorization!.split(' ')[1];
  if (!token) {
    next();
    return;
  }

  try {
    const { payload } = await jose.jwtVerify<UserJWT>(token, new TextEncoder().encode(config.JWT_SECRET));
    req.userJWT = payload;
  } catch {
    // If parsing the jwt failed, consider the user not logged in
  }

  next();
}) as RequestHandler;
