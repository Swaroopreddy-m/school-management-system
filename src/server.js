const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Normalize loopback IP from ::1 to 127.0.0.1 for audit logs consistency
app.use((req, res, next) => {
  let ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  if (ip === '::1') {
    ip = '127.0.0.1';
  } else if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7);
  }
  Object.defineProperty(req, 'ip', {
    value: ip,
    writable: true,
    configurable: true
  });
  next();
});

// Enable CORS and body parser
app.use(cors());
app.use(express.json());

// Serve frontend static assets
app.use(express.static(path.join(__dirname, '../public')));

// Setup router endpoints
app.use('/api/setup', require('./routes/setup'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/developer', require('./routes/developer'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/school', require('./routes/school'));

// Fallback to index.html for Single Page Application routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Server successfully started on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser to view the application.`);
});
