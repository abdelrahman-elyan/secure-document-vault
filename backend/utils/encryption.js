const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').slice(0, 32);

const encryptFile = (buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv: iv.toString('hex'), encrypted };
};

const decryptFile = (encryptedBuffer, ivHex) => {
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

const generateHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

const generateKeyPair = () => {
  return crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
  });
};

const signData = (data, privateKey) => {
  const sign = crypto.createSign('SHA256');
  sign.update(data);
  return sign.sign(privateKey, 'base64');
};

const verifySignature = (data, signature, publicKey) => {
  try {
    const verify = crypto.createVerify('SHA256');
    verify.update(data);
    return verify.verify(publicKey, signature, 'base64');
  } catch { return false; }
};

module.exports = { encryptFile, decryptFile, generateHash, generateKeyPair, signData, verifySignature };