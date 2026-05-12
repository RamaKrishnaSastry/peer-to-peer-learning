import { Request } from 'express';

export interface AuthRequest extends Request {
  userId?: string;
  token?: string;
  user?: any;
}

export interface CustomRequest extends Request {
  userId?: string;
  body: any;
}
