const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const passport = require('passport');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');

const validatePassword = (password) => {
  const errors = [];
  if (password.length < 8) errors.push('At least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('At least one number');
  if (!/[!@#$%^&*]/.test(password)) errors.push('At least one special character (!@#$%^&*)');
  return errors;
};

// Register (Modified for mandatory 2FA on signup)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ message: 'All fields required' });

    const policyErrors = validatePassword(password);
    if (policyErrors.length > 0)
      return res.status(400).json({ message: 'Password policy failed', errors: policyErrors });

    const [existing] = await db.query('SELECT id FROM users WHERE email=? OR username=?', [email, username]);
    if (existing.length > 0)
      return res.status(400).json({ message: 'User already exists' });

    // 1. توليد الـ 2FA Secret فوراً للمستخدم الجديد
    const secret = speakeasy.generateSecret({ name: `SecureVault (${email})` });
    const hashed = await bcrypt.hash(password, 12);

    // 2. إدخال المستخدم في الـ Database مع حفظ السيكرت وتفعيل الـ 2FA إجبارياً
    await db.query(
      'INSERT INTO users (username, email, password, two_factor_secret, two_factor_enabled) VALUES (?,?,?,?, TRUE)',
      [username, email, hashed, secret.base32]
    );

    // 3. جلب الـ user الجديد وعمل tempToken عشان يقدر يكمل تفعيل الـ 2FA
    const [newUser] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    const tempToken = jwt.sign(
      { id: newUser[0].id, email: email, role: 'user', username: username },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    // 4. توليد الـ QR Code وإرساله للفرونت إند ليعرضه فوراً
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.status(201).json({
      message: 'User registered, 2FA setup required',
      requires2FA: true,
      qrCode: qrCodeUrl,
      tempToken
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
    if (rows.length === 0)
      return res.status(400).json({ message: 'Invalid credentials' });

    const user = rows[0];
    if (!user.password)
      return res.status(400).json({ message: 'Please login with OAuth' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.two_factor_enabled) {
      return res.json({ requiresTwoFactor: true, userId: user.id });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Verify 2FA
router.post('/2fa/verify-login', async (req, res) => {
  try {
    const { userId, token } = req.body;
    const [rows] = await db.query('SELECT * FROM users WHERE id=?', [userId]);
    if (rows.length === 0) return res.status(400).json({ message: 'User not found' });
    const user = rows[0];
    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token,
      window: 1
    });
    if (!verified) return res.status(400).json({ message: 'Invalid 2FA token' });
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({ token: jwtToken, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Setup 2FA
router.post('/2fa/setup', verifyToken, async (req, res) => {
  try {
    const secret = speakeasy.generateSecret({ name: `SecureVault (${req.user.email})` });
    await db.query('UPDATE users SET two_factor_secret=? WHERE id=?', [secret.base32, req.user.id]);
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
    res.json({ qrCode: qrCodeUrl, secret: secret.base32 });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Enable 2FA
router.post('/2fa/enable', verifyToken, async (req, res) => {
  try {
    const { token } = req.body;
    const [rows] = await db.query('SELECT two_factor_secret FROM users WHERE id=?', [req.user.id]);
    const verified = speakeasy.totp.verify({
      secret: rows[0].two_factor_secret,
      encoding: 'base32',
      token,
      window: 1
    });
    if (!verified) return res.status(400).json({ message: 'Invalid token' });
    await db.query('UPDATE users SET two_factor_enabled=TRUE WHERE id=?', [req.user.id]);
    res.json({ message: '2FA enabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── Disable 2FA ─────────────────────────────────────────────────────
router.post('/2fa/disable', verifyToken, async (req, res) => {
  try {
    await db.query('UPDATE users SET two_factor_enabled=FALSE, two_factor_secret=NULL WHERE id=?', [req.user.id]);
    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GitHub OAuth
router.get('/github', passport.authenticate('github', { scope: ['user:email'], session: false }));
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    // لو عنده 2FA مفعّل → ابعت tempToken وروّحه لشاشة الـ 2FA
    if (req.user.two_factor_enabled) {
      const tempToken = jwt.sign(
        { id: req.user.id, requiresTwoFactor: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.redirect(
        `${process.env.FRONTEND_URL}/oauth-callback?requiresTwoFactor=true&tempToken=${tempToken}&userId=${req.user.id}`
      );
    }
    // مفيش 2FA → دخول مباشر
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth` }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email, role: req.user.role, username: req.user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?token=${token}`);
  }
);

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  const [rows] = await db.query('SELECT id, username, email, role, two_factor_enabled FROM users WHERE id=?', [req.user.id]);
  res.json(rows[0]);
});

module.exports = router;
