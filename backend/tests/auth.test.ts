import request from 'supertest';
import createApp from '../src/app';
import prisma from '../src/db';
import { uniqueEmail, TEST_PASSWORD } from './helpers';

const app = createApp();

const requestOtp = async (email: string) =>
  request(app).post('/api/auth/otp/request').send({ email });

const registerWithOtp = async (email: string, password = TEST_PASSWORD) => {
  const sent = await requestOtp(email);
  return request(app)
    .post('/api/auth/otp/verify')
    .send({ email, code: sent.body.data.devOtp, password });
};

describe('Auth (register via OTP + password, login with password)', () => {
  test('register (OTP + password) -> me flow', async () => {
    const email = uniqueEmail('user');

    const sent = await requestOtp(email);
    expect(sent.status).toBe(200);
    expect(sent.body.data.devOtp).toBeDefined();

    const registered = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code: sent.body.data.devOtp, password: TEST_PASSWORD });
    expect(registered.status).toBe(200);
    expect(registered.body.success).toBe(true);
    expect(registered.body.data.token).toBeDefined();
    expect(registered.body.data.user.email).toBe(email);
    expect(registered.body.data.user.password).toBeUndefined();
    const token = registered.body.data.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);
    expect(me.body.data.stats.currentStreak).toBe(0);
  });

  test('register rejects a short password', async () => {
    const email = uniqueEmail('weak');
    const res = await registerWithOtp(email, 'short');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Password must be at least 8 characters');
  });

  test('register accepts a custom username', async () => {
    const email = uniqueEmail('custom');
    const sent = await requestOtp(email);
    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code: sent.body.data.devOtp, password: TEST_PASSWORD, username: 'my_handle' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.username).toBe('my_handle');
  });

  test('register rejects a taken username', async () => {
    const email = uniqueEmail('first');
    const sent = await requestOtp(email);
    await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code: sent.body.data.devOtp, password: TEST_PASSWORD, username: 'first_handle' });

    const other = uniqueEmail('second');
    const sent2 = await requestOtp(other);
    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email: other, code: sent2.body.data.devOtp, password: TEST_PASSWORD, username: 'first_handle' });
    expect(res.status).toBe(409);
  });

  test('register rejects an invalid username', async () => {
    const email = uniqueEmail('baduser');
    const sent = await requestOtp(email);
    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code: sent.body.data.devOtp, password: TEST_PASSWORD, username: 'Bad Name!' });
    expect(res.status).toBe(400);
  });

  test('register rejects an invalid email on request', async () => {
    const res = await requestOtp('not-an-email');
    expect(res.status).toBe(400);
  });

  test('register rejects an incorrect code', async () => {
    const email = uniqueEmail('badcode');
    await requestOtp(email);

    const res = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code: '000000', password: TEST_PASSWORD });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Incorrect verification code');
  });

  test('a used code cannot be reused', async () => {
    const email = uniqueEmail('reuse');
    const sent = await requestOtp(email);
    const code = sent.body.data.devOtp;

    const first = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code, password: TEST_PASSWORD });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, code, password: TEST_PASSWORD });
    expect(second.status).toBe(400);
  });

  test('register rejects an email that already has an account', async () => {
    const email = uniqueEmail('dup');
    await registerWithOtp(email);

    await new Promise((r) => setTimeout(r, 1100));
    const res = await registerWithOtp(email);
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already exists/i);
  });

  test('resend is rate-limited by cooldown', async () => {
    const email = uniqueEmail('cooldown');
    await requestOtp(email);

    const second = await requestOtp(email);
    expect(second.status).toBe(429);
  });

  test('login with the registered password returns a token', async () => {
    const email = uniqueEmail('loginok');
    await registerWithOtp(email);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeDefined();
    expect(login.body.data.user.email).toBe(email);
    expect(login.body.data.user.password).toBeUndefined();
  });

  test('login also works with the username as identifier', async () => {
    const email = uniqueEmail('loginu');
    const registered = await registerWithOtp(email);
    const username = registered.body.data.user.username;

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: username, password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(email);
  });

  test('login rejects a wrong password', async () => {
    const email = uniqueEmail('loginbad');
    await registerWithOtp(email);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpass123' });
    expect(login.status).toBe(401);
    expect(login.body.error).toBe('Invalid email or password');
  });

  test('login rejects an unknown account', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: uniqueEmail('nobody'), password: TEST_PASSWORD });
    expect(login.status).toBe(401);
  });

  test('google auth returns 503 when client id is not configured', async () => {
    const res = await request(app).post('/api/auth/google').send({ idToken: 'some-token' });
    expect(res.status).toBe(503);
  });

  test('a token for a deleted user is rejected with 401', async () => {
    const email = uniqueEmail('ghost');
    const registered = await registerWithOtp(email);
    const token = registered.body.data.token;
    const userId = registered.body.data.user.id;

    // Simulate the user being wiped (e.g. a dev DB reset).
    await prisma.user.delete({ where: { id: userId } });

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(401);
  });

  test('user can change their username and login with it', async () => {
    const email = uniqueEmail('rename');
    const registered = await registerWithOtp(email);
    const token = registered.body.data.token;
    const auth = { Authorization: `Bearer ${token}` };

    const update = await request(app)
      .put('/api/users/me')
      .set(auth)
      .send({ username: 'renamed_user' });
    expect(update.status).toBe(200);
    expect(update.body.data.username).toBe('renamed_user');

    const me = await request(app).get('/api/auth/me').set(auth);
    expect(me.body.data.username).toBe('renamed_user');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'renamed_user', password: TEST_PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body.data.user.email).toBe(email);
  });

  test('changing username rejects a taken one', async () => {
    const emailA = uniqueEmail('a');
    const tokenA = (await registerWithOtp(emailA)).body.data.token;
    const emailB = uniqueEmail('b');
    const tokenB = (await registerWithOtp(emailB)).body.data.token;
    const usernameB = (await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenB}`)).body.data.username;

    const update = await request(app)
      .put('/api/users/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ username: usernameB });
    expect(update.status).toBe(409);
  });
});
