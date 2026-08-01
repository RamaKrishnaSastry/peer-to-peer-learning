import request from 'supertest';
import createApp from '../src/app';
import prisma from '../src/db';

const app = createApp();
let counter = 0;
const unique = (prefix: string) => `${prefix}_${Date.now()}_${counter++}`;

const requestOtp = async (email: string) =>
  request(app).post('/api/auth/otp/request').send({ email });

const verifyOtp = async (email: string, code: string) =>
  request(app).post('/api/auth/otp/verify').send({ email, code });

describe('Auth (OTP)', () => {
  test('request -> verify -> me flow', async () => {
    const email = unique('user') + '@test.com';

    const sent = await requestOtp(email);
    expect(sent.status).toBe(200);
    expect(sent.body.data.devOtp).toBeDefined();

    const verified = await verifyOtp(email, sent.body.data.devOtp);
    expect(verified.status).toBe(200);
    expect(verified.body.success).toBe(true);
    expect(verified.body.data.token).toBeDefined();
    expect(verified.body.data.user.email).toBe(email);
    expect(verified.body.data.user.password).toBeUndefined();
    const token = verified.body.data.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);
    expect(me.body.data.stats.currentStreak).toBe(0);
  });

  test('rejects invalid email on request', async () => {
    const res = await requestOtp('not-an-email');
    expect(res.status).toBe(400);
  });

  test('rejects an incorrect code', async () => {
    const email = unique('badcode') + '@test.com';
    await requestOtp(email);

    const res = await verifyOtp(email, '000000');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Incorrect verification code');
  });

  test('rejects verify with no valid code', async () => {
    const res = await verifyOtp(unique('nobody') + '@test.com', '123456');
    expect(res.status).toBe(400);
  });

  test('a used code cannot be reused', async () => {
    const email = unique('reuse') + '@test.com';
    const sent = await requestOtp(email);
    const code = sent.body.data.devOtp;

    await verifyOtp(email, code);
    const second = await verifyOtp(email, code);
    expect(second.status).toBe(400);
  });

  test('existing user logs in with OTP (no duplicate account)', async () => {
    const email = unique('existing') + '@test.com';
    const sent1 = await requestOtp(email);
    await verifyOtp(email, sent1.body.data.devOtp);

    // Wait out the resend cooldown, then sign in again.
    await new Promise((r) => setTimeout(r, 1100));
    const sent2 = await requestOtp(email);
    const loggedIn = await verifyOtp(email, sent2.body.data.devOtp);

    expect(loggedIn.status).toBe(200);
    expect(loggedIn.body.data.user.email).toBe(email);
  });

  test('resend is rate-limited by cooldown', async () => {
    const email = unique('cooldown') + '@test.com';
    await requestOtp(email);

    const second = await requestOtp(email);
    expect(second.status).toBe(429);
  });

  test('google auth returns 503 when client id is not configured', async () => {
    const res = await request(app).post('/api/auth/google').send({ idToken: 'some-token' });
    expect(res.status).toBe(503);
  });

  test('a token for a deleted user is rejected with 401', async () => {
    const email = unique('ghost') + '@test.com';
    const sent = await requestOtp(email);
    const verified = await verifyOtp(email, sent.body.data.devOtp);
    const token = verified.body.data.token;
    const userId = verified.body.data.user.id;

    // Simulate the user being wiped (e.g. a dev DB reset).
    await prisma.user.delete({ where: { id: userId } });

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });
});
