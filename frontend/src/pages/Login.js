import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const s = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' },
  title: { fontSize: '28px', fontWeight: '700', color: '#1e293b', textAlign: 'center', marginBottom: '4px' },
  sub: { color: '#64748b', textAlign: 'center', marginBottom: '28px', fontSize: '14px' },
  label: { display: 'block', color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  input: { width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', color: '#1e293b', fontSize: '15px', outline: 'none', marginBottom: '20px', boxSizing: 'border-box' },
  btn: { width: '100%', background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '13px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginBottom: '4px' },
  oauthBtn: (borderColor, textColor) => ({
    width: '100%',
    background: '#ffffff',
    color: textColor,
    border: `1px solid ${borderColor}`,
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '13px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    cursor: 'pointer',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
  }),
  logoIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px' },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' },
  divider: { display: 'flex', alignItems: 'center', textAlign: 'center', color: '#94a3b8', margin: '24px 0', fontSize: '12px', fontWeight: '500' },
  dividerLine: { content: '""', flex: 1, borderBottom: '1px solid #e2e8f0' },
  link: { color: '#1d4ed8', textDecoration: 'none', fontWeight: '500' }
};

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [twoFA, setTwoFA] = useState({ show: false, userId: null, token: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await API.post('/auth/login', form);
      if (res.data.requiresTwoFactor) {
        setTwoFA({ show: true, userId: res.data.userId, token: '' });
      } else {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  const handle2FA = async () => {
    setError(''); setLoading(true);
    try {
      const res = await API.post('/auth/2fa/verify-login', { userId: twoFA.userId, token: twoFA.token });
      login(res.data.token, res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid 2FA code. Please enter the current code from your App.');
    } finally { setLoading(false); }
  };

  if (twoFA.show) return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>📱 Two-Factor Auth</div>
        <div style={s.sub}>Enter the 6-digit code from your authenticator app</div>
        {error && <div style={s.err}>{error}</div>}
        <label style={s.label}>Authentication Code</label>
        <input style={s.input} placeholder="000000" maxLength={6} value={twoFA.token}
          onChange={e => setTwoFA({ ...twoFA, token: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handle2FA()} />
        <button style={s.btn} onClick={handle2FA} disabled={loading}>{loading ? 'Verifying...' : 'VERIFY & ENTER'}</button>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.title}>🔐 SecureVault</div>
        <div style={s.sub}>Sign in to your secure document vault</div>
        {error && <div style={s.err}>{error}</div>}

        <label style={s.label}>Email</label>
        <input style={s.input} type="email" placeholder="Enter your email" value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })} />

        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="Enter your password" value={form.password}
          onChange={e => setForm({ ...form, password: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()} />

        <button style={s.btn} onClick={handleSubmit}>{loading ? 'Signing in...' : 'LOGIN'}</button>

        <div style={s.divider}>
          <div style={s.dividerLine}></div>
          <span style={{ padding: '0 10px' }}>or continue with</span>
          <div style={s.dividerLine}></div>
        </div>

        {/* Google - real backend */}
        <button style={s.oauthBtn('#e2e8f0', '#334155')} onClick={() => window.location.href = 'https://localhost:5000/api/auth/google'}>
          <div style={s.logoIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          </div>
          CONTINUE WITH GOOGLE
        </button>

        {/* GitHub - real backend */}
        <button style={s.oauthBtn('#e2e8f0', '#334155')} onClick={() => window.location.href = 'https://localhost:5000/api/auth/github'}>
          <div style={s.logoIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#24292e"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
          </div>
          CONTINUE WITH GITHUB
        </button>

        <div style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
          Don't have an account? <Link to="/register" style={s.link}>Create new account</Link>
        </div>
      </div>
    </div>
  );
}
