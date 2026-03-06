'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
      <Link href="/admin/dashboard?filter=review" className="sidebar-item active">
        <span>⚠️</span> Review Queue
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

// ─── Criteria item ────────────────────────────────────────────────────────────
function CriteriaItem({ label, state, score, detail, children }) {
  return (
    <div className={`criteria-item ${state}`} style={{ marginBottom: 10 }}>
      <div className="criteria-head">
        <span className="criteria-name">{label}</span>
        <Badge
          status={
            state === 'pass' ? 'ok' : state === 'fail' ? 'rejected' : 'warn'
          }
        >
          {state === 'pass' ? '✓ Pass' : state === 'fail' ? '✗ Fail' : '⚠ Review'}
        </Badge>
      </div>
      {score !== undefined && (
        <div className="criteria-bar">
          <div
            className="criteria-bar-fill"
            style={{
              width: `${score}%`,
              background:
                state === 'pass'
                  ? 'var(--green)'
                  : state === 'fail'
                  ? 'var(--red)'
                  : '#f59e0b',
            }}
          />
        </div>
      )}
      {detail && <div className="criteria-detail">{detail}</div>}
      {children}
    </div>
  );
}

// ─── Doc Viewer ───────────────────────────────────────────────────────────────
const DOC_TABS = [
  { key: 'paystub1', label: 'Sep Stub', icon: '📄' },
  { key: 'paystub2', label: 'Oct Stub', icon: '📄' },
  { key: 'paystub3', label: 'Nov Stub', icon: '📄' },
  { key: 'employment', label: 'Employment', icon: '🏢' },
  { key: 'credit', label: 'Credit', icon: '📊' },
  { key: 'govid', label: 'Gov ID', icon: '🪪' },
  { key: 'landlord', label: 'Landlord ⚠️', icon: '🏠', flagged: true },
];

const MOCK_DOC_DATA = {
  paystub1: {
    title: 'Pay Stub — September 2024',
    lines: [
      ['Employer', 'Nexus Corp Philippines'],
      ['Employee', 'Maria Santos'],
      ['Period', 'Sep 1–30, 2024'],
      ['Gross Pay', '₱32,500'],
      ['Tax', '₱4,875'],
      ['Net Pay', '₱27,625'],
      ['Status', 'Verified ✓'],
    ],
  },
  paystub2: {
    title: 'Pay Stub — October 2024',
    lines: [
      ['Employer', 'Nexus Corp Philippines'],
      ['Employee', 'Maria Santos'],
      ['Period', 'Oct 1–31, 2024'],
      ['Gross Pay', '₱32,500'],
      ['Tax', '₱4,875'],
      ['Net Pay', '₱27,625'],
      ['Status', 'Verified ✓'],
    ],
  },
  paystub3: {
    title: 'Pay Stub — November 2024',
    lines: [
      ['Employer', 'Nexus Corp Philippines'],
      ['Employee', 'Maria Santos'],
      ['Period', 'Nov 1–30, 2024'],
      ['Gross Pay', '₱32,500'],
      ['Tax', '₱4,875'],
      ['Net Pay', '₱27,625'],
      ['Status', 'Verified ✓'],
    ],
  },
  employment: {
    title: 'Certificate of Employment',
    lines: [
      ['Company', 'Nexus Corp Philippines'],
      ['Employee', 'Maria Santos'],
      ['Position', 'Senior Analyst'],
      ['Since', 'March 2020'],
      ['Status', 'Regular Employee'],
      ['Verified', '✓ AI Confirmed'],
    ],
  },
  credit: {
    title: 'Credit Report Summary',
    lines: [
      ['Bureau', 'TransUnion PH'],
      ['Score', '618 / 850'],
      ['Rating', 'Fair'],
      ['Accounts', '6 active'],
      ['Delinquencies', '1 (18 mo ago)'],
      ['Inquiries', '2 (12 mo)'],
    ],
  },
  govid: {
    title: "Government ID — Driver's License",
    lines: [
      ['Name', 'Maria Santos'],
      ['ID No.', 'N03-12-123456'],
      ['Issued', 'Jan 15, 2021'],
      ['Expires', 'Jan 15, 2026'],
      ['Status', 'Valid ✓'],
    ],
  },
  landlord: {
    title: 'Landlord Reference Letter',
    lines: [
      ['From', 'Jose Reyes'],
      ['Property', 'Makati Ave Condo'],
      ['Tenancy', 'Jan 2022 – Oct 2024'],
      ['Payment', '⚠ Occasional delays'],
      ['Condition', 'Good'],
      ['Recommend', '⚠ With reservations'],
    ],
    flagged: true,
  },
};

