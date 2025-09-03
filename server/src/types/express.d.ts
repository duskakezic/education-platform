import type { UserRecord } from '../utils/types';

// Augment Express types so `req.currentUser` is recognized everywhere
declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: UserRecord;
  }
}

export {};

