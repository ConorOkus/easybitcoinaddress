import logger from './logger';

interface RequiredEnvVar {
  name: string;
  description: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
}

const requiredEnvVars: RequiredEnvVar[] = [
  {
    name: 'NODE_ENV',
    description: 'Node.js environment',
    required: false,
    defaultValue: 'development',
  },
  {
    name: 'PORT',
    description: 'Server port',
    required: false,
    defaultValue: '3000',
    validator: (value: string) => !isNaN(parseInt(value)) && parseInt(value) > 0,
  },
  {
    name: 'POWERDNS_API_URL',
    description: 'PowerDNS HTTP API URL',
    required: true,
    validator: (value: string) => value.startsWith('http://') || value.startsWith('https://'),
  },
  {
    name: 'POWERDNS_API_KEY',
    description: 'PowerDNS API key',
    required: true,
    validator: (value: string) => value.length >= 8,
  },
  {
    name: 'POWERDNS_SERVER_ID',
    description: 'PowerDNS server ID',
    required: false,
    defaultValue: 'localhost',
  },
  {
    name: 'DNS_ZONE',
    description: 'DNS zone for Bitcoin payment names',
    required: false,
    defaultValue: 'easybitcoinaddress.me',
  },
  {
    name: 'DNS_TTL',
    description: 'DNS record TTL in seconds',
    required: false,
    defaultValue: '300',
    validator: (value: string) => !isNaN(parseInt(value)) && parseInt(value) > 0,
  },
  {
    name: 'AUTH_TOKEN',
    description: 'API authentication token',
    required: true,
    validator: (value: string) => value.length >= 16,
  },
  {
    name: 'LOG_LEVEL',
    description: 'Logging level',
    required: false,
    defaultValue: 'info',
    validator: (value: string) => ['error', 'warn', 'info', 'debug'].includes(value),
  },
];

export function validateEnvironment(): void {
  logger.info('Validating environment variables...');

  const errors: string[] = [];
  const warnings: string[] = [];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (envVar.required && (!value || value.trim() === '')) {
      errors.push(`Missing required environment variable: ${envVar.name} (${envVar.description})`);
      continue;
    }

    // Use default value if not provided
    if (!value && envVar.defaultValue) {
      process.env[envVar.name] = envVar.defaultValue;
      logger.info(`Using default value for ${envVar.name}: ${envVar.defaultValue}`);
      continue;
    }

    // Validate value if provided
    if (value && envVar.validator && !envVar.validator(value)) {
      errors.push(`Invalid value for environment variable: ${envVar.name} (${envVar.description})`);
    }
  }

  // Check for development secrets in production
  if (process.env.NODE_ENV === 'production') {
    const developmentSecrets = [
      'your-powerdns-api-key-here',
      'your-secret-auth-token-here',
      'development-secret-token-123',
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar.name];
      if (value && developmentSecrets.includes(value)) {
        errors.push(
          `Production environment detected but ${envVar.name} contains a development placeholder value`
        );
      }
    }
  }

  // Check for weak secrets
  const authToken = process.env.AUTH_TOKEN;
  if (authToken) {
    if (authToken.length < 32) {
      warnings.push('AUTH_TOKEN should be at least 32 characters for better security');
    }
    if (authToken.includes('secret') || authToken.includes('token')) {
      warnings.push(
        'AUTH_TOKEN appears to contain predictable words - consider using a random string'
      );
    }
  }

  // Log warnings
  if (warnings.length > 0) {
    logger.warn('Environment warnings:');
    warnings.forEach((warning) => logger.warn(`  - ${warning}`));
  }

  // Handle errors
  if (errors.length > 0) {
    logger.error('Environment validation failed:');
    errors.forEach((error) => logger.error(`  - ${error}`));
    logger.error('Please check your .env file and fix the above issues');
    logger.error('See .env.example for reference');
    process.exit(1);
  }

  logger.info('Environment validation completed successfully');
}

export function generateSecureToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('base64');
}

export function maskSensitiveValue(value: string): string {
  if (!value || value.length <= 8) {
    return '***';
  }
  return value.substring(0, 4) + '***' + value.substring(value.length - 4);
}
