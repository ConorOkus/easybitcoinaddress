export interface Config {
  env: string;
  port: number;
  powerdns: {
    apiUrl: string;
    apiKey: string;
    serverId: string;
  };
  dns: {
    zone: string;
    recordPrefix: string;
    ttl: number;
  };
  auth: {
    token: string;
  };
  logging: {
    level: string;
  };
}

export interface RegisterRequest {
  name: string;
  uri: string;
}

export interface RecordResponse {
  fqdn: string;
  uri: string;
}

export interface ErrorResponse {
  error: string;
  details?: string;
  fqdn?: string;
}