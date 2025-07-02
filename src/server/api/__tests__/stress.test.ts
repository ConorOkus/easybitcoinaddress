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
import recordsRouter from '../routes/records';
import powerdns from '../services/powerdns';
import { RecordResponse } from '../types';

jest.mock('../services/powerdns');
jest.mock('../config/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the environment validation
jest.mock('../config/env-validation', () => ({
  validateEnvironment: jest.fn(),
}));

const mockPowerDNS = powerdns as jest.Mocked<typeof powerdns>;

const app = express();
app.use(express.json());
app.use(recordsRouter);

const validAuthToken = 'test-auth-token';

describe('Stress Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Concurrent registration attempts', () => {
    it('should handle multiple concurrent registration requests', async () => {
      const mockResponse: RecordResponse = {
        fqdn: 'user.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: 'bitcoin:bc1qexample...',
      };

      // Mock PowerDNS to return null (no existing record) for all checks
      mockPowerDNS.getTXTRecord.mockResolvedValue(null);
      mockPowerDNS.addTXTRecord.mockResolvedValue(mockResponse);

      const requests = Array(5).fill(null).map((_, index) =>
        request(app)
          .post('/register')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send({
            name: `user${index}`,
            uri: 'bitcoin:bc1qexample...',
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(201);
      });
    });

    it('should handle concurrent requests for the same name properly', async () => {
      let callCount = 0;
      mockPowerDNS.getTXTRecord.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call returns null (no existing record)
          return Promise.resolve(null);
        } else {
          // Subsequent calls return existing record
          return Promise.resolve({
            fqdn: 'samename.user._bitcoin-payment.easybitcoinaddress.me.',
            uri: 'bitcoin:bc1qexample...',
          });
        }
      });

      mockPowerDNS.addTXTRecord.mockResolvedValue({
        fqdn: 'samename.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: 'bitcoin:bc1qexample...',
      });

      const requests = Array(3).fill(null).map(() =>
        request(app)
          .post('/register')
          .set('Authorization', `Bearer ${validAuthToken}`)
          .send({
            name: 'samename',
            uri: 'bitcoin:bc1qexample...',
          })
      );

      const responses = await Promise.all(requests);

      // One should succeed (201), others should fail with conflict (409)
      const successResponses = responses.filter(r => r.status === 201);
      const conflictResponses = responses.filter(r => r.status === 409);

      expect(successResponses.length).toBeGreaterThan(0);
      expect(conflictResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Malformed request handling', () => {
    it('should handle extremely large payloads gracefully', async () => {
      const largePayload = {
        name: 'bob',
        uri: 'bitcoin:' + 'a'.repeat(100000),
        extraField: 'x'.repeat(50000),
      };

      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(largePayload);

      // Should not crash, either accept or reject gracefully
      expect([200, 201, 400, 413, 414]).toContain(response.status);
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect(response.status).toBe(400);
    });

    it('should handle requests with missing Content-Type', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send('name=bob&uri=bitcoin:bc1qexample');

      // Should handle gracefully, not crash
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Resource limits', () => {
    it('should handle many rapid GET requests', async () => {
      mockPowerDNS.getTXTRecord.mockResolvedValue({
        fqdn: 'test.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: 'bitcoin:bc1qexample...',
      });

      const requests = Array(20).fill(null).map(() =>
        request(app).get('/record/test')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });

    it('should handle requests with various authentication patterns', async () => {
      const authPatterns = [
        'Bearer valid-token',
        'bearer valid-token',
        'BEARER valid-token',
        'Bearer   valid-token   ',
        'Basic invalid',
        '',
        'Bearer',
        'Bearer ',
      ];

      const requests = authPatterns.map(auth =>
        request(app)
          .post('/register')
          .set('Authorization', auth)
          .send({
            name: 'test',
            uri: 'bitcoin:bc1qexample...',
          })
      );

      const responses = await Promise.all(requests);

      // Most should be 401, but app should not crash
      responses.forEach(response => {
        expect([200, 201, 401]).toContain(response.status);
      });
    });
  });

  describe('Error recovery', () => {
    it('should recover from PowerDNS service failures', async () => {
      // First request fails
      mockPowerDNS.getTXTRecord.mockRejectedValueOnce(new Error('Service temporarily unavailable'));
      
      // Second request succeeds
      mockPowerDNS.getTXTRecord.mockResolvedValueOnce(null);
      mockPowerDNS.addTXTRecord.mockResolvedValueOnce({
        fqdn: 'recovery.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: 'bitcoin:bc1qexample...',
      });

      const payload = {
        name: 'recovery',
        uri: 'bitcoin:bc1qexample...',
      };

      // First request should fail
      const firstResponse = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(payload);

      expect(firstResponse.status).toBe(500);

      // Second request should succeed
      const secondResponse = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(payload);

      expect(secondResponse.status).toBe(201);
    });
  });
});