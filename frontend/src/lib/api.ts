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
    console.log('=== API Configuration ===');
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('API_KEY:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET');
    console.log('Payload:', payload);
    
    const url = `${API_BASE_URL}/register`;
    console.log('Full URL:', url);
    
    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
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