'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/layout/TopNav';
import Badge from '@/components/ui/Badge';

const STATUS_LABEL = {
  processing: '🤖 Processing',
  review: '⚠️ Review',
  mismatch: '⚡ Mismatch',
  approved: '✅ Approved',
  rejected: '❌ Rejected',
};

function Sidebar({ role, reviewCount }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">Main</div>
      <Link href="/admin/dashboard" className="sidebar-item active">
        <span>📊</span> Dashboard
      </Link>
      <Link href="/admin/dashboard?filter=review" className="sidebar-item">
        <span>⚠️</span> Review Queue
        {reviewCount > 0 && <span className="count-badge">{reviewCount}</span>}
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
          <Link href="/admin/settings" className="sidebar-item">
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

export default function DashboardPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_session');
    if (!stored) {
      router.push('/admin/login');
      return;
    }
    const sess = JSON.parse(stored);
    setSession(sess);
    fetchApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchApps() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/applications');
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setApps(Array.isArray(data) ? data : data.applications || []);
    } catch {
      // leave empty
    } finally {
      setLoading(false);
    }
  }

  const stats = useMemo(() => {
    const total = apps.length;
    const needsReview = apps.filter((a) => a.status === 'review' || a.status === 'mismatch').length;
    const approved = apps.filter((a) => a.status === 'approved').length;
    const rejected = apps.filter((a) => a.status === 'rejected').length;
    return { total, needsReview, approved, rejected };
  }, [apps]);

  const reviewCount = stats.needsReview;

  const filtered = useMemo(() => {
    let list = apps;
    if (activeFilter !== 'all') {
      list = list.filter((a) => a.status === activeFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          (a.id || '').toLowerCase().includes(q) ||
          (a.applicantName || '').toLowerCase().includes(q) ||
          (a.email || '').toLowerCase().includes(q) ||
          (a.unit || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [apps, activeFilter, search]);

  const filters = ['all', 'review', 'mismatch', 'processing', 'approved', 'rejected'];

  if (!session) return null;

  return (
    <>
      <TopNav adminMode adminName={session.name} adminRole={session.role} />

      <div className="admin-layout">
        <Sidebar role={session.role} reviewCount={reviewCount} />

        <div className="sidebar-main">
          {/* AI badge */}
          <div className="ai-badge">
            <div className="ai-pulse" />
            AI SCREENING ACTIVE
          </div>

          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">
            Overview of all tenant applications and AI screening results.
          </p>

          {/* Stats */}
          <div className="stat-row">
            <div className="stat-box">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Total Applications</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: 'var(--accent)' }}>
                {stats.needsReview}
              </div>
              <div className="stat-label">Needs Review</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: 'var(--green)' }}>
                {stats.approved}
              </div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ color: 'var(--red)' }}>
                {stats.rejected}
              </div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="table-toolbar">
            <input
              type="text"
              className="search-input"
              placeholder="Search by ID, name, unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="filter-tabs">
              {filters.map((f) => (
                <button
                  key={f}
                  className={`filter-tab${activeFilter === f ? ' active' : ''}`}
                  onClick={() => setActiveFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <span className="spinner" />
              <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div
              style={{
                padding: 40,
                textAlign: 'center',
                border: '1px dashed var(--border)',
                fontSize: 11,
                color: 'var(--muted)',
              }}
            >
              No applications match your search or filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>App ID</th>
                    <th>Applicant</th>
                    <th>Unit</th>
                    <th>Rent</th>
                    <th>Credit</th>
                    <th>Income Ratio</th>
                    <th>Docs</th>
                    <th>AI Result</th>
                    <th>Decided By</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => {
                    const isActionable =
                      app.status === 'review' || app.status === 'mismatch';
                    return (
                      <tr key={app.id}>
                        <td>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 10,
                              color: 'var(--accent)',
                              letterSpacing: 1,
                            }}
                          >
                            {app.id}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 10 }}>
                            {app.applicantName || app.firstName + ' ' + app.lastName || '—'}
                          </div>
                          <div style={{ fontSize: 9, color: 'var(--muted)' }}>{app.email}</div>
                        </td>
                        <td style={{ fontSize: 10 }}>{app.unit || '—'}</td>
                        <td style={{ fontSize: 10 }}>
                          {app.monthlyRent
                            ? `₱${Number(app.monthlyRent).toLocaleString()}`
                            : '—'}
                        </td>
                        <td style={{ fontSize: 10 }}>
                          {app.creditScore ? (
                            <span
                              style={{
                                color:
                                  app.creditScore >= 680
                                    ? 'var(--green)'
                                    : app.creditScore >= 600
                                    ? 'var(--yellow)'
                                    : 'var(--red)',
                                fontWeight: 700,
                              }}
                            >
                              {app.creditScore}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ fontSize: 10 }}>
                          {app.incomeRatio ? (
                            <span
                              style={{
                                color:
                                  app.incomeRatio >= 2.5 ? 'var(--green)' : 'var(--red)',
                                fontWeight: 700,
                              }}
                            >
                              {Number(app.incomeRatio).toFixed(2)}×
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td style={{ fontSize: 10 }}>
                          {app.docsUploaded != null ? `${app.docsUploaded}/7` : '—'}
                        </td>
                        <td>
                          <Badge status={app.status} />
                        </td>
                        <td style={{ fontSize: 10, color: 'var(--muted)' }}>
                          {app.decidedBy || '—'}
                        </td>
                        <td>
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className={`btn sm${isActionable ? ' primary' : ' secondary'}`}
                          >
                            {isActionable ? 'Review →' : 'View'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
