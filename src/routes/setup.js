const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

// Check setup status
router.get('/status', async (req, res) => {
  try {
    const devCount = await prisma.developer.count();
    return res.json({ needsSetup: devCount === 0 });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return res.status(500).json({ message: 'Internal server error checking setup status.' });
  }
});

// Complete setup
router.post('/complete', async (req, res) => {
  try {
    const devCount = await prisma.developer.count();
    if (devCount > 0) {
      return res.status(400).json({ message: 'System setup has already been completed.' });
    }

    const {
      // Step 1: Developer Registration
      developerName,
      email,
      username,
      password,
      securityQuestion,
      securityAnswer,
      organization,

      // Step 2: Create Super Admin
      superAdminName,
      superAdminEmail,
      superAdminUsername,
      superAdminPassword,
      superAdminPhone,
      superAdminCountry,
      superAdminTimezone,

      // Step 3: Platform Settings
      platformName,
      theme,
      language,
      currency,
      timezone,
      smtpHost,
      smtpPort
    } = req.body;

    // Validation
    if (!developerName || !email || !username || !password || !securityQuestion || !securityAnswer || !platformName) {
      return res.status(400).json({ message: 'Developer registration fields are required.' });
    }
    if (!superAdminName || !superAdminEmail || !superAdminUsername || !superAdminPassword) {
      return res.status(400).json({ message: 'Super admin credentials are required.' });
    }

    // Hash passwords
    const devPasswordHash = await bcrypt.hash(password, 10);
    const adminPasswordHash = await bcrypt.hash(superAdminPassword, 10);

    // Database transaction to ensure atomic execution
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Developer
      const developer = await tx.developer.create({
        data: {
          name: developerName,
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          passwordHash: devPasswordHash,
          securityQuestion,
          securityAnswer,
          organization
        }
      });

      // 2. Create Super Admin
      const superAdmin = await tx.superAdmin.create({
        data: {
          developerId: developer.id,
          name: superAdminName,
          email: superAdminEmail.toLowerCase(),
          username: superAdminUsername.toLowerCase(),
          passwordHash: adminPasswordHash,
          phone: superAdminPhone,
          country: superAdminCountry,
          timezone: superAdminTimezone
        }
      });

      // 3. Create Platform Settings
      const settings = await tx.platformSettings.create({
        data: {
          platformName,
          theme: theme || 'dark',
          currency: currency || 'USD',
          timezone: timezone || 'UTC',
          language: language || 'en',
          smtpHost: smtpHost || null,
          smtpPort: smtpPort ? parseInt(smtpPort, 10) : null
        }
      });

      // 4. Log the audit event
      await tx.auditLog.create({
        data: {
          actorId: developer.id,
          actorName: developer.name,
          actorType: 'DEVELOPER',
          action: 'PLATFORM_INITIALIZED',
          details: `Platform initialized with name "${platformName}". First Super Admin "${superAdminName}" created.`,
          ipAddress: req.ip
        }
      });

      return { developer, superAdmin, settings };
    });

    return res.status(200).json({
      message: 'System initialized successfully.',
      data: {
        platformName: result.settings.platformName,
        developer: { id: result.developer.id, username: result.developer.username },
        superAdmin: { id: result.superAdmin.id, username: result.superAdmin.username }
      }
    });

  } catch (error) {
    console.error('Error completing setup:', error);
    return res.status(500).json({ message: 'Internal server error during setup.' });
  }
});

module.exports = router;
