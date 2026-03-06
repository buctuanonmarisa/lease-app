export default function Alert({ type = 'success', icon, title, children }) {
  const defaultIcons = {
    success: '✅',
    processing: '🤖',
    mismatch: '⚡',
    review: '⚠️',
    error: '❌',
  };

  const displayIcon = icon !== undefined ? icon : defaultIcons[type] || 'ℹ️';

  return (
    <div className={`alert ${type}`}>
      <span className="alert-icon">{displayIcon}</span>
      <div>
        {title && <div className="alert-title">{title}</div>}
        <div className="alert-body">{children}</div>
      </div>
    </div>
  );
}
