import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const styles = {
  nav: {
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1d4ed8', // أزرق ملكي
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  links: { display: 'flex', gap: '8px', alignItems: 'center' },
  link: (active) => ({
    color: active ? '#1d4ed8' : '#64748b',
    textDecoration: 'none',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    background: active ? '#eff6ff' : 'transparent',
    border: active ? '1px solid #bfdbfe' : '1px solid transparent',
    transition: 'all 0.2s'
  }),
  right: { display: 'flex', alignItems: 'center', gap: '12px' },
  badge: (role) => ({
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase',
    background: role === 'admin' ? '#fee2e2' : role === 'manager' ? '#fef3c7' : '#dcfce7',
    color: role === 'admin' ? '#ef4444' : role === 'manager' ? '#d97706' : '#15803d',
    border: `1px solid ${role === 'admin' ? '#fca5a5' : role === 'manager' ? '#fcd34d' : '#86efac'}`
  }),
  logoutBtn: {
    background: '#fee2e2',
    color: '#ef4444',
    border: '1px solid #fca5a5',
    padding: '6px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.logo}>🔐 SecureVault</Link>
      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link(location.pathname === '/dashboard')}>Dashboard</Link>
        <Link to="/documents" style={styles.link(location.pathname === '/documents')}>Documents</Link>
        <Link to="/verify" style={styles.link(location.pathname === '/verify')}>Verify</Link>
        <Link to="/settings" style={styles.link(location.pathname === '/settings')}>Settings</Link>
        {user?.role === 'admin' && (
          <Link to="/admin" style={styles.link(location.pathname === '/admin')}>Admin Panel</Link>
        )}
      </div>
      <div style={styles.right}>
        <span style={{ color: '#475569', fontSize: '14px', fontWeight: '500' }}>{user?.username}</span>
        <span style={styles.badge(user?.role)}>{user?.role}</span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </div>
    </nav>
  );
}