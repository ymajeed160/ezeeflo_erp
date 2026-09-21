// EzeeFlo Loyalty - API Test Suite (Phase 1)
// Run: npm test

const request = require('supertest');
const app = require('../app');

describe('Health Check', () => {
  it('GET /api/health should return 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Auth Endpoints', () => {
  it('POST /api/auth/login without credentials should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/login with invalid credentials should return 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'nonexistent', password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/auth/me without token should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });
});

describe('Protected Routes', () => {
  it('GET /api/dashboard/stats without token should return 401', async () => {
    const res = await request(app).get('/api/dashboard/stats');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/users without token should return 401', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(401);
  });
});

describe('Super Admin Routes', () => {
  it('GET /api/superadmin/dashboard/stats without token should return 401', async () => {
    const res = await request(app).get('/api/superadmin/dashboard/stats');
    expect(res.statusCode).toBe(401);
  });
});
