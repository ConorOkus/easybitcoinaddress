import * as dotenv from 'dotenv';
import * as path from 'path';
import { Config } from '../types';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  powerdns: {
    apiUrl: process.env.POWERDNS_API_URL || 'http://localhost:8081',
    apiKey: process.env.POWERDNS_API_KEY || '',
    serverId: process.env.POWERDNS_SERVER_ID || 'localhost'
  },
  
  dns: {
    zone: process.env.DNS_ZONE || 'easybitcoinaddress.me',
    recordPrefix: '_bitcoin-payment',
    ttl: parseInt(process.env.DNS_TTL || '300', 10)
  },
  
  auth: {
    token: process.env.AUTH_TOKEN || ''
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};

export default config;