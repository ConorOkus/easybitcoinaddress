import axios from 'axios';

// Environment validation
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

if (!API_KEY) {
  throw new Error('NEXT_PUBLIC_API_KEY environment variable is not set');
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
    const url = `${baseUrl}/register`;

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error: any) {

      throw error;
    }
  },

  async getRecord(name: string): Promise<RecordResponse> {
    const response = await axios.get<RecordResponse>(`${baseUrl}/record/${name}`);
    return response.data;
  },
};
