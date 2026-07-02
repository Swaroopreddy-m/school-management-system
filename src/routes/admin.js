const express = require('express');
const router = express.Router();
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

// Create School
router.post('/schools', async (req, res) => {
  try {
    const { schoolName, schoolCode, email, phone, address, city, country, timezone, logo } = req.body;

    if (!schoolName || !schoolCode || !email || !phone || !address || !city || !country || !timezone) {
      return res.status(400).json({ message: 'All school fields are required.' });
    }

    const codeUpper = schoolCode.toUpperCase();

    // Check code uniqueness
    const existing = await prisma.school.findUnique({
      where: { schoolCode: codeUpper }
    });

    if (existing) {
      return res.status(400).json({ message: 'School code already exists.' });
    }

    const school = await prisma.school.create({
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
        createdBy: req.user.id
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'SUPER_ADMIN',
        action: 'SCHOOL_CREATED',
        details: `School "${schoolName}" with code "${codeUpper}" created successfully.`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json(school);

  } catch (error) {
    console.error('Error creating school:', error);
    return res.status(500).json({ message: 'Error creating school.' });
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
