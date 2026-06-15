import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log('🌱 Seeding PropOS database...');

  // ─── PROP FIRMS ───────────────────────────────────────────────────────────

  const firms = [
    {
      name: 'FTMO', slug: 'ftmo', websiteUrl: 'https://ftmo.com',
      country: 'Czech Republic', foundedYear: 2014,
      description: 'One of the most established prop firms worldwide. Known for reliability, fast payouts and transparent rules.',
      instruments: ['Forex', 'Indices', 'Commodities', 'Crypto', 'Stocks'],
      platforms: ['MT4', 'MT5', 'cTrader'],
      payoutMethods: ['Bank Wire', 'Skrill', 'Wise'],
      trustScore: 91, communityRating: 4.8, reviewCount: 3891, isVerified: true,
      challengeTypes: [
        {
          name: '2-Step FTMO Challenge', slug: '2-step', description: 'Classic 2-phase evaluation',
          sizes: [10000, 25000, 50000, 100000, 200000],
          prices: [155, 250, 345, 540, 1080],
          phases: [
            { phase: 1, profitTargetPct: 10, dailyDrawdownPct: 5, maxDrawdownPct: 10, minTradingDays: 4, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: false, consistencyRule: false },
            { phase: 2, profitTargetPct: 5,  dailyDrawdownPct: 5, maxDrawdownPct: 10, minTradingDays: 4, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: false, consistencyRule: false },
            { phase: 3, profitTargetPct: 0,  dailyDrawdownPct: 5, maxDrawdownPct: 10, minTradingDays: 0, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: false, consistencyRule: false },
          ],
        },
        {
          name: 'Swing FTMO Challenge', slug: 'swing', description: 'Overnight and weekend holding allowed',
          sizes: [10000, 25000, 50000, 100000, 200000],
          prices: [250, 345, 480, 750, 1480],
          phases: [
            { phase: 1, profitTargetPct: 10, dailyDrawdownPct: 10, maxDrawdownPct: 20, minTradingDays: 4, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, overnightHoldingAllowed: true, weekendHoldingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 5,  dailyDrawdownPct: 10, maxDrawdownPct: 20, minTradingDays: 4, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, overnightHoldingAllowed: true, weekendHoldingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
    {
      name: 'FundingPips', slug: 'fundingpips', websiteUrl: 'https://fundingpips.com',
      country: 'UAE', foundedYear: 2022,
      description: 'Fast-growing prop firm with competitive pricing and on-demand payouts. Popular among forex traders.',
      instruments: ['Forex', 'Indices', 'Commodities', 'Metals'],
      platforms: ['MT5', 'cTrader'],
      payoutMethods: ['Bank Wire', 'Crypto', 'Wise'],
      trustScore: 94, communityRating: 4.6, reviewCount: 1247, isVerified: true,
      challengeTypes: [
        {
          name: '1-Step Challenge', slug: '1-step', description: 'Single-phase evaluation, fastest path to funding',
          sizes: [5000, 10000, 25000, 50000, 100000, 200000],
          prices: [49, 75, 149, 249, 449, 799],
          phases: [
            { phase: 1, profitTargetPct: 8, dailyDrawdownPct: 4, maxDrawdownPct: 8, minTradingDays: 3, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 0, dailyDrawdownPct: 4, maxDrawdownPct: 8, minTradingDays: 0, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
        {
          name: '2-Step Challenge', slug: '2-step', description: 'Standard 2-phase evaluation',
          sizes: [5000, 10000, 25000, 50000, 100000, 200000],
          prices: [39, 59, 99, 189, 349, 649],
          phases: [
            { phase: 1, profitTargetPct: 10, dailyDrawdownPct: 4, maxDrawdownPct: 8, minTradingDays: 3, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 5,  dailyDrawdownPct: 4, maxDrawdownPct: 8, minTradingDays: 3, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
            { phase: 3, profitTargetPct: 0,  dailyDrawdownPct: 4, maxDrawdownPct: 8, minTradingDays: 0, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
    {
      name: 'The5ers', slug: 'the5ers', websiteUrl: 'https://the5ers.com',
      country: 'Israel', foundedYear: 2016,
      description: 'Unique model with 100% profit split. Traders keep all profits after passing evaluation.',
      instruments: ['Forex', 'Metals', 'Indices'],
      platforms: ['MT5'],
      payoutMethods: ['Bank Wire', 'PayPal', 'Skrill'],
      trustScore: 89, communityRating: 4.3, reviewCount: 982, isVerified: true,
      challengeTypes: [
        {
          name: 'Bootcamp', slug: 'bootcamp', description: '100% profit split, no time limit',
          sizes: [20000, 40000, 60000, 80000, 100000],
          prices: [95, 175, 225, 275, 325],
          phases: [
            { phase: 1, profitTargetPct: 6, dailyDrawdownPct: 4, maxDrawdownPct: 8, minTradingDays: 0, profitSplitPct: 100, payoutFrequency: 'Monthly', newsTradingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 0, dailyDrawdownPct: 4, maxDrawdownPct: 8, minTradingDays: 0, profitSplitPct: 100, payoutFrequency: 'Monthly', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
    {
      name: 'FundedNext', slug: 'fundednext', websiteUrl: 'https://fundednext.com',
      country: 'Bangladesh', foundedYear: 2022,
      description: 'One of the fastest growing prop firms. Offers up to $300k funding and 15% profit share during challenge.',
      instruments: ['Forex', 'Indices', 'Crypto', 'Commodities'],
      platforms: ['MT4', 'MT5'],
      payoutMethods: ['Bank Wire', 'Crypto', 'Wise'],
      trustScore: 86, communityRating: 4.1, reviewCount: 741, isVerified: true,
      challengeTypes: [
        {
          name: 'Stellar 1-Phase', slug: 'stellar-1', description: '1-step evaluation',
          sizes: [6000, 15000, 25000, 50000, 100000, 200000, 300000],
          prices: [59, 99, 149, 249, 449, 799, 1099],
          phases: [
            { phase: 1, profitTargetPct: 10, dailyDrawdownPct: 5, maxDrawdownPct: 10, minTradingDays: 5, profitSplitPct: 90, payoutFrequency: 'Bi-weekly', newsTradingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 0,  dailyDrawdownPct: 5, maxDrawdownPct: 10, minTradingDays: 0, profitSplitPct: 90, payoutFrequency: 'Bi-weekly', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
    {
      name: 'E8 Markets', slug: 'e8markets', websiteUrl: 'https://e8markets.com',
      country: 'USA', foundedYear: 2021,
      description: 'Known for a clear scaling plan and fast payouts. Popular with both forex and futures traders.',
      instruments: ['Forex', 'Indices', 'Commodities', 'Futures'],
      platforms: ['MT4', 'MT5', 'DXTrade'],
      payoutMethods: ['Bank Wire', 'Crypto', 'Payoneer'],
      trustScore: 84, communityRating: 4.2, reviewCount: 623, isVerified: true,
      challengeTypes: [
        {
          name: 'E8 Evaluation', slug: 'e8-eval', description: '2-phase evaluation with scaling plan',
          sizes: [25000, 50000, 100000, 250000],
          prices: [168, 228, 388, 848],
          phases: [
            { phase: 1, profitTargetPct: 8, dailyDrawdownPct: 5, maxDrawdownPct: 8, minTradingDays: 3, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: true, consistencyPct: 40 },
            { phase: 2, profitTargetPct: 5, dailyDrawdownPct: 5, maxDrawdownPct: 8, minTradingDays: 3, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: true, consistencyPct: 40 },
            { phase: 3, profitTargetPct: 0, dailyDrawdownPct: 5, maxDrawdownPct: 8, minTradingDays: 0, profitSplitPct: 80, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
    {
      name: 'Alpha Capital', slug: 'alphacapital', websiteUrl: 'https://alphacapitalgroup.uk',
      country: 'UK', foundedYear: 2021,
      description: 'UK-based prop firm with competitive rules and bi-weekly payouts.',
      instruments: ['Forex', 'Indices', 'Commodities'],
      platforms: ['MT4', 'MT5'],
      payoutMethods: ['Bank Wire', 'Crypto'],
      trustScore: 81, communityRating: 3.9, reviewCount: 412, isVerified: true,
      challengeTypes: [
        {
          name: 'Standard Challenge', slug: 'standard', description: '2-phase evaluation',
          sizes: [10000, 25000, 50000, 100000],
          prices: [99, 199, 299, 499],
          phases: [
            { phase: 1, profitTargetPct: 10, dailyDrawdownPct: 5, maxDrawdownPct: 10, minTradingDays: 5, profitSplitPct: 80, payoutFrequency: 'Bi-weekly', newsTradingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 5,  dailyDrawdownPct: 5, maxDrawdownPct: 10, minTradingDays: 5, profitSplitPct: 80, payoutFrequency: 'Bi-weekly', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
    {
      name: 'Blue Guardian', slug: 'blueguardian', websiteUrl: 'https://blueguardian.co',
      country: 'UK', foundedYear: 2021,
      description: 'Allows crypto trading and has a relaxed news trading policy. Good for swing traders.',
      instruments: ['Forex', 'Indices', 'Crypto', 'Metals'],
      platforms: ['MT4', 'MT5'],
      payoutMethods: ['Bank Wire', 'Crypto', 'Payoneer'],
      trustScore: 79, communityRating: 4.0, reviewCount: 318, isVerified: false,
      challengeTypes: [
        {
          name: 'Guardian Challenge', slug: 'guardian', description: '2-phase evaluation, crypto allowed',
          sizes: [10000, 25000, 50000, 100000, 200000],
          prices: [79, 149, 259, 449, 849],
          phases: [
            { phase: 1, profitTargetPct: 10, dailyDrawdownPct: 5, maxDrawdownPct: 8, minTradingDays: 4, profitSplitPct: 85, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 5,  dailyDrawdownPct: 5, maxDrawdownPct: 8, minTradingDays: 4, profitSplitPct: 85, payoutFrequency: 'On Demand', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
    {
      name: 'Topstep', slug: 'topstep', websiteUrl: 'https://topstep.com',
      country: 'USA', foundedYear: 2012,
      description: 'The original futures prop firm. Specialises exclusively in futures and forex futures.',
      instruments: ['Futures', 'Forex Futures'],
      platforms: ['Rithmic', 'TradingView', 'NinjaTrader'],
      payoutMethods: ['Bank Wire', 'PayPal'],
      trustScore: 88, communityRating: 4.4, reviewCount: 2140, isVerified: true,
      challengeTypes: [
        {
          name: 'Trading Combine', slug: 'combine', description: 'Futures evaluation with daily loss limit',
          sizes: [50000, 100000, 150000],
          prices: [165, 325, 375],
          phases: [
            { phase: 1, profitTargetPct: 6, dailyDrawdownPct: 2, maxDrawdownPct: 3, minTradingDays: 10, profitSplitPct: 90, payoutFrequency: 'Weekly', newsTradingAllowed: true, consistencyRule: false },
            { phase: 2, profitTargetPct: 0, dailyDrawdownPct: 2, maxDrawdownPct: 3, minTradingDays: 0, profitSplitPct: 90, payoutFrequency: 'Weekly', newsTradingAllowed: true, consistencyRule: false },
          ],
        },
      ],
    },
  ];

  for (const firmData of firms) {
    const { challengeTypes, ...firmFields } = firmData;

    const firm = await prisma.propFirm.upsert({
      where: { slug: firmFields.slug },
      create: firmFields,
      update: { trustScore: firmFields.trustScore, communityRating: firmFields.communityRating, reviewCount: firmFields.reviewCount },
    });

    for (const ctData of challengeTypes) {
      const { sizes, prices, phases, ...ctFields } = ctData;

      const ct = await prisma.propFirmChallengeType.upsert({
        where: { id: `${firm.id}-${ctFields.slug}` },
        create: { ...ctFields, propFirmId: firm.id },
        update: {},
      }).catch(async () => {
        // Handle upsert by slug lookup
        const existing = await prisma.propFirmChallengeType.findFirst({
          where: { propFirmId: firm.id, slug: ctFields.slug },
        });
        if (existing) return existing;
        return prisma.propFirmChallengeType.create({ data: { ...ctFields, propFirmId: firm.id } });
      });

      // Account sizes
      for (let i = 0; i < sizes.length; i++) {
        const existing = await prisma.propFirmAccountSize.findFirst({
          where: { challengeTypeId: ct.id, accountSize: sizes[i] },
        });
        if (!existing) {
          await prisma.propFirmAccountSize.create({
            data: { challengeTypeId: ct.id, accountSize: sizes[i], price: prices[i] ?? null },
          });
        }
      }

      // Rules per phase
      for (const phaseData of phases) {
        const existing = await prisma.propFirmRule.findFirst({
          where: { propFirmId: firm.id, challengeTypeId: ct.id, phase: phaseData.phase, isCurrent: true },
        });
        if (!existing) {
          await prisma.propFirmRule.create({
            data: {
              propFirmId: firm.id,
              challengeTypeId: ct.id,
              phase: phaseData.phase,
              profitTargetPct: phaseData.profitTargetPct,
              dailyDrawdownPct: phaseData.dailyDrawdownPct,
              maxDrawdownPct: phaseData.maxDrawdownPct,
              minTradingDays: phaseData.minTradingDays,
              profitSplitPct: phaseData.profitSplitPct,
              payoutFrequency: phaseData.payoutFrequency,
              newsTradingAllowed: (phaseData as any).newsTradingAllowed ?? true,
              overnightHoldingAllowed: (phaseData as any).overnightHoldingAllowed ?? true,
              weekendHoldingAllowed: (phaseData as any).weekendHoldingAllowed ?? false,
              consistencyRule: (phaseData as any).consistencyRule ?? false,
              consistencyPct: (phaseData as any).consistencyPct ?? null,
              isCurrent: true,
            },
          });
        }
      }
    }

    console.log(`  ✅ ${firm.name}`);
  }

  console.log('\n✅ Seed complete — 8 prop firms seeded with challenge types, account sizes and rules.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
