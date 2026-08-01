import crypto from 'crypto';
import prisma from '../db';
import { validateEmail } from '../utils/helpers';

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

export const generateOtp = (): string => {
  return crypto.randomInt(0, 1000000).toString().padStart(OTP_LENGTH, '0');
};

const hashOtp = (code: string): string => {
  return crypto.createHash('sha256').update(code).digest('hex');
};

const isProduction = (): boolean => process.env.NODE_ENV === 'production';

const httpError = (message: string, status: number) =>
  Object.assign(new Error(message), { status });

export const requestOtp = async (email: string): Promise<{ devOtp?: string }> => {
  const normalized = (email || '').trim().toLowerCase();
  if (!validateEmail(normalized)) {
    throw httpError('Invalid email address', 400);
  }

  // Drop stale codes for this address.
  await prisma.otpVerification.deleteMany({
    where: { email: normalized, expiresAt: { lt: new Date() } },
  });

  // Cooldown between resend attempts.
  const recent = await prisma.otpVerification.findFirst({
    where: { email: normalized, used: false },
    orderBy: { createdAt: 'desc' },
  });
  if (recent) {
    const remaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000);
    if (remaining > 0) {
      throw httpError(`Please wait ${remaining}s before requesting a new code`, 429);
    }
  }

  const code = generateOtp();
  await prisma.otpVerification.create({
    data: {
      email: normalized,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  // Dev-only delivery: log to console and echo the code back so the flow works
  // without a mail provider. Swap in a provider (Resend/Brevo) in production.
  const devOtp = isProduction() ? undefined : code;
  console.log(`[OTP] ${normalized}: your verification code is ${code} (valid 10 min)`);
  return { devOtp };
};

export const verifyOtp = async (email: string, code: string): Promise<void> => {
  const normalized = (email || '').trim().toLowerCase();
  const input = (code || '').trim();

  const record = await prisma.otpVerification.findFirst({
    where: { email: normalized, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!record) {
    throw httpError('Invalid or expired verification code', 400);
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    throw httpError('Too many incorrect attempts. Request a new code.', 400);
  }
  if (record.codeHash !== hashOtp(input)) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    throw httpError('Incorrect verification code', 400);
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { used: true },
  });
};
