'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TopNav from '@/components/layout/TopNav';
import StepsBar from '@/components/layout/StepsBar';
import Badge from '@/components/ui/Badge';

const DOCS = [
  { key: 'paystub1', label: 'Pay Stub — Month 1', icon: '📄', group: 'Income Verification' },
  { key: 'paystub2', label: 'Pay Stub — Month 2', icon: '📄', group: 'Income Verification' },
  { key: 'paystub3', label: 'Pay Stub — Month 3', icon: '📄', group: 'Income Verification' },
  { key: 'employment', label: 'Certificate of Employment', icon: '🏢', group: 'Employment' },
  { key: 'credit', label: 'Credit Report', icon: '📊', group: 'Financial' },
  { key: 'govid', label: 'Government-Issued ID', icon: '🪪', group: 'Identity' },
  { key: 'landlord', label: 'Landlord Reference Letter', icon: '🏠', group: 'References' },
];

const GROUPS = ['Income Verification', 'Employment', 'Financial', 'Identity', 'References'];

export default function DocumentsPage() {
  const router = useRouter();
  const [files, setFiles] = useState({});
  const [errors, setErrors] = useState({});
  const inputRefs = useRef({});

  useEffect(() => {
    const stored = sessionStorage.getItem('apply_form_data');
    if (!stored) {
      router.push('/apply');
    }
  }, [router]);

  const uploadedCount = Object.keys(files).length;
  const total = DOCS.length;
  const allUploaded = uploadedCount === total;
  const progressPct = Math.round((uploadedCount / total) * 100);

  function handleFileChange(key, e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({ ...prev, [key]: 'Only PDF, JPG, or PNG files are accepted.' }));
      return;
    }

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, [key]: 'File must be under 10 MB.' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [key]: '' }));
    setFiles((prev) => ({ ...prev, [key]: file }));
  }

  function handleContinue() {
    // Store file names in sessionStorage (binary data cannot be stored)
    const fileInfo = {};
    Object.entries(files).forEach(([key, file]) => {
      fileInfo[key] = { name: file.name, size: file.size, type: file.type };
    });
    sessionStorage.setItem('apply_doc_info', JSON.stringify(fileInfo));
    router.push('/apply/review');
  }

  function triggerUpload(key) {
    inputRefs.current[key]?.click();
  }

  return (
    <>
      <TopNav adminMode={false} />
      <StepsBar currentStep={2} />

      <div className="container">
        <h1 className="page-title">Document Upload</h1>
        <p className="page-sub">
          Upload all required documents in PDF, JPG, or PNG format. Maximum file size is 10 MB per
          document. All 7 documents must be uploaded before you can proceed.
        </p>

        {/* Progress */}
        <div className="doc-progress-wrap">
          <span className="doc-progress-label">Upload Progress</span>
          <div className="doc-progress-track">
            <div
              className={`doc-progress-fill${allUploaded ? ' complete' : ''}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span
            className="doc-progress-count"
            style={{ color: allUploaded ? 'var(--green)' : 'var(--ink)' }}
          >
            {uploadedCount}/{total}
          </span>
        </div>

        {/* Document Groups */}
        {GROUPS.map((group) => {
          const groupDocs = DOCS.filter((d) => d.group === group);
          return (
            <div key={group} className="doc-group">
              <div className="doc-group-title">
                <span>{group}</span>
                <span style={{ fontSize: 9, color: 'var(--muted)', fontWeight: 400 }}>
                  {groupDocs.filter((d) => files[d.key]).length}/{groupDocs.length} uploaded
                </span>
              </div>

              {groupDocs.map((doc) => {
                const uploaded = !!files[doc.key];
                return (
                  <div key={doc.key}>
                    <div className={`doc-item${uploaded ? ' uploaded' : ' pending'}`}>
                      <span className="doc-icon">{doc.icon}</span>
                      <div className="doc-info">
                        <div className="doc-name">{doc.label}</div>
                        {uploaded ? (
                          <div className="doc-meta">
                            {files[doc.key].name} &mdash;{' '}
                            {(files[doc.key].size / 1024).toFixed(0)} KB
                          </div>
                        ) : (
                          <div className="doc-meta">PDF, JPG or PNG · Max 10 MB</div>
                        )}
                      </div>

                      {uploaded ? (
                        <Badge status="ok">✓ Uploaded</Badge>
                      ) : (
                        <Badge status="pending">Pending</Badge>
                      )}

                      <button
                        type="button"
                        className={`btn sm${uploaded ? ' secondary' : ' ghost'}`}
                        onClick={() => triggerUpload(doc.key)}
                        style={{ marginLeft: 8, flexShrink: 0 }}
                      >
                        {uploaded ? 'Replace' : 'Upload'}
                      </button>

                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        style={{ display: 'none' }}
                        ref={(el) => { inputRefs.current[doc.key] = el; }}
                        onChange={(e) => handleFileChange(doc.key, e)}
                      />
                    </div>
                    {errors[doc.key] && (
                      <div className="form-error" style={{ paddingLeft: 4, marginBottom: 4 }}>
                        {errors[doc.key]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Submit area */}
        {!allUploaded ? (
          <div className="submit-locked">
            <span className="submit-locked-icon">🔒</span>
            <div>
              <div>
                <span className="submit-locked-count">{total - uploadedCount}</span> document
                {total - uploadedCount !== 1 ? 's' : ''} remaining
              </div>
              <div style={{ marginTop: 3 }}>Upload all documents to continue to review.</div>
            </div>
          </div>
        ) : null}

        <div className="btn-row" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => router.push('/apply')}
          >
            ← Back
          </button>
          <button
            type="button"
            className={`btn${allUploaded ? ' primary' : ' locked'}`}
            disabled={!allUploaded}
            onClick={handleContinue}
          >
            {allUploaded ? 'Review & Submit →' : `Upload All Documents (${uploadedCount}/${total})`}
          </button>
        </div>
      </div>
    </>
  );
}
