const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

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
