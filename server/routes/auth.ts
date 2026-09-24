/**
 * ExamGuard AI - Authentication & Multi-Tenant Institution API Routes
 */

import { Router } from 'express';
import { db } from '../db/mongo';
import { generateToken, hashPassword, comparePassword, requireAuth, AuthRequest } from '../auth/authService';
import { User, Institution } from '../../src/types';

const router = Router();

// GET /api/auth/institutions - List all registered & sandbox institutions
router.get('/institutions', async (_req, res) => {
  try {
    const instRes = await db.institutions().find();
    const institutions: Institution[] = await instRes.toArray();
    res.json(institutions);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch institutions' });
  }
});

// POST /api/auth/register-institution - Institutional onboarding flow
router.post('/register-institution', async (req, res) => {
  try {
    const {
      name,
      registrationId,
      type = 'University',
      country = 'India',
      domain = '',
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    if (!name || !registrationId || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({
        error: 'Institution Name, Registration ID, Admin Name, Admin Email, and Admin Password are required',
      });
    }

    const cleanRegId = registrationId.toUpperCase().trim();
    const cleanEmail = adminEmail.toLowerCase().trim();

    // Check if institution registration ID already exists
    const existingInst = await db.institutions().findOne({
      $or: [{ registrationId: cleanRegId }, { name: name.trim() }],
    });
    if (existingInst) {
      return res.status(409).json({
        error: `An institution with registration ID '${cleanRegId}' or name '${name.trim()}' is already registered`,
      });
    }

    // Check if admin email exists
    const existingUser = await db.users().findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(409).json({
        error: `An institutional user with email '${cleanEmail}' is already registered`,
      });
    }

    const institutionId = `inst-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newInstitution: Institution = {
      id: institutionId,
      name: name.trim(),
      registrationId: cleanRegId,
      type,
      country: country.trim(),
      domain: domain.trim(),
      adminName: adminName.trim(),
      adminEmail: cleanEmail,
      status: 'ACTIVE',
      isSampleSandbox: false,
      createdAt: new Date().toISOString(),
    };

    await db.institutions().insertOne(newInstitution);

    // Create institutional administrator
    const passwordHash = await hashPassword(adminPassword);
    const adminUser: User & { passwordHash: string } = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      institutionId,
      institutionName: newInstitution.name,
      institutionRegistrationId: newInstitution.registrationId,
      employeeId: `ADM-${cleanRegId}`,
      name: adminName.trim(),
      email: cleanEmail,
      role: 'EXAMINER', // Examiners can create & manage exams and review attempts
      passwordHash,
      createdAt: new Date().toISOString(),
    };

    await db.users().insertOne(adminUser);

    // Log audit
    await db.audit_logs().insertOne({
      id: `log-inst-reg-${Date.now()}`,
      institutionId,
      timestamp: new Date().toISOString(),
      actorId: adminUser.id,
      actorName: adminUser.name,
      actorRole: adminUser.role,
      action: 'INSTITUTION_REGISTERED',
      details: `New institution '${newInstitution.name}' (Reg ID: ${cleanRegId}) registered by ${adminUser.name}.`,
    });

    const { passwordHash: _, ...safeUser } = adminUser;
    const token = generateToken(safeUser);

    res.status(201).json({
      institution: newInstitution,
      user: safeUser,
      token,
      message: `Institution '${newInstitution.name}' registered and provisioned successfully.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Institutional registration failed' });
  }
});

// POST /api/auth/register - Register user under an institution
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'STUDENT',
      institutionId,
      institutionRegistrationId,
      studentId,
      employeeId,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await db.users().findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    // Resolve institution
    let boundInstitution: Institution | null = null;
    if (institutionRegistrationId) {
      boundInstitution = await db.institutions().findOne({
        registrationId: institutionRegistrationId.toUpperCase().trim(),
      });
    } else if (institutionId) {
      boundInstitution = await db.institutions().findOne({ id: institutionId });
    }

    // Default to Vignan University if none specified
    if (!boundInstitution) {
      boundInstitution = await db.institutions().findOne({ id: 'inst-vignan' });
    }

    const passwordHash = await hashPassword(password);
    const newUser: User & { passwordHash: string } = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      institutionId: boundInstitution?.id || 'inst-vignan',
      institutionName: boundInstitution?.name || 'Vignan University',
      institutionRegistrationId: boundInstitution?.registrationId || 'VIGNAN-UNIV-DEMO',
      studentId: studentId?.trim() || (role === 'STUDENT' ? `STU-${Date.now().toString().slice(-4)}` : undefined),
      employeeId: employeeId?.trim() || (role === 'EXAMINER' ? `FAC-${Date.now().toString().slice(-4)}` : undefined),
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

// POST /api/auth/login - Multi-tenant login with institution validation
router.post('/login', async (req, res) => {
  try {
    const { email, password, institutionId, institutionRegistrationId } = req.body;
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

    // If an institution was specified in the login form, check affiliation
    if (institutionRegistrationId || institutionId) {
      let targetInst: Institution | null = null;
      if (institutionRegistrationId) {
        targetInst = await db.institutions().findOne({
          registrationId: institutionRegistrationId.toUpperCase().trim(),
        });
      } else if (institutionId) {
        targetInst = await db.institutions().findOne({ id: institutionId });
      }

      if (targetInst && user.institutionId && user.institutionId !== targetInst.id) {
        return res.status(403).json({
          error: `User account is registered under '${user.institutionName || 'another institution'}', not '${targetInst.name}'. Please select the correct institution.`,
        });
      }
    }

    // Ensure user has institutional metadata populated
    if (!user.institutionId) {
      user.institutionId = 'inst-vignan';
      user.institutionName = 'Vignan University';
      user.institutionRegistrationId = 'VIGNAN-UNIV-DEMO';
      await db.users().updateOne({ id: user.id }, { $set: {
        institutionId: user.institutionId,
        institutionName: user.institutionName,
        institutionRegistrationId: user.institutionRegistrationId,
      }});
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
