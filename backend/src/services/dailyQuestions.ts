import prisma from '../db';

export interface QuestionOption {
  label: string;
  text: string;
}

export const parseOptions = (options: string): QuestionOption[] => {
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const getTodaysQuestion = async (type: string, userId?: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let question = await prisma.dailyQuestion.findUnique({
    where: { type_date: { type, date: today } },
  });

  if (!question) {
    // Fallback: deterministic rotation through the question bank so every
    // day still has a question even before the generator runs.
    const pool = await prisma.dailyQuestion.findMany({
      where: { type },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (pool.length > 0) {
      const dayNumber = Math.floor(today.getTime() / 86400000);
      question = await prisma.dailyQuestion.findUnique({
        where: { id: pool[dayNumber % pool.length].id },
      });
    }
  }

  if (!question) return null;

  let myAttempt = null;
  if (userId) {
    myAttempt = await prisma.questionAttempt.findUnique({
      where: { userId_questionId: { userId, questionId: question.id } },
    });
  }

  return {
    ...question,
    options: parseOptions(question.options),
    attempted: !!myAttempt,
    myAttempt,
  };
};

export const getQuestionHistory = async (type: string) => {
  const questions = await prisma.dailyQuestion.findMany({
    where: { type },
    orderBy: { date: 'desc' },
    include: {
      attempts: {
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, username: true } } },
      },
    },
  });

  return questions.map((q) => ({
    ...q,
    options: parseOptions(q.options),
  }));
};
