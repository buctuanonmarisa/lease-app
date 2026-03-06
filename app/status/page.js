'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/layout/TopNav';
import Alert from '@/components/ui/Alert';

export default function StatusPage() {
  const router = useRouter();
  const [appId, setAppId] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!appId.trim() || !email.trim()) {
      setError('Please enter both your Application ID and email address.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch(
        `/api/applications/${encodeURIComponent(appId.trim())}?email=${encodeURIComponent(email.trim())}`
      );
      if (res.status === 404) {
        setError('Application not found. Please check your Application ID and email address.');
        return;
      }
      if (!res.ok) {
        throw new Error(`Server error (${res.status})`);
      }
      // Found — navigate to status detail
      router.push(
        `/status/${encodeURIComponent(appId.trim())}?email=${encodeURIComponent(email.trim())}`
      );
    } catch (err) {
      setError(err.message || 'Failed to look up application. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <TopNav adminMode={false} />

      <div className="container" style={{ maxWidth: 520, paddingTop: 48 }}>
        <h1 className="page-title">Track Application Status</h1>
        <p className="page-sub">
          Enter your Application ID and the email address you used when applying to check the
          current status of your application.
        </p>

        {error && (
          <Alert type="error" title="Not Found">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">
              Application ID <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. APP-20241201-0042"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
            <div className="form-hint">Your Application ID was shown after submission.</div>
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address <span className="required">*</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn primary full"
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                Searching...
              </>
            ) : (
              'Check Status →'
            )}
          </button>
        </form>

        <hr className="divider" />

        {/* Demo credentials */}
        <div
          style={{
            padding: 12,
            background: '#f8fafc',
            border: '1px dashed var(--border)',
            fontSize: 9,
            color: 'var(--muted)',
            lineHeight: 2,
            marginBottom: 16,
          }}
        >
          <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
            Demo Applications
          </strong>
          {[
            { id: 'APP-2024-1060', email: 'leonor@email.com', status: 'Approved' },
            { id: 'APP-2024-1055', email: 'ana@email.com',    status: 'Under Review' },
            { id: 'APP-2024-1054', email: 'ramon@email.com',  status: 'Rejected' },
            { id: 'APP-2024-1051', email: 'mario@email.com',  status: 'Mismatch' },
            { id: 'APP-2024-1050', email: 'carla@email.com',  status: 'Processing' },
          ].map(({ id, email: demoEmail, status }) => (
            <div
              key={id}
              style={{ cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'baseline' }}
              onClick={() => { setAppId(id); setEmail(demoEmail); }}
            >
              <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{id}</span>
              <span>{demoEmail}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>{status}</span>
            </div>
          ))}
          <div style={{ marginTop: 4, fontSize: 8, color: '#9ca3af' }}>
            Click a row to fill in the form automatically.
          </div>
        </div>

        <p style={{ fontSize: 10, color: 'var(--muted)', textAlign: 'center' }}>
          Haven&apos;t applied yet?{' '}
          <Link href="/apply" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            Start a new application
          </Link>
        </p>
      </div>
    </>
  );
}
