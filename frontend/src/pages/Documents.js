import React, { useState, useEffect, useRef } from 'react';
import API from '../api/axios';

const s = {
  page: { padding: '32px', maxWidth: '1200px', margin: '0 auto' },
  h1: { fontSize: '26px', fontWeight: '700', color: '#1e293b', marginBottom: '24px' },
  uploadBox: { background: '#ffffff', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '24px', cursor: 'pointer', transition: 'all 0.2s' },
  uploadText: { color: '#64748b', fontSize: '14px', marginTop: '8px' },
  btn: (color, bg) => ({ background: bg, color: color, border: `1px solid ${color}30`, borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }),
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { background: '#f8fafc', color: '#475569', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' },
  td: { padding: '16px', borderBottom: '1px solid #e2e8f0', color: '#334155', fontSize: '14px', verticalAlign: 'middle' },
  section: { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  badge: { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: '600' },
  err: { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px', color: '#ef4444', fontSize: '13px', marginBottom: '16px' },
  ok: { background: '#dcfce7', border: '1px solid #86efac', borderRadius: '8px', padding: '12px', color: '#15803d', fontSize: '13px', marginBottom: '16px' },
};

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const fetchDocs = () => API.get('/documents').then(res => setDocs(res.data)).catch(() => {});
  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async (file) => {
    if (!file) return;
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { setMessage({ text: 'File too large (max 10MB)', type: 'err' }); return; }
    setUploading(true); setMessage({ text: '', type: '' });
    const formData = new FormData();
    formData.append('document', file);
    try {
      const res = await API.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage({ text: `✓ Uploaded! SHA-256: ${res.data.hash}`, type: 'ok' });
      fetchDocs();
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Upload failed', type: 'err' });
    } finally { setUploading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await API.delete(`/documents/${id}`);
      setMessage({ text: 'Document deleted', type: 'ok' });
      fetchDocs();
    } catch { setMessage({ text: 'Delete failed', type: 'err' }); }
  };

  const handleDownload = async (id, name) => {
    try {
      const res = await API.get(`/documents/download/${id}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = name; a.click();
      URL.revokeObjectURL(url);
    } catch { setMessage({ text: 'Download failed', type: 'err' }); }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div style={s.page}>
      <div style={s.h1}>📁 Document Manager</div>
      {message.text && <div style={message.type === 'ok' ? s.ok : s.err}>{message.text}</div>}

      <div style={{ ...s.uploadBox, borderColor: dragging ? '#2563eb' : '#cbd5e1', background: dragging ? '#eff6ff' : '#ffffff' }}
        onClick={() => fileRef.current.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files[0]); }}>
        <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg" onChange={e => handleUpload(e.target.files[0])} />
        <div style={{ fontSize: '40px' }}>📤</div>
        <div style={{ color: '#2563eb', fontWeight: '700', marginTop: '8px' }}>{uploading ? 'Encrypting & Uploading...' : 'Click or drag to upload'}</div>
        <div style={s.uploadText}>PDF, DOC, DOCX, TXT, PNG, JPG — Max 10MB</div>
        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '8px', fontWeight: '500' }}>🔒 Files are encrypted with AES-256 before storage</div>
      </div>

      <div style={s.section}>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Document</th>
              <th style={s.th}>Size</th>
              <th style={s.th}>SHA-256 Hash</th>
              <th style={s.th}>Uploaded</th>
              <th style={s.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={5} style={{ ...s.td, textAlign: 'center', color: '#64748b', padding: '40px' }}>No documents yet. Upload your first document above.</td></tr>
            ) : docs.map(doc => (
              <tr key={doc.id}>
                <td style={s.td}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>{doc.original_name}</div>
                  <div style={{ marginTop: '4px' }}><span style={s.badge}>🔒 Encrypted</span></div>
                  {doc.username && <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', fontWeight: '500' }}>by {doc.username}</div>}
                </td>
                <td style={{ ...s.td, color: '#475569', fontWeight: '500' }}>{formatSize(doc.file_size)}</td>
                <td style={{ ...s.td, fontFamily: 'monospace', fontSize: '11px', color: '#64748b', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.sha256_hash}</td>
                <td style={{ ...s.td, color: '#64748b', fontSize: '13px' }}>{new Date(doc.uploaded_at).toLocaleDateString()}</td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button style={s.btn('#2563eb', '#eff6ff')} onClick={() => handleDownload(doc.id, doc.original_name)}>⬇ Download</button>
                    <button style={s.btn('#dc2626', '#fee2e2')} onClick={() => handleDelete(doc.id)}>🗑 Delete</button>
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