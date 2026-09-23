/**
 * ExamGuard AI - Authentication API Routes
 */

import { Router } from 'express';
import { db } from '../db/mongo';
import { generateToken, hashPassword, comparePassword, requireAuth, AuthRequest } from '../auth/authService';
import { User } from '../../src/types';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'STUDENT' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.users().findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    const passwordHash = await hashPassword(password);
    const newUser: User & { passwordHash: string } = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      email: normalizedEmail,
      role: role === 'EXAMINER' ? 'EXAMINER' : 'STUDENT',
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await db.users().insertOne(newUser);

    const { passwordHash: _, ...safeUser } = newUser;
    const token = generateToken(safeUser);

    res.status(201).json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.users().findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await comparePassword(password, user.passwordHash || '');
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const { passwordHash, ...safeUser } = user;
    const token = generateToken(safeUser);

    res.json({ user: safeUser, token });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

router.get('/me', requireAuth, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

export default router;
