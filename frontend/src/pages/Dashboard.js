import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

const s = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  welcome: { marginBottom: '32px' },
  h1: { fontSize: '28px', fontWeight: '700', color: '#1e293b', marginBottom: '6px' },
  sub: { color: '#64748b', fontSize: '15px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '32px' },
  card: (color) => ({ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', borderLeft: `4px solid ${color}`, boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }),
  cardNum: { fontSize: '36px', fontWeight: '800', marginBottom: '4px' },
  cardLabel: { color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' },
  section: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px' },
  quickBtn: (color) => ({ display: 'inline-flex', alignItems: 'center', gap: '8px', background: `${color}10`, color: color, border: `1px solid ${color}30`, borderRadius: '8px', padding: '10px 18px', textDecoration: 'none', fontSize: '14px', fontWeight: '600', marginRight: '12px', marginBottom: '8px', transition: 'all 0.2s' }),
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  feature: { background: '#f8fafc', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' },
  featureIcon: { fontSize: '20px' },
  featureName: { fontSize: '14px', color: '#475569', fontWeight: '600' }
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    API.get('/documents').then(res => setDocs(res.data)).catch(() => {});
    if (user?.role === 'admin' || user?.role === 'manager') {
      API.get('/admin/stats').then(res => setStats(res.data)).catch(() => {});
    }
  }, [user]);

  return (
    <div style={s.page}>
      <div style={s.welcome}>
        <div style={s.h1}>Welcome back, {user?.username} 👋</div>
        <div style={s.sub}>Manage your secure documents and cryptographic operations</div>
      </div>

      <div style={s.grid}>
        <div style={s.card('#3b82f6')}>
          <div style={{ ...s.cardNum, color: '#2563eb' }}>{docs.length}</div>
          <div style={s.cardLabel}>My Documents</div>
        </div>
        {stats && <>
          <div style={s.card('#10b981')}>
            <div style={{ ...s.cardNum, color: '#059669' }}>{stats.totalUsers}</div>
            <div style={s.cardLabel}>Total Users</div>
          </div>
          <div style={s.card('#f59e0b')}>
            <div style={{ ...s.cardNum, color: '#d97706' }}>{stats.totalDocs}</div>
            <div style={s.cardLabel}>All Documents</div>
          </div>
        </>}
        <div style={s.card('#8b5cf6')}>
          <div style={{ ...s.cardNum, color: '#7c3aed', fontSize: '20px', paddingTop: '12px' }}>{user?.role?.toUpperCase()}</div>
          <div style={s.cardLabel}>Your Role</div>
        </div>
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Quick Actions</div>
        <Link to="/documents" style={s.quickBtn('#2563eb')}>📤 Upload Document</Link>
        <Link to="/documents" style={s.quickBtn('#059669')}>📁 My Documents</Link>
        <Link to="/verify" style={s.quickBtn('#d97706')}>🔍 Verify Integrity</Link>
        <Link to="/settings" style={s.quickBtn('#7c3aed')}>⚙️ Settings & 2FA</Link>
        {user?.role === 'admin' && <Link to="/admin" style={s.quickBtn('#dc2626')}>👥 Admin Panel</Link>}
      </div>

      <div style={s.section}>
        <div style={s.sectionTitle}>Security Features Active</div>
        <div style={s.featureGrid}>
          {[['🔐','JWT Auth'],['🔑','Bcrypt Hashing'],['📋','RBAC'],['🔒','AES-256 Encryption'],['✍️','Digital Signatures'],['#️⃣','SHA-256 Hashing'],['📱','2FA Support'],['🌐','HTTPS']].map(([icon, name]) => (
            <div key={name} style={s.feature}>
              <div style={s.featureIcon}>{icon}</div>
              <div style={s.featureName}>{name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}