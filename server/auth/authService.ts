/**
 * ExamGuard AI - Authentication & Authorization Service
 * Real bcrypt password hashing & real JWT signing/verification
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from '../db/mongo';
import { User, UserRole } from '../../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'examguard-ai-jwt-secret-key-production-ready-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';

export interface AuthRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions);
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (!decoded || !decoded.id) return null;
    const user = await db.users().findOne({ id: decoded.id });
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  } catch {
    return null;
  }
}

export async function authenticateRequest(req: Request): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  // Support real JWT tokens
  return verifyToken(token);
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  authenticateRequest(req)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'Authentication required or token expired' });
      }
      req.user = user;
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Authentication verification failed' });
    });
}

export function requireRole(roles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: requires one of roles [${roles.join(', ')}]` });
    }
    next();
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
