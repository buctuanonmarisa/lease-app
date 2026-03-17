'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import TopNav from '@/components/layout/TopNav';
import type { AnalyticsData, KpiKey } from '@/types';

// ── Design tokens matching globals.css ────────────────────────
const C = {
  ink: '#111827',
  accent: '#1d4ed8',
  green: '#065f46',
  greenLight: '#10b981',
  red: '#991b1b',
  redLight: '#ef4444',
  yellow: '#92400e',
  yellowLight: '#f59e0b',
  purple: '#6d28d9',
  muted: '#6b7280',
  border: '#d1ccc3',
  paper: '#f9f7f4',
  cream: '#f0ece4',
};

const PIE_COLORS = [C.accent, C.greenLight, C.yellowLight, C.redLight];

// ── Sidebar ────────────────────────────────────────────────────
function Sidebar({ role, reviewCount }: { role: string; reviewCount: number }) {
  return (
    <div className="sidebar">
      <div className="sidebar-section">Main</div>
      <Link href="/admin/dashboard" className="sidebar-item">
        <span>📊</span> Dashboard
      </Link>
      <Link href="/admin/dashboard?filter=review" className="sidebar-item">
        <span>⚠️</span> Review Queue
        {reviewCount > 0 && <span className="count-badge">{reviewCount}</span>}
      </Link>
      <Link href="/admin/analytics" className="sidebar-item active">
        <span>📈</span> Analytics
      </Link>
      <Link href="/admin/dashboard?filter=approved" className="sidebar-item">
        <span>✅</span> Approved
      </Link>
      <Link href="/admin/dashboard?filter=rejected" className="sidebar-item">
        <span>❌</span> Rejected
      </Link>
      {role === 'superadmin' && (
        <>
          <div className="sidebar-section">Admin</div>
          <Link href="/admin/settings" className="sidebar-item">
            <span>👥</span> Manage Admins
          </Link>
          <Link href="/admin/settings#audit" className="sidebar-item">
            <span>📋</span> Audit Log
          </Link>
        </>
      )}
    </div>
  );
}

// ── KPI card config ────────────────────────────────────────────
interface KpiCardDef {
  key: KpiKey;
  label: string;
  getValue: (d: AnalyticsData) => string;
  sub: string;
  color: string;
  chartTitle: string;
  chartDesc: string;
}

function buildKpiCards(data: AnalyticsData): KpiCardDef[] {
  const s = data.summary;
  return [
    {
      key: 'total',
      label: 'Total Apps',
      getValue: () => String(s.total),
      sub: 'all submitted',
      color: C.ink,
      chartTitle: 'Applications Over Time',
      chartDesc: 'Daily application submissions over the last 30 days.',
    },
    {
      key: 'review',
      label: 'Needs Review',
      getValue: () => String(s.needsReview),
      sub: 'review + mismatch',
      color: C.yellowLight,
      chartTitle: 'Review Queue by Day',
      chartDesc: 'Applications flagged for review or mismatch, grouped by submission date.',
    },
    {
      key: 'approved',
      label: 'Approved',
      getValue: () => String(s.approved),
      sub: `of ${s.total} total`,
      color: C.greenLight,
      chartTitle: 'Weekly Status Breakdown',
      chartDesc: 'Approved, rejected, review, and processing applications grouped by week.',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      getValue: () => String(s.rejected),
      sub: `of ${s.total} total`,
      color: C.redLight,
      chartTitle: 'Weekly Status Breakdown',
      chartDesc: 'Approved, rejected, review, and processing applications grouped by week.',
    },
    {
      key: 'decisionTime',
      label: 'Avg. Decision Time',
      getValue: () =>
        s.avgDecisionDays != null ? `${s.avgDecisionDays.toFixed(1)}d` : '—',
      sub: 'submission → decision',
      color: C.accent,
      chartTitle: 'Decision Time per Application',
      chartDesc: 'Days from submission to final decision for each decided application. Reference line = average.',
    },
    {
      key: 'approvalRate',
      label: 'Approval Rate',
      getValue: () => (s.approvalRate != null ? `${s.approvalRate}%` : '—'),
      sub: 'of decided applications',
      color:
        s.approvalRate != null
          ? s.approvalRate >= 60
            ? C.greenLight
            : s.approvalRate >= 40
            ? C.yellowLight
            : C.redLight
          : C.muted,
      chartTitle: 'Cumulative Approval Rate',
      chartDesc: 'Running approval percentage as decisions are made over time.',
    },
    {
      key: 'topUnit',
      label: 'Most Applied Unit',
      getValue: () =>
        data.unitCounts.length > 0 ? data.unitCounts[0].unit : '—',
      sub:
        data.unitCounts.length > 0
          ? `${data.unitCounts[0].count} application${data.unitCounts[0].count !== 1 ? 's' : ''}`
          : 'no data',
      color: C.purple,
      chartTitle: 'Applications by Unit',
      chartDesc: 'Total applications submitted per rental unit.',
    },
    {
      key: 'topRent',
      label: 'Top Rent Range',
      getValue: () => {
        const top = [...data.rentRangeCounts].sort((a, b) => b.count - a.count)[0];
        return top ? top.range : '—';
      },
      sub: (() => {
        const top = [...data.rentRangeCounts].sort((a, b) => b.count - a.count)[0];
        return top ? `${top.count} application${top.count !== 1 ? 's' : ''}` : 'no data';
      })(),
      color: C.yellowLight,
      chartTitle: 'Rent Range Distribution',
      chartDesc: 'How applications are spread across monthly rent brackets.',
    },
  ];
}

