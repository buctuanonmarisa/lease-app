'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/layout/TopNav';
import Alert from '@/components/ui/Alert';
import Badge from '@/components/ui/Badge';

const DOC_LABELS = {
  paystub1: 'Pay Stub — Month 1',
  paystub2: 'Pay Stub — Month 2',
  paystub3: 'Pay Stub — Month 3',
  employment: 'Certificate of Employment',
  credit: 'Credit Report',
  govid: 'Government-Issued ID',
  landlord: 'Landlord Reference Letter',
};

function CriteriaGrid({ items }) {
  return (
    <div className="criteria-grid">
      {items.map((item) => (
        <div key={item.key} className={`criteria-item ${item.state}`}>
          <div className="criteria-head">
            <span className="criteria-name">{item.label}</span>
            <Badge status={item.state === 'pass' ? 'ok' : item.state === 'fail' ? 'rejected' : 'warn'}>
              {item.state === 'pass' ? '✓ Pass' : item.state === 'fail' ? '✗ Fail' : '⚠ Review'}
            </Badge>
          </div>
          {item.score !== undefined && (
            <div className="criteria-bar">
              <div
                className="criteria-bar-fill"
                style={{
                  width: `${item.score}%`,
                  background:
                    item.state === 'pass'
                      ? 'var(--green)'
                      : item.state === 'fail'
                      ? 'var(--red)'
                      : '#f59e0b',
                }}
              />
            </div>
          )}
          {item.detail && <div className="criteria-detail">{item.detail}</div>}
        </div>
      ))}
    </div>
  );
}

