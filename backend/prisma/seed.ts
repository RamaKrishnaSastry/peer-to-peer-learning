import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const daysFromNow = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return startOfDay(d);
};

interface CategorySeed {
  name: string;
  slug: string;
  domain: string;
  level: number;
  parentId: number | null;
}

const categorySeeds: CategorySeed[] = [
  // UPSC tree
  { name: 'UPSC', slug: 'upsc', domain: 'UPSC', level: 0, parentId: null },
  { name: 'General Studies 1', slug: 'gs1', domain: 'UPSC', level: 1, parentId: 0 },
  { name: 'General Studies 2', slug: 'gs2', domain: 'UPSC', level: 1, parentId: 0 },
  { name: 'History & Culture', slug: 'history-culture', domain: 'UPSC', level: 2, parentId: 1 },
  { name: 'Ancient India', slug: 'ancient-india', domain: 'UPSC', level: 3, parentId: 4 },
  { name: 'Medieval India', slug: 'medieval-india', domain: 'UPSC', level: 3, parentId: 4 },
  { name: 'Modern India', slug: 'modern-india', domain: 'UPSC', level: 3, parentId: 4 },
  { name: 'Geography', slug: 'geography', domain: 'UPSC', level: 2, parentId: 1 },
  { name: 'Indian Geography', slug: 'indian-geography', domain: 'UPSC', level: 3, parentId: 8 },
  { name: 'Polity', slug: 'polity', domain: 'UPSC', level: 2, parentId: 2 },
  { name: 'Constitution', slug: 'constitution', domain: 'UPSC', level: 3, parentId: 10 },
  // JEE tree
  { name: 'JEE', slug: 'jee', domain: 'JEE', level: 0, parentId: null },
  { name: 'Physics', slug: 'physics', domain: 'JEE', level: 1, parentId: 12 },
  { name: 'Mechanics', slug: 'mechanics', domain: 'JEE', level: 2, parentId: 13 },
  { name: 'Electromagnetism', slug: 'electromagnetism', domain: 'JEE', level: 2, parentId: 13 },
  { name: 'Chemistry', slug: 'chemistry', domain: 'JEE', level: 1, parentId: 12 },
  { name: 'Physical Chemistry', slug: 'physical-chemistry', domain: 'JEE', level: 2, parentId: 16 },
  { name: 'Organic Chemistry', slug: 'organic-chemistry', domain: 'JEE', level: 2, parentId: 16 },
  { name: 'Mathematics', slug: 'mathematics', domain: 'JEE', level: 1, parentId: 12 },
  { name: 'Calculus', slug: 'calculus', domain: 'JEE', level: 2, parentId: 19 },
  { name: 'Algebra', slug: 'algebra', domain: 'JEE', level: 2, parentId: 19 },
  // Finance tree
  { name: 'Finance', slug: 'finance', domain: 'Finance', level: 0, parentId: null },
  { name: 'Stock Markets', slug: 'stock-markets', domain: 'Finance', level: 1, parentId: 22 },
  { name: 'Fundamental Analysis', slug: 'fundamental-analysis', domain: 'Finance', level: 2, parentId: 23 },
  { name: 'Technical Analysis', slug: 'technical-analysis', domain: 'Finance', level: 2, parentId: 23 },
  { name: 'Personal Finance', slug: 'personal-finance', domain: 'Finance', level: 1, parentId: 22 },
  { name: 'Budgeting', slug: 'budgeting', domain: 'Finance', level: 2, parentId: 26 },
];

interface QuestionSeed {
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  type: string;
}