// ── Custom tooltip ─────────────────────────────────────────────
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.border}`,
        padding: '8px 12px',
        fontSize: 11,
        fontFamily: 'IBM Plex Mono, monospace',
        borderRadius: 4,
      }}
    >
      {label && <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>}
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
}

// ── Decision-time tooltip ──────────────────────────────────────
function DecisionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { appId: string; name: string; days: number; status: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.border}`,
        padding: '8px 12px',
        fontSize: 11,
        fontFamily: 'IBM Plex Mono, monospace',
        borderRadius: 4,
      }}
    >
      <div style={{ fontWeight: 700 }}>APP-{d.appId}</div>
      <div style={{ color: C.muted }}>{d.name}</div>
      <div style={{ marginTop: 4 }}>
        <strong>{d.days}d</strong> · {d.status}
      </div>
    </div>
  );
}

// ── Chart renderer ─────────────────────────────────────────────
function KpiChart({ kpi, data }: { kpi: KpiKey; data: AnalyticsData }) {
  const avgDays = data.summary.avgDecisionDays;

  if (kpi === 'total') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data.applicationsOverTime}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={C.accent} stopOpacity={0.25} />
              <stop offset="95%" stopColor={C.accent} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="count"
            name="Applications"
            stroke={C.accent}
            fill="url(#areaGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (kpi === 'review') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.reviewQueueOverTime}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Flagged for Review" fill={C.yellowLight} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kpi === 'approved' || kpi === 'rejected') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data.weeklyStatusBreakdown}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="week" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
          <YAxis tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
          <Bar dataKey="approved" name="Approved" stackId="a" fill={C.greenLight} />
          <Bar dataKey="rejected" name="Rejected" stackId="a" fill={C.redLight} />
          <Bar dataKey="review" name="Review" stackId="a" fill={C.yellowLight} />
          <Bar
            dataKey="processing"
            name="Processing"
            stackId="a"
            fill={C.muted}
            radius={[3, 3, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kpi === 'decisionTime') {
    const barColor = (entry: { status: string }) =>
      entry.status === 'approved' ? C.greenLight : C.redLight;
    return (
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data.decisionTimes} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis
            dataKey="appId"
            tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }}
            label={{ value: 'Application', position: 'insideBottom', offset: -10, fontSize: 10 }}
          />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            label={{ value: 'Days', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip content={<DecisionTooltip />} />
          {avgDays != null && (
            <ReferenceLine
              y={avgDays}
              stroke={C.accent}
              strokeDasharray="4 4"
              label={{ value: `Avg ${avgDays.toFixed(1)}d`, fill: C.accent, fontSize: 10 }}
            />
          )}
          <Bar dataKey="days" name="Days to Decide" radius={[3, 3, 0, 0]}>
            {data.decisionTimes.map((entry, i) => (
              <Cell key={i} fill={barColor(entry)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kpi === 'approvalRate') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data.approvalRateOverTime}>
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
          <YAxis
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(value: number) => [`${value}%`, 'Approval Rate']}
            labelFormatter={(l) => `Date: ${l}`}
            contentStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          />
          <ReferenceLine y={60} stroke={C.greenLight} strokeDasharray="4 4" />
          <Line
            type="monotone"
            dataKey="rate"
            name="Approval Rate"
            stroke={C.greenLight}
            strokeWidth={2}
            dot={{ r: 3, fill: C.greenLight }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (kpi === 'topUnit') {
    return (
      <ResponsiveContainer width="100%" height={Math.max(260, data.unitCounts.length * 40)}>
        <BarChart
          data={data.unitCounts}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 16, bottom: 4 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
          <XAxis type="number" tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
          <YAxis
            dataKey="unit"
            type="category"
            width={90}
            tick={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Applications" fill={C.purple} radius={[0, 3, 3, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (kpi === 'topRent') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data.rentRangeCounts}
            dataKey="count"
            nameKey="range"
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={3}
            label={({ range, percent }) =>
              percent > 0 ? `${range} (${(percent * 100).toFixed(0)}%)` : ''
            }
            labelLine={false}
          >
            {data.rentRangeCounts.map((_, i) => (
              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [value, name]}
            contentStyle={{ fontSize: 11, fontFamily: 'IBM Plex Mono' }}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'IBM Plex Mono' }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return null;
}

// ── Main page ──────────────────────────────────────────────────
export default function AnalyticsPage() {
  const router = useRouter();
  const [session, setSession] = useState<{ name: string; role: string } | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState<KpiKey | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('admin_session');
    if (!stored) {
      router.push('/admin/login');
      return;
    }
    setSession(JSON.parse(stored));
    fetchAnalytics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/analytics');
      if (res.status === 401) { router.push('/admin/login'); return; }
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      // leave null
    } finally {
      setLoading(false);
    }
  }

  function handleKpiClick(key: KpiKey) {
    if (selectedKpi === key) {
      setSelectedKpi(null);
      return;
    }
    setSelectedKpi(key);
    setTimeout(() => {
      chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  if (!session) return null;

  const kpiCards = data ? buildKpiCards(data) : [];
  const activeCard = kpiCards.find((c) => c.key === selectedKpi);

  return (
    <>
      <TopNav adminMode adminName={session.name} adminRole={session.role} />

      <div className="admin-layout">
        <Sidebar role={session.role} reviewCount={data?.summary.needsReview ?? 0} />

        <div className="sidebar-main">
          <div className="ai-badge">
            <div className="ai-pulse" />
            AI SCREENING ACTIVE
          </div>

          <h1 className="page-title">Analytics</h1>
          <p className="page-sub">
            Click any KPI card to explore detailed charts.
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 60 }}>
              <span className="spinner" />
              <p style={{ fontSize: 11, color: C.muted, marginTop: 12 }}>Loading analytics...</p>
            </div>
          ) : !data ? (
            <div style={{ padding: 40, color: C.muted, fontSize: 11 }}>
              Failed to load analytics data.
            </div>
          ) : (
            <>
              {/* ── KPI Cards ─────────────────────────────── */}
              <div className="stat-row">
                {kpiCards.slice(0, 4).map((card) => (
                  <KpiCardButton
                    key={card.key}
                    card={card}
                    data={data}
                    selected={selectedKpi === card.key}
                    onClick={() => handleKpiClick(card.key)}
                  />
                ))}
              </div>
              <div className="stat-row" style={{ marginTop: 0 }}>
                {kpiCards.slice(4).map((card) => (
                  <KpiCardButton
                    key={card.key}
                    card={card}
                    data={data}
                    selected={selectedKpi === card.key}
                    onClick={() => handleKpiClick(card.key)}
                  />
                ))}
              </div>

              {/* ── Selected chart panel ───────────────────── */}
              <div ref={chartRef}>
                {selectedKpi && activeCard && (
                  <div
                    style={{
                      marginTop: 24,
                      border: `1.5px solid ${C.accent}`,
                      borderRadius: 8,
                      padding: '20px 24px',
                      background: '#fff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 16,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            fontFamily: 'Fraunces, serif',
                            color: C.ink,
                          }}
                        >
                          {activeCard.chartTitle}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>
                          {activeCard.chartDesc}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedKpi(null)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: 16,
                          color: C.muted,
                          padding: '0 4px',
                          lineHeight: 1,
                        }}
                        aria-label="Close chart"
                      >
                        ×
                      </button>
                    </div>
                    <KpiChart kpi={selectedKpi} data={data} />
                  </div>
                )}
              </div>

              {/* ── Always-visible bottom row ──────────────── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginTop: 24,
                }}
              >
                <MiniChart
                  title="Credit Score Distribution"
                  desc="Applicants grouped by credit score range."
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.creditScoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="range" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                      <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Applicants" radius={[3, 3, 0, 0]}>
                        {data.creditScoreDistribution.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.range === '<600'
                                ? C.redLight
                                : entry.range === '600–649'
                                ? C.yellowLight
                                : C.greenLight
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </MiniChart>

                <MiniChart
                  title="Income Ratio Distribution"
                  desc="Applicants grouped by monthly income ÷ rent ratio."
                >
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.incomeRatioDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                      <XAxis dataKey="range" tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} />
                      <YAxis tick={{ fontSize: 9, fontFamily: 'IBM Plex Mono' }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Applicants" radius={[3, 3, 0, 0]}>
                        {data.incomeRatioDistribution.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={
                              entry.range === '<1.5×' || entry.range === '1.5–2×'
                                ? C.redLight
                                : entry.range === '2–2.5×'
                                ? C.yellowLight
                                : C.greenLight
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </MiniChart>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── KpiCardButton ──────────────────────────────────────────────
function KpiCardButton({
  card,
  data,
  selected,
  onClick,
}: {
  card: KpiCardDef;
  data: AnalyticsData;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: 'unset',
        cursor: 'pointer',
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
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = '#9ca3af';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'IBM Plex Mono, monospace',
          color: card.color,
          lineHeight: 1.1,
        }}
      >
        {card.getValue(data)}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: C.ink,
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        {card.label}
      </div>
      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{card.sub}</div>
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 10,
          fontSize: 9,
          color: selected ? C.accent : C.muted,
          opacity: 0.7,
        }}
      >
        {selected ? '▲ hide' : '▼ chart'}
      </div>
    </button>
  );
}

// ── MiniChart wrapper ──────────────────────────────────────────
function MiniChart({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 6,
        padding: '16px 18px',
        background: '#fff',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'Fraunces, serif',
          color: C.ink,
          marginBottom: 3,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 9, color: C.muted, marginBottom: 12 }}>{desc}</div>
      {children}
    </div>
  );
}
