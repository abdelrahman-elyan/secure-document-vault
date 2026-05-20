const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const passport = require('passport');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(passport.initialize());

// ── Load passport strategies ──
require('./config/passport')(passport);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/admin',     require('./routes/admin'));

app.get('/', (req, res) => {
  res.send('🔐 SecureVault Backend API is running securely over HTTPS.');
});

// ── HTTPS Server ──────────────────────────────────────────────
const sslOptions = {
  key:  fs.readFileSync(path.join(__dirname, 'certs', 'server.key')),
  cert: fs.readFileSync(path.join(__dirname, 'certs', 'server.cert'))
};

https.createServer(sslOptions, app).listen(PORT, () => {
  console.log(`🔒 HTTPS Server running on https://localhost:${PORT}`);
});
