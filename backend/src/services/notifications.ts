import prisma from '../db';

interface NotificationInput {
  recipientId: string;
  type: string;
  message: string;
  targetType?: string;
  targetId?: string;
  actorName?: string;
}

export const createNotification = async (input: NotificationInput): Promise<void> => {
  const { recipientId, ...rest } = input;
  if (!recipientId) return;
  await prisma.notification.create({
    data: { userId: recipientId, ...rest },
  });
};

// Skip notification when the actor is the recipient (no self-notifications)
export const notify = (
  recipientId: string,
  actorId: string,
  input: Omit<NotificationInput, 'recipientId'>,
): Promise<void> => {
  if (recipientId === actorId) return Promise.resolve();
  return createNotification({ recipientId, ...input });
};
