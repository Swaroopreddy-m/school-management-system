const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { authenticate } = require('../middleware/auth');

// Require Developer authentication for all sub-routes
router.use(authenticate(['DEVELOPER']));

// 1. Get Platform Statistics
router.get('/stats', async (req, res) => {
  try {
    const schoolCount = await prisma.school.count();
    const activeSchools = await prisma.school.count({ where: { status: 'ACTIVE' } });
    const superAdminCount = await prisma.superAdmin.count();
    const auditCount = await prisma.auditLog.count();

    return res.json({
      schools: schoolCount,
      activeSchools: activeSchools,
      superAdmins: superAdminCount,
      auditLogs: auditCount
    });
  } catch (error) {
    console.error('Error fetching developer stats:', error);
    return res.status(500).json({ message: 'Error retrieving statistics.' });
  }
});

// 2. Get All Schools
router.get('/schools', async (req, res) => {
  try {
    const schools = await prisma.school.findMany({
      include: {
        creator: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json(schools);
  } catch (error) {
    console.error('Error fetching schools:', error);
    return res.status(500).json({ message: 'Error retrieving schools.' });
  }
});

// 3. Toggle School Status (Enable/Disable)
router.put('/schools/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be ACTIVE or INACTIVE.' });
    }

    const school = await prisma.school.update({
      where: { id },
      data: { status }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'DEVELOPER',
        action: `SCHOOL_STATUS_${status}`,
        details: `School "${school.schoolName}" (${school.schoolCode}) status set to ${status}.`,
        ipAddress: req.ip
      }
    });

    return res.json({ message: `School status updated to ${status}.`, school });
  } catch (error) {
    console.error('Error updating school status:', error);
    return res.status(500).json({ message: 'Error updating school status.' });
  }
});

// 4. Get All Super Admins
router.get('/super-admins', async (req, res) => {
  try {
    const admins = await prisma.superAdmin.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(admins);
  } catch (error) {
    console.error('Error fetching super admins:', error);
    return res.status(500).json({ message: 'Error retrieving super admins.' });
  }
});

// 5. Create Super Admin
router.post('/super-admins', async (req, res) => {
  try {
    const { name, email, username, password, phone, country, timezone } = req.body;

    if (!name || !email || !username || !password) {
      return res.status(400).json({ message: 'Required fields missing: name, email, username, password.' });
    }

    const existingAdmin = await prisma.superAdmin.findFirst({
      where: {
        OR: [
          { username: username.toLowerCase() },
          { email: email.toLowerCase() }
        ]
      }
    });

    if (existingAdmin) {
      return res.status(400).json({ message: 'A Super Admin with this username or email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const admin = await prisma.superAdmin.create({
      data: {
        developerId: req.user.id,
        name,
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        passwordHash,
        phone,
        country,
        timezone
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'DEVELOPER',
        action: 'SUPER_ADMIN_CREATED',
        details: `Super Admin "${name}" (${username}) created.`,
        ipAddress: req.ip
      }
    });

    return res.status(201).json({ message: 'Super Admin created successfully.', admin: { id: admin.id, name: admin.name, username: admin.username } });
  } catch (error) {
    console.error('Error creating super admin:', error);
    return res.status(500).json({ message: 'Error creating Super Admin.' });
  }
});

// 6. Toggle Super Admin Status (Enable/Disable)
router.put('/super-admins/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (active === undefined) {
      return res.status(400).json({ message: 'Active state required.' });
    }

    const admin = await prisma.superAdmin.update({
      where: { id },
      data: { active: !!active }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'DEVELOPER',
        action: active ? 'SUPER_ADMIN_ACTIVATED' : 'SUPER_ADMIN_DEACTIVATED',
        details: `Super Admin "${admin.name}" (${admin.username}) set to ${active ? 'Active' : 'Inactive'}.`,
        ipAddress: req.ip
      }
    });

    return res.json({ message: `Super Admin set to ${active ? 'Active' : 'Inactive'}.`, admin });
  } catch (error) {
    console.error('Error updating super admin status:', error);
    return res.status(500).json({ message: 'Error updating Super Admin status.' });
  }
});

