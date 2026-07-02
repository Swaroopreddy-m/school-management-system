const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

router.use(authenticate(['SUPER_ADMIN']));

// Get all schools created by this Super Admin
router.get('/schools', async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      where: { createdBy: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return res.status(500).json({ message: 'Error retrieving schools.' });
  }
});

// Create School & Default School Admin atomically
router.post('/schools', async (req, res) => {
  try {
    const { 
      schoolName, schoolCode, email, phone, address, city, country, timezone, logo,
      adminUsername, adminPassword, adminEmail, adminName,
      subscriptionTier, features
    } = req.body;

    if (!schoolName || !schoolCode || !email || !phone || !address || !city || !country || !timezone ||
        !adminUsername || !adminPassword || !adminEmail || !adminName) {
      return res.status(400).json({ message: 'All school and administrator fields are required.' });
    }

    const codeUpper = schoolCode.toUpperCase();

    // Check code uniqueness
    const existing = await prisma.school.findUnique({
      where: { schoolCode: codeUpper }
    });

    if (existing) {
      return res.status(400).json({ message: 'School code already exists.' });
    }

    // Hash admin password
    const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);

    // Atomically create School and default School Admin inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          schoolName,
          schoolCode: codeUpper,
          email,
          phone,
          address,
          city,
          country,
          timezone,
          logo: logo || null,
          subscriptionTier: subscriptionTier || 'BASIC',
          features: Array.isArray(features) ? features.join(',') : (features || 'attendance,fees,exams,library'),
          createdBy: req.user.id
        }
      });

      const schoolAdmin = await tx.schoolUser.create({
        data: {
          schoolId: school.id,
          name: adminName,
          email: adminEmail.toLowerCase(),
          username: adminUsername.toLowerCase(),
          passwordHash: hashedAdminPassword,
          role: 'SCHOOL_ADMIN',
          active: true
        }
      });

      return { school, schoolAdmin };
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SUPER_ADMIN',
        action: 'SCHOOL_CREATED',
        details: `School "${schoolName}" (${codeUpper}) and default School Admin "${adminName}" created successfully.`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json(result.school);

  } catch (error) {
    console.error('Error creating school:', error);
    return res.status(500).json({ message: 'Error creating school and administrator.' });
  }
});

// Update school subscription and features config
router.put('/schools/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const { subscriptionTier, features } = req.body;

    if (!subscriptionTier || !features) {
      return res.status(400).json({ message: 'Subscription tier and features are required.' });
    }

    // Verify ownership
    const school = await prisma.school.findFirst({
      where: { id, createdBy: req.user.id }
    });

    if (!school) {
      return res.status(404).json({ message: 'School not found or access denied.' });
    }

    const featuresStr = Array.isArray(features) ? features.join(',') : features;

    const updated = await prisma.school.update({
      where: { id },
      data: {
        subscriptionTier,
        features: featuresStr
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SUPER_ADMIN',
        action: 'SCHOOL_CONFIG_UPDATED',
        details: `School "${updated.schoolName}" config updated: Tier=${subscriptionTier}, Features=${featuresStr}.`,
        ipAddress: req.ip
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating school config:', error);
    return res.status(500).json({ message: 'Error updating school settings.' });
  }
});

// Toggle school status
router.put('/schools/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' });
    }

    // Verify ownership
    const existing = await prisma.school.findFirst({
      where: { id, createdBy: req.user.id }
    });

    if (!existing) {
      return res.status(404).json({ message: 'School not found or access denied.' });
    }

    const updated = await prisma.school.update({
      where: { id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SUPER_ADMIN',
        action: `SCHOOL_STATUS_${status}`,
        details: `School "${updated.schoolName}" set to ${status}.`,
        ipAddress: req.ip
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating school status:', error);
    return res.status(500).json({ message: 'Error updating school status.' });
  }
});

// Get all School Users belonging to this Super Admin's schools
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.schoolUser.findMany({
      where: {
        school: {
          createdBy: req.user.id
        }
      },
      include: {
        school: {
          select: {
            schoolName: true,
            schoolCode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(users);
  } catch (error) {
    console.error('Error fetching school users:', error);
    return res.status(500).json({ message: 'Error retrieving school users.' });
  }
});

// Create a new School User (Principal, Teacher, etc.) under an owned school
router.post('/users', async (req, res) => {
  try {
    const { schoolId, name, email, username, password, role } = req.body;

    if (!schoolId || !name || !email || !username || !password || !role) {
      return res.status(400).json({ message: 'All user fields (schoolId, name, email, username, password, role) are required.' });
    }

    // Verify school is owned by this Super Admin
    const school = await prisma.school.findFirst({
      where: { id: schoolId, createdBy: req.user.id }
    });

    if (!school) {
      return res.status(404).json({ message: 'School not found or access denied.' });
    }

    // Check if user already exists in this school
    const existingUser = await prisma.schoolUser.findUnique({
      where: {
        schoolId_username: {
          schoolId,
          username: username.toLowerCase()
        }
      }
    });

    if (existingUser) {
      return res.status(400).json({ message: `Username "${username}" already exists in this school.` });
    }

    const hashedUserPassword = await bcrypt.hash(password, 10);

    const {
      employeeId, subject, qualification,
      rollNumber, grade, section, parentName, parentPhone
    } = req.body;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.schoolUser.create({
        data: {
          schoolId,
          name,
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          passwordHash: hashedUserPassword,
          role,
          active: true
        }
      });

      if (role === 'TEACHER') {
        await tx.teacherProfile.create({
          data: {
            userId: newUser.id,
            employeeId: employeeId || `EMP-${newUser.username.toUpperCase()}`,
            subject: subject || 'General',
            qualification: qualification || 'B.Ed.'
          }
        });
      } else if (role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            rollNumber: rollNumber || `ROLL-${newUser.username.toUpperCase()}`,
            grade: grade || 'Grade 1',
            section: section || 'A',
            parentName: parentName || '',
            parentPhone: parentPhone || ''
          }
        });
      }

      return newUser;
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SUPER_ADMIN',
        action: 'SCHOOL_USER_CREATED',
        details: `Created user "${name}" with role "${role}" in school "${school.schoolName}".`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json({ id: user.id, name: user.name, username: user.username, role: user.role });

  } catch (error) {
    console.error('Error creating school user:', error);
    return res.status(500).json({ message: 'Error creating school user.' });
  }
});

// Toggle school user status
router.put('/users/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (active === undefined) {
      return res.status(400).json({ message: 'Active state is required.' });
    }

    // Verify user belongs to a school created by this Super Admin
    const existingUser = await prisma.schoolUser.findFirst({
      where: {
        id,
        school: { createdBy: req.user.id }
      },
      include: { school: true }
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found or access denied.' });
    }

    const updated = await prisma.schoolUser.update({
      where: { id },
      data: { active: !!active }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SUPER_ADMIN',
        action: active ? 'SCHOOL_USER_ACTIVATED' : 'SCHOOL_USER_DEACTIVATED',
        details: `School user "${updated.name}" (${updated.username}) set to ${active ? 'Active' : 'Inactive'} in school "${existingUser.school.schoolName}".`,
        ipAddress: req.ip
      }
    });

    return res.json(updated);
  } catch (error) {
    console.error('Error updating school user status:', error);
    return res.status(500).json({ message: 'Error updating user status.' });
  }
});

// Get Audit Logs for this Super Admin
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { actorId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return res.json(logs);
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving audit logs.' });
  }
});

module.exports = router;
