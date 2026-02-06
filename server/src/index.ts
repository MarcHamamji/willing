import express, { type ErrorRequestHandler } from 'express';
import morgan from 'morgan';

import config from './config.js';
import api from './api/index.js';
import { ZodError } from 'zod';
import cors from 'cors';

const app = express();

app.use(morgan('dev'));
app.use(express.json());

app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));

app.use(api);

// Not found handler
app.use((req, res, next) => {
  res.status(404);
  const error = new Error(`Not Found - ${req.originalUrl}`);
  next(error);
});

// Error handler
app.use(((err, req, res, _next) => {
  if (res.statusCode === 200) {
    if (err instanceof ZodError) {
      res.status(400);
    } else {
      res.status(500);
    }
  }

  res.json({
    message: err.message,
    stack: config.NODE_ENV === 'production' ? '' : err.stack,
  });
}) as ErrorRequestHandler);

app.listen(config.SERVER_PORT, (error?: Error) => {
  if (error) {
    console.error('Failed to start server');
  } else {
    console.log('Listening on port ' + config.SERVER_PORT);
  }
});
