
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch {
    return null;
  }
}

export const authenticateToken: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ message: 'Invalid token' });
  }

  const user = await storage.getUser(decoded.userId);
  if (!user) {
    return res.status(403).json({ message: 'User not found' });
  }

  (req as any).user = user;
  next();
};

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateMobileNumber(mobile: string): boolean {
  const mobileRegex = /^(\+91|91)?[6-9]\d{9}$/;
  return mobileRegex.test(mobile);
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}
