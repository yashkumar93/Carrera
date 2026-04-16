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

    async sendMessage(message, stage = null, isOnboarding = false) {
        try {
            const response = await this.client.post('/api/chat', {
                message,
                stage,
                is_onboarding: isOnboarding,
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw new Error(error.response?.data?.detail || 'Failed to send message');
        }
    }

    async streamMessage(message, _unused, stage, onChunk, onComplete, onError) {
        try {
            const token = await getIdToken();
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ message, stage }),
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

    // ---------------------------------------------------------------------------
    // Single chat history & personal wiki
    // ---------------------------------------------------------------------------

    async getChatHistory() {
        try {
            const response = await this.client.get('/api/chat/history');
            return response.data; // { messages: [...], stage: string }
        } catch (error) {
            console.error('Get chat history error:', error);
            return { messages: [], stage: 'discovery' };
        }
    }

    async clearChatHistory() {
        const response = await this.client.delete('/api/chat/history');
        return response.data;
    }

    async getWiki() {
        try {
            const response = await this.client.get('/api/chat/wiki');
            return response.data; // { wiki: {slug: {content, version, updated_at}}, slugs, descriptions }
        } catch (error) {
            console.error('Get wiki error:', error);
            return { wiki: {}, slugs: [], descriptions: {} };
        }
    }

    async getWikiUpdates() {
        try {
            const response = await this.client.get('/api/chat/wiki/updates');
            return response.data.updates || [];
        } catch (error) {
            console.error('Get wiki updates error:', error);
            return [];
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
    // Generic REST helpers (used by admin panel)
    // ---------------------------------------------------------------------------

    async get(path) {
        const response = await this.client.get(`/api${path}`);
        return response.data;
    }

    async patch(path, data) {
        const response = await this.client.patch(`/api${path}`, data);
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // Resume parsing
    // ---------------------------------------------------------------------------

    async parseResume(file) {
        const formData = new FormData();
        formData.append('file', file);
        const token = await getIdToken();
        const headers = { Authorization: `Bearer ${token}` };
        const response = await fetch(`${API_BASE_URL}/api/resume/parse`, {
            method: 'POST',
            headers,
            body: formData,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Resume parsing failed');
        }
        return response.json();
    }

    async getResumeAnalysis() {
        try {
            const response = await this.client.get('/api/resume/analysis');
            return response.data;
        } catch (error) {
            if (error.response?.status === 404) return null;
            throw error;
        }
    }

    // ---------------------------------------------------------------------------
    // Aptitude assessments
    // ---------------------------------------------------------------------------

    async generateAssessment(career, numQuestions = 12) {
        const response = await this.client.post('/api/assessment/generate', {
            career,
            num_questions: numQuestions,
        });
        return response.data;
    }

    async scoreAssessment(career, questions, answers) {
        const response = await this.client.post('/api/assessment/score', {
            career,
            questions,
            answers,
        });
        return response.data;
    }

    async getAssessmentHistory() {
        const response = await this.client.get('/api/assessment/history');
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // Mentorship Marketplace
    // ---------------------------------------------------------------------------

    async registerMentor(data) {
        const response = await this.client.post('/api/mentors/register', data);
        return response.data;
    }

    async listMentors(expertise = null, limit = 20, offset = 0) {
        const params = { limit, offset };
        if (expertise) params.expertise = expertise;
        const response = await this.client.get('/api/mentors', { params });
        return response.data;
    }

    async getMentor(mentorId) {
        const response = await this.client.get(`/api/mentors/${mentorId}`);
        return response.data;
    }

    async getMyMentorProfile() {
        try {
            const response = await this.client.get('/api/mentors/me');
            return response.data;
        } catch (e) {
            if (e.response?.status === 404) return null;
            throw e;
        }
    }

    async requestMentorship(mentorId, data) {
        const response = await this.client.post(`/api/mentors/${mentorId}/request`, data);
        return response.data;
    }

    async getMySentRequests() {
        const response = await this.client.get('/api/mentors/requests/sent');
        return response.data;
    }

    async getMyReceivedRequests() {
        const response = await this.client.get('/api/mentors/requests/received');
        return response.data;
    }

    async updateRequestStatus(requestId, status) {
        const response = await this.client.patch(`/api/mentors/requests/${requestId}/status`, { status });
        return response.data;
    }

    async addMentorReview(mentorId, rating, comment) {
        const response = await this.client.post(`/api/mentors/${mentorId}/review`, { rating, comment });
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // Community Forum
    // ---------------------------------------------------------------------------

    async createPost(title, content, tags) {
        const response = await this.client.post('/api/community/posts', { title, content, tags });
        return response.data;
    }

    async listPosts(tag = null, limit = 20, offset = 0) {
        const params = { limit, offset };
        if (tag) params.tag = tag;
        const response = await this.client.get('/api/community/posts', { params });
        return response.data;
    }

    async getPost(postId) {
        const response = await this.client.get(`/api/community/posts/${postId}`);
        return response.data;
    }

    async addReply(postId, content) {
        const response = await this.client.post(`/api/community/posts/${postId}/replies`, { content });
        return response.data;
    }

    async votePost(postId) {
        const response = await this.client.post(`/api/community/posts/${postId}/vote`);
        return response.data;
    }

    async deletePost(postId) {
        const response = await this.client.delete(`/api/community/posts/${postId}`);
        return response.data;
    }

    async getCommunityTags() {
        const response = await this.client.get('/api/community/tags');
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // Employers
    // ---------------------------------------------------------------------------

    async listEmployers(career = null, limit = 20) {
        const params = { limit };
        if (career) params.career = career;
        const response = await this.client.get('/api/employers', { params });
        return response.data;
    }

    async getEmployer(employerId) {
        const response = await this.client.get(`/api/employers/${employerId}`);
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // API Key Management
    // ---------------------------------------------------------------------------

    async createApiKey(name) {
        const response = await this.client.post('/api/keys', { name });
        return response.data;
    }

    async listApiKeys() {
        const response = await this.client.get('/api/keys');
        return response.data;
    }

    async revokeApiKey(keyId) {
        const response = await this.client.delete(`/api/keys/${keyId}`);
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // Career Comparison
    // ---------------------------------------------------------------------------

    async compareCareers(careers, userSkills = []) {
        const response = await this.client.post('/api/compare', {
            careers,
            user_skills: userSkills,
        });
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // Learning Roadmap
    // ---------------------------------------------------------------------------

    async generateRoadmap(careerGoal, timelineMonths = 6) {
        const response = await this.client.post('/api/roadmap/generate', {
            career_goal: careerGoal,
            timeline_months: timelineMonths,
        });
        return response.data;
    }

    async getRoadmap() {
        const response = await this.client.get('/api/roadmap');
        return response.data;
    }

    async addRoadmapItem(data) {
        const response = await this.client.post('/api/roadmap/items', data);
        return response.data;
    }

    async updateRoadmapItem(itemId, data) {
        const response = await this.client.patch(`/api/roadmap/items/${itemId}`, data);
        return response.data;
    }

    async deleteRoadmapItem(itemId) {
        const response = await this.client.delete(`/api/roadmap/items/${itemId}`);
        return response.data;
    }

    async clearRoadmap() {
        const response = await this.client.delete('/api/roadmap');
        return response.data;
    }

    // ---------------------------------------------------------------------------
    // PDF Export
    // ---------------------------------------------------------------------------

    async exportSessionPdf(sessionId, filename = 'career-plan.pdf') {
        const token = await getIdToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(`${API_BASE_URL}/api/session/${sessionId}/export/pdf`, {
            headers,
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'PDF export failed');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    // ---------------------------------------------------------------------------
    // Labor Market Data
    // ---------------------------------------------------------------------------

    async getLaborMarket(career) {
        const response = await this.client.get(`/api/labor-market/${encodeURIComponent(career)}`);
        return response.data;
    }

    async getLaborMarketBatch(careers) {
        const response = await this.client.post('/api/labor-market/batch', { careers });
        return response.data;
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