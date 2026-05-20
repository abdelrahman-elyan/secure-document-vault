import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const s = {
  page: { padding: '32px', maxWidth: '700px', margin: '0 auto' },
  h1: { fontSize: '26px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '28px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  info: { background: '#f8fafc', borderRadius: '8px', padding: '14px', border: '1px solid #e2e8f0' },
  infoRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0', fontSize: '14px' },
  badgeActive: { background: '#16a34a', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  badgeOff: { background: '#ef4444', color: '#fff', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: '12px', padding: '20px', color: '#15803d', fontSize: '14px', lineHeight: '1.6', fontWeight: '500' },
  warn: { background: '#fef9c3', border: '1px solid #fde047', borderRadius: '12px', padding: '20px', color: '#854d0e', fontSize: '14px', lineHeight: '1.6' },
  btn: { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
  btnRed: { background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
  btnGreen: { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '16px' },
  input: { width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', color: '#1e293b', fontSize: '15px', outline: 'none', marginTop: '12px', boxSizing: 'border-box' },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#ef4444', fontSize: '13px', marginTop: '12px' },
  succ: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', color: '#15803d', fontSize: '13px', marginTop: '12px' },
  qrWrap: { textAlign: 'center', margin: '16px 0' },
  label: { display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginTop: '16px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  step: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '14px 16px', marginBottom: '10px', fontSize: '14px', color: '#1e40af' }
};

export default function Settings() {
  const { user, login } = useAuth();

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Setup flow
  const [step, setStep] = useState('idle'); // idle | setup | verify
  const [qrCode, setQrCode] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' }); // type: err | ok
  const [loading, setLoading] = useState(false);

  // ── Fetch real 2FA status from DB ─────────────────────────────────
  useEffect(() => {
    API.get('/auth/me')
      .then(res => {
        setTwoFAEnabled(!!res.data.two_factor_enabled);
        setLoadingStatus(false);
      })
      .catch(() => setLoadingStatus(false));
  }, []);

  // ── Step 1: Generate QR Code ───────────────────────────────────────
  const handleSetup = async () => {
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      const res = await API.post('/auth/2fa/setup');
      setQrCode(res.data.qrCode);
      setStep('verify');
      setOtpCode('');
    } catch {
      setMsg({ text: 'Failed to generate QR code. Try again.', type: 'err' });
    } finally { setLoading(false); }
  };

  // ── Step 2: Verify OTP and Enable ─────────────────────────────────
  const handleEnable = async () => {
    if (otpCode.length !== 6) {
      setMsg({ text: 'Please enter the 6-digit code from your app.', type: 'err' });
      return;
    }
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      await API.post('/auth/2fa/enable', { token: otpCode });
      setTwoFAEnabled(true);
      setStep('idle');
      setQrCode('');
      setOtpCode('');
      setMsg({ text: '✅ 2FA enabled successfully! Your account is now secured.', type: 'ok' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Invalid code. Check your app and try again.', type: 'err' });
    } finally { setLoading(false); }
  };

  // ── Disable 2FA ───────────────────────────────────────────────────
  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) return;
    setMsg({ text: '', type: '' });
    setLoading(true);
    try {
      await API.post('/auth/2fa/disable');
      setTwoFAEnabled(false);
      setStep('idle');
      setMsg({ text: '2FA has been disabled.', type: 'ok' });
    } catch {
      setMsg({ text: 'Failed to disable 2FA.', type: 'err' });
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.h1}>⚙️ Settings</div>

      {/* Account Info */}
      <div style={s.card}>
        <div style={s.cardTitle}>Account Information</div>
        <div style={s.info}>
          <div style={s.infoRow}>
            <span style={{ color: '#64748b' }}>Username</span>
            <span style={{ color: '#1e293b', fontWeight: '500' }}>{user?.username}</span>
          </div>
          <div style={s.infoRow}>
            <span style={{ color: '#64748b' }}>Email</span>
            <span style={{ color: '#1e293b' }}>{user?.email}</span>
          </div>
          <div style={{ ...s.infoRow, borderBottom: 'none' }}>
            <span style={{ color: '#64748b' }}>Role</span>
            <span style={{ color: '#1d4ed8', fontWeight: '600', textTransform: 'uppercase' }}>{user?.role}</span>
          </div>
        </div>
      </div>

      {/* 2FA Management */}
      <div style={s.card}>
        <div style={s.cardTitle}>
          <span>📱 Two-Factor Authentication (2FA)</span>
          {loadingStatus ? null : (
            twoFAEnabled
              ? <span style={s.badgeActive}>ACTIVE ✓</span>
              : <span style={s.badgeOff}>DISABLED</span>
          )}
        </div>

        {/* Message */}
        {msg.text && (
          <div style={msg.type === 'ok' ? s.succ : s.err}>{msg.text}</div>
        )}

        {/* ── Status: Enabled ── */}
        {twoFAEnabled && step === 'idle' && (
          <>
            <div style={s.ok}>
              <div style={{ fontSize: '17px', fontWeight: '700', marginBottom: '6px' }}>
                🔒 Two-Factor Authentication is Enabled
              </div>
              Your account is protected with TOTP. Every login requires a 6-digit code from your authenticator app.
            </div>
            <button style={s.btnRed} onClick={handleDisable} disabled={loading}>
              {loading ? 'Disabling...' : '🔓 Disable 2FA'}
            </button>
          </>
        )}

        {/* ── Status: Disabled ── */}
        {!twoFAEnabled && step === 'idle' && (
          <>
            <div style={s.warn}>
              ⚠️ Two-Factor Authentication is <strong>not enabled</strong>. Enable it now to protect your account.
            </div>
            <button style={s.btnGreen} onClick={handleSetup} disabled={loading}>
              {loading ? 'Generating QR...' : '🛡️ Enable 2FA Now'}
            </button>
          </>
        )}

        {/* ── Setup Flow: Show QR ── */}
        {step === 'verify' && (
          <>
            <div style={s.step}>📥 <strong>Step 1:</strong> Download <strong>Google Authenticator</strong> or <strong>Authy</strong> on your phone.</div>
            <div style={s.step}>📷 <strong>Step 2:</strong> Open the app → tap <strong>+</strong> → <strong>Scan QR Code</strong></div>
            <div style={s.step}>✏️ <strong>Step 3:</strong> Enter the 6-digit code shown in the app below</div>

            {qrCode && (
              <div style={s.qrWrap}>
                <img
                  src={qrCode}
                  alt="2FA QR Code"
                  style={{ width: '180px', height: '180px', border: '2px solid #cbd5e1', borderRadius: '12px', padding: '8px', background: '#fff' }}
                />
              </div>
            )}

            <label style={s.label}>6-Digit Code from Authenticator App</label>
            <input
              style={s.input}
              placeholder="000000"
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleEnable()}
              autoFocus
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={s.btnGreen} onClick={handleEnable} disabled={loading}>
                {loading ? 'Activating...' : '✅ Activate 2FA'}
              </button>
              <button
                style={{ ...s.btn, background: '#94a3b8', marginTop: '16px' }}
                onClick={() => { setStep('idle'); setMsg({ text: '', type: '' }); }}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
