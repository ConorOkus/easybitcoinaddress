import config from '../../config/config';

jest.mock('../../config/logger');

const mockAxiosInstance = {
  get: jest.fn(),
  patch: jest.fn(),
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockAxiosInstance),
}));

describe('PowerDNS Service', () => {
  let powerdns: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    config.powerdns = {
      apiUrl: 'http://localhost:8081',
      apiKey: 'test-api-key',
      serverId: 'localhost',
    };
    config.dns = {
      zone: 'easybitcoinaddress.me',
      recordPrefix: '_bitcoin-payment',
      ttl: 300,
    };

    powerdns = require('../../services/powerdns').default;
  });

  describe('constructFQDN', () => {
    it('should construct proper FQDN with trailing dot', () => {
      const fqdn = powerdns.constructFQDN('conor');
      expect(fqdn).toBe('conor.user._bitcoin-payment.easybitcoinaddress.me.');
    });
  });

  describe('FQDN normalization', () => {
    it('should handle case-insensitive matching in getTXTRecord', async () => {
      const name = 'TestUser';
      const uri = 'bitcoin:bc1qexample...';
      const expectedFqdn = 'testuser.user._bitcoin-payment.easybitcoinaddress.me.';

      // Simulate PowerDNS returning uppercase FQDN
      const zoneData = {
        rrsets: [
          {
            name: 'TestUser.User._bitcoin-payment.easybitcoinaddress.me.',
            type: 'TXT',
            records: [
              {
                content: `"${uri}"`,
                disabled: false,
              },
            ],
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: zoneData });

      const result = await powerdns.getTXTRecord(name);

      expect(result).toEqual({
        fqdn: expectedFqdn,
        uri,
      });
    });

    it('should handle missing trailing dot in returned FQDN', async () => {
      const name = 'conor';
      const uri = 'bitcoin:bc1qexample...';
      const expectedFqdn = 'conor.user._bitcoin-payment.easybitcoinaddress.me.';

      // Simulate PowerDNS returning FQDN without trailing dot
      const zoneData = {
        rrsets: [
          {
            name: 'conor.user._bitcoin-payment.easybitcoinaddress.me',
            type: 'TXT',
            records: [
              {
                content: `"${uri}"`,
                disabled: false,
              },
            ],
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: zoneData });

      const result = await powerdns.getTXTRecord(name);

      expect(result).toEqual({
        fqdn: expectedFqdn,
        uri,
      });
    });
  });

  describe('addTXTRecord', () => {
    it('should add a TXT record successfully', async () => {
      const name = 'conor';
      const uri = 'bitcoin:bc1qexample...';
      const fqdn = 'conor.user._bitcoin-payment.easybitcoinaddress.me.';

      mockAxiosInstance.patch.mockResolvedValue({ status: 200 });

      const result = await powerdns.addTXTRecord(name, uri);

      expect(result).toEqual({ fqdn, uri });
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/zones/easybitcoinaddress.me', {
        rrsets: [
          {
            name: fqdn,
            type: 'TXT',
            changetype: 'REPLACE',
            records: [
              {
                content: `"${uri}"`,
                disabled: false,
              },
            ],
            ttl: 300,
          },
        ],
      });
    });

    it('should handle API errors when adding record', async () => {
      mockAxiosInstance.patch.mockRejectedValue(new Error('Request failed with status code 500'));

      await expect(powerdns.addTXTRecord('conor', 'bitcoin:bc1q...')).rejects.toThrow(
        'Failed to add DNS record'
      );
    });

    it('should handle network errors when adding record', async () => {
      mockAxiosInstance.patch.mockRejectedValue(new Error('Network Error'));

      await expect(powerdns.addTXTRecord('conor', 'bitcoin:bc1q...')).rejects.toThrow(
        'Failed to add DNS record'
      );
    });
  });

  describe('getTXTRecord', () => {
    it('should retrieve an existing TXT record', async () => {
      const name = 'conor';
      const uri = 'bitcoin:bc1qexample...';
      const fqdn = 'conor.user._bitcoin-payment.easybitcoinaddress.me.';

      const zoneData = {
        rrsets: [
          {
            name: fqdn,
            type: 'TXT',
            records: [
              {
                content: `"${uri}"`,
                disabled: false,
              },
            ],
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: zoneData });

      const result = await powerdns.getTXTRecord(name);

      expect(result).toEqual({ fqdn, uri });
    });

    it('should return null for non-existent record', async () => {
      const zoneData = {
        rrsets: [
          {
            name: 'other.user._bitcoin-payment.easybitcoinaddress.me.',
            type: 'TXT',
            records: [{ content: '"bitcoin:bc1qother..."', disabled: false }],
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: zoneData });

      const result = await powerdns.getTXTRecord('nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for empty records array', async () => {
      const fqdn = 'conor.user._bitcoin-payment.easybitcoinaddress.me.';
      const zoneData = {
        rrsets: [
          {
            name: fqdn,
            type: 'TXT',
            records: [],
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: zoneData });

      const result = await powerdns.getTXTRecord('conor');

      expect(result).toBeNull();
    });

    it('should handle quoted content correctly', async () => {
      const name = 'conor';
      const uri = 'bitcoin:bc1qexample...';
      const fqdn = 'conor.user._bitcoin-payment.easybitcoinaddress.me.';

      const zoneData = {
        rrsets: [
          {
            name: fqdn,
            type: 'TXT',
            records: [
              {
                content: `"${uri}"`,
                disabled: false,
              },
            ],
          },
        ],
      };

      mockAxiosInstance.get.mockResolvedValue({ data: zoneData });

      const result = await powerdns.getTXTRecord(name);

      expect(result?.uri).toBe(uri);
    });

    it('should handle API errors when getting record', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('Request failed with status code 404'));

      await expect(powerdns.getTXTRecord('conor')).rejects.toThrow('Failed to get DNS record');
    });
  });

  describe('deleteTXTRecord', () => {
    it('should delete a TXT record successfully', async () => {
      const name = 'conor';
      const fqdn = 'conor.user._bitcoin-payment.easybitcoinaddress.me.';

      mockAxiosInstance.patch.mockResolvedValue({ status: 200 });

      const result = await powerdns.deleteTXTRecord(name);

      expect(result).toBe(true);
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/zones/easybitcoinaddress.me', {
        rrsets: [
          {
            name: fqdn,
            type: 'TXT',
            changetype: 'DELETE',
          },
        ],
      });
    });

    it('should handle API errors when deleting record', async () => {
      mockAxiosInstance.patch.mockRejectedValue(new Error('Request failed with status code 500'));

      await expect(powerdns.deleteTXTRecord('conor')).rejects.toThrow(
        'Failed to delete DNS record'
      );
    });

    it('should handle network errors when deleting record', async () => {
      mockAxiosInstance.patch.mockRejectedValue(new Error('Network Error'));

      await expect(powerdns.deleteTXTRecord('conor')).rejects.toThrow(
        'Failed to delete DNS record'
      );
    });
  });
});
