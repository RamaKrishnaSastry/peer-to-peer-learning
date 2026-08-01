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
  source: string;
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
    source: 'NCERT Class 12 - Themes in Indian History (Part I)',
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
    source: 'Laxmikanth - Indian Polity',
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
    source: 'Laxmikanth - Indian Polity',
  },
  {
    type: 'UPSC',
    question:
      'Impeachment of the President of India for violation of the Constitution is governed by which Article?',
    options: [
      { label: 'A', text: 'Article 56' },
      { label: 'B', text: 'Article 61' },
      { label: 'C', text: 'Article 75' },
      { label: 'D', text: 'Article 124' },
    ],
    correctAnswer: 'B',
    explanation:
      'Article 61 provides the procedure for impeachment of the President. The charge may be initiated by either House of Parliament.',
    source: 'Laxmikanth - Indian Polity',
  },
  {
    type: 'UPSC',
    question: 'Which of the following Indian rivers flows through a rift valley?',
    options: [
      { label: 'A', text: 'Krishna' },
      { label: 'B', text: 'Godavari' },
      { label: 'C', text: 'Narmada' },
      { label: 'D', text: 'Mahanadi' },
    ],
    correctAnswer: 'C',
    explanation:
      'The Narmada and the Tapi are west-flowing rivers that flow through rift valleys between the Vindhyas and the Satpura ranges.',
    source: 'NCERT Class 11 Geography - India Physical Environment',
  },
  {
    type: 'UPSC',
    question:
      'NITI Aayog, established in 2015, replaced which earlier body?',
    options: [
      { label: 'A', text: 'Finance Commission' },
      { label: 'B', text: 'Planning Commission' },
      { label: 'C', text: 'National Development Council' },
      { label: 'D', text: 'Fiscal Policy Committee' },
    ],
    correctAnswer: 'B',
    explanation:
      'NITI Aayog (National Institution for Transforming India) replaced the Planning Commission on 1 January 2015.',
    source: 'Ramesh Singh - Indian Economy',
  },
  {
    type: 'UPSC',
    question: 'The Poona Pact (1932) was signed between Mahatma Gandhi and ____.',
    options: [
      { label: 'A', text: 'Muhammad Ali Jinnah' },
      { label: 'B', text: 'Dr. B.R. Ambedkar' },
      { label: 'C', text: 'Jawaharlal Nehru' },
      { label: 'D', text: 'C. Rajagopalachari' },
    ],
    correctAnswer: 'B',
    explanation:
      'The Poona Pact of September 1932 was agreed between Mahatma Gandhi and Dr. B.R. Ambedkar, revising the separate electorate for Depressed Classes announced in the Communal Award.',
    source: 'Spectrum - A Brief History of Modern India',
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
    source: 'NCERT Class 11 Physics',
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
    source: 'NCERT Class 11 Mathematics',
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
    source: 'NCERT Class 11 Chemistry',
  },
  {
    type: 'JEE',
    question:
      'A spring of force constant k is cut into two equal halves. The force constant of each half is ____.',
    options: [
      { label: 'A', text: 'k/2' },
      { label: 'B', text: 'k' },
      { label: 'C', text: '2k' },
      { label: 'D', text: '4k' },
    ],
    correctAnswer: 'C',
    explanation:
      'Force constant is inversely proportional to the length of the spring. Halving the length doubles the force constant, so each half has constant 2k.',
    source: 'HC Verma - Concepts of Physics',
  },
  {
    type: 'JEE',
    question:
      'The molecular geometry of the ammonia molecule (NH₃) is ____.',
    options: [
      { label: 'A', text: 'Trigonal planar' },
      { label: 'B', text: 'Trigonal pyramidal' },
      { label: 'C', text: 'Tetrahedral' },
      { label: 'D', text: 'Bent' },
    ],
    correctAnswer: 'B',
    explanation:
      'Nitrogen in NH₃ is sp³ hybridized with one lone pair, giving a trigonal pyramidal shape with a bond angle of about 107°.',
    source: 'NCERT Class 11 Chemistry',
  },
  {
    type: 'JEE',
    question: 'The value of the definite integral ∫₀¹ x dx is ____.',
    options: [
      { label: 'A', text: '0' },
      { label: 'B', text: '1/2' },
      { label: 'C', text: '1' },
      { label: 'D', text: '2' },
    ],
    correctAnswer: 'B',
    explanation:
      '∫₀¹ x dx = [x²/2]₀¹ = 1/2 - 0 = 1/2.',
    source: 'NCERT Class 12 Mathematics',
  },
  {
    type: 'JEE',
    question: 'The dimensional formula of force is ____.',
    options: [
      { label: 'A', text: '[MLT⁻²]' },
      { label: 'B', text: '[ML²T⁻²]' },
      { label: 'C', text: '[MLT⁻¹]' },
      { label: 'D', text: '[ML⁻¹T⁻²]' },
    ],
    correctAnswer: 'A',
    explanation:
      'Force = mass × acceleration = M × LT⁻², giving dimensions [MLT⁻²].',
    source: 'NCERT Class 11 Physics',
  },
  {
    type: 'JEE',
    question: 'Which of the following molecules has a zero dipole moment?',
    options: [
      { label: 'A', text: 'NH₃' },
      { label: 'B', text: 'H₂O' },
      { label: 'C', text: 'CO₂' },
      { label: 'D', text: 'CHCl₃' },
    ],
    correctAnswer: 'C',
    explanation:
      'CO₂ is linear with two identical C=O bond dipoles pointing in opposite directions, so they cancel and the molecule has a zero net dipole moment.',
    source: 'NCERT Class 11 Chemistry',
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
    source: 'NSE Academy - Securities Markets',
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
    source: 'NISM - Equity Markets',
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
    source: 'The Intelligent Investor - Benjamin Graham',
  },
  {
    type: 'Finance',
    question: 'The "face value" of a share refers to its ____.',
    options: [
      { label: 'A', text: 'Current market price' },
      { label: 'B', text: 'Nominal value fixed at the time of issue' },
      { label: 'C', text: 'Book value on the balance sheet' },
      { label: 'D', text: 'Liquidation value of the company' },
    ],
    correctAnswer: 'B',
    explanation:
      'Face value (or par value) is the nominal value assigned to a share at the time of issuance and is printed on the share certificate.',
    source: 'NSE Academy - Equity Markets',
  },
  {
    type: 'Finance',
    question: 'The primary function of the Reserve Bank of India (RBI) is to ____.',
    options: [
      { label: 'A', text: 'Regulate stock market trading' },
      { label: 'B', text: 'Regulate the supply of money and credit in the economy' },
      { label: 'C', text: 'Manage company registrations' },
      { label: 'D', text: 'Frame the fiscal budget' },
    ],
    correctAnswer: 'B',
    explanation:
      'As the central bank, the RBI formulates and implements monetary policy to regulate the supply of money and credit in the economy.',
    source: 'NCERT Class 12 Macroeconomics',
  },
  {
    type: 'Finance',
    question: 'In fundamental analysis, the abbreviation "EPS" stands for ____.',
    options: [
      { label: 'A', text: 'Equity Performance Score' },
      { label: 'B', text: 'Earnings Per Share' },
      { label: 'C', text: 'Estimated Profit Share' },
      { label: 'D', text: 'Equity Price Spread' },
    ],
    correctAnswer: 'B',
    explanation:
      'Earnings per share (EPS) is net profit divided by the number of outstanding shares — a core input in valuation multiples.',
    source: 'NISM - Fundamental Analysis',
  },
  {
    type: 'Finance',
    question: 'Which type of mutual fund scheme aims to track a market index such as the Nifty 50?',
    options: [
      { label: 'A', text: 'Sectoral fund' },
      { label: 'B', text: 'Index fund' },
      { label: 'C', text: 'Balanced fund' },
      { label: 'D', text: 'Liquid fund' },
    ],
    correctAnswer: 'B',
    explanation:
      'An index fund passively tracks a market index (for example the Nifty 50), aiming to mirror its composition and returns.',
    source: 'NSE Academy - Mutual Funds',
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
  const types = ['UPSC', 'JEE', 'Finance'] as const;

  for (const type of types) {
    const seeds = questionSeeds.filter((s) => s.type === type);

    for (const [index, seed] of seeds.entries()) {
      // First three: today, tomorrow, day-after. Rest: distinct past dates so
      // they enrich the pool used by rotation and LLM variant generation.
      const date = index < 3 ? daysFromNow(index) : daysFromNow(-(index + 1));

      await prisma.dailyQuestion.upsert({
        where: { type_date: { type, date } },
        update: {},
        create: {
          question: seed.question,
          options: JSON.stringify(seed.options),
          correctAnswer: seed.correctAnswer,
          explanation: seed.explanation,
          source: seed.source,
          type,
          date,
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
