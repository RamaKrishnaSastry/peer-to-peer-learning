import request from 'supertest';
import createApp from '../src/app';

const app = createApp();
let counter = 0;
const unique = (prefix: string) => `${prefix}_${Date.now()}_${counter++}`;

describe('Auth', () => {
  test('signup -> login -> me flow', async () => {
    const email = unique('user') + '@test.com';
    const username = unique('user');

    const signup = await request(app)
      .post('/api/auth/signup')
      .send({ email, username, password: 'password123' });

    expect(signup.status).toBe(201);
    expect(signup.body.success).toBe(true);
    expect(signup.body.data.token).toBeDefined();
    expect(signup.body.data.user.password).toBeUndefined();
    const token = signup.body.data.token;

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });

    expect(login.status).toBe(200);
    expect(login.body.data.token).toBeDefined();

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe(email);
    expect(me.body.data.stats.currentStreak).toBe(0);
  });

  test('rejects duplicate email on signup', async () => {
    const email = unique('dup') + '@test.com';

    await request(app)
      .post('/api/auth/signup')
      .send({ email, username: unique('dup'), password: 'password123' });

    const second = await request(app)
      .post('/api/auth/signup')
      .send({ email, username: unique('dup2'), password: 'password123' });

    expect(second.status).toBe(400);
  });

  test('rejects weak password', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: unique('weak') + '@test.com', username: unique('weak'), password: 'short' });

    expect(res.status).toBe(400);
  });

  test('login with wrong password fails', async () => {
    const email = unique('bad') + '@test.com';
    await request(app)
      .post('/api/auth/signup')
      .send({ email, username: unique('bad'), password: 'password123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('google auth returns 503 when client id is not configured', async () => {
    const res = await request(app).post('/api/auth/google').send({ idToken: 'some-token' });
    expect(res.status).toBe(503);
  });
});
