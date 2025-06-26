beforeEach(() => {
  jest.clearAllMocks();

  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.AUTH_TOKEN = 'test-auth-token';
  process.env.POWERDNS_API_URL = 'http://localhost:8081';
  process.env.POWERDNS_API_KEY = 'test-api-key';
  process.env.POWERDNS_SERVER_ID = 'localhost';
  process.env.DNS_ZONE = 'easybitcoinaddress.me';
  process.env.DNS_RECORD_PREFIX = '_bitcoin-payment';
  process.env.DNS_TTL = '300';
  process.env.LOG_LEVEL = 'error';
});

afterAll(() => {
  jest.restoreAllMocks();
});
