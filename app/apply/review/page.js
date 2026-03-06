'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/layout/TopNav';
import StepsBar from '@/components/layout/StepsBar';
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

export default function ReviewPage() {
  const router = useRouter();
  const [formData, setFormData] = useState(null);
  const [docInfo, setDocInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = sessionStorage.getItem('apply_form_data');
    const docs = sessionStorage.getItem('apply_doc_info');
    if (!stored) {
      router.push('/apply');
      return;
    }
    if (!docs) {
      router.push('/apply/documents');
      return;
    }
    setFormData(JSON.parse(stored));
    setDocInfo(JSON.parse(docs));
  }, [router]);

  const docKeys = Object.keys(DOC_LABELS);
  const uploadedCount = docKeys.filter((k) => docInfo[k]).length;

  async function handleSubmit() {
    if (!formData) return;
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        documents: Object.entries(docInfo).map(([key, info]) => ({
          key,
          label: DOC_LABELS[key],
          fileName: info.name,
          fileSize: info.size,
          fileType: info.type,
        })),
      };

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const data = await res.json();
      const appId = data.id || data.appId || data.applicationId || 'APP-' + Date.now();
      sessionStorage.setItem('last_app_id', appId);
      sessionStorage.setItem('last_app_email', formData.email);
      router.push(`/apply/confirmed/${appId}`);
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!formData) {
    return (
      <>
        <TopNav adminMode={false} />
        <StepsBar currentStep={3} />
        <div className="container">
          <p style={{ fontSize: 11, color: 'var(--muted)' }}>Loading...</p>
        </div>
      </>
    );
  }

  const income = parseFloat(formData.monthlyIncome) || 0;
  const rent = parseFloat(formData.monthlyRent) || 0;
  const ratio = rent > 0 ? (income / rent).toFixed(2) : '—';

  return (
    <>
      <TopNav adminMode={false} />
      <StepsBar currentStep={3} />

      <div className="container">
        <h1 className="page-title">Review & Submit</h1>
        <p className="page-sub">
          Please review your application details and uploaded documents before submitting.
        </p>

        {/* Document progress — 100% complete */}
        <div className="doc-progress-wrap">
          <span className="doc-progress-label">Documents</span>
          <div className="doc-progress-track">
            <div
              className="doc-progress-fill complete"
              style={{ width: '100%' }}
            />
          </div>
          <span className="doc-progress-count" style={{ color: 'var(--green)' }}>
            7/7 ✓
          </span>
        </div>

        {/* Application Summary */}
        <div className="form-section">
          <div className="form-section-title">Personal Information</div>
          <div className="form-row">
            <div>
              <div className="form-label">Full Name</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {formData.firstName} {formData.lastName}
              </div>
            </div>
            <div>
              <div className="form-label">Email</div>
              <div style={{ fontSize: 12 }}>{formData.email}</div>
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 10 }}>
            <div>
              <div className="form-label">Phone</div>
              <div style={{ fontSize: 12 }}>{formData.phone}</div>
            </div>
            <div>
              <div className="form-label">Date of Birth</div>
              <div style={{ fontSize: 12 }}>{formData.dob}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="form-label">ID Type</div>
            <div style={{ fontSize: 12 }}>{formData.idType}</div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Property Details</div>
          <div style={{ marginBottom: 8 }}>
            <div className="form-label">Unit / Address</div>
            <div style={{ fontSize: 12 }}>{formData.unit}</div>
          </div>
          <div className="form-row">
            <div>
              <div className="form-label">Monthly Rent</div>
              <div style={{ fontSize: 12 }}>
                ₱{parseFloat(formData.monthlyRent).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="form-label">Move-In Date</div>
              <div style={{ fontSize: 12 }}>{formData.moveIn}</div>
            </div>
          </div>
          <div style={{ marginTop: 10 }}>
            <div className="form-label">Monthly Income</div>
            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              ₱{income.toLocaleString()}
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  background: parseFloat(ratio) >= 2.5 ? 'var(--green-lt)' : 'var(--red-lt)',
                  color: parseFloat(ratio) >= 2.5 ? 'var(--green)' : 'var(--red)',
                }}
              >
                {ratio}× ratio {parseFloat(ratio) >= 2.5 ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="form-section">
          <div className="form-section-title">Uploaded Documents</div>
          {docKeys.map((key) => (
            <div key={key} className="doc-item uploaded" style={{ marginBottom: 5 }}>
              <span className="doc-icon">✓</span>
              <div className="doc-info">
                <div className="doc-name">{DOC_LABELS[key]}</div>
                {docInfo[key] && (
                  <div className="doc-meta">
                    {docInfo[key].name} &mdash; {(docInfo[key].size / 1024).toFixed(0)} KB
                  </div>
                )}
              </div>
              <Badge status="ok">Uploaded</Badge>
            </div>
          ))}
        </div>

        {/* Fee notice */}
        <div className="info-box" style={{ marginBottom: 16 }}>
          <strong>Payment Notice</strong>
          <br />
          A ₱5,000 non-refundable application fee will be charged upon submission. This fee covers
          the cost of AI-powered background checks, credit report retrieval, and document
          verification.
        </div>

        {/* Error */}
        {error && (
          <Alert type="error" title="Submission Error">
            {error}
          </Alert>
        )}

        <div className="btn-row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => router.push('/apply/documents')}
            disabled={loading}
          >
            ← Back
          </button>
          <button
            type="button"
            className="btn success"
            onClick={handleSubmit}
            disabled={loading}
            style={{ gap: 10 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Submitting...
              </>
            ) : (
              '✓ Submit Application & Pay ₱5,000'
            )}
          </button>
        </div>
      </div>
    </>
  );
}