// Re-upload modal
function ReuploadModal({ mismatches, onClose, onSubmit, loading }) {
  const [files, setFiles] = useState({});
  const inputRefs = useRef({});

  function handleFile(key, e) {
    const file = e.target.files[0];
    if (!file) return;
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  function handleSubmit() {
    onSubmit(files);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-title">Re-upload Flagged Documents</div>
        <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 16 }}>
          Please re-upload the documents that were flagged for review. Accepted formats: PDF, JPG,
          PNG (max 10 MB each).
        </p>

        {mismatches.map((key) => (
          <div key={key} className={`doc-item${files[key] ? ' uploaded' : ' mismatch'}`} style={{ marginBottom: 8 }}>
            <span className="doc-icon">⚡</span>
            <div className="doc-info">
              <div className="doc-name">{DOC_LABELS[key] || key}</div>
              {files[key] ? (
                <div className="doc-meta">{files[key].name}</div>
              ) : (
                <div className="doc-meta">Flagged — please re-upload</div>
              )}
            </div>
            <button
              type="button"
              className="btn sm ghost"
              onClick={() => inputRefs.current[key]?.click()}
            >
              {files[key] ? 'Replace' : 'Upload'}
            </button>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              ref={(el) => { inputRefs.current[key] = el; }}
              onChange={(e) => handleFile(key, e)}
            />
          </div>
        ))}

        <div className="modal-footer">
          <button className="btn secondary sm" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="btn primary sm"
            onClick={handleSubmit}
            disabled={loading || Object.keys(files).length === 0}
          >
            {loading ? 'Submitting...' : 'Submit Re-uploads →'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StatusDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id || '';
  const email = searchParams?.get('email') || '';

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reuploadLoading, setReuploadLoading] = useState(false);
  const [reuploadSuccess, setReuploadSuccess] = useState(false);

  async function fetchApp() {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(
        `/api/applications/${encodeURIComponent(id)}?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setApp(data);
    } catch (err) {
      setFetchError(err.message || 'Failed to load application.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, email]);

  async function handleReupload(files) {
    setReuploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      Object.entries(files).forEach(([key, file]) => {
        formData.append(key, file);
      });
      const res = await fetch(`/api/applications/${encodeURIComponent(id)}/reupload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Re-upload failed');
      setShowModal(false);
      setReuploadSuccess(true);
      fetchApp();
    } catch (err) {
      alert(err.message || 'Re-upload failed. Please try again.');
    } finally {
      setReuploadLoading(false);
    }
  }

  if (loading) {
    return (
      <>
        <TopNav adminMode={false} />
        <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
          <span className="spinner" />
          <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12 }}>
            Loading application...
          </p>
        </div>
      </>
    );
  }

  if (fetchError) {
    return (
      <>
        <TopNav adminMode={false} />
        <div className="container">
          <Alert type="error" title="Could Not Load Application">
            {fetchError}
          </Alert>
          <Link href="/status" className="btn secondary sm">
            ← Try Again
          </Link>
        </div>
      </>
    );
  }

  if (!app) return null;

  const status = app.status || 'processing';
  const mismatches = app.mismatches || [];
  const docs = app.documents || Object.keys(DOC_LABELS).map((k) => ({ key: k, status: 'uploaded' }));

  const approvedCriteria = [
    { key: 'credit', label: 'Credit Score', state: 'pass', score: 78, detail: 'Score: 742 — Excellent standing' },
    { key: 'income', label: 'Income Ratio', state: 'pass', score: 85, detail: 'Ratio: 3.2× — Exceeds 2.5× minimum' },
    { key: 'employment', label: 'Employment', state: 'pass', score: 100, detail: 'Verified — 4 years continuous' },
    { key: 'rental', label: 'Rental History', state: 'pass', score: 90, detail: 'No late payments on record' },
  ];

  const reviewCriteria = [
    { key: 'credit', label: 'Credit Score', state: 'flagged', score: 52, detail: 'Score: 618 — Below preferred 680 threshold' },
    { key: 'income', label: 'Income Ratio', state: 'pass', score: 72, detail: 'Ratio: 2.7× — Meets minimum' },
    { key: 'employment', label: 'Employment', state: 'pass', score: 100, detail: 'Verified employment confirmed' },
    { key: 'rental', label: 'Rental History', state: 'flagged', score: 40, detail: 'One late payment noted 18 months ago' },
  ];

  const rejectedCriteria = [
    { key: 'credit', label: 'Credit Score', state: 'fail', score: 22, detail: 'Score: 501 — Below minimum threshold' },
    { key: 'income', label: 'Income Ratio', state: 'fail', score: 30, detail: 'Ratio: 1.8× — Below 2.5× minimum' },
    { key: 'employment', label: 'Employment', state: 'flagged', score: 55, detail: 'Employment gap of 6 months noted' },
    { key: 'rental', label: 'Rental History', state: 'fail', score: 15, detail: 'Prior eviction on record' },
  ];

  return (
    <>
      <TopNav adminMode={false} />

      {showModal && (
        <ReuploadModal
          mismatches={mismatches.length > 0 ? mismatches : Object.keys(DOC_LABELS)}
          onClose={() => setShowModal(false)}
          onSubmit={handleReupload}
          loading={reuploadLoading}
        />
      )}

      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <Link href="/status" className="btn secondary sm">← Back</Link>
          <h1 className="page-title" style={{ margin: 0 }}>Application Status</h1>
          <Badge status={status} />
        </div>

        {/* App ID box */}
        <div className="app-id-box">
          <div>
            <div className="app-id-label">Application ID</div>
            <div className="app-id-val">{id}</div>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8', textAlign: 'right' }}>
            {app.applicantName && <div>{app.applicantName}</div>}
            {app.unit && <div>{app.unit}</div>}
          </div>
        </div>

        {reuploadSuccess && (
          <Alert type="success" title="Documents Re-submitted">
            Your documents have been re-uploaded and are being re-reviewed. Check back in 24 hours.
          </Alert>
        )}

        {/* Processing */}
        {status === 'processing' && (
          <>
            <Alert type="processing" title="AI Review In Progress">
              Our AI is currently analyzing your application. This typically takes 24–48 hours.
              You will receive an email notification when the review is complete.
            </Alert>
            <div className="info-box">
              <strong>What we are checking:</strong>
              <br />
              Credit history · Income verification · Employment records · Document authenticity ·
              Rental history · Landlord reference
            </div>
          </>
        )}

        {/* Mismatch */}
        {status === 'mismatch' && (
          <>
            <Alert type="mismatch" title="Document Issues Found">
              Our AI flagged some discrepancies in your submitted documents. Please review the issues
              below and re-upload the corrected documents.
              {mismatches.length > 0 && (
                <ul style={{ marginTop: 8 }}>
                  {mismatches.map((m, i) => (
                    <li key={i}>{typeof m === 'string' ? (DOC_LABELS[m] || m) : m.message}</li>
                  ))}
                </ul>
              )}
            </Alert>

            <div className="form-section-title" style={{ marginBottom: 10 }}>Document Status</div>
            {docs.map((doc) => {
              const key = doc.key || doc;
              const isMismatch = mismatches.includes(key) || doc.status === 'mismatch';
              return (
                <div key={key} className={`doc-item${isMismatch ? ' mismatch' : ' uploaded'}`} style={{ marginBottom: 5 }}>
                  <span className="doc-icon">{isMismatch ? '⚡' : '✓'}</span>
                  <div className="doc-info">
                    <div className="doc-name">{DOC_LABELS[key] || key}</div>
                    <div className="doc-meta">
                      {isMismatch ? 'Flagged — re-upload required' : 'Verified'}
                    </div>
                  </div>
                  <Badge status={isMismatch ? 'mismatch' : 'ok'}>
                    {isMismatch ? '⚡ Mismatch' : '✓ OK'}
                  </Badge>
                </div>
              );
            })}

            <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 16 }}>
              <button className="btn warning" onClick={() => setShowModal(true)}>
                Re-upload Flagged Documents →
              </button>
            </div>
          </>
        )}

        {/* Review (human review needed) */}
        {status === 'review' && (
          <>
            <Alert type="review" title="Under Human Review">
              Your application has passed initial AI screening and is now being reviewed by our
              property management team. You will hear back within 1–2 business days.
            </Alert>
            <div className="form-section-title" style={{ marginBottom: 10 }}>AI Screening Results</div>
            <CriteriaGrid items={reviewCriteria} />
            <div className="info-box">
              Some criteria were flagged for manual review. Our team will contact you if any
              additional information is needed.
            </div>
          </>
        )}

        {/* Approved */}
        {status === 'approved' && (
          <>
            <Alert type="success" title="Application Approved!">
              Congratulations! Your application has been approved. Our team will contact you shortly
              with the lease agreement and move-in instructions.
            </Alert>
            <div className="form-section-title" style={{ marginBottom: 10 }}>Screening Summary</div>
            <CriteriaGrid items={approvedCriteria} />
            <div className="info-box">
              <strong>Next Steps:</strong>
              <br />
              1. Sign the lease agreement (sent via email)
              <br />
              2. Pay the security deposit within 5 business days
              <br />
              3. Schedule your move-in inspection
            </div>
          </>
        )}

        {/* Rejected */}
        {status === 'rejected' && (
          <>
            <Alert type="error" title="Application Not Approved">
              We regret to inform you that your application did not meet our screening requirements
              at this time. {app.decisionNotes || ''}
            </Alert>
            <div className="form-section-title" style={{ marginBottom: 10 }}>Screening Results</div>
            <CriteriaGrid items={rejectedCriteria} />
            <div className="info-box">
              You may reapply after 90 days or appeal this decision by contacting our office with
              supporting documentation.
            </div>
            <div className="btn-row" style={{ justifyContent: 'flex-start', marginTop: 12 }}>
              <Link href="/apply" className="btn secondary">
                Start New Application
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
