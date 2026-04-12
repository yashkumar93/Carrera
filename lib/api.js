import axios from 'axios';
import { getIdToken } from './firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Attach Firebase ID token to every request when available
        this.client.interceptors.request.use(async (config) => {
            try {
                const token = await getIdToken();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            } catch (err) {
                // Public endpoints (health, stages) still work without a token
            }
            return config;
        });
    }

    async sendMessage(message, sessionId = null, stage = null, isOnboarding = false) {
        try {
            const response = await this.client.post('/api/chat', {
                message,
                session_id: sessionId,
                stage,
                is_onboarding: isOnboarding,
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.response?.data?.detail || 'Failed to send message');
        }
    }

    async streamMessage(message, sessionId, stage, onChunk, onComplete, onError) {
        try {
            const token = await getIdToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message, session_id: sessionId, stage }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'Failed to send message');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.done) {
                                if (onComplete) onComplete(data);
                            } else {
                                if (onChunk) onChunk(data.token);
                            }
                        } catch (e) {
                            console.error('Error parsing SSE data:', e);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Stream Error:', error);
            if (onError) onError(error);
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

    async listSessions() {
        try {
            const response = await this.client.get('/api/sessions');
            return response.data.sessions;
        } catch (error) {
            console.error('List sessions error:', error);
            return [];
        }
    }

    async deleteSession(sessionId) {
        try {
            await this.client.delete(`/api/session/${sessionId}`);
        } catch (error) {
            console.error('Delete session error:', error);
        }
    }

    // ---------------------------------------------------------------------------
    // Profile
    // ---------------------------------------------------------------------------

    async getProfile() {
        try {
            const response = await this.client.get('/api/profile');
            return response.data;
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    }

    async updateProfile(data) {
        try {
            const response = await this.client.put('/api/profile', data);
            return response.data;
        } catch (error) {
            console.error('Update profile error:', error);
            throw new Error(error.response?.data?.detail || 'Failed to update profile');
        }
    }

    // ---------------------------------------------------------------------------
    // Feedback
    // ---------------------------------------------------------------------------

    async submitFeedback(sessionId, rating, messageSnapshot = null, comment = null) {
        try {
            const response = await this.client.post(`/api/session/${sessionId}/feedback`, {
                rating,
                message_snapshot: messageSnapshot,
                comment,
            });
            return response.data;
        } catch (error) {
            console.error('Submit feedback error:', error);
            // Non-critical — don't throw, just log
        }
    }

    // ---------------------------------------------------------------------------
    // Account Deletion (GDPR)
    // ---------------------------------------------------------------------------

    async deleteAccountData() {
        try {
            const response = await this.client.delete('/api/account');
            return response.data;
        } catch (error) {
            console.error('Delete account error:', error);
            throw new Error(error.response?.data?.detail || 'Failed to delete account data');
        }
    }

    // ---------------------------------------------------------------------------
    // Misc
    // ---------------------------------------------------------------------------

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