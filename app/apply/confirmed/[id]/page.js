'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TopNav from '@/components/layout/TopNav';
import Alert from '@/components/ui/Alert';

export default function ConfirmedPage() {
  const params = useParams();
  const id = params?.id || '';
  const [email, setEmail] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('last_app_email') || '';
    setEmail(storedEmail);
  }, []);

  const statusUrl = `/status/${id}${email ? `?email=${encodeURIComponent(email)}` : ''}`;

  return (
    <>
      <TopNav adminMode={false} />

      <div className="container" style={{ textAlign: 'center', paddingTop: 48 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
        <h1 className="page-title" style={{ fontSize: 28 }}>
          Application Submitted!
        </h1>
        <p className="page-sub" style={{ maxWidth: 480, margin: '0 auto 24px' }}>
          Your rental application has been received and is now being processed by our AI screening
          system.
        </p>

        {/* App ID Box */}
        <div className="app-id-box" style={{ justifyContent: 'center', marginBottom: 24 }}>
          <div>
            <div className="app-id-label">Application ID</div>
            <div className="app-id-val">{id}</div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: '0 auto', textAlign: 'left' }}>
          <Alert type="success" title="Confirmation Sent">
            A confirmation email has been sent to your registered email address. Please keep your
            Application ID for reference.
          </Alert>

          <Alert type="processing" title="AI Review In Progress">
            Our AI screening system is now analyzing your documents and verifying your information.
            This typically takes 24–48 hours.
          </Alert>

          <div className="info-box" style={{ marginBottom: 20 }}>
            <strong>What happens next?</strong>
            <br />
            <br />
            1. AI reviews your documents and runs credit checks
            <br />
            2. Employment and income verification is completed
            <br />
            3. Landlord reference is contacted
            <br />
            4. Results are reviewed by our property management team
            <br />
            5. You receive a decision via email within 2–3 business days
          </div>

          <div className="btn-row" style={{ justifyContent: 'center' }}>
            <Link href={statusUrl} className="btn primary">
              Track Application Status
            </Link>
            <Link href="/apply" className="btn secondary">
              Start New Application
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
