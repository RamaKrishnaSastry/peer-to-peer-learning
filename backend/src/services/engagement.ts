import prisma from '../db';
import { calculateReputation } from '../utils/helpers';

const startOfDay = (date: Date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const updateStreak = async (userId: string) => {
  const now = new Date();
  const today = startOfDay(now);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streak = await prisma.streak.findUnique({ where: { userId } });
  const last = streak?.lastActivityDate ? startOfDay(streak.lastActivityDate) : null;

  let currentStreak = 1;
  if (streak && last) {
    if (last.getTime() === today.getTime()) {
      currentStreak = streak.currentStreak;
    } else if (last.getTime() === yesterday.getTime()) {
      currentStreak = streak.currentStreak + 1;
    } else {
      currentStreak = 1;
    }
  }

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        userId,
        currentStreak,
        longestStreak: currentStreak,
        lastActivityDate: now,
      },
    });
  } else {
    streak = await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak,
        longestStreak: Math.max(streak.longestStreak, currentStreak),
        lastActivityDate: now,
      },
    });
  }

  return streak;
};

export const recalculateUserStats = async (userId: string) => {
  const [contentIds, answerIds, commentIds] = await Promise.all([
    prisma.content.findMany({ where: { creatorId: userId }, select: { id: true } }),
    prisma.answer.findMany({ where: { creatorId: userId }, select: { id: true } }),
    prisma.comment.findMany({ where: { userId }, select: { id: true } }),
  ]);

  const [contentVotes, answerVotes, commentVotes] = await Promise.all([
    prisma.vote.count({ where: { parentType: 'content', parentId: { in: contentIds.map((c) => c.id) } } }),
    prisma.vote.count({ where: { parentType: 'answer', parentId: { in: answerIds.map((a) => a.id) } } }),
    prisma.vote.count({ where: { parentType: 'comment', parentId: { in: commentIds.map((c) => c.id) } } }),
  ]);

  const [streak] = await Promise.all([
    prisma.streak.findUnique({ where: { userId } }),
  ]);

  const contentCount = contentIds.length;
  const answerCount = answerIds.length;
  const upvotesReceived = contentVotes + answerVotes + commentVotes;
  const reputationScore = calculateReputation(
    upvotesReceived,
    contentCount,
    answerCount,
    streak?.currentStreak ?? 0
  );

  return prisma.userStats.upsert({
    where: { userId },
    update: { contentCount, answerCount, upvotesReceived, reputationScore },
    create: { userId, contentCount, answerCount, upvotesReceived, reputationScore },
  });
};

export const awardBadge = async (userId: string, slug: string) => {
  const badge = await prisma.badge.findUnique({ where: { slug } });
  if (!badge) return null;

  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return existing;

  return prisma.userBadge.create({
    data: { userId, badgeId: badge.id },
  });
};

export const getStatsWithStreak = async (userId: string) => {
  const [stats, streak] = await Promise.all([
    prisma.userStats.findUnique({ where: { userId } }),
    prisma.streak.findUnique({ where: { userId } }),
  ]);

  return {
    reputationScore: stats?.reputationScore ?? 0,
    upvotesReceived: stats?.upvotesReceived ?? 0,
    contentCount: stats?.contentCount ?? 0,
    answerCount: stats?.answerCount ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
  };
};
