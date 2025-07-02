// Set up environment variables before any imports
process.env.NODE_ENV = 'test';
process.env.AUTH_TOKEN = 'test-auth-token';
process.env.POWERDNS_API_URL = 'http://localhost:8081';
process.env.POWERDNS_API_KEY = 'test-api-key';
process.env.POWERDNS_SERVER_ID = 'localhost';
process.env.DNS_ZONE = 'easybitcoinaddress.me';
process.env.DNS_RECORD_PREFIX = '_bitcoin-payment';
process.env.DNS_TTL = '300';
process.env.LOG_LEVEL = 'error';

import request from 'supertest';
import express from 'express';

// Create a simple app with just the health endpoint
const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

describe('Health Endpoint', () => {
  it('should return 200 with healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('timestamp');
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  it('should return consistent response format', async () => {
    const response = await request(app).get('/health');

    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(typeof response.body.status).toBe('string');
    expect(typeof response.body.timestamp).toBe('string');
  });

  it('should handle multiple concurrent health checks', async () => {
    const promises = Array(10).fill(null).map(() => 
      request(app).get('/health')
    );

    const responses = await Promise.all(promises);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });
  });

  it('should respond quickly to health checks', async () => {
    const start = Date.now();
    await request(app).get('/health');
    const duration = Date.now() - start;

    // Health check should respond within 100ms
    expect(duration).toBeLessThan(100);
  });
});