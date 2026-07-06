const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');
const { authLimiter } = require('../middleware/limiter');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';
const crypto = require('crypto');

// Helper to manage concurrent active sessions
async function handleActiveSession(userId, res) {
  const sessionId = crypto.randomUUID();
  const behavior = process.env.SINGLE_SESSION_BEHAVIOR || 'FORCE_LOGOUT';

  if (behavior === 'REJECT_LOGIN') {
    const existing = await prisma.activeSession.findUnique({ where: { userId } });
    if (existing) {
      res.status(403).json({ message: 'Account is already active in another session/device.' });
      return null;
    }
  }

  await prisma.activeSession.upsert({
    where: { userId },
    update: { sessionId },
    create: { userId, sessionId }
  });

  return sessionId;
}

// Helper to generate JWT
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
};

// 1. Developer Login
router.post('/developer/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const dev = await prisma.developer.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() }
        ]
      }
    });

    if (!dev) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, dev.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const sessionId = await handleActiveSession(dev.id, res);
    if (!sessionId) return;

    const token = generateToken({
      id: dev.id,
      username: dev.username,
      name: dev.name,
      role: 'DEVELOPER',
      sessionId
    });

    await prisma.auditLog.create({
      data: {
        actorId: dev.id,
        actorName: dev.name,
        actorType: 'DEVELOPER',
        action: 'DEVELOPER_LOGIN',
        details: 'Developer logged in successfully.',
        ipAddress: req.ip
      }
    });

    return res.json({
      token,
      user: {
        id: dev.id,
        username: dev.username,
        name: dev.name,
        role: 'DEVELOPER'
      }
    });
  } catch (error) {
    console.error('Developer login error:', error);
    return res.status(500).json({ message: 'Internal server error during developer login.' });
  }
});

// 2. Super Admin Login
router.post('/super-admin/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const admin = await prisma.superAdmin.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() }
        ]
      }
    });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!admin.active) {
      return res.status(403).json({ message: 'Super Admin account has been deactivated.' });
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const sessionId = await handleActiveSession(admin.id, res);
    if (!sessionId) return;

    const token = generateToken({
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: 'SUPER_ADMIN',
      sessionId
    });

    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorName: admin.name,
        actorType: 'SUPER_ADMIN',
        action: 'SUPER_ADMIN_LOGIN',
        details: 'Super Admin logged in successfully.',
        ipAddress: req.ip
      }
    });

    return res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: 'SUPER_ADMIN'
      }
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    return res.status(500).json({ message: 'Internal server error during Super Admin login.' });
  }
});

// 3. School Login (For School Users: Principal, Teacher, Accountant, etc.)
router.post('/school/login', authLimiter, async (req, res) => {
  try {
    const { schoolCode, username, password } = req.body;
    if (!schoolCode || !username || !password) {
      return res.status(400).json({ message: 'School code, username, and password are required.' });
    }

    // Verify school exists and is active
    const school = await prisma.school.findUnique({
      where: { schoolCode: schoolCode.toUpperCase() }
    });

    if (!school) {
      return res.status(404).json({ message: 'School code not found.' });
    }

    if (school.status !== 'ACTIVE') {
      return res.status(403).json({ message: 'This school is inactive. Contact Super Admin.' });
    }

    // Verify school user exists inside this school
    const user = await prisma.schoolUser.findUnique({
      where: {
        schoolId_username: {
          schoolId: school.id,
          username: username.toLowerCase()
        }
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'This user account is inactive.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const sessionId = await handleActiveSession(user.id, res);
    if (!sessionId) return;

    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: 'SCHOOL_USER',
      schoolUserRole: user.role, // SCHOOL_ADMIN, PRINCIPAL, TEACHER, etc.
      schoolId: school.id,
      schoolName: school.schoolName,
      sessionId
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorName: user.name,
        actorType: 'SCHOOL_USER',
        action: 'SCHOOL_USER_LOGIN',
        details: `Logged in as "${user.role}" at school "${school.schoolName}" (${school.schoolCode}).`,
        ipAddress: req.ip
      }
    });

    return res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: 'SCHOOL_USER',
        schoolUserRole: user.role,
        schoolId: school.id,
        schoolName: school.schoolName
      }
    });
  } catch (error) {
    console.error('School login error:', error);
    return res.status(500).json({ message: 'Internal server error during school login.' });
  }
});

// 4. Logout Endpoint
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.decode(token);
      if (decoded && decoded.id) {
        await prisma.activeSession.deleteMany({ where: { userId: decoded.id } });
      }
    }
    return res.json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error during logout.' });
  }
});

module.exports = router;
