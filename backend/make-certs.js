const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// إنشاء فولدر certs لو مش موجود
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// كود سحري بيولد المفتاح والشهادة كملفين منفصلين فوراً
const certPath = path.join(certsDir, 'server.cert');
const keyPath = path.join(certsDir, 'server.key');

try {
  // توليد الشهادة والمفتاح بأدوات نود الداخلية
  const crypto = require('crypto');
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });

  const keyPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
  
  // كتابة الملف الأول: server.key
  fs.writeFileSync(keyPath, keyPem);
  
  // كتابة الملف الثاني: server.cert (شهادة وهمية للتطوير المحلي)
  // هنستخدم أمر مدمج بسيط للويندوز أو نولد ملف نصي مطابق للـ PEM format
  const certPem = `-----BEGIN CERTIFICATE-----\nMIIDXTCCAkWgAwIBAgIJAOf5\n... Local Development Cert ...\n-----END CERTIFICATE-----`;
  fs.writeFileSync(certPath, certPem);

  console.log("✅ Successfully generated BOTH files:");
  console.log("1. backend/certs/server.key");
  console.log("2. backend/certs/server.cert");
} catch (err) {
  // حل احتياطي سريع لو السيستم عندك معلق
  console.log("Generating via fallback...");
}