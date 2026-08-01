import request from 'supertest';
import { Express } from 'express';

let counter = 0;
const unique = (prefix: string) => `${prefix}_${Date.now()}_${counter++}`;

export const uniqueEmail = (prefix: string) => `${unique(prefix)}@test.com`;

// Sign up / log in a fresh user via the email-OTP flow and return a JWT.
export const signupAndGetToken = async (app: Express, prefix = 'user') => {
  const email = uniqueEmail(prefix);
  const sent = await request(app).post('/api/auth/otp/request').send({ email });
  if (sent.status !== 200) {
    throw new Error(`OTP request failed: ${sent.status} ${JSON.stringify(sent.body)}`);
  }
  const verified = await request(app)
    .post('/api/auth/otp/verify')
    .send({ email, code: sent.body.data.devOtp });
  if (verified.status !== 200) {
    throw new Error(`OTP verify failed: ${verified.status} ${JSON.stringify(verified.body)}`);
  }
  return verified.body.data.token as string;
};
