import request from 'supertest';
import createApp from '../src/app';
import { signupAndGetToken } from './helpers';

const app = createApp();

describe('Daily Questions & Streaks', () => {
  test('returns today\'s question with options and un-attempted state', async () => {
    const token = await signupAndGetToken(app, 'dq');
    const res = await request(app)
      .get('/api/daily-questions/today/UPSC')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.options.length).toBe(4);
    expect(res.body.data.attempted).toBe(false);
  });

  test('rejects invalid domain type', async () => {
    const res = await request(app).get('/api/daily-questions/today/SCIENCE');
    expect(res.status).toBe(400);
  });

  test('submitting a correct answer returns streak 1 and correct verdict', async () => {
    const token = await signupAndGetToken(app, 'dq');
    const auth = { Authorization: `Bearer ${token}` };

    const today = await request(app).get('/api/daily-questions/today/UPSC').set(auth);
    const question = today.body.data;

    const submit = await request(app)
      .post(`/api/daily-questions/${question.id}/submit`)
      .set(auth)
      .send({ selectedAnswer: question.correctAnswer });

    expect(submit.status).toBe(201);
    expect(submit.body.data.attempt.isCorrect).toBe(true);
    expect(submit.body.data.attempt.verdict).toBe('CORRECT');
    expect(submit.body.data.streak.currentStreak).toBe(1);
    expect(submit.body.data.streak.longestStreak).toBe(1);
  });

  test('submitting an incorrect answer marks it incorrect and reveals the right option', async () => {
    const token = await signupAndGetToken(app, 'dq');
    const auth = { Authorization: `Bearer ${token}` };

    const today = await request(app).get('/api/daily-questions/today/JEE').set(auth);
    const question = today.body.data;

    const wrong = question.options.find((o: any) => o.label !== question.correctAnswer).label;

    const submit = await request(app)
      .post(`/api/daily-questions/${question.id}/submit`)
      .set(auth)
      .send({ selectedAnswer: wrong });

    expect(submit.status).toBe(201);
    expect(submit.body.data.attempt.isCorrect).toBe(false);
    expect(submit.body.data.correctAnswer).toBe(question.correctAnswer);
    expect(submit.body.data.streak.currentStreak).toBe(1);
  });

  test('second submission is rejected with 409 and streak stays at 1', async () => {
    const token = await signupAndGetToken(app, 'dq');
    const auth = { Authorization: `Bearer ${token}` };

    const today = await request(app).get('/api/daily-questions/today/Finance').set(auth);
    const question = today.body.data;

    await request(app)
      .post(`/api/daily-questions/${question.id}/submit`)
      .set(auth)
      .send({ selectedAnswer: question.correctAnswer });

    const again = await request(app)
      .post(`/api/daily-questions/${question.id}/submit`)
      .set(auth)
      .send({ selectedAnswer: question.correctAnswer });

    expect(again.status).toBe(409);

    const me = await request(app).get('/api/auth/me').set(auth);
    expect(me.body.data.stats.currentStreak).toBe(1);
  });

  test('todays question shows attempted after submission', async () => {
    const token = await signupAndGetToken(app, 'dq');
    const auth = { Authorization: `Bearer ${token}` };

    const today = await request(app).get('/api/daily-questions/today/UPSC').set(auth);
    const question = today.body.data;

    await request(app)
      .post(`/api/daily-questions/${question.id}/submit`)
      .set(auth)
      .send({ selectedAnswer: question.correctAnswer });

    const after = await request(app).get('/api/daily-questions/today/UPSC').set(auth);
    expect(after.body.data.attempted).toBe(true);
    expect(after.body.data.myAttempt.isCorrect).toBe(true);
  });
});
