/**
 * Dummy AI Analysis Generator
 * Simulates document verification, credit scoring, and landlord sentiment analysis.
 */

const SENTIMENT_OPTIONS = [
  {
    tone: 'Positive / Enthusiastic',
    phrases: '"excellent tenant", "always paid on time", "highly recommend"',
    recommendation: '✅ Explicitly given',
    result: 'positive',
  },
  {
    tone: 'Negative / Reluctant',
    phrases: '"had difficulties paying on time", "would not necessarily recommend", "occasional complaints"',
    recommendation: '❌ Not given',
    result: 'negative',
  },
  {
    tone: 'Neutral / Factual',
    phrases: '"tenancy was uneventful", "unit returned in acceptable condition"',
    recommendation: '⚠️ Neutral — no clear stance',
    result: 'neutral',
  },
];

export function generateAIAnalysis({ monthlyRent, monthlyIncome }) {
  const rent = parseFloat(monthlyRent) || 0;
  const income = parseFloat(monthlyIncome) || 0;
  const incomeRatio = rent > 0 ? income / rent : 0;

  const baseCreditScore = 560 + Math.floor(incomeRatio * 45) + Math.floor(Math.random() * 70);
  const creditScore = Math.min(850, Math.max(490, baseCreditScore));

  const creditPass = creditScore >= 650;
  const incomePass = incomeRatio >= 2.5;

  let landlordSentiment;
  let scenario;

  if (creditPass && incomePass) {
    const roll = Math.random();
    if (roll < 0.65) {
      landlordSentiment = { ...SENTIMENT_OPTIONS[0], confidence: Math.floor(88 + Math.random() * 10) };
      scenario = 'approved';
    } else if (roll < 0.88) {
      landlordSentiment = { ...SENTIMENT_OPTIONS[1], confidence: Math.floor(82 + Math.random() * 10) };
      scenario = 'review';
    } else {
      landlordSentiment = { ...SENTIMENT_OPTIONS[2], confidence: Math.floor(74 + Math.random() * 10) };
      scenario = 'mismatch';
    }
  } else if (!creditPass && !incomePass) {
    landlordSentiment = { ...SENTIMENT_OPTIONS[1], confidence: Math.floor(80 + Math.random() * 10) };
    scenario = 'rejected';
  } else {
    landlordSentiment = { ...SENTIMENT_OPTIONS[1], confidence: Math.floor(82 + Math.random() * 10) };
    scenario = 'review';
  }

  return {
    creditScore,
    creditPass,
    incomeRatio: incomeRatio.toFixed(2),
    incomePass,
    employmentConsistent: true,
    landlordSentiment,
    scenario,
    mismatches: scenario === 'mismatch'
      ? [
          { doc: 'Employment Certificate', issue: 'Company name on certificate does not match pay stubs' },
          { doc: 'Pay Stub — Month 2', issue: 'Salary amount does not match employment letter' },
        ]
      : [],
    analysedAt: new Date().toISOString(),
  };
}

export function getInitialStatus(scenario) {
  if (scenario === 'mismatch') return 'mismatch';
  if (scenario === 'review') return 'review';
  if (scenario === 'rejected') return 'rejected';
  return 'processing'; // approved apps start as processing until admin approves
}
