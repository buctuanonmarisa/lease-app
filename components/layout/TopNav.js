'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TopNav({ adminMode = false, adminName = '', adminRole = '' }) {
  const router = useRouter();

  async function handleSignOut() {
    try {
      await fetch('/api/auth/login', { method: 'DELETE' });
    } catch (_) {
      // ignore network errors during sign out
    }
    sessionStorage.removeItem('admin_session');
    router.push('/admin/login');
  }

  return (
    <nav className="topnav">
      <div className="logo-mark">L</div>
      <span className="nav-brand">LeaseFlow</span>

      <div className="nav-right">
        {!adminMode ? (
          <>
            <Link href="/status" className="nav-link">
              Track Application
            </Link>
            <Link href="/admin/login" className="nav-link">
              Admin →
            </Link>
          </>
        ) : (
          <>
            <span className="nav-link" style={{ color: '#cbd5e1' }}>
              {adminName}
            </span>
            <span
              className={`nav-badge${adminRole === 'superadmin' ? ' superadmin' : ''}`}
            >
              {adminRole === 'superadmin' ? 'Super Admin' : 'Admin'}
            </span>
            <button
              onClick={handleSignOut}
              className="btn secondary sm"
              style={{ color: '#f1f5f9', borderColor: '#334155', background: 'transparent', height: 28 }}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
