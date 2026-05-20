const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

// Get all users (admin only)
router.get('/users', verifyToken, requireRole('admin'), async (req, res) => {
  const [rows] = await db.query('SELECT id, username, email, role, two_factor_enabled, created_at FROM users ORDER BY created_at DESC');
  res.json(rows);
});

// Update user role (admin only)
router.put('/users/:id/role', verifyToken, requireRole('admin'), async (req, res) => {
  const { role } = req.body;
  if (!['admin', 'manager', 'user'].includes(role))
    return res.status(400).json({ message: 'Invalid role' });
  await db.query('UPDATE users SET role=? WHERE id=?', [role, req.params.id]);
  res.json({ message: 'Role updated' });
});

// Delete user (admin only)
router.delete('/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  if (parseInt(req.params.id) === req.user.id)
    return res.status(400).json({ message: 'Cannot delete yourself' });
  await db.query('DELETE FROM users WHERE id=?', [req.params.id]);
  res.json({ message: 'User deleted' });
});

// Stats
router.get('/stats', verifyToken, requireRole('admin', 'manager'), async (req, res) => {
  const [[{ totalUsers }]] = await db.query('SELECT COUNT(*) as totalUsers FROM users');
  const [[{ totalDocs }]] = await db.query('SELECT COUNT(*) as totalDocs FROM documents');
  const [roleStats] = await db.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
  res.json({ totalUsers, totalDocs, roleStats });
});

module.exports = router;