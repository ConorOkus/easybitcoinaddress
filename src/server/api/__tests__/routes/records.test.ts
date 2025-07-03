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
import recordsRouter from '../../routes/records';
import powerdns from '../../services/powerdns';
import { RecordResponse } from '../../types';

jest.mock('../../services/powerdns');
jest.mock('../../config/logger', () => ({
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock the environment validation
jest.mock('../../config/env-validation', () => ({
  validateEnvironment: jest.fn(),
}));

const mockPowerDNS = powerdns as jest.Mocked<typeof powerdns>;

const app = express();
app.use(express.json());
app.use(recordsRouter);

const validAuthToken = 'test-auth-token';

describe('Records Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const validPayload = {
      name: 'conor',
      uri: 'bitcoin:bc1qexample...',
    };

    it('should register a new name successfully', async () => {
      const mockResponse: RecordResponse = {
        fqdn: 'conor.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: 'bitcoin:bc1qexample...',
      };

      mockPowerDNS.getTXTRecord.mockResolvedValueOnce(null);
      mockPowerDNS.addTXTRecord.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(validPayload);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Name registered successfully',
        fqdn: mockResponse.fqdn,
        uri: mockResponse.uri,
      });
      expect(mockPowerDNS.getTXTRecord).toHaveBeenCalledWith('conor');
      expect(mockPowerDNS.addTXTRecord).toHaveBeenCalledWith('conor', 'bitcoin:bc1qexample...');
    });

    it('should return 409 if name already exists', async () => {
      const existingRecord: RecordResponse = {
        fqdn: 'conor.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: 'bitcoin:bc1qold...',
      };

      mockPowerDNS.getTXTRecord.mockResolvedValueOnce(existingRecord);

      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(validPayload);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        error: 'Name already registered',
        fqdn: existingRecord.fqdn,
      });
      expect(mockPowerDNS.addTXTRecord).not.toHaveBeenCalled();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/register').send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Missing or invalid authorization header',
      });
    });

    it('should return 401 with invalid authentication', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', 'Bearer invalid-token')
        .send(validPayload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        error: 'Invalid authentication token',
      });
    });

    it('should return 400 for invalid name format', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'invalid name!',
          uri: 'bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('lowercase');
    });

    it('should return 400 for name exceeding 64 characters', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'a'.repeat(65),
          uri: 'bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('64 characters');
    });

    it('should return 400 for invalid URI format', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'conor',
          uri: 'not-bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('bitcoin');
    });

    it('should accept valid BOLT 12 offer URI', async () => {
      const bolt12Uri = 'bitcoin:?lno=lno1qgsqvgnwgcg35z6ee2h3yczraddm72xrfua9uve2rlrm9deu7xyfzrcgqgn3qzsyvfkx26qkyypwa3cf24sm78dzrutkpdswp6kazq4p6';
      const mockResponse: RecordResponse = {
        fqdn: 'bob.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: bolt12Uri,
      };

      mockPowerDNS.getTXTRecord.mockResolvedValueOnce(null);
      mockPowerDNS.addTXTRecord.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'bob',
          uri: bolt12Uri,
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: 'Name registered successfully',
        fqdn: mockResponse.fqdn,
        uri: mockResponse.uri,
      });
    });

    it('should return 400 for invalid BOLT 12 offer format', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'bob',
          uri: 'bitcoin:?lno=invalid-bolt12-offer',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('lno1');
    });

    it('should return 400 for malformed BOLT 12 URI', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'bob',
          uri: 'bitcoin:?lno=',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('lno1');
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    // Additional edge case and security tests
    it('should return 400 for empty string fields', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: '',
          uri: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for whitespace-only name', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: '   ',
          uri: 'bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for uppercase characters in name', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'Bob',
          uri: 'bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('lowercase');
    });

    it('should return 400 for special characters in name', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'bob@test',
          uri: 'bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
      expect(response.body.details).toContain('lowercase');
    });

    it('should return 400 for SQL injection attempt in name', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: "'; DROP TABLE records; --",
          uri: 'bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for XSS attempt in name', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: '<script>alert("xss")</script>',
          uri: 'bitcoin:bc1qexample...',
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should handle very long URI gracefully', async () => {
      const longUri = 'bitcoin:' + 'a'.repeat(10000);
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 'bob',
          uri: longUri,
        });

      // Should either accept it or fail validation, but not crash
      expect([200, 201, 400, 413]).toContain(response.status);
    });

    it('should return 400 for null values', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: null,
          uri: null,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should return 400 for non-string values', async () => {
      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send({
          name: 123,
          uri: { invalid: 'object' },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation error');
    });

    it('should handle PowerDNS service errors', async () => {
      mockPowerDNS.getTXTRecord.mockRejectedValueOnce(new Error('PowerDNS API error'));

      const response = await request(app)
        .post('/register')
        .set('Authorization', `Bearer ${validAuthToken}`)
        .send(validPayload);

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'PowerDNS API error',
      });
    });
  });

  describe('GET /record/:name', () => {
    it('should retrieve an existing record', async () => {
      const mockRecord: RecordResponse = {
        fqdn: 'conor.user._bitcoin-payment.easybitcoinaddress.me.',
        uri: 'bitcoin:bc1qexample...',
      };

      mockPowerDNS.getTXTRecord.mockResolvedValueOnce(mockRecord);

      const response = await request(app).get('/record/conor');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRecord);
      expect(mockPowerDNS.getTXTRecord).toHaveBeenCalledWith('conor');
    });

    it('should return 404 for non-existent record', async () => {
      mockPowerDNS.getTXTRecord.mockResolvedValueOnce(null);

      const response = await request(app).get('/record/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Record not found',
      });
    });

    it('should return 400 for invalid name format', async () => {
      const response = await request(app).get('/record/invalid name!');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid name format');
      expect(response.body.details).toBeDefined();
    });

    it('should return 400 for name exceeding 64 characters', async () => {
      const response = await request(app).get('/record/' + 'a'.repeat(65));

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid name format');
    });

    it('should handle PowerDNS service errors', async () => {
      mockPowerDNS.getTXTRecord.mockRejectedValueOnce(new Error('PowerDNS API error'));

      const response = await request(app).get('/record/conor');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'PowerDNS API error',
      });
    });
  });
});
