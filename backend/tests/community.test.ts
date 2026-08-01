import request from 'supertest';
import createApp from '../src/app';
import { signupAndGetToken } from './helpers';
const app = createApp();

describe('Community: Content, Discussions, Answers, Upvotes', () => {
  let token: string;
  let auth: { Authorization: string };
  let categoryId: number;

  beforeAll(async () => {
    token = await signupAndGetToken(app, 'comm');
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
    expect(detail.body.data.isClosed).toBe(false);

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

  test('creator can end a discussion; no further answers are allowed', async () => {
    const create = await request(app)
      .post('/api/discussions')
      .set(auth)
      .send({
        title: 'Settlement of a discussion',
        description: 'Will be closed',
        categoryId,
      });
    const discussionId = create.body.data.id;

    const closed = await request(app)
      .post(`/api/discussions/${discussionId}/close`)
      .set(auth);
    expect(closed.status).toBe(200);
    expect(closed.body.data.isClosed).toBe(true);

    const detail = await request(app).get(`/api/discussions/${discussionId}`);
    expect(detail.body.data.isClosed).toBe(true);

    const answer = await request(app)
      .post(`/api/discussions/${discussionId}/answers`)
      .set(auth)
      .send({ text: 'Too late' });
    expect(answer.status).toBe(403);

    const reopened = await request(app)
      .post(`/api/discussions/${discussionId}/reopen`)
      .set(auth);
    expect(reopened.status).toBe(200);
    expect(reopened.body.data.isClosed).toBe(false);

    const answerAfter = await request(app)
      .post(`/api/discussions/${discussionId}/answers`)
      .set(auth)
      .send({ text: 'Back open' });
    expect(answerAfter.status).toBe(201);
  });

  test('only the discussion starter can end it', async () => {
    const creator = await signupAndGetToken(app, 'creator');
    const stranger = await signupAndGetToken(app, 'stranger');

    const create = await request(app)
      .post('/api/discussions')
      .set('Authorization', `Bearer ${creator}`)
      .send({
        title: 'My private thread',
        description: 'Only I can close',
        categoryId,
      });
    const discussionId = create.body.data.id;

    const close = await request(app)
      .post(`/api/discussions/${discussionId}/close`)
      .set('Authorization', `Bearer ${stranger}`);
    expect(close.status).toBe(403);
  });

  test('profile reflects accumulated stats', async () => {
    const me = await request(app).get('/api/auth/me').set(auth);
    expect(me.status).toBe(200);
    expect(me.body.data.stats.contentCount).toBe(1);
    expect(me.body.data.stats.answerCount).toBe(2);
    expect(me.body.data.stats.upvotesReceived).toBeGreaterThanOrEqual(1);
    expect(me.body.data.stats.reputationScore).toBeGreaterThan(0);
  });

  test('content and discussions are filterable by exam domain', async () => {
    const domain = (await request(app).get('/api/auth/me').set(auth)).body.data.domain;
    expect(domain).toBe('UPSC');

    const upsc = await request(app).get('/api/content?domain=UPSC');
    expect(upsc.status).toBe(200);
    expect(upsc.body.data.some((c: any) => c.title === 'Test notes')).toBe(true);

    const jee = await request(app).get('/api/content?domain=JEE');
    expect(jee.body.data.some((c: any) => c.title === 'Test notes')).toBe(false);

    const upscDisc = await request(app).get('/api/discussions?domain=UPSC');
    expect(upscDisc.status).toBe(200);
    expect(upscDisc.body.data.some((d: any) => d.title === 'How does P/E ratio work?')).toBe(true);

    const jeeDisc = await request(app).get('/api/discussions?domain=JEE');
    expect(jeeDisc.body.data.some((d: any) => d.title === 'How does P/E ratio work?')).toBe(false);
  });

  test('search finds content, discussions, and categories', async () => {
    const res = await request(app).get('/api/search?q=P%2FE');
    expect(res.status).toBe(200);
    expect(res.body.data.total).toBeGreaterThan(0);
    expect(res.body.data.discussions.some((d: any) => d.title === 'How does P/E ratio work?')).toBe(true);

    const notes = await request(app).get('/api/search?q=notes');
    expect(notes.body.data.content.some((c: any) => c.title === 'Test notes')).toBe(true);

    const cat = await request(app).get('/api/search?q=History');
    expect(cat.body.data.categories.length).toBeGreaterThan(0);

    const empty = await request(app).get('/api/search?q=zzzznothingzzzz');
    expect(empty.body.data.total).toBe(0);
  });

  test('notifications are created on answers/comments and can be marked read', async () => {
    const owner = await signupAndGetToken(app, 'notifowner');
    const actor = await signupAndGetToken(app, 'notifactor');
    const ownerAuth = { Authorization: `Bearer ${owner}` };
    const actorAuth = { Authorization: `Bearer ${actor}` };

    const create = await request(app)
      .post('/api/discussions')
      .set(ownerAuth)
      .send({
        title: 'Notify me on this thread',
        description: 'I want to be notified',
        categoryId,
      });
    const discussionId = create.body.data.id;

    const answer = await request(app)
      .post(`/api/discussions/${discussionId}/answers`)
      .set(actorAuth)
      .send({ text: 'Someone else answers your thread' });
    expect(answer.status).toBe(201);

    const ownerList = await request(app).get('/api/notifications').set(ownerAuth);
    expect(ownerList.status).toBe(200);
    expect(ownerList.body.data.length).toBeGreaterThanOrEqual(1);
    expect(ownerList.body.unreadCount).toBeGreaterThanOrEqual(1);
    const answerNotif = ownerList.body.data.find((n: any) => n.type === 'answer_on_discussion');
    expect(answerNotif).toBeDefined();
    expect(answerNotif.message).toContain('notifactor');

    await request(app).post('/api/notifications/read-all').set(ownerAuth);
    const afterRead = await request(app).get('/api/notifications').set(ownerAuth);
    expect(afterRead.body.unreadCount).toBe(0);

    const comment = await request(app)
      .post(`/api/answers/${answer.body.data.id}/comment`)
      .set(ownerAuth)
      .send({ text: 'Thanks for the answer!' });
    expect(comment.status).toBe(201);

    const actorList = await request(app).get('/api/notifications').set(actorAuth);
    const commentNotif = actorList.body.data.find((n: any) => n.type === 'comment_on_answer');
    expect(commentNotif).toBeDefined();
    expect(commentNotif.message).toContain('notifowner');

    const readOne = await request(app)
      .post(`/api/notifications/${commentNotif.id}/read`)
      .set(actorAuth);
    expect(readOne.status).toBe(200);
    expect(readOne.body.data.read).toBe(true);

    const stranger = await signupAndGetToken(app, 'notifstranger');
    const forbidden = await request(app)
      .post(`/api/notifications/${commentNotif.id}/read`)
      .set('Authorization', `Bearer ${stranger}`);
    expect(forbidden.status).toBe(404);
  });

  test('security headers from helmet are applied', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  test('leaderboard ranks users by reputation and streak', async () => {
    await signupAndGetToken(app, 'lboard');
    const res = await request(app).get('/api/leaderboard');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('username');
    expect(res.body.data[0]).toHaveProperty('stats');
    expect(res.body.data[0].stats).toHaveProperty('reputationScore');

    const reps = res.body.data.map((u: any) => u.stats.reputationScore);
    expect([...reps].sort((a: number, b: number) => b - a)).toEqual(reps);

    const streak = await request(app).get('/api/leaderboard?type=streak');
    expect(streak.status).toBe(200);
    expect(streak.body.data.length).toBeGreaterThan(0);
    expect(streak.body.data[0].stats).toHaveProperty('currentStreak');

    const domain = await request(app).get('/api/leaderboard?domain=JEE');
    expect(domain.status).toBe(200);
  });

  test('reporting flow: submit, unique per user, moderation status update', async () => {
    const reporter = await signupAndGetToken(app, 'reporter');
    const target = await signupAndGetToken(app, 'targetuser');
    const reporterAuth = { Authorization: `Bearer ${reporter}` };
    const targetAuth = { Authorization: `Bearer ${target}` };

    const create = await request(app)
      .post('/api/content')
      .set(targetAuth)
      .send({
        title: 'Reportable content',
        description: 'Has an issue',
        type: 'notes',
        contentUrl: 'https://example.com/report.pdf',
        categoryId,
      });
    const contentId = create.body.data.id;

    const report = await request(app)
      .post('/api/reports')
      .set(reporterAuth)
      .send({ targetType: 'content', targetId: contentId, reason: 'spam', details: 'Duplicate notes' });
    expect(report.status).toBe(201);
    expect(report.body.data.reason).toBe('spam');

    const duplicate = await request(app)
      .post('/api/reports')
      .set(reporterAuth)
      .send({ targetType: 'content', targetId: contentId, reason: 'abuse' });
    expect(duplicate.status).toBe(201);

    const invalidType = await request(app)
      .post('/api/reports')
      .set(reporterAuth)
      .send({ targetType: 'user', targetId: contentId, reason: 'spam' });
    expect(invalidType.status).toBe(400);

    const missing = await request(app)
      .post('/api/reports')
      .set(reporterAuth)
      .send({ targetType: 'content', targetId: 'nonexistent-id', reason: 'spam' });
    expect(missing.status).toBe(404);

    const queue = await request(app).get('/api/reports').set(reporterAuth);
    expect(queue.status).toBe(200);
    expect(queue.body.total).toBeGreaterThanOrEqual(1);
    expect(queue.body.data[0].status).toBe('open');

    const reviewed = await request(app)
      .patch(`/api/reports/${report.body.data.id}`)
      .set(reporterAuth)
      .send({ status: 'reviewed', reviewNote: 'Actioned' });
    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.status).toBe('reviewed');

    const openQueue = await request(app).get('/api/reports?status=open').set(reporterAuth);
    expect(openQueue.body.data.some((r: any) => r.id === report.body.data.id)).toBe(false);
  });

  test('file upload stores a file and returns a public URL', async () => {
    const uploader = await signupAndGetToken(app, 'uploader');
    const uploaderAuth = { Authorization: `Bearer ${uploader}` };

    const up = await request(app)
      .post('/api/uploads')
      .set(uploaderAuth)
      .attach('file', Buffer.from('hello upload'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });
    expect(up.status).toBe(201);
    expect(up.body.data.url).toMatch(/^\/uploads\//);

    const fileRes = await request(app).get(up.body.data.url);
    expect(fileRes.status).toBe(200);
    expect(fileRes.text).toContain('hello upload');

    const badExt = await request(app)
      .post('/api/uploads')
      .set(uploaderAuth)
      .attach('file', Buffer.from('x'), { filename: 'evil.exe', contentType: 'application/octet-stream' });
    expect(badExt.status).toBe(400);

    const noFile = await request(app).post('/api/uploads').set(uploaderAuth);
    expect(noFile.status).toBe(400);
  });

  test('discussion starter can edit and delete; others cannot', async () => {
    const owner = await signupAndGetToken(app, 'editowner');
    const stranger = await signupAndGetToken(app, 'editstranger');
    const ownerAuth = { Authorization: `Bearer ${owner}` };
    const strangerAuth = { Authorization: `Bearer ${stranger}` };

    const create = await request(app)
      .post('/api/discussions')
      .set(ownerAuth)
      .send({ title: 'Editable thread', description: 'original description', categoryId });
    const discussionId = create.body.data.id;

    const edit = await request(app)
      .put(`/api/discussions/${discussionId}`)
      .set(ownerAuth)
      .send({ title: 'Editable thread v2', description: 'updated description' });
    expect(edit.status).toBe(200);
    expect(edit.body.data.title).toBe('Editable thread v2');
    expect(edit.body.data.description).toBe('updated description');

    const forbiddenEdit = await request(app)
      .put(`/api/discussions/${discussionId}`)
      .set(strangerAuth)
      .send({ title: 'Hacked' });
    expect(forbiddenEdit.status).toBe(403);

    const emptyEdit = await request(app)
      .put(`/api/discussions/${discussionId}`)
      .set(ownerAuth)
      .send({});
    expect(emptyEdit.status).toBe(400);

    const forbiddenDelete = await request(app)
      .delete(`/api/discussions/${discussionId}`)
      .set(strangerAuth);
    expect(forbiddenDelete.status).toBe(403);

    const deleted = await request(app)
      .delete(`/api/discussions/${discussionId}`)
      .set(ownerAuth);
    expect(deleted.status).toBe(200);
    expect(deleted.body.data.deleted).toBe(true);

    const gone = await request(app).get(`/api/discussions/${discussionId}`);
    expect(gone.status).toBe(404);
  });
});
