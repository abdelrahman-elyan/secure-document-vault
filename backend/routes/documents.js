const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');
const { encryptFile, decryptFile, generateHash, generateKeyPair, signData, verifySignature } = require('../utils/encryption');

const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('File type not allowed'));
  }
});

// Upload document
router.post('/upload', verifyToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const hash = generateHash(req.file.buffer);
    const { privateKey, publicKey } = generateKeyPair();
    const signature = signData(hash, privateKey);
    const { iv, encrypted } = encryptFile(req.file.buffer);

    const storedName = `${Date.now()}_${req.user.id}.enc`;
    const filePath = path.join(UPLOAD_DIR, storedName);
    fs.writeFileSync(filePath, JSON.stringify({ iv, data: encrypted.toString('base64') }));

    await db.query(
      'INSERT INTO documents (user_id, original_name, stored_name, file_type, file_size, sha256_hash, signature, public_key) VALUES (?,?,?,?,?,?,?,?)',
      [req.user.id, req.file.originalname, storedName, req.file.mimetype, req.file.size, hash, signature, publicKey]
    );

    res.status(201).json({ message: 'Document uploaded successfully', hash });
  } catch (err) {
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

// Get all documents for user (admin/manager see all)
router.get('/', verifyToken, async (req, res) => {
  try {
    let rows;
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      [rows] = await db.query(`
        SELECT d.*, u.username FROM documents d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.uploaded_at DESC
      `);
    } else {
      [rows] = await db.query('SELECT * FROM documents WHERE user_id=? ORDER BY uploaded_at DESC', [req.user.id]);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Download document
router.get('/download/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM documents WHERE id=?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Document not found' });
    const doc = rows[0];
    if (req.user.role === 'user' && doc.user_id !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });

    const filePath = path.join(UPLOAD_DIR, doc.stored_name);
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const decrypted = decryptFile(Buffer.from(fileData.data, 'base64'), fileData.iv);

    res.setHeader('Content-Disposition', `attachment; filename="${doc.original_name}"`);
    res.setHeader('Content-Type', doc.file_type);
    res.send(decrypted);
  } catch (err) {
    res.status(500).json({ message: 'Download failed', error: err.message });
  }
});

// Verify document integrity
router.post('/verify/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM documents WHERE id=?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Document not found' });
    const doc = rows[0];

    const filePath = path.join(UPLOAD_DIR, doc.stored_name);
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const decrypted = decryptFile(Buffer.from(fileData.data, 'base64'), fileData.iv);
    const currentHash = generateHash(decrypted);

    const hashMatch = currentHash === doc.sha256_hash;
    const signatureValid = verifySignature(doc.sha256_hash, doc.signature, doc.public_key);

    res.json({
      documentName: doc.original_name,
      originalHash: doc.sha256_hash,
      currentHash,
      hashMatch,
      signatureValid,
      integrityStatus: hashMatch && signatureValid ? 'VALID' : 'TAMPERED'
    });
  } catch (err) {
    res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

// Delete document
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM documents WHERE id=?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Not found' });
    const doc = rows[0];
    if (req.user.role === 'user' && doc.user_id !== req.user.id)
      return res.status(403).json({ message: 'Access denied' });

    const filePath = path.join(UPLOAD_DIR, doc.stored_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await db.query('DELETE FROM documents WHERE id=?', [req.params.id]);
    res.json({ message: 'Document deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
});

module.exports = router;