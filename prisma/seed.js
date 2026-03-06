const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // ── Seed Admins ──
  const admins = [
    { name: 'Sarah Tan',  email: 'sarah@leaseflow.ph', role: 'superadmin', initials: 'ST', color: '#6d28d9' },
    { name: 'Mike Cruz',  email: 'mike@leaseflow.ph',  role: 'admin',      initials: 'MC', color: '#1d4ed8' },
    { name: 'Joy Reyes',  email: 'joy@leaseflow.ph',   role: 'admin',      initials: 'JR', color: '#0891b2' },
  ];

  for (const a of admins) {
    await prisma.admin.upsert({
      where: { email: a.email },
      update: {},
      create: { ...a, password: await bcrypt.hash('admin123', 10) },
    });
  }

  // ── Seed Demo Applications ──
  const demoApps = [
    {
      id: 'APP-2024-1060',
      firstName: 'Leonor', lastName: 'Santos', email: 'leonor@email.com',
      phone: '+63 912 345 6789', dob: '1990-03-15', idType: "Driver's License",
      unit: 'Unit 2B, 22 Magsaysay Ave', monthlyRent: 12000, monthlyIncome: 38400, moveIn: '2024-12-15',
      status: 'approved',
      decidedBy: 'Mike Cruz', decidedAt: new Date('2024-11-19T15:12:00Z'),
      decisionNotes: 'All criteria pass. Excellent credit. Positive landlord reference.',
      aiAnalysis: JSON.stringify({ creditScore: 720, creditPass: true, incomeRatio: '3.20', incomePass: true, employmentConsistent: true, landlordSentiment: { tone: 'Positive / Enthusiastic', phrases: '"excellent tenant", "always paid on time", "highly recommend"', recommendation: '✅ Explicitly given', confidence: 94, result: 'positive' }, scenario: 'approved', mismatches: [] }),
      docs: ['paystub1','paystub2','paystub3','employment','credit','govid','landlord'],
    },
    {
      id: 'APP-2024-1055',
      firstName: 'Ana', lastName: 'Lim', email: 'ana@email.com',
      phone: '+63 917 234 5678', dob: '1988-07-22', idType: 'Passport',
      unit: 'Unit 5A, 22 Magsaysay Ave', monthlyRent: 18000, monthlyIncome: 52000, moveIn: '2024-12-01',
      status: 'review',
      aiAnalysis: JSON.stringify({ creditScore: 665, creditPass: true, incomeRatio: '2.89', incomePass: true, employmentConsistent: true, landlordSentiment: { tone: 'Negative / Reluctant', phrases: '"had difficulties paying on time", "would not necessarily recommend", "occasional complaints"', recommendation: '❌ Not given', confidence: 87, result: 'negative' }, scenario: 'review', mismatches: [] }),
      docs: ['paystub1','paystub2','paystub3','employment','credit','govid','landlord'],
    },
    {
      id: 'APP-2024-1054',
      firstName: 'Ramon', lastName: 'Tan', email: 'ramon@email.com',
      phone: '+63 918 765 4321', dob: '1995-11-08', idType: 'SSS ID',
      unit: 'Unit 1C, 22 Magsaysay Ave', monthlyRent: 9000, monthlyIncome: 17100, moveIn: '2024-12-01',
      status: 'rejected',
      decidedBy: 'Joy Reyes', decidedAt: new Date('2024-11-18T16:04:00Z'),
      decisionNotes: 'Credit 580 below min 650. Income ratio 1.9× below 2.5×.',
      aiAnalysis: JSON.stringify({ creditScore: 580, creditPass: false, incomeRatio: '1.90', incomePass: false, employmentConsistent: true, landlordSentiment: { tone: 'Neutral / Factual', phrases: '"tenancy was uneventful"', recommendation: '⚠️ Neutral', confidence: 71, result: 'neutral' }, scenario: 'rejected', mismatches: [] }),
      docs: ['paystub1','paystub2','paystub3','employment','credit','govid','landlord'],
    },
    {
      id: 'APP-2024-1051',
      firstName: 'Mario', lastName: 'Cruz', email: 'mario@email.com',
      phone: '+63 920 111 2233', dob: '1992-05-30', idType: "Driver's License",
      unit: 'Unit 4F, 22 Magsaysay Ave', monthlyRent: 15000, monthlyIncome: 45000, moveIn: '2024-12-15',
      status: 'mismatch',
      aiAnalysis: JSON.stringify({ creditScore: null, creditPass: null, incomeRatio: null, incomePass: null, employmentConsistent: false, landlordSentiment: null, scenario: 'mismatch', mismatches: [{ doc: 'Employment Certificate', issue: 'Company "XYZ Holdings" does not match pay stubs showing "ABC Corp"' }, { doc: 'Pay Stub — Month 2 (October 2024)', issue: 'Salary ₱52,000 does not match employment letter stating ₱42,000' }] }),
      docs: ['paystub1','paystub2','paystub3','employment','credit','govid','landlord'],
    },
    {
      id: 'APP-2024-1050',
      firstName: 'Carla', lastName: 'Bautista', email: 'carla@email.com',
      phone: '+63 919 888 7766', dob: '1993-09-14', idType: 'PhilSys ID',
      unit: 'Unit 2A, 22 Magsaysay Ave', monthlyRent: 12000, monthlyIncome: 32400, moveIn: '2025-01-01',
      status: 'processing',
      aiAnalysis: JSON.stringify({ creditScore: 698, creditPass: true, incomeRatio: '2.70', incomePass: true, employmentConsistent: true, landlordSentiment: { tone: 'Positive / Enthusiastic', phrases: '"reliable tenant"', recommendation: '✅ Given', confidence: 89, result: 'positive' }, scenario: 'approved', mismatches: [] }),
      docs: ['paystub1','paystub2','paystub3','employment','credit','govid','landlord'],
    },
  ];

  for (const app of demoApps) {
    const { docs, ...appData } = app;
    await prisma.application.upsert({
      where: { id: app.id },
      update: {},
      create: {
        ...appData,
        submittedAt: new Date('2024-11-20T09:00:00Z'),
        documents: {
          create: docs.map(type => ({ type, filename: `${type}_demo.pdf`, status: 'uploaded' }))
        }
      },
    });
  }

  // ── Seed Properties ──
  const properties = [
    { unit: 'Unit 1A, 22 Magsaysay Ave', type: 'Studio',     floor: 1, monthlyRent:  8500, available: true  },
    { unit: 'Unit 1B, 22 Magsaysay Ave', type: 'Studio',     floor: 1, monthlyRent:  8500, available: true  },
    { unit: 'Unit 1C, 22 Magsaysay Ave', type: 'Studio',     floor: 1, monthlyRent:  9000, available: false },
    { unit: 'Unit 2A, 22 Magsaysay Ave', type: '1-Bedroom',  floor: 2, monthlyRent: 12000, available: false },
    { unit: 'Unit 2B, 22 Magsaysay Ave', type: '1-Bedroom',  floor: 2, monthlyRent: 12000, available: false },
    { unit: 'Unit 2C, 22 Magsaysay Ave', type: '1-Bedroom',  floor: 2, monthlyRent: 12500, available: true  },
    { unit: 'Unit 3A, 22 Magsaysay Ave', type: '2-Bedroom',  floor: 3, monthlyRent: 18000, available: true  },
    { unit: 'Unit 3B, 22 Magsaysay Ave', type: '2-Bedroom',  floor: 3, monthlyRent: 18000, available: true  },
    { unit: 'Unit 4F, 22 Magsaysay Ave', type: '2-Bedroom',  floor: 4, monthlyRent: 15000, available: false },
    { unit: 'Unit 5A, 22 Magsaysay Ave', type: '3-Bedroom',  floor: 5, monthlyRent: 25000, available: false },
    { unit: 'Unit 5B, 22 Magsaysay Ave', type: '3-Bedroom',  floor: 5, monthlyRent: 25000, available: true  },
    { unit: 'Unit 6A, 22 Magsaysay Ave', type: 'Penthouse',  floor: 6, monthlyRent: 38000, available: true  },
  ];

  for (const p of properties) {
    await prisma.property.upsert({
      where: { unit: p.unit },
      update: { available: p.available, monthlyRent: p.monthlyRent },
      create: p,
    });
  }

  console.log('✅ Database seeded successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
