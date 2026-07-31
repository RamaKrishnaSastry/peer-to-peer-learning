import request from 'supertest';
import createApp from '../src/app';

const app = createApp();
let counter = 0;
const unique = (prefix: string) => `${prefix}_${Date.now()}_${counter++}`;

const signupAndGetToken = async () => {
  const email = unique('comm') + '@test.com';
  const res = await request(app)
    .post('/api/auth/signup')
    .send({ email, username: unique('comm'), password: 'password123' });
  return res.body.data.token;
};

describe('Community: Content, Discussions, Answers, Upvotes', () => {
  let token: string;
  let auth: { Authorization: string };
  let categoryId: number;

  beforeAll(async () => {
    token = await signupAndGetToken();
    auth = { Authorization: `Bearer ${token}` };
    const cats = await request(app).get('/api/categories');
    categoryId = cats.body.data[0].id;
  });

  test('list root categories returns seeded domains', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    const names = res.body.data.map((c: any) => c.name);
    expect(names).toEqual(expect.arrayContaining(['UPSC', 'JEE', 'Finance']));
  });

  test('content upload -> comment -> rate -> upvote', async () => {
    const upload = await request(app)
      .post('/api/content')
      .set(auth)
      .send({
        title: 'Test notes',
        description: 'Test description',
        type: 'notes',
        contentUrl: 'https://example.com/notes.pdf',
        categoryId,
      });

    expect(upload.status).toBe(201);
    const contentId = upload.body.data.id;

    const detail = await request(app).get(`/api/content/${contentId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.upvoteCount).toBe(0);

    const comment = await request(app)
      .post(`/api/content/${contentId}/comment`)
      .set(auth)
      .send({ text: 'Great notes!' });
    expect(comment.status).toBe(201);

    const rate = await request(app)
      .post(`/api/content/${contentId}/rate`)
      .set(auth)
      .send({ stars: 5 });
    expect(rate.status).toBe(200);
    expect(rate.body.data.avgRating).toBe(5);
    expect(rate.body.data.ratingCount).toBe(1);

    const upvote = await request(app)
      .post(`/api/content/${contentId}/upvote`)
      .set(auth);
    expect(upvote.status).toBe(200);
    expect(upvote.body.data.voted).toBe(true);
    expect(upvote.body.data.count).toBe(1);

    const detailAfter = await request(app).get(`/api/content/${contentId}`);
    expect(detailAfter.body.data.upvoteCount).toBe(1);
    expect(detailAfter.body.data.comments.length).toBe(1);
  });

  test('discussion -> answer -> upvote flow', async () => {
    const create = await request(app)
      .post('/api/discussions')
      .set(auth)
      .send({
        title: 'How does P/E ratio work?',
        description: 'Need help understanding this',
        categoryId,
      });
    expect(create.status).toBe(201);
    const discussionId = create.body.data.id;

    const detail = await request(app).get(`/api/discussions/${discussionId}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.answers.length).toBe(0);
    expect(detail.body.data.viewCount).toBe(1);

    const answer = await request(app)
      .post(`/api/discussions/${discussionId}/answers`)
      .set(auth)
      .send({ text: 'P/E compares price to earnings per share.' });
    expect(answer.status).toBe(201);

    const upvote = await request(app)
      .post(`/api/answers/${answer.body.data.id}/upvote`)
      .set(auth);
    expect(upvote.status).toBe(200);
    expect(upvote.body.data.count).toBe(1);

    const detailAfter = await request(app).get(`/api/discussions/${discussionId}`);
    expect(detailAfter.body.data.answers.length).toBe(1);
    expect(detailAfter.body.data.answers[0].upvoteCount).toBe(1);
  });

  test('profile reflects accumulated stats', async () => {
    const me = await request(app).get('/api/auth/me').set(auth);
    expect(me.status).toBe(200);
    expect(me.body.data.stats.contentCount).toBe(1);
    expect(me.body.data.stats.answerCount).toBe(1);
    expect(me.body.data.stats.upvotesReceived).toBeGreaterThanOrEqual(1);
    expect(me.body.data.stats.reputationScore).toBeGreaterThan(0);
  });
});
