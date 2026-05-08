const API_BASE_URL = 'http://localhost:3001/api';
const API_ORIGIN = (() => {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return 'http://localhost:3001';
  }
})();

export function getApiOrigin() {
  return API_ORIGIN;
}

export function normalizeMediaUrl(url) {
  if (!url) return url;
  // already absolute (http/https/blob/data)
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  // backend serves relative paths from its origin
  if (url.startsWith('/')) return `${API_ORIGIN}${url}`;
  return `${API_ORIGIN}/${url}`;
}

export function mediaDownloadUrl(mediaId) {
  if (!mediaId) return null;
  // Note: <img>/<video> tags cannot send Authorization headers.
  // We pass the auth token as a query param so media can render.
  // (Trade-off: token appears in URL/history; consider short-lived signed media tokens later.)
  const token = (() => {
    try { return localStorage.getItem('authToken') } catch { return null }
  })();
  const u = new URL(`${API_ORIGIN}/api/media/${mediaId}`);
  if (token) u.searchParams.set('token', token);
  return u.toString();
}

class ApiService {
  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async uploadCapsuleMedia(capsuleId, file) {
    const url = `${API_BASE_URL}/capsules/${capsuleId}/media`;
    const token = localStorage.getItem('authToken');
    const form = new FormData();
    form.append('file', file);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: form
    });
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Upload failed (HTTP ${response.status})`);
      }
      if (data?.media?.id) {
        return {
          ...data,
          media: {
            ...data.media,
            url: data.media.url ? normalizeMediaUrl(data.media.url) : mediaDownloadUrl(data.media.id),
          }
        }
      }
      return data;
    } else {
      const text = await response.text();
      throw new Error(`Upload failed (HTTP ${response.status}). ${text.slice(0, 180)}`);
    }
  }

  // Auth endpoints
  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async verifyOTP(email, otp, name, password) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, name, password }),
    });
  }

  async resendOTP(email, name) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async verifyEmail(token) {
    return this.request('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async resendVerification(email) {
    return this.request('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Profile endpoints
  async updateProfile(profileData) {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/user/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async getProfile() {
    return this.request('/user/profile');
  }

  async deleteAccount() {
    return this.request('/user/delete-account', {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Capsule endpoints
  async createCapsule(payload) {
    return this.request('/capsules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async listMyCapsules() {
    return this.request('/capsules');
  }

  async deleteCapsule(id) {
    return this.request(`/capsules/${id}`, { method: 'DELETE' });
  }

  async removeCollaborator(capsuleId, email) {
    return this.request(`/capsules/${capsuleId}/collaborators`, {
      method: 'DELETE',
      body: JSON.stringify({ email }),
    });
  }

  async listPublicCapsules() {
    return this.request('/capsules/public');
  }

  async listMemories() {
    return this.request('/memories');
  }

  async addToMemories(capsuleId) {
    return this.request(`/memories/${capsuleId}`, { method: 'POST' });
  }

  async removeFromMemories(capsuleId) {
    return this.request(`/memories/${capsuleId}`, { method: 'DELETE' });
  }

  async unlockCapsule(id, password) {
    return this.request(`/capsules/${id}/unlock`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }

  // Comments endpoints
  async getComments(capsuleId) {
    return this.request(`/capsules/${capsuleId}/comments`);
  }

  async addComment(capsuleId, commentData) {
    return this.request(`/capsules/${capsuleId}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    });
  }

  async updateComment(commentId, content) {
    return this.request(`/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }

  async deleteComment(commentId) {
    return this.request(`/comments/${commentId}`, { method: 'DELETE' });
  }

  // Likes endpoints
  async getLikes(capsuleId) {
    return this.request(`/capsules/${capsuleId}/likes`);
  }

  async addLike(capsuleId, likeData) {
    return this.request(`/capsules/${capsuleId}/like`, {
      method: 'POST',
      body: JSON.stringify(likeData),
    });
  }

  async removeLike(capsuleId) {
    return this.request(`/capsules/${capsuleId}/like`, { method: 'DELETE' });
  }

  // Collaboration approval endpoints
  async listCollaborationRequests() {
    return this.request('/collaboration/requests');
  }

  async respondCollaboration(token, action) {
    return this.request('/collaboration/respond', {
      method: 'POST',
      body: JSON.stringify({ token, action }),
    });
  }
}

export default new ApiService();


