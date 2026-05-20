import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' },
  card: { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  title: { fontSize: '26px', fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: '6px' },
  sub: { color: '#64748b', textAlign: 'center', marginBottom: '28px', fontSize: '14px' },
  label: { display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', color: '#1e293b', fontSize: '15px', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' },
  btn: { width: '100%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#94a3b8', fontSize: '16px' }
};

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [show2FA, setShow2FA]   = useState(false);
  const [otp, setOtp]           = useState('');
  const [userId, setUserId]     = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const token             = params.get('token');
    const requiresTwoFactor = params.get('requiresTwoFactor');
    const uId               = params.get('userId');

    if (requiresTwoFactor === 'true' && uId) {
      // OAuth user has 2FA enabled → show OTP screen
      setUserId(uId);
      setShow2FA(true);
    } else if (token) {
      // No 2FA → direct login
      localStorage.setItem('token', token);
      API.get('/auth/me')
        .then(res => { login(token, res.data); navigate('/dashboard'); })
        .catch(() => navigate('/login'));
    } else {
      navigate('/login?error=oauth');
    }
  }, []); // eslint-disable-line

  // FIX: use /2fa/verify-login with userId (not tempToken)
  const handle2FA = async () => {
    setError(''); setLoading(true);
    try {
      const res = await API.post('/auth/2fa/verify-login', { userId, token: otp });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch {
      setError('Invalid code. Please check your authenticator app and try again.');
    } finally { setLoading(false); }
  };

  if (show2FA) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>📱 Two-Factor Auth</div>
        <div style={s.sub}>
          OAuth login detected 2FA on your account.<br />
          Enter the 6-digit code from your authenticator app.
        </div>
        {error && <div style={s.err}>{error}</div>}
        <label style={s.label}>Authentication Code</label>
        <input
          style={s.input}
          placeholder="000000"
          maxLength={6}
          value={otp}
          onChange={e => setOtp(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handle2FA()}
          autoFocus
        />
        <button style={s.btn} onClick={handle2FA} disabled={loading}>
          {loading ? 'Verifying...' : 'VERIFY & ENTER'}
        </button>
      </div>
    </div>
  );

  return <div style={s.loading}>🔐 Authenticating...</div>;
}
