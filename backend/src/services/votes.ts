import prisma from '../db';

export type VoteParentType = 'content' | 'answer' | 'comment';

export const getVoteCount = async (parentId: string, parentType: VoteParentType) => {
  return prisma.vote.count({ where: { parentId, parentType } });
};

export const toggleVote = async (
  userId: string,
  parentId: string,
  parentType: VoteParentType
): Promise<{ voted: boolean }> => {
  const existing = await prisma.vote.findUnique({
    where: {
      parentId_parentType_userId: { parentId, parentType, userId },
    },
  });

  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    await decrementCounter(parentId, parentType);
    return { voted: false };
  }

  await prisma.vote.create({ data: { parentId, parentType, userId } });
  await incrementCounter(parentId, parentType);
  return { voted: true };
};

const incrementCounter = async (parentId: string, parentType: VoteParentType) => {
  if (parentType === 'answer') {
    await prisma.answer.updateMany({ where: { id: parentId }, data: { upvoteCount: { increment: 1 } } });
  } else if (parentType === 'comment') {
    await prisma.comment.updateMany({ where: { id: parentId }, data: { upvoteCount: { increment: 1 } } });
  }
};

const decrementCounter = async (parentId: string, parentType: VoteParentType) => {
  if (parentType === 'answer') {
    await prisma.answer.updateMany({
      where: { id: parentId, upvoteCount: { gt: 0 } },
      data: { upvoteCount: { decrement: 1 } },
    });
  } else if (parentType === 'comment') {
    await prisma.comment.updateMany({
      where: { id: parentId, upvoteCount: { gt: 0 } },
      data: { upvoteCount: { decrement: 1 } },
    });
  }
};
