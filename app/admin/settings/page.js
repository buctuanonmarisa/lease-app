'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/layout/TopNav';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';
import { ToastContainer, useToast } from '@/components/ui/Toast';

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function Sidebar({ role }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">Main</div>
      <Link href="/admin/dashboard" className="sidebar-item">
        <span>📊</span> Dashboard
      </Link>
      <Link href="/admin/dashboard?filter=review" className="sidebar-item">
        <span>⚠️</span> Review Queue
      </Link>
      <Link href="/admin/analytics" className="sidebar-item">
        <span>📈</span> Analytics
      </Link>
      <Link href="/admin/dashboard?filter=approved" className="sidebar-item">
        <span>✅</span> Approved
      </Link>
      <Link href="/admin/dashboard?filter=rejected" className="sidebar-item">
        <span>❌</span> Rejected
      </Link>
      {role === 'superadmin' && (
        <>
          <div className="sidebar-section">Admin</div>
          <Link href="/admin/settings" className="sidebar-item active">
            <span>👥</span> Manage Admins
          </Link>
          <Link href="/admin/settings#audit" className="sidebar-item">
            <span>📋</span> Audit Log
          </Link>
        </>
      )}
    </div>
  );
}

// ─── Add Admin Modal ──────────────────────────────────────────────────────────
function AddAdminModal({ onClose, onAdd }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await onAdd(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add admin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Add Sub-Admin</div>

        {error && (
          <Alert type="error" title="Error">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="e.g. Maria Santos"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="maria@leaseflow.ph"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select
              name="role"
              className="form-select"
              value={form.role}
              onChange={handleChange}
            >
              <option value="admin">Admin (Sub-Admin)</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn secondary sm"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn primary sm" disabled={loading}>
              {loading ? 'Adding...' : 'Add Admin →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [session, setSession] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_session');
    if (!stored) { router.push('/admin/login'); return; }
    const sess = JSON.parse(stored);
    setSession(sess);
    if (sess.role === 'superadmin') {
      fetchAdmins();
      fetchAuditLog();
    } else {
      setLoadingAdmins(false);
      setLoadingAudit(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAdmins() {
    setLoadingAdmins(true);
    try {
      const res = await fetch('/api/admin/admins');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : data.admins || []);
    } catch {
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  }

  async function fetchAuditLog() {
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/admin/applications');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const apps = Array.isArray(data) ? data : data.applications || [];
      // Build audit entries from decided apps
      const entries = apps
        .filter((a) => a.decidedBy)
        .map((a) => ({
          id: a.id,
          applicant: a.applicantName || `${a.firstName || ''} ${a.lastName || ''}`.trim(),
          decision: a.status,
          decidedBy: a.decidedBy,
          date: a.decidedAt,
          notes: a.decisionNotes || '—',
        }));
      setAuditLog(entries);
    } catch {
      setAuditLog([]);
    } finally {
      setLoadingAudit(false);
    }
  }

  async function handleAddAdmin(form) {
    const res = await fetch('/api/admin/admins', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to add admin');
    }
    showToast(`Admin ${form.name} added successfully.`, 'success');
    fetchAdmins();
  }

  async function handleRemoveAdmin(adminId, adminName) {
    if (!confirm(`Remove admin "${adminName}"? This action cannot be undone.`)) return;
    setRemovingId(adminId);
    try {
      const res = await fetch(`/api/admin/admins/${adminId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove');
      showToast(`Admin ${adminName} removed.`, 'success');
      fetchAdmins();
    } catch (err) {
      showToast(err.message || 'Failed to remove admin.', 'error');
    } finally {
      setRemovingId(null);
    }
  }

  // Avatar color from name
  function avatarColor(name) {
    const colors = ['#1d4ed8', '#065f46', '#6d28d9', '#991b1b', '#92400e', '#0e7490'];
    let h = 0;
    for (let i = 0; i < (name || '').length; i++) h = name.charCodeAt(i) + h * 31;
    return colors[Math.abs(h) % colors.length];
  }

  function initials(name) {
    return (name || 'A')
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  if (!session) return null;

  // Access denied for non-superadmin
  if (session.role !== 'superadmin') {
    return (
      <>
        <TopNav adminMode adminName={session.name} adminRole={session.role} />
        <div className="admin-layout">
          <Sidebar role={session.role} />
          <div className="sidebar-main">
            <Alert type="error" title="Access Denied">
              You do not have permission to access this page. Only Super Admins can manage admin
              users.
            </Alert>
            <Link href="/admin/dashboard" className="btn secondary sm">
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <TopNav adminMode adminName={session.name} adminRole={session.role} />
      <ToastContainer />

      {showAddModal && (
        <AddAdminModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddAdmin}
        />
      )}

      <div className="admin-layout">
        <Sidebar role={session.role} />

        <div className="sidebar-main">
          {/* ─ Admin Management ─ */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <div>
              <h1 className="page-title" style={{ marginBottom: 4 }}>
                Manage Admins
              </h1>
              <p className="page-sub" style={{ marginBottom: 0 }}>
                Add, edit, or remove admin users for the LeaseFlow system.
              </p>
            </div>
            <button
              className="btn primary sm"
              onClick={() => setShowAddModal(true)}
            >
              + Add Sub-Admin
            </button>
          </div>

          {loadingAdmins ? (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <span className="spinner" />
            </div>
          ) : admins.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                border: '1px dashed var(--border)',
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              No admins found.
            </div>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="admin-user-row">
                {/* Avatar */}
                <div
                  className="admin-avatar"
                  style={{ background: admin.color || avatarColor(admin.name) }}
                >
                  {admin.initials || initials(admin.name)}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{admin.name}</div>
                  <div style={{ fontSize: 9, color: 'var(--muted)' }}>{admin.email}</div>
                </div>

                <span
                  className={`nav-badge${admin.role === 'superadmin' ? ' superadmin' : ''}`}
                  style={{ fontSize: 9, padding: '3px 8px' }}
                >
                  {admin.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                </span>

                <div style={{ display: 'flex', gap: 6, marginLeft: 10 }}>
                  <button className="btn secondary sm">Edit</button>
                  <button
                    className="btn danger sm"
                    disabled={removingId === admin.id}
                    onClick={() => handleRemoveAdmin(admin.id, admin.name)}
                  >
                    {removingId === admin.id ? '...' : 'Remove'}
                  </button>
                </div>
              </div>
            ))
          )}

          <hr className="divider" id="audit" />

          {/* ─ Audit Log ─ */}
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Audit Log
          </h2>
          <p className="page-sub" style={{ marginBottom: 14 }}>
            Record of all application decisions made by admin users.
          </p>

          {loadingAudit ? (
            <div style={{ textAlign: 'center', padding: 30 }}>
              <span className="spinner" />
            </div>
          ) : auditLog.length === 0 ? (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                border: '1px dashed var(--border)',
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              No decisions recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Applicant</th>
                    <th>Decision</th>
                    <th>Decided By</th>
                    <th>Date</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLog.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <Link
                          href={`/admin/applications/${entry.id}`}
                          style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: 1 }}
                        >
                          {entry.id}
                        </Link>
                      </td>
                      <td style={{ fontSize: 10 }}>{entry.applicant || '—'}</td>
                      <td>
                        <Badge status={entry.decision} />
                      </td>
                      <td style={{ fontSize: 10 }}>{entry.decidedBy || '—'}</td>
                      <td style={{ fontSize: 10, color: 'var(--muted)' }}>
                        {entry.date
                          ? new Date(entry.date).toLocaleDateString('en-PH', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td
                        style={{
                          fontSize: 9,
                          color: 'var(--muted)',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={entry.notes}
                      >
                        {entry.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
