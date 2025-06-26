import axios, { AxiosInstance } from 'axios';
import config from '../config/config';
import logger from '../config/logger';
import { RecordResponse } from '../types';

interface PowerDNSRecord {
  content: string;
  disabled: boolean;
}

interface PowerDNSRRSet {
  name: string;
  type: string;
  changetype?: string;
  records?: PowerDNSRecord[];
}

interface PowerDNSZone {
  rrsets: PowerDNSRRSet[];
}

class PowerDNSService {
  private apiUrl: string;
  private apiKey: string;
  private serverId: string;
  private zone: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.apiUrl = config.powerdns.apiUrl;
    this.apiKey = config.powerdns.apiKey;
    this.serverId = config.powerdns.serverId;
    this.zone = `${config.dns.recordPrefix}.${config.dns.zone}`;
    
    logger.info('PowerDNS Service initialized', {
      zone: this.zone,
      apiUrl: this.apiUrl,
      serverId: this.serverId
    });
    
    this.axiosInstance = axios.create({
      baseURL: `${this.apiUrl}/api/v1/servers/${this.serverId}`,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  constructFQDN(name: string): string {
    return `${name.toLowerCase()}.user.${this.zone}.`;
  }

  private normalizeFQDN(fqdn: string): string {
    // Convert to lowercase and ensure trailing dot
    let normalized = fqdn.toLowerCase();
    if (!normalized.endsWith('.')) {
      normalized += '.';
    }
    return normalized;
  }

  async addTXTRecord(name: string, uri: string): Promise<RecordResponse> {
    const fqdn = this.constructFQDN(name);
    
    try {
      const rrsets = {
        rrsets: [{
          name: fqdn,
          type: 'TXT',
          changetype: 'REPLACE',
          records: [{
            content: `"${uri}"`,
            disabled: false
          }],
          ttl: config.dns.ttl
        }]
      };

      await this.axiosInstance.patch(`/zones/${this.zone}`, rrsets);
      logger.info(`Added TXT record for ${fqdn}`);
      
      return { fqdn, uri };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to add TXT record', { error: message, fqdn });
      throw new Error(`Failed to add DNS record: ${message}`);
    }
  }

  async getTXTRecord(name: string): Promise<RecordResponse | null> {
    const fqdn = this.constructFQDN(name);
    
    try {
      const response = await this.axiosInstance.get<PowerDNSZone>(`/zones/${this.zone}`);
      const zone = response.data;
      
      // Normalize FQDN for comparison (lowercase, ensure trailing dot)
      const normalizedFqdn = this.normalizeFQDN(fqdn);
      
      const rrset = zone.rrsets.find(rr => 
        this.normalizeFQDN(rr.name) === normalizedFqdn && rr.type === 'TXT'
      );
      
      if (!rrset || !rrset.records || rrset.records.length === 0) {
        return null;
      }
      
      const content = rrset.records[0].content;
      const uri = content.replace(/^"|"$/g, '');
      
      return { fqdn, uri };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to get TXT record', { error: message, fqdn });
      throw new Error(`Failed to get DNS record: ${message}`);
    }
  }

  async deleteTXTRecord(name: string): Promise<boolean> {
    const fqdn = this.constructFQDN(name);
    
    try {
      const rrsets = {
        rrsets: [{
          name: fqdn,
          type: 'TXT',
          changetype: 'DELETE'
        }]
      };

      await this.axiosInstance.patch(`/zones/${this.zone}`, rrsets);
      logger.info(`Deleted TXT record for ${fqdn}`);
      
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to delete TXT record', { error: message, fqdn });
      throw new Error(`Failed to delete DNS record: ${message}`);
    }
  }
}

export default new PowerDNSService();