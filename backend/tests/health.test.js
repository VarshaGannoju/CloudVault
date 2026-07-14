const supertest = require('supertest');
const app = require('../src/app');

describe('Health Check Endpoint', () => {
  it('should return 200 OK', async () => {
    const res = await supertest(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