// 7. Get Platform Settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await prisma.platformSettings.findFirst();
    return res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ message: 'Error fetching platform settings.' });
  }
});

// 8. Update Platform Settings
router.put('/settings', async (req, res) => {
  try {
    const { platformName, theme, currency, timezone, language, smtpHost, smtpPort } = req.body;

    if (!platformName) {
      return res.status(400).json({ message: 'Platform name is required.' });
    }

    const settings = await prisma.platformSettings.findFirst();

    const updatedSettings = await prisma.platformSettings.update({
      where: { id: settings.id },
      data: {
        platformName,
        theme,
        currency,
        timezone,
        language,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? parseInt(smtpPort, 10) : null
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'DEVELOPER',
        action: 'PLATFORM_SETTINGS_UPDATED',
        details: `Platform Settings updated. Name: "${platformName}".`,
        ipAddress: req.ip
      }
    });

    return res.json({ message: 'Settings updated successfully.', settings: updatedSettings });
  } catch (error) {
    console.error('Error updating platform settings:', error);
    return res.status(500).json({ message: 'Error updating settings.' });
  }
});

// 9. Get Audit Logs
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100
    });
    return res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ message: 'Error fetching audit logs.' });
  }
});

// 10. Database Backup Endpoint
router.post('/database/backup', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const backupFileName = `backup_${Date.now()}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Fetch all tables
    const data = {
      developers: await prisma.developer.findMany(),
      platformSettings: await prisma.platformSettings.findMany(),
      superAdmins: await prisma.superAdmin.findMany(),
      schools: await prisma.school.findMany(),
      schoolUsers: await prisma.schoolUser.findMany(),
      studentProfiles: await prisma.studentProfile.findMany(),
      teacherProfiles: await prisma.teacherProfile.findMany(),
      attendances: await prisma.attendance.findMany(),
      exams: await prisma.exam.findMany(),
      examResults: await prisma.examResult.findMany(),
      feeInvoices: await prisma.feeInvoice.findMany(),
      books: await prisma.book.findMany(),
      bookIssues: await prisma.bookIssue.findMany(),
      visitorLogs: await prisma.visitorLog.findMany(),
      rolePermissions: await prisma.rolePermission.findMany(),
      userPermissions: await prisma.userPermission.findMany(),
      auditLogs: await prisma.auditLog.findMany()
    };

    fs.writeFileSync(backupFilePath, JSON.stringify(data, null, 2), 'utf8');

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'DEVELOPER',
        action: 'DATABASE_BACKUP',
        details: `Database backup created: ${backupFileName}`,
        ipAddress: req.ip
      }
    });
    return res.json({ message: 'Database backup completed successfully.', file: backupFileName });
  } catch (error) {
    console.error('Backup error:', error);
    return res.status(500).json({ message: 'Backup execution failed.' });
  }
});

// 11. Database Restore Endpoint
router.post('/database/restore', async (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) return res.status(400).json({ message: 'Filename required.' });

    const fs = require('fs');
    const path = require('path');
    const backupFilePath = path.join(__dirname, '../../backups', filename);

    if (!fs.existsSync(backupFilePath)) {
      return res.status(404).json({ message: 'Backup snapshot file not found.' });
    }

    const data = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));

    // Recreate all tables inside a transaction
    await prisma.$transaction(async (tx) => {
      // 1. Wipe tables in correct reverse-dependency order
      await tx.userPermission.deleteMany();
      await tx.rolePermission.deleteMany();
      await tx.visitorLog.deleteMany();
      await tx.bookIssue.deleteMany();
      await tx.book.deleteMany();
      await tx.feeInvoice.deleteMany();
      await tx.examResult.deleteMany();
      await tx.exam.deleteMany();
      await tx.attendance.deleteMany();
      await tx.teacherProfile.deleteMany();
      await tx.studentProfile.deleteMany();
      await tx.schoolUser.deleteMany();
      await tx.school.deleteMany();
      await tx.superAdmin.deleteMany();
      await tx.platformSettings.deleteMany();
      await tx.developer.deleteMany();
      await tx.auditLog.deleteMany();

      // 2. Restore tables in dependency order
      if (data.developers && data.developers.length > 0) await tx.developer.createMany({ data: data.developers });
      if (data.platformSettings && data.platformSettings.length > 0) await tx.platformSettings.createMany({ data: data.platformSettings });
      if (data.superAdmins && data.superAdmins.length > 0) await tx.superAdmin.createMany({ data: data.superAdmins });
      if (data.schools && data.schools.length > 0) await tx.school.createMany({ data: data.schools });
      if (data.schoolUsers && data.schoolUsers.length > 0) await tx.schoolUser.createMany({ data: data.schoolUsers });
      if (data.studentProfiles && data.studentProfiles.length > 0) await tx.studentProfile.createMany({ data: data.studentProfiles });
      if (data.teacherProfiles && data.teacherProfiles.length > 0) await tx.teacherProfile.createMany({ data: data.teacherProfiles });
      if (data.attendances && data.attendances.length > 0) await tx.attendance.createMany({ data: data.attendances });
      if (data.exams && data.exams.length > 0) await tx.exam.createMany({ data: data.exams });
      if (data.examResults && data.examResults.length > 0) await tx.examResult.createMany({ data: data.examResults });
      if (data.feeInvoices && data.feeInvoices.length > 0) await tx.feeInvoice.createMany({ data: data.feeInvoices });
      if (data.books && data.books.length > 0) await tx.book.createMany({ data: data.books });
      if (data.bookIssues && data.bookIssues.length > 0) await tx.bookIssue.createMany({ data: data.bookIssues });
      if (data.visitorLogs && data.visitorLogs.length > 0) await tx.visitorLog.createMany({ data: data.visitorLogs });
      if (data.rolePermissions && data.rolePermissions.length > 0) await tx.rolePermission.createMany({ data: data.rolePermissions });
      if (data.userPermissions && data.userPermissions.length > 0) await tx.userPermission.createMany({ data: data.userPermissions });
      if (data.auditLogs && data.auditLogs.length > 0) await tx.auditLog.createMany({ data: data.auditLogs });
    }, { timeout: 30000 });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'DEVELOPER',
        action: 'DATABASE_RESTORE',
        details: `Database restored from backup: ${filename}`,
        ipAddress: req.ip
      }
    });
    return res.json({ message: `Database successfully restored from ${filename}.` });
  } catch (error) {
    console.error('Restore error:', error);
    return res.status(500).json({ message: 'Restore execution failed.' });
  }
});

// 12. Get Developer Profile
router.get('/profile', async (req, res) => {
  try {
    const dev = await prisma.developer.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, username: true, organization: true, createdAt: true }
    });
    return res.json(dev);
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching profile.' });
  }
});

// 13. Update Developer Profile
router.put('/profile', async (req, res) => {
  try {
    const { name, email, username, organization, currentPassword, newPassword } = req.body;

    const dev = await prisma.developer.findUnique({ where: { id: req.user.id } });

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to set a new password.' });
      }
      const isMatch = await bcrypt.compare(currentPassword, dev.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid current password.' });
      }
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await prisma.developer.update({
        where: { id: req.user.id },
        data: { passwordHash: newPasswordHash }
      });
    }

    const updated = await prisma.developer.update({
      where: { id: req.user.id },
      data: {
        name: name || dev.name,
        email: email ? email.toLowerCase() : dev.email,
        username: username ? username.toLowerCase() : dev.username,
        organization: organization || dev.organization
      },
      select: { id: true, name: true, email: true, username: true, organization: true }
    });

    await prisma.auditLog.create({
      data: {
        actorId: req.user.id,
        actorName: req.user.name,
        actorType: 'DEVELOPER',
        action: 'DEVELOPER_PROFILE_UPDATED',
        details: 'Developer profile details updated.',
        ipAddress: req.ip
      }
    });

    return res.json({ message: 'Profile updated successfully.', user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Error updating profile.' });
  }
});

module.exports = router;