function DocViewer({ docKey }) {
  const data = MOCK_DOC_DATA[docKey] || { title: docKey, lines: [] };
  return (
    <div className={`doc-viewer${data.flagged ? ' flagged' : ''}`}>
      <div className="doc-viewer-header">
        <span>{data.flagged ? '⚠️' : '📄'}</span>
        {data.title}
        {data.flagged && (
          <Badge status="mismatch" style={{ marginLeft: 'auto' }}>
            Flagged
          </Badge>
        )}
      </div>
      <div className="doc-viewer-body">
        <div className="doc-thumb">
          <span style={{ fontSize: 24 }}>{data.flagged ? '⚠️' : '📄'}</span>
          <span style={{ fontSize: 8, color: 'var(--muted)' }}>Preview</span>
        </div>
        <div className="doc-viewer-info">
          {data.lines.map(([k, v]) => (
            <div key={k}>
              <strong>{k}:</strong> {v}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params?.id || '';

  const [session, setSession] = useState(null);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [decisionLoading, setDecisionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('paystub1');
  const [allApps, setAllApps] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_session');
    if (!stored) { router.push('/admin/login'); return; }
    setSession(JSON.parse(stored));
    fetchApp();
    fetchAllApps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchApp() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/applications/${id}`);
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setApp(data);
      setNotes(data.decisionNotes || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllApps() {
    try {
      const res = await fetch('/api/admin/applications');
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.applications || [];
      setAllApps(list);
      const idx = list.findIndex((a) => a.id === id);
      setCurrentIndex(idx >= 0 ? idx : 0);
    } catch {
      // ignore
    }
  }

  async function handleDecision(decision) {
    if (!notes.trim()) {
      showToast('Please add notes before making a decision.', 'error');
      return;
    }
    setDecisionLoading(true);
    try {
      const res = await fetch(`/api/admin/applications/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes }),
      });
      if (!res.ok) throw new Error('Decision failed');
      showToast(
        decision === 'approved' ? '✅ Application approved!' : '❌ Application rejected.',
        decision === 'approved' ? 'success' : 'error'
      );
      fetchApp();
    } catch (err) {
      showToast(err.message || 'Failed to submit decision.', 'error');
    } finally {
      setDecisionLoading(false);
    }
  }

  function navigateTo(idx) {
    if (idx < 0 || idx >= allApps.length) return;
    router.push(`/admin/applications/${allApps[idx].id}`);
  }

  if (!session) return null;

  const isDecidable =
    app && (app.status === 'review' || app.status === 'processing' || app.status === 'mismatch');
  const isDecided = app && (app.status === 'approved' || app.status === 'rejected');

  // Build AI criteria from app data or use mock
  const criteria = app?.aiCriteria || [
    {
      key: 'credit',
      label: 'Credit Score',
      state: (app?.creditScore || 618) >= 680 ? 'pass' : (app?.creditScore || 618) >= 600 ? 'flagged' : 'fail',
      score: Math.min(100, Math.round(((app?.creditScore || 618) / 850) * 100)),
      detail: `Score: ${app?.creditScore || 618} — ${(app?.creditScore || 618) >= 680 ? 'Excellent' : (app?.creditScore || 618) >= 600 ? 'Fair' : 'Poor'}`,
    },
    {
      key: 'income',
      label: 'Income Ratio',
      state: (app?.incomeRatio || 2.1) >= 2.5 ? 'pass' : 'fail',
      score: Math.min(100, Math.round(((app?.incomeRatio || 2.1) / 4) * 100)),
      detail: `Ratio: ${Number(app?.incomeRatio || 2.1).toFixed(2)}× — ${(app?.incomeRatio || 2.1) >= 2.5 ? 'Meets' : 'Below'} 2.5× minimum`,
    },
    {
      key: 'employment',
      label: 'Employment',
      state: 'pass',
      score: 100,
      detail: 'Certificate of Employment verified',
    },
    {
      key: 'rental',
      label: 'Rental History',
      state: 'flagged',
      score: 42,
      detail: 'Landlord letter indicates occasional payment delays',
    },
  ];

  return (
    <>
      <TopNav adminMode adminName={session.name} adminRole={session.role} />
      <ToastContainer />

      <div className="admin-layout">
        <Sidebar role={session.role} />

        <div className="sidebar-main" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Record Nav */}
          <div className="record-nav">
            <span className="record-nav-info">
              Application {currentIndex + 1} of {allApps.length} &nbsp;·&nbsp;
              <strong style={{ color: 'var(--accent)', letterSpacing: 1 }}>{id}</strong>
            </span>
            <button
              className="btn secondary sm"
              onClick={() => navigateTo(currentIndex - 1)}
              disabled={currentIndex === 0}
            >
              ← Prev
            </button>
            <button
              className="btn secondary sm"
              onClick={() => navigateTo(currentIndex + 1)}
              disabled={currentIndex >= allApps.length - 1}
            >
              Next →
            </button>
            <Link href="/admin/dashboard" className="btn ghost sm" style={{ marginLeft: 8 }}>
              ← Back to Dashboard
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner" />
            </div>
          ) : error ? (
            <div style={{ padding: 24 }}>
              <Alert type="error" title="Load Error">{error}</Alert>
            </div>
          ) : app ? (
            <div className="analysis-split" style={{ flex: 1, overflowY: 'auto', alignItems: 'start' }}>
              {/* ─ Left: AI Analysis ─ */}
              <div className="analysis-left">
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 700, margin: 0 }}>
                    AI Analysis
                  </h2>
                  <Badge status={app.status} />
                </div>

                {/* App summary */}
                <div className="app-id-box" style={{ marginBottom: 14 }}>
                  <div>
                    <div className="app-id-label">Application ID</div>
                    <div className="app-id-val" style={{ fontSize: 16 }}>{id}</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>
                    <div style={{ fontWeight: 600 }}>
                      {app.applicantName || `${app.firstName || ''} ${app.lastName || ''}`.trim()}
                    </div>
                    <div>{app.email}</div>
                    <div>{app.unit}</div>
                  </div>
                </div>

                {/* AI Criteria */}
                <div className="form-section-title" style={{ marginBottom: 10 }}>
                  Screening Criteria
                </div>

                {criteria.map(({ key: cKey, ...rest }) => (
                  <CriteriaItem key={cKey} {...rest}>
                    {/* Landlord sentiment box */}
                    {cKey === 'rental' && (
                      <div className="sentiment-box" style={{ marginTop: 8 }}>
                        <div className="sentiment-title">Landlord Sentiment Analysis</div>
                        <div>
                          <strong>Tone:</strong> Mildly negative
                        </div>
                        <div>
                          <strong>Key phrases:</strong> &quot;occasional delays&quot;,
                          &quot;generally cooperative&quot;
                        </div>
                        <div>
                          <strong>Recommendation:</strong> With reservations
                        </div>
                        <div>
                          <strong>Confidence:</strong> 78%
                        </div>
                      </div>
                    )}
                  </CriteriaItem>
                ))}

                {/* Document completeness */}
                <CriteriaItem
                  label="Document Completeness"
                  state="pass"
                  score={100}
                  detail="All 7 required documents submitted"
                />

                <hr className="divider" />

                {/* Decision section */}
                {isDecided ? (
                  <div className="info-box">
                    <strong>Decision: </strong>
                    <Badge status={app.status} />
                    <br />
                    <br />
                    <strong>Decided By:</strong> {app.decidedBy || '—'}
                    <br />
                    <strong>Date:</strong>{' '}
                    {app.decidedAt
                      ? new Date(app.decidedAt).toLocaleDateString('en-PH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : '—'}
                    <br />
                    <strong>Notes:</strong> {app.decisionNotes || '—'}
                  </div>
                ) : isDecidable ? (
                  <>
                    <div className="form-section-title" style={{ marginBottom: 8 }}>
                      Admin Decision
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        Decision Notes <span className="required">*</span>
                      </label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="Add notes about this decision (required)..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        style={{ height: 80 }}
                      />
                      <div className="form-hint">Notes are required before approving or rejecting.</div>
                    </div>
                    <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 10 }}>
                      <button
                        className="btn success"
                        onClick={() => handleDecision('approved')}
                        disabled={decisionLoading}
                      >
                        {decisionLoading ? '...' : '✓ Approve'}
                      </button>
                      <button
                        className="btn danger"
                        onClick={() => handleDecision('rejected')}
                        disabled={decisionLoading}
                      >
                        {decisionLoading ? '...' : '✗ Reject'}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>

              {/* ─ Right: Document Viewer ─ */}
              <div className="analysis-right">
                <div className="form-section-title" style={{ marginBottom: 10 }}>
                  Document Viewer
                </div>

                <div className="doc-tabs">
                  {DOC_TABS.map((tab) => (
                    <div
                      key={tab.key}
                      className={`doc-tab${activeTab === tab.key ? ' active' : ''}${tab.flagged ? ' flagged-tab' : ''}`}
                      onClick={() => setActiveTab(tab.key)}
                    >
                      {tab.icon} {tab.label}
                    </div>
                  ))}
                </div>

                <DocViewer docKey={activeTab} />

                <div
                  style={{
                    fontSize: 9,
                    color: 'var(--muted)',
                    marginTop: 8,
                    lineHeight: 1.8,
                    borderTop: '1px dashed var(--border)',
                    paddingTop: 10,
                  }}
                >
                  <strong>AI Extraction Confidence:</strong>{' '}
                  {activeTab === 'landlord' ? '72% — Low confidence on sentiment' : '94% — High confidence'}
                  <br />
                  <strong>Last Analyzed:</strong> {new Date().toLocaleDateString('en-PH')}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