const questionSeeds: QuestionSeed[] = [
  {
    type: 'UPSC',
    question:
      'The Harappan civilization is primarily known as a/an ____ civilization.',
    options: [
      { label: 'A', text: 'Agrarian' },
      { label: 'B', text: 'Urban' },
      { label: 'C', text: 'Pastoral' },
      { label: 'D', text: 'Hunting-gathering' },
    ],
    correctAnswer: 'B',
    explanation:
      'The Indus Valley (Harappan) civilization was urban in character, with well-planned cities such as Mohenjo-daro and Harappa featuring grid layouts and drainage systems.',
  },
  {
    type: 'UPSC',
    question:
      'The Directive Principles of State Policy were borrowed from the Constitution of ____.',
    options: [
      { label: 'A', text: 'USA' },
      { label: 'B', text: 'Ireland' },
      { label: 'C', text: 'United Kingdom' },
      { label: 'D', text: 'Canada' },
    ],
    correctAnswer: 'B',
    explanation:
      'The Directive Principles of State Policy (Part IV) were borrowed from the Irish Constitution, which itself was influenced by the Spanish Constitution.',
  },
  {
    type: 'UPSC',
    question:
      'The right to vote in elections for the Lok Sabha is granted under which Article of the Indian Constitution?',
    options: [
      { label: 'A', text: 'Article 19' },
      { label: 'B', text: 'Article 21' },
      { label: 'C', text: 'Article 326' },
      { label: 'D', text: 'Article 356' },
    ],
    correctAnswer: 'C',
    explanation:
      'Article 326 provides that elections to the Lok Sabha and State Legislative Assemblies shall be on the basis of adult suffrage.',
  },
  {
    type: 'JEE',
    question:
      'A body is projected vertically upward with velocity v. The time taken to reach the maximum height is ____.',
    options: [
      { label: 'A', text: 'v/g' },
      { label: 'B', text: '2v/g' },
      { label: 'C', text: 'v/(2g)' },
      { label: 'D', text: 'v²/g' },
    ],
    correctAnswer: 'A',
    explanation:
      'At maximum height the final velocity is zero. Using v = u - gt with u = v and v = 0 gives t = v/g.',
  },
  {
    type: 'JEE',
    question:
      'If f(x) = x² - 4x + 3, then the number of real roots of f(x) = 0 is ____.',
    options: [
      { label: 'A', text: '0' },
      { label: 'B', text: '1' },
      { label: 'C', text: '2' },
      { label: 'D', text: '4' },
    ],
    correctAnswer: 'C',
    explanation:
      'The discriminant is D = b² - 4ac = 16 - 12 = 4 > 0, so the quadratic has two distinct real roots (x = 1 and x = 3).',
  },
  {
    type: 'JEE',
    question:
      'The hybridization of carbon in methane (CH₄) is ____.',
    options: [
      { label: 'A', text: 'sp' },
      { label: 'B', text: 'sp²' },
      { label: 'C', text: 'sp³' },
      { label: 'D', text: 'dsp²' },
    ],
    correctAnswer: 'C',
    explanation:
      'Carbon in methane forms four sigma bonds with four hydrogen atoms and no lone pairs, corresponding to sp³ hybridization with a tetrahedral geometry.',
  },
  {
    type: 'Finance',
    question:
      'Which of the following is a debt instrument issued by a company to raise capital?',
    options: [
      { label: 'A', text: 'Equity share' },
      { label: 'B', text: 'Bond' },
      { label: 'C', text: 'Mutual fund unit' },
      { label: 'D', text: 'Derivative option' },
    ],
    correctAnswer: 'B',
    explanation:
      'A bond is a fixed-income debt instrument through which a company borrows money from investors and promises to repay principal with interest.',
  },
  {
    type: 'Finance',
    question:
      'The price-to-earnings (P/E) ratio primarily measures ____.',
    options: [
      { label: 'A', text: 'A company’s total debt' },
      { label: 'B', text: 'How much investors pay per unit of earnings' },
      { label: 'C', text: 'Dividend yield' },
      { label: 'D', text: 'Market volatility' },
    ],
    correctAnswer: 'B',
    explanation:
      'The P/E ratio compares a company’s share price to its earnings per share, indicating how much investors are willing to pay for each unit of earnings.',
  },
  {
    type: 'Finance',
    question: 'What does diversification in investing primarily aim to reduce?',
    options: [
      { label: 'A', text: 'Returns' },
      { label: 'B', text: 'Risk' },
      { label: 'C', text: 'Tax liability' },
      { label: 'D', text: 'Liquidity' },
    ],
    correctAnswer: 'B',
    explanation:
      'Diversification spreads investments across different assets, reducing unsystematic (specific) risk without necessarily reducing expected returns.',
  },
];

const badgeSeeds = [
  { name: 'First Step', slug: 'first-step' },
  { name: 'Rising Star', slug: 'rising-star' },
  { name: 'Helper', slug: 'helper' },
  { name: 'Streak 7', slug: 'streak-7' },
  { name: 'Top Contributor', slug: 'top-contributor' },
];

async function seedCategories() {
  for (const seed of categorySeeds) {
    const parent = seed.parentId !== null ? await prisma.category.findUnique({ where: { slug: categorySeeds[seed.parentId].slug } }) : null;
    const pathParts: string[] = [];
    if (parent) {
      pathParts.push(parent.path);
    }
    pathParts.push(seed.name);
    await prisma.category.upsert({
      where: { slug: seed.slug },
      update: {},
      create: {
        name: seed.name,
        slug: seed.slug,
        domain: seed.domain,
        level: seed.level,
        parentId: parent?.id ?? null,
        path: pathParts.join('/'),
        isLeaf: seed.level === 3,
      },
    });
  }
}

async function seedQuestions() {
  // Spread questions one per day so the "today" endpoint always has content.
  for (const seed of questionSeeds) {
    await prisma.dailyQuestion.upsert({
      where: {
        type_date: { type: seed.type, date: daysFromNow(0) },
      },
      update: {},
      create: {
        question: seed.question,
        options: JSON.stringify(seed.options),
        correctAnswer: seed.correctAnswer,
        explanation: seed.explanation,
        type: seed.type,
        date: daysFromNow(0),
      },
    });
  }
  // Add one extra question per domain on following days so rotation has variety.
  const tomorrow: Record<string, QuestionSeed> = {
    UPSC: questionSeeds[1],
    JEE: questionSeeds[4],
    Finance: questionSeeds[7],
  };
  const dayAfter: Record<string, QuestionSeed> = {
    UPSC: questionSeeds[2],
    JEE: questionSeeds[5],
    Finance: questionSeeds[8],
  };
  for (const type of ['UPSC', 'JEE', 'Finance'] as const) {
    for (const [offset, map] of [[1, tomorrow], [2, dayAfter]] as const) {
      const seed = map[type];
      await prisma.dailyQuestion.upsert({
        where: { type_date: { type, date: daysFromNow(offset) } },
        update: {},
        create: {
          question: seed.question,
          options: JSON.stringify(seed.options),
          correctAnswer: seed.correctAnswer,
          explanation: seed.explanation,
          type,
          date: daysFromNow(offset),
        },
      });
    }
  }
}

async function seedBadges() {
  for (const badge of badgeSeeds) {
    await prisma.badge.upsert({
      where: { slug: badge.slug },
      update: {},
      create: badge,
    });
  }
}

async function main() {
  await seedCategories();
  await seedQuestions();
  await seedBadges();
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
