import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const s = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  h1: { fontSize: '26px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
  sub: { color: '#64748b', marginBottom: '28px', fontSize: '14px' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' },
  stat: (color) => ({ background: '#ffffff', border: '1px solid #e2e8f0', borderLeft: `4px solid ${color}`, borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' }),
  statNum: { fontSize: '32px', fontWeight: '800' },
  statLabel: { color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px', fontWeight: '600' },
  section: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.01)' },
  sectionHeader: { padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '16px', fontWeight: '600', color: '#1e293b' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', color: '#475569', padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: '14px' },
  roleBadge: (role) => ({ display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', background: role === 'admin' ? '#fee2e2' : role === 'manager' ? '#fef3c7' : '#dcfce7', color: role === 'admin' ? '#ef4444' : role === 'manager' ? '#d97706' : '#15803d' }),
  select: { background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '5px 10px', color: '#1e293b', fontSize: '13px', cursor: 'pointer' },
  delBtn: { background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', padding: '5px 12px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '10px 14px', color: '#15803d', fontSize: '13px', marginBottom: '16px' }
};

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [msg, setMsg] = useState('');

  const fetchAll = () => {
    API.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
    API.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  };
  useEffect(() => { fetchAll(); }, []);

  const updateRole = async (id, role) => {
    try {
      await API.put(`/admin/users/${id}/role`, { role });
      setMsg(`Role updated successfully`);
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to update role'); }
  };

  const deleteUser = async (id, username) => {
    if (!window.confirm(`Delete user "${username}"? This will also delete all their documents.`)) return;
    try {
      await API.delete(`/admin/users/${id}`);
      setMsg(`User "${username}" deleted`);
      fetchAll();
      setTimeout(() => setMsg(''), 3000);
    } catch { setMsg('Failed to delete user'); }
  };

  return (
    <div style={s.page}>
      <div style={s.h1}>👥 Admin Panel</div>
      <div style={s.sub}>Manage users, roles, and system overview</div>
      {msg && <div style={s.ok}>{msg}</div>}

      {stats && (
        <div style={s.statsGrid}>
          <div style={s.stat('#3b82f6')}><div style={{ ...s.statNum, color: '#2563eb' }}>{stats.totalUsers}</div><div style={s.statLabel}>Total Users</div></div>
          <div style={s.stat('#10b981')}><div style={{ ...s.statNum, color: '#059669' }}>{stats.totalDocs}</div><div style={s.statLabel}>Total Documents</div></div>
          {stats.roleStats.map(r => (
            <div key={r.role} style={s.stat('#8b5cf6')}><div style={{ ...s.statNum, color: '#7c3aed' }}>{r.count}</div><div style={s.statLabel}>{r.role}s</div></div>
          ))}
        </div>
      )}

      <div style={s.section}>
        <div style={s.sectionHeader}>
          <div style={s.sectionTitle}>User Management</div>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>{users.length} total users</div>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>User</th>
              <th style={s.th}>Email</th>
              <th style={s.th}>Role</th>
              <th style={s.th}>2FA</th>
              <th style={s.th}>Joined</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={s.td}><div style={{ fontWeight: '600', color: '#1e293b' }}>{u.username}</div><div style={{ color: '#64748b', fontSize: '12px' }}>ID: {u.id}</div></td>
                <td style={{ ...s.td, color: '#475569', fontWeight: '500' }}>{u.email}</td>
                <td style={s.td}><span style={s.roleBadge(u.role)}>{u.role}</span></td>
                <td style={s.td}><span style={{ color: u.two_factor_enabled ? '#16a34a' : '#64748b', fontSize: '13px', fontWeight: '600' }}>{u.two_factor_enabled ? '✓ ON' : '✗ OFF'}</span></td>
                <td style={{ ...s.td, color: '#64748b', fontSize: '12px' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select style={s.select} value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button style={s.delBtn} onClick={() => deleteUser(u.id, u.username)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}