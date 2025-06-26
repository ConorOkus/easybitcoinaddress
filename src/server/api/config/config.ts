import * as dotenv from 'dotenv';
import * as path from 'path';
import { Config } from '../types';
import { validateEnvironment } from './env-validation';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

// Validate environment variables on startup
validateEnvironment();

const config: Config = {
  env: process.env.NODE_ENV as string,
  port: parseInt(process.env.PORT as string, 10),

  powerdns: {
    apiUrl: process.env.POWERDNS_API_URL as string,
    apiKey: process.env.POWERDNS_API_KEY as string,
    serverId: process.env.POWERDNS_SERVER_ID as string,
  },

  dns: {
    zone: process.env.DNS_ZONE as string,
    recordPrefix: '_bitcoin-payment',
    ttl: parseInt(process.env.DNS_TTL as string, 10),
  },

  auth: {
    token: process.env.AUTH_TOKEN as string,
  },

  logging: {
    level: process.env.LOG_LEVEL as string,
  },
};

export default config;
