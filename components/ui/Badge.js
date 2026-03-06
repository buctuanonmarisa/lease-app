const STATUS_CLASS_MAP = {
  processing: 'processing',
  review: 'review',
  mismatch: 'mismatch',
  approved: 'approved',
  rejected: 'rejected',
  ok: 'ok',
  warn: 'warn',
  pending: 'pending-b',
};

const STATUS_LABEL_MAP = {
  processing: '🤖 Processing',
  review: '⚠️ Review',
  mismatch: '⚡ Mismatch',
  approved: '✅ Approved',
  rejected: '❌ Rejected',
  ok: '✓ OK',
  warn: '⚠ Warn',
  pending: '● Pending',
};

export default function Badge({ status, children }) {
  const cls = STATUS_CLASS_MAP[status] || '';
  const defaultLabel = STATUS_LABEL_MAP[status] || status;

  return (
    <span className={`badge ${cls}`}>
      {children !== undefined ? children : defaultLabel}
    </span>
  );
}
