import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

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
    await axios.post(`${API_BASE_URL}/register`, payload, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
  },

  async getRecord(name: string): Promise<RecordResponse> {
    const response = await axios.get<RecordResponse>(`${API_BASE_URL}/record/${name}`);
    return response.data;
  },

  async deleteRecord(name: string): Promise<void> {
    await axios.delete(`${API_BASE_URL}/record/${name}`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
      },
    });
  },
};