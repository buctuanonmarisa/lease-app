'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/layout/TopNav';
import Badge from '@/components/ui/Badge';
import StatCard from '@/components/ui/StatCard';

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

    // Avg days from submission to decision (only decided apps)
    const decided = apps.filter((a) => a.decidedAt);
    const avgDays =
      decided.length > 0
        ? decided.reduce((sum, a) => {
            const ms = new Date(a.decidedAt) - new Date(a.submittedAt);
            return sum + ms / (1000 * 60 * 60 * 24);
          }, 0) / decided.length
        : null;

    // Approval rate among decided apps
    const approvalRate =
      approved + rejected > 0
        ? Math.round((approved / (approved + rejected)) * 100)
        : null;

    // Most applied-for unit
    const unitCounts = {};
    apps.forEach((a) => {
      if (a.unit) unitCounts[a.unit] = (unitCounts[a.unit] || 0) + 1;
    });
    const topUnit = Object.entries(unitCounts).sort((a, b) => b[1] - a[1])[0] ?? null;

    // Most popular rent range
    const rentBuckets = { '₱0–10k': 0, '₱10–15k': 0, '₱15–20k': 0, '₱20k+': 0 };
    apps.forEach((a) => {
      const r = a.monthlyRent;
      if (!r) return;
      if (r < 10000) rentBuckets['₱0–10k']++;
      else if (r < 15000) rentBuckets['₱10–15k']++;
      else if (r < 20000) rentBuckets['₱15–20k']++;
      else rentBuckets['₱20k+']++;
    });
    const topRent = Object.entries(rentBuckets).sort((a, b) => b[1] - a[1])[0] ?? null;

    return { total, needsReview, approved, rejected, avgDays, approvalRate, topUnit, topRent };
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
            <StatCard value={String(stats.total)} label="Total Apps" />
            <StatCard value={String(stats.needsReview)} label="Needs Review" color="var(--accent)" />
            <StatCard value={String(stats.approved)} label="Approved" color="var(--green)" />
            <StatCard value={String(stats.rejected)} label="Rejected" color="var(--red)" />
          </div>

          {/* Insights Row */}
          <div className="stat-row">
            <div className="stat-box">
              <div className="stat-num" style={{ fontSize: 22 }}>
                {stats.avgDays != null ? `${stats.avgDays.toFixed(1)}d` : '—'}
              </div>
              <div className="stat-label">Avg. Decision Time</div>
              <div style={{ fontSize: 8, color: 'var(--muted)', marginTop: 3 }}>
                submission → decision
              </div>
            </div>
            <div className="stat-box">
              <div
                className="stat-num"
                style={{
                  fontSize: 22,
                  color:
                    stats.approvalRate != null
                      ? stats.approvalRate >= 60
                        ? '#10b981'
                        : stats.approvalRate >= 40
                        ? '#ca8a04'
                        : 'var(--red)'
                      : undefined,
                }}
              >
                {stats.approvalRate != null ? `${stats.approvalRate}%` : '—'}
              </div>
              <div className="stat-label">Approval Rate</div>
              <div style={{ fontSize: 8, color: 'var(--muted)', marginTop: 3 }}>
                of decided applications
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ fontSize: 18 }}>
                {stats.topUnit ? stats.topUnit[0] : '—'}
              </div>
              <div className="stat-label">Most Applied Unit</div>
              <div style={{ fontSize: 8, color: 'var(--muted)', marginTop: 3 }}>
                {stats.topUnit
                  ? `${stats.topUnit[1]} application${stats.topUnit[1] !== 1 ? 's' : ''}`
                  : 'no data'}
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-num" style={{ fontSize: 18 }}>
                {stats.topRent ? stats.topRent[0] : '—'}
              </div>
              <div className="stat-label">Top Rent Range</div>
              <div style={{ fontSize: 8, color: 'var(--muted)', marginTop: 3 }}>
                {stats.topRent
                  ? `${stats.topRent[1]} application${stats.topRent[1] !== 1 ? 's' : ''}`
                  : 'no data'}
              </div>
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
