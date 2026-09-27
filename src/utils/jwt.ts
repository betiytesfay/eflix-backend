import jwt from 'jsonwebtoken';
import { UserRole } from '../types/user.types';

export interface JwtPayload {
  userId: string;
  role: UserRole;
}

export const signToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_2026';
  return jwt.verify(token, secret) as JwtPayload;
};
