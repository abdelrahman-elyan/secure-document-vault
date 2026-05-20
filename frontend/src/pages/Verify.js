import React, { useState, useEffect } from 'react';
import API from '../api/axios';

const s = {
  page: { padding: '32px', maxWidth: '800px', margin: '0 auto' },
  h1: { fontSize: '26px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' },
  sub: { color: '#64748b', marginBottom: '28px', fontSize: '14px' },
  card: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  label: { color: '#475569', fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: { width: '100%', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px 16px', color: '#1e293b', fontSize: '14px', outline: 'none', marginBottom: '16px' },
  btn: { background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 28px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' },
  resultCard: (status) => ({ background: status === 'VALID' ? '#dcfce7' : '#fee2e2', border: `1px solid ${status === 'VALID' ? '#86efac' : '#fca5a5'}`, borderRadius: '12px', padding: '24px' }),
  statusBadge: (status) => ({ display: 'inline-block', padding: '6px 16px', borderRadius: '20px', fontWeight: '700', fontSize: '14px', background: status === 'VALID' ? '#16a34a' : '#dc2626', color: '#ffffff', marginBottom: '20px' }),
  row: { display: 'grid', gridTemplateColumns: '140px 1fr', gap: '8px', marginBottom: '12px', alignItems: 'start' },
  rowLabel: { color: '#475569', fontSize: '13px', fontWeight: '600', paddingTop: '2px' },
  rowVal: { color: '#1e293b', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all', fontWeight: '500' },
  check: (ok) => ({ color: ok ? '#16a34a' : '#dc2626', fontWeight: '700', fontSize: '13px' })
};

export default function Verify() {
  const [docs, setDocs] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { API.get('/documents').then(r => setDocs(r.data)).catch(() => {}); }, []);

  const verify = async () => {
    if (!selectedId) return;
    setLoading(true); setResult(null);
    try {
      const res = await API.post(`/documents/verify/${selectedId}`);
      setResult(res.data);
    } catch (err) {
      setResult({ error: err.response?.data?.message || 'Verification failed' });
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.h1}>🔍 Document Integrity Verification</div>
      <div style={s.sub}>Verify that a document has not been tampered with using SHA-256 hashing and digital signatures</div>

      <div style={s.card}>
        <label style={s.label}>Select Document to Verify</label>
        <select style={s.select} value={selectedId} onChange={e => { setSelectedId(e.target.value); setResult(null); }}>
          <option value="">— Choose a document —</option>
          {docs.map(d => <option key={d.id} value={d.id}>{d.original_name}</option>)}
        </select>
        <button style={s.btn} onClick={verify} disabled={loading || !selectedId}>
          {loading ? 'Verifying...' : '🔍 Verify Integrity'}
        </button>
      </div>

      {result && !result.error && (
        <div style={s.resultCard(result.integrityStatus)}>
          <div style={s.statusBadge(result.integrityStatus)}>
            {result.integrityStatus === 'VALID' ? '✅ DOCUMENT INTEGRITY VERIFIED' : '⚠️ DOCUMENT MAY BE TAMPERED'}
          </div>
          <div style={s.row}><span style={s.rowLabel}>Document</span><span style={s.rowVal}>{result.documentName}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Original Hash</span><span style={s.rowVal}>{result.originalHash}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Current Hash</span><span style={s.rowVal}>{result.currentHash}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Hash Match</span><span style={s.check(result.hashMatch)}>{result.hashMatch ? '✓ Hashes Match' : '✗ Hashes Do Not Match'}</span></div>
          <div style={s.row}><span style={s.rowLabel}>Signature</span><span style={s.check(result.signatureValid)}>{result.signatureValid ? '✓ Signature Valid' : '✗ Signature Invalid'}</span></div>
        </div>
      )}
      {result?.error && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '16px', color: '#dc2626', fontWeight: '500' }}>{result.error}</div>
      )}
    </div>
  );
}