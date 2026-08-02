/**
 * Promote a user to moderator (or admin) by username or email.
 *
 * Usage:
 *   npm run promote -- <username|email> [moderator|admin]
 *
 * Examples:
 *   npm run promote -- ramakrishnasastry073 moderator
 *   npm run promote -- admin@example.com admin
 */
import prisma from '../db';

const [target, role = 'moderator'] = process.argv.slice(2);

const run = async () => {
  if (!target) {
    console.error('Usage: npm run promote -- <username|email> [moderator|admin]');
    process.exit(1);
  }
  if (!['moderator', 'admin'].includes(role)) {
    console.error(`Invalid role "${role}". Use "moderator" or "admin".`);
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { OR: [{ username: target }, { email: target }] },
  });

  if (!user) {
    console.error(`No user found for "${target}".`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { role },
  });

  console.log(`Promoted ${updated.username} (${updated.email}) to ${updated.role}.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => process.exit(0));