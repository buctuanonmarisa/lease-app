'use client';

const C = {
  ink: '#111827',
  accent: '#1d4ed8',
  muted: '#6b7280',
  border: '#d1ccc3',
};

interface StatCardProps {
  value: string;
  label: string;
  sub?: string;
  color?: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function StatCard({ value, label, sub, color = C.ink, selected = false, onClick }: StatCardProps) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      style={{
        all: onClick ? 'unset' : undefined,
        cursor: onClick ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minWidth: 0,
        background: selected ? '#eef2ff' : '#fff',
        border: `1.5px solid ${selected ? C.accent : C.border}`,
        borderRadius: 6,
        padding: '14px 16px',
        transition: 'border-color 0.15s, background 0.15s',
        position: 'relative',
      }}
      onMouseEnter={onClick ? (e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = '#9ca3af';
        } : undefined}
        onMouseLeave={onClick ? (e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.borderColor = C.border;
        } : undefined}

    >
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'IBM Plex Mono, monospace', color, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.ink, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      {sub && <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{sub}</div>}
      {onClick && (
        <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 9, color: selected ? C.accent : C.muted, opacity: 0.7 }}>
          {selected ? '▲ hide' : '▼ chart'}
        </div>
      )}
    </Tag>
  );
}
