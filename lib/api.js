import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    async sendMessage(message, sessionId = null, stage = null) {
        try {
            const response = await this.client.post('/api/chat', {
                message,
                session_id: sessionId,
                stage,
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.response?.data?.detail || 'Failed to send message');
        }
    }

    async getSessionInfo(sessionId) {
        try {
            const response = await this.client.get(`/api/session/${sessionId}`);
            return response.data;
        } catch (error) {
            console.error('Session info error:', error);
            throw new Error('Failed to get session info');
        }
    }

    async deleteSession(sessionId) {
        try {
            await this.client.delete(`/api/session/${sessionId}`);
        } catch (error) {
            console.error('Delete session error:', error);
        }
    }

    async healthCheck() {
        try {
            const response = await this.client.get('/api/health');
            return response.data;
        } catch (error) {
            console.error('Health check error:', error);
            return { status: 'unhealthy' };
        }
    }

    async getStages() {
        try {
            const response = await this.client.get('/api/stages');
            return response.data.stages;
        } catch (error) {
            console.error('Get stages error:', error);
            return [];
        }
    }
}

export default new ApiService();
