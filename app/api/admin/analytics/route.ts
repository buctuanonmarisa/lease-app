import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import type {
  AnalyticsData,
  TimeSeriesPoint,
  WeeklyStatusPoint,
  DecisionTimeEntry,
  ApprovalRatePoint,
  UnitCount,
  RentRangeCount,
  ScoreRangeCount,
} from '@/types';

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function formatWeek(d: Date): string {
  // Return "YYYY-Www" label for the ISO week
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  dt.setDate(dt.getDate() + 3 - ((dt.getDay() + 6) % 7));
  const week = Math.floor((((dt.getTime() - new Date(dt.getFullYear(), 0, 4).getTime()) / 86400000) + new Date(dt.getFullYear(), 0, 4).getDay() + 5) / 7);
  const m = d.toLocaleString('default', { month: 'short' });
  return `${m} ${d.getDate()}`;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apps = await prisma.application.findMany({
    orderBy: { submittedAt: 'asc' },
  });

  // ── Summary ──────────────────────────────────────────────────
  const total = apps.length;
  const needsReview = apps.filter((a) => a.status === 'review' || a.status === 'mismatch').length;
  const approved = apps.filter((a) => a.status === 'approved').length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;

  const decided = apps.filter((a) => a.decidedAt !== null);
  const avgDecisionDays =
    decided.length > 0
      ? decided.reduce((sum, a) => {
          const ms = new Date(a.decidedAt!).getTime() - new Date(a.submittedAt).getTime();
          return sum + Math.abs(ms / (1000 * 60 * 60 * 24));
        }, 0) / decided.length
      : null;

  const approvalRate =
    approved + rejected > 0
      ? Math.round((approved / (approved + rejected)) * 100)
      : null;

  // ── Applications over time (last 30 days) ────────────────────
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const appsByDay: Record<string, number> = {};

  // Seed all 30 days with 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    appsByDay[formatDate(d)] = 0;
  }

  apps.forEach((a) => {
    const submittedDate = new Date(a.submittedAt);
    if (submittedDate >= thirtyDaysAgo) {
      const key = formatDate(submittedDate);
      if (key in appsByDay) appsByDay[key]++;
    }
  });

  const applicationsOverTime: TimeSeriesPoint[] = Object.entries(appsByDay).map(
    ([date, count]) => ({ date: date.slice(5), count }) // "MM-DD"
  );

  // ── Review queue over time (apps flagged review/mismatch by day) ──
  const reviewByDay: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    reviewByDay[formatDate(d)] = 0;
  }
  apps
    .filter((a) => a.status === 'review' || a.status === 'mismatch')
    .forEach((a) => {
      const key = formatDate(new Date(a.submittedAt));
      if (key in reviewByDay) reviewByDay[key]++;
    });

  const reviewQueueOverTime: TimeSeriesPoint[] = Object.entries(reviewByDay).map(
    ([date, count]) => ({ date: date.slice(5), count })
  );

  // ── Weekly status breakdown ───────────────────────────────────
  const weekMap: Record<string, WeeklyStatusPoint> = {};
  apps.forEach((a) => {
    const week = formatWeek(new Date(a.submittedAt));
    if (!weekMap[week]) {
      weekMap[week] = { week, approved: 0, rejected: 0, review: 0, processing: 0 };
    }
    const entry = weekMap[week];
    if (a.status === 'approved') entry.approved++;
    else if (a.status === 'rejected') entry.rejected++;
    else if (a.status === 'review' || a.status === 'mismatch') entry.review++;
    else entry.processing++;
  });
  const weeklyStatusBreakdown: WeeklyStatusPoint[] = Object.values(weekMap);

  // ── Decision times per application ───────────────────────────
  const decisionTimes: DecisionTimeEntry[] = apps
    .filter((a) => a.decidedAt !== null)
    .map((a) => {
      const days =
        (new Date(a.decidedAt!).getTime() - new Date(a.submittedAt).getTime()) /
        (1000 * 60 * 60 * 24);
      return {
        appId: a.id.replace('APP-', '').slice(-4), // last 4 chars e.g. "0001"
        name: `${a.firstName} ${a.lastName}`,
        days: Math.abs(Math.round(days * 10) / 10),
        status: a.status,
      };
    });

  // ── Approval rate over time (cumulative) ──────────────────────
  const decidedSorted = [...decided].sort(
    (a, b) => new Date(a.decidedAt!).getTime() - new Date(b.decidedAt!).getTime()
  );
  let cumulativeApproved = 0;
  let cumulativeDecided = 0;
  const approvalRateOverTime: ApprovalRatePoint[] = decidedSorted.map((a) => {
    cumulativeDecided++;
    if (a.status === 'approved') cumulativeApproved++;
    return {
      date: formatDate(new Date(a.decidedAt!)).slice(5),
      rate: Math.round((cumulativeApproved / cumulativeDecided) * 100),
      decided: cumulativeDecided,
    };
  });

  // ── Unit counts ───────────────────────────────────────────────
  const unitMap: Record<string, number> = {};
  apps.forEach((a) => {
    if (a.unit) unitMap[a.unit] = (unitMap[a.unit] || 0) + 1;
  });
  const unitCounts: UnitCount[] = Object.entries(unitMap)
    .sort((a, b) => b[1] - a[1])
    .map(([unit, count]) => ({ unit, count }));

  // ── Rent range counts ─────────────────────────────────────────
  const rentBuckets: Record<string, number> = {
    '₱0–10k': 0,
    '₱10–15k': 0,
    '₱15–20k': 0,
    '₱20k+': 0,
  };
  apps.forEach((a) => {
    if (!a.monthlyRent) return;
    if (a.monthlyRent < 10000) rentBuckets['₱0–10k']++;
    else if (a.monthlyRent < 15000) rentBuckets['₱10–15k']++;
    else if (a.monthlyRent < 20000) rentBuckets['₱15–20k']++;
    else rentBuckets['₱20k+']++;
  });
  const rentRangeCounts: RentRangeCount[] = Object.entries(rentBuckets).map(
    ([range, count]) => ({ range, count })
  );

  // ── Credit score distribution (from aiAnalysis JSON) ─────────
  const creditBuckets: Record<string, number> = {
    '<600': 0,
    '600–649': 0,
    '650–699': 0,
    '700–749': 0,
    '750+': 0,
  };
  apps.forEach((a) => {
    if (!a.aiAnalysis) return;
    try {
      const ai = JSON.parse(a.aiAnalysis);
      const score = ai.creditScore;
      if (typeof score !== 'number') return;
      if (score < 600) creditBuckets['<600']++;
      else if (score < 650) creditBuckets['600–649']++;
      else if (score < 700) creditBuckets['650–699']++;
      else if (score < 750) creditBuckets['700–749']++;
      else creditBuckets['750+']++;
    } catch {
      // ignore parse errors
    }
  });
  const creditScoreDistribution: ScoreRangeCount[] = Object.entries(creditBuckets).map(
    ([range, count]) => ({ range, count })
  );

  // ── Income ratio distribution ─────────────────────────────────
  const incomeBuckets: Record<string, number> = {
    '<1.5×': 0,
    '1.5–2×': 0,
    '2–2.5×': 0,
    '2.5–3×': 0,
    '3×+': 0,
  };
  apps.forEach((a) => {
    if (!a.monthlyRent || !a.monthlyIncome) return;
    const ratio = a.monthlyIncome / a.monthlyRent;
    if (ratio < 1.5) incomeBuckets['<1.5×']++;
    else if (ratio < 2) incomeBuckets['1.5–2×']++;
    else if (ratio < 2.5) incomeBuckets['2–2.5×']++;
    else if (ratio < 3) incomeBuckets['2.5–3×']++;
    else incomeBuckets['3×+']++;
  });
  const incomeRatioDistribution: ScoreRangeCount[] = Object.entries(incomeBuckets).map(
    ([range, count]) => ({ range, count })
  );

  const response: AnalyticsData = {
    summary: { total, needsReview, approved, rejected, avgDecisionDays, approvalRate },
    applicationsOverTime,
    reviewQueueOverTime,
    weeklyStatusBreakdown,
    decisionTimes,
    approvalRateOverTime,
    unitCounts,
    rentRangeCounts,
    creditScoreDistribution,
    incomeRatioDistribution,
  };

  return NextResponse.json(response);
}
