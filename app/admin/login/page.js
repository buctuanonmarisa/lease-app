'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@/components/ui/Alert';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      if (res.status === 401) {
        setError('Invalid email or password. Please try again.');
        return;
      }
      if (!res.ok) {
        throw new Error(`Server error (${res.status})`);
      }

      const data = await res.json();
      // Store admin session
      const session = {
        name: data.name || data.adminName || email.split('@')[0],
        email: data.email || email,
        role: data.role || 'admin',
        initials: data.initials || (data.name || email).slice(0, 2).toUpperCase(),
        color: data.color || '#1d4ed8',
      };
      sessionStorage.setItem('admin_session', JSON.stringify(session));
      router.push('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Minimal nav — logo only */}
      <nav
        style={{
          background: 'var(--nav-bg)',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 12,
          borderBottom: '2px solid rgba(29,78,216,0.35)',
        }}
      >
        <div className="logo-mark">L</div>
        <span className="nav-brand">LeaseFlow</span>
      </nav>

      <div className="login-wrap" style={{ flex: 1 }}>
        {/* Left — dark branding */}
        <div className="login-left">
          <div style={{ marginBottom: 32 }}>
            <div
              style={{
                background: 'var(--accent)',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: 22,
                fontWeight: 700,
                marginBottom: 20,
              }}
            >
              P
            </div>
            <div className="login-tagline">
              AI-Powered
              <br />
              Tenant Screening
            </div>
            <div className="login-sub" style={{ marginTop: 10 }}>
              LeaseFlow automates tenant qualification with advanced AI — reducing screening time
              from days to hours.
            </div>
          </div>

          <div className="login-features">
            <div>🤖 AI document analysis</div>
            <div>📊 Automated credit checks</div>
            <div>🔍 Employment verification</div>
            <div>📋 Landlord sentiment analysis</div>
            <div>⚡ Real-time mismatch detection</div>
          </div>
        </div>

        {/* Right — login form */}
        <div className="login-right">
          <h2
            style={{
              fontFamily: 'Fraunces, serif',
              fontSize: 20,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            Admin Sign In
          </h2>
          <p style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 24 }}>
            Sign in to manage tenant applications and screening results.
          </p>

          {error && (
            <Alert type="error" title="Login Failed">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="admin@leaseflow.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
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
                  Signing in...
                </>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 20,
              padding: 12,
              background: '#f8fafc',
              border: '1px dashed var(--border)',
              fontSize: 9,
              color: 'var(--muted)',
              lineHeight: 1.9,
            }}
          >
            <strong style={{ color: 'var(--ink)' }}>Demo Credentials</strong>
            <br />
            Super Admin: sarah@leaseflow.ph / admin123
            <br />
            Admin: mike@leaseflow.ph / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
