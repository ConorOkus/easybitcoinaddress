import axios from 'axios';

// Environment validation
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (!API_BASE_URL) {
  console.error('NEXT_PUBLIC_API_URL environment variable is not set');
  console.error('Please check your .env.local file');
}

if (!API_KEY) {
  console.error('NEXT_PUBLIC_API_KEY environment variable is not set');
  console.error('Please check your .env.local file');
}

// Use defaults if not set (for development)
const baseUrl = API_BASE_URL || 'http://localhost:3000';
const apiKey = API_KEY || '';

interface RegisterPayload {
  name: string;
  uri: string;
}

interface RecordResponse {
  fqdn: string;
  uri: string;
}

export const api = {
  async registerName(payload: RegisterPayload): Promise<void> {
    console.log('=== API Configuration ===');
    console.log('API_BASE_URL:', baseUrl);
    console.log('API_KEY:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT SET');
    console.log('Payload:', payload);

    const url = `${baseUrl}/register`;
    console.log('Full URL:', url);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('Success response:', response.status, response.data);
    } catch (error: any) {
      console.error('=== API Error ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);

      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('No response received:', error.request);
      }

      throw error;
    }
  },

  async getRecord(name: string): Promise<RecordResponse> {
    const response = await axios.get<RecordResponse>(`${baseUrl}/record/${name}`);
    return response.data;
  },

  async deleteRecord(name: string): Promise<void> {
    await axios.delete(`${baseUrl}/record/${name}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });
  },
};
