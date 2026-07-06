const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production';

const authenticate = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      // Validate active session
      if (!decoded.sessionId) {
        return res.status(401).json({ message: 'Session invalid. Please login again.' });
      }
      const activeSession = await prisma.activeSession.findUnique({ where: { userId: decoded.id } });
      if (!activeSession || activeSession.sessionId !== decoded.sessionId) {
        return res.status(401).json({ message: 'Session active elsewhere or expired. Please login again.' });
      }

      req.user = decoded;

      if (allowedRoles.length > 0 && !allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      // Extra security validation
      if (decoded.role === 'DEVELOPER') {
        const dev = await prisma.developer.findUnique({ where: { id: decoded.id } });
        if (!dev) {
          return res.status(403).json({ message: 'Developer account does not exist.' });
        }
      } else if (decoded.role === 'SUPER_ADMIN') {
        const admin = await prisma.superAdmin.findUnique({ where: { id: decoded.id } });
        if (!admin || !admin.active) {
          return res.status(403).json({ message: 'Super Admin account is inactive.' });
        }
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }
  };
};

module.exports = { authenticate };
