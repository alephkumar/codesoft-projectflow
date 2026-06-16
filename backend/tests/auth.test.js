const request = require('supertest');
const app = require('../server');
const mongoose = require('mongoose');
const User = require('../models/User');

const { connectDB, closeDB } = require('../config/db');

beforeAll(async () => {
  await connectDB();
});

afterAll(async () => {
  await User.deleteMany({ email: /test.*@test\.com/ });
  await closeDB();
});

describe('Auth API', () => {
  const testUser = { name: 'Test User', email: 'test123@test.com', password: 'password123', role: 'team_member' };

  test('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('POST /api/auth/register - should fail with duplicate email', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);
    expect(res.statusCode).toBe(400);
  });

  test('POST /api/auth/login - should login successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  test('POST /api/auth/login - should fail with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: testUser.email, password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/auth/profile - should return user profile when authenticated', async () => {
    const loginRes = await request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password });
    const token = loginRes.body.accessToken;
    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(testUser.email);
  });

  test('GET /api/auth/profile - should fail without token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.statusCode).toBe(401);
  });
});
