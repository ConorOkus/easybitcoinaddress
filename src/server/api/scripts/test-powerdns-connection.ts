#!/usr/bin/env tsx

import axios from 'axios';
import config from '../config/config';

interface ConnectionTest {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: any;
}

async function testPowerDNSConnection(): Promise<void> {
  const results: ConnectionTest[] = [];

  console.log('🔍 PowerDNS Connection Diagnostics\n');
  console.log(`Configuration:`);
  console.log(`  API URL: [CONFIGURED]`);
  console.log(`  Server ID: [CONFIGURED]`);
  console.log(`  DNS Zone: [CONFIGURED]`);
  console.log(`  DNS TTL: ${config.dns.ttl}`);
  console.log(`  API Key: ${config.powerdns.apiKey ? '***SET***' : '***NOT SET***'}\n`);

  // Test 1: Check if API key is configured
  if (!config.powerdns.apiKey) {
    results.push({
      test: 'API Key Configuration',
      status: 'FAIL',
      message: 'PowerDNS API key is not configured',
    });
  } else {
    results.push({
      test: 'API Key Configuration',
      status: 'PASS',
      message: 'API key is configured',
    });
  }

  // Test 2: Basic connectivity to PowerDNS API
  try {
    const response = await axios.get(`${config.powerdns.apiUrl}/api/v1/servers`, {
      headers: {
        'X-API-Key': config.powerdns.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    results.push({
      test: 'PowerDNS API Connectivity',
      status: 'PASS',
      message: 'Successfully connected to PowerDNS API',
      details: `Response status: ${response.status}`,
    });
  } catch (error: any) {
    const status = error.code === 'ECONNREFUSED' ? 'FAIL' : 'WARN';
    results.push({
      test: 'PowerDNS API Connectivity',
      status,
      message: `Failed to connect to PowerDNS API: ${error.message}`,
      details: {
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
      },
    });
  }

  // Test 3: Check if the specified server exists
  try {
    const response = await axios.get(
      `${config.powerdns.apiUrl}/api/v1/servers/${config.powerdns.serverId}`,
      {
        headers: {
          'X-API-Key': config.powerdns.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    results.push({
      test: 'Server ID Verification',
      status: 'PASS',
      message: `Server '${config.powerdns.serverId}' exists`,
      details: response.data,
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      results.push({
        test: 'Server ID Verification',
        status: 'FAIL',
        message: `Server '${config.powerdns.serverId}' not found`,
      });
    } else if (error.code !== 'ECONNREFUSED') {
      results.push({
        test: 'Server ID Verification',
        status: 'WARN',
        message: `Could not verify server: ${error.message}`,
      });
    }
  }

  // Test 4: Check if the DNS zone exists
  try {
    const response = await axios.get(
      `${config.powerdns.apiUrl}/api/v1/servers/${config.powerdns.serverId}/zones/${config.dns.zone}`,
      {
        headers: {
          'X-API-Key': config.powerdns.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    results.push({
      test: 'DNS Zone Verification',
      status: 'PASS',
      message: `Zone '${config.dns.zone}' exists and is accessible`,
      details: {
        name: response.data.name,
        kind: response.data.kind,
        dnssec: response.data.dnssec,
      },
    });
  } catch (error: any) {
    if (error.response?.status === 404) {
      results.push({
        test: 'DNS Zone Verification',
        status: 'FAIL',
        message: `Zone '${config.dns.zone}' not found`,
      });
    } else if (error.code !== 'ECONNREFUSED') {
      results.push({
        test: 'DNS Zone Verification',
        status: 'WARN',
        message: `Could not verify zone: ${error.message}`,
      });
    }
  }

  // Test 5: Test creating a test TXT record
  const testName = `test.user.${config.dns.recordPrefix}.${config.dns.zone}.`;
  try {
    const rrsets = {
      rrsets: [
        {
          name: testName,
          type: 'TXT',
          changetype: 'REPLACE',
          records: [
            {
              content: '"bitcoin:test-connection"',
              disabled: false,
            },
          ],
          ttl: config.dns.ttl,
        },
      ],
    };

    await axios.patch(
      `${config.powerdns.apiUrl}/api/v1/servers/${config.powerdns.serverId}/zones/${config.dns.zone}`,
      rrsets,
      {
        headers: {
          'X-API-Key': config.powerdns.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    results.push({
      test: 'Record Creation Test',
      status: 'PASS',
      message: 'Successfully created test TXT record',
    });

    // Test 6: Verify we can retrieve the record we just created
    try {
      const zoneResponse = await axios.get(
        `${config.powerdns.apiUrl}/api/v1/servers/${config.powerdns.serverId}/zones/${config.dns.zone}`,
        {
          headers: {
            'X-API-Key': config.powerdns.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      const zone = zoneResponse.data;
      const normalizedTestName = testName.toLowerCase();

      const foundRecord = zone.rrsets.find(
        (rr: any) => rr.name.toLowerCase() === normalizedTestName && rr.type === 'TXT'
      );

      if (foundRecord) {
        results.push({
          test: 'Record Retrieval Test',
          status: 'PASS',
          message: 'Successfully retrieved test TXT record',
          details: {
            name: foundRecord.name,
            content: foundRecord.records[0]?.content,
            ttl: foundRecord.ttl,
          },
        });
      } else {
        results.push({
          test: 'Record Retrieval Test',
          status: 'FAIL',
          message: 'Could not find test record after creation',
          details: {
            expectedName: testName,
            normalizedName: normalizedTestName,
            availableRecords: zone.rrsets
              .filter((rr: any) => rr.type === 'TXT')
              .map((rr: any) => rr.name),
          },
        });
      }
    } catch (retrievalError: any) {
      results.push({
        test: 'Record Retrieval Test',
        status: 'WARN',
        message: `Could not test record retrieval: ${retrievalError.message}`,
      });
    }

    // Clean up the test record
    try {
      const deleteRrsets = {
        rrsets: [
          {
            name: testName,
            type: 'TXT',
            changetype: 'DELETE',
          },
        ],
      };

      await axios.patch(
        `${config.powerdns.apiUrl}/api/v1/servers/${config.powerdns.serverId}/zones/${config.dns.zone}`,
        deleteRrsets,
        {
          headers: {
            'X-API-Key': config.powerdns.apiKey,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      results.push({
        test: 'Record Deletion Test',
        status: 'PASS',
        message: 'Successfully deleted test TXT record',
      });
    } catch (cleanupError) {
      results.push({
        test: 'Record Deletion Test',
        status: 'WARN',
        message: 'Could not clean up test record',
      });
    }
  } catch (error: any) {
    if (error.code !== 'ECONNREFUSED') {
      results.push({
        test: 'Record Creation Test',
        status: 'FAIL',
        message: `Failed to create test record: ${error.message}`,
        details: error.response?.data,
      });
    }
  }

  // Print results
  console.log('📊 Test Results:\n');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach((result) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${icon} ${result.test}: ${result.message}`);

    if (result.details) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
    }

    if (result.status === 'PASS') passCount++;
    else if (result.status === 'FAIL') failCount++;
    else warnCount++;

    console.log('');
  });

  console.log(`\n📈 Summary: ${passCount} passed, ${failCount} failed, ${warnCount} warnings\n`);

  // Recommendations
  if (failCount > 0 || warnCount > 0) {
    console.log('🔧 Recommendations:\n');

    if (!config.powerdns.apiKey) {
      console.log('• Set POWERDNS_API_KEY environment variable');
    }

    if (results.some((r) => r.test === 'PowerDNS API Connectivity' && r.status === 'FAIL')) {
      console.log('• Check if PowerDNS server is running');
      console.log('• Verify POWERDNS_API_URL is correct');
      console.log('• Check firewall/network connectivity');
    }

    if (results.some((r) => r.test === 'Server ID Verification' && r.status === 'FAIL')) {
      console.log('• Verify POWERDNS_SERVER_ID is correct (usually "localhost")');
    }

    if (results.some((r) => r.test === 'DNS Zone Verification' && r.status === 'FAIL')) {
      console.log('• Create the DNS zone in PowerDNS');
      console.log('• Verify DNS_ZONE environment variable');
    }
  }
}

// Run the test
testPowerDNSConnection().catch(console.error);
