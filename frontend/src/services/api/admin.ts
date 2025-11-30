import { API_URL, ADMIN_TIME_OPERATIONS, PAGINATION_LIMIT } from '@/config/settings';
import { apiClient } from '@/services/api/api';
import type { Request, PagedResponse, AccountProfile, Config, UserListItem, RoleListItem, News } from '@/services/api/types';

class AdminApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_URL;
  }

  private buildUrl(path: string): string {
    const prefix = '/admin/v1';
    return `${this.baseUrl}${prefix}${path}`;
  }

  private request(path: string, init: RequestInit = {}): Promise<Response> {
    return apiClient.authorizedFetch(this.buildUrl(path), init);
  }

  async getRequest(requestId: string): Promise<Request> {
    const response = await this.request(`/requests/${requestId}`);
    if (!response.ok) {
      throw new Error('Failed to get request');
    }
    return response.json();
  }

  async getRequests(page: number = 1, limit: number = PAGINATION_LIMIT): Promise<PagedResponse<Request>> {
    const response = await this.request(`/requests/?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to get requests');
    }
    return response.json();
  }

  async applyRequest(requestId: string): Promise<{ msg: string }> {
    const response = await this.request(`/requests/${requestId}/apply`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to apply request');
    }
    return response.json();
  }

  async denyRequest(requestId: string): Promise<void> {
    const response = await this.request(`/requests/${requestId}/deny`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to deny request');
    }
  }

  async getUserProfile(userId: string): Promise<AccountProfile> {
    const response = await this.request(`/users/${userId}/profile`);
    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }
    return response.json();
  }

  async getConfig(configId: string): Promise<Config> {
    const response = await this.request(`/configs/${configId}`);
    if (!response.ok) {
      throw new Error('Failed to get config');
    }
    return response.json();
  }

  async verifyUser(userId: string): Promise<void> {
    const response = await this.request(`/users/${userId}/verify`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to verify user' }));
      throw new Error(error.detail || 'Failed to verify user');
    }
  }

  async unverifyUser(userId: string): Promise<void> {
    const response = await this.request(`/users/${userId}/unverify`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to unverify user' }));
      throw new Error(error.detail || 'Failed to unverify user');
    }
  }

  async resetUserPassword(userId: string): Promise<string> {
    const response = await this.request(`/users/${userId}/password/reset`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to reset password' }));
      throw new Error(error.detail || 'Failed to reset password');
    }
    const data = await response.json();
    return data.msg || '';
  }

  async getUsers(page: number = 1, limit: number = PAGINATION_LIMIT): Promise<PagedResponse<UserListItem>> {
    const response = await this.request(`/users/?page=${page}&limit=${limit}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get users' }));
      throw new Error(error.detail || 'Failed to get users');
    }
    return response.json();
  }

  async getConfigs(page: number = 1, limit: number = PAGINATION_LIMIT): Promise<PagedResponse<Config>> {
    const response = await this.request(`/configs/?page=${page}&limit=${limit}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get configs' }));
      throw new Error(error.detail || 'Failed to get configs');
    }
    return response.json();
  }

  async getRoles(page: number = 1, limit: number = PAGINATION_LIMIT): Promise<PagedResponse<RoleListItem>> {
    const response = await this.request(`/roles/?page=${page}&limit=${limit}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get roles' }));
      throw new Error(error.detail || 'Failed to get roles');
    }
    return response.json();
  }

  async addTimeToConfig(configId: string, days: number = ADMIN_TIME_OPERATIONS.DEFAULT_DAYS, hours: number = ADMIN_TIME_OPERATIONS.DEFAULT_HOURS): Promise<void> {
    const response = await this.request(`/configs/${configId}/time/add?days=${days}&hours=${hours}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to add time to config' }));
      throw new Error(error.detail || 'Failed to add time to config');
    }
  }

  async removeTimeFromConfig(configId: string, days: number = ADMIN_TIME_OPERATIONS.DEFAULT_DAYS, hours: number = ADMIN_TIME_OPERATIONS.DEFAULT_HOURS): Promise<void> {
    const response = await this.request(`/configs/${configId}/time/remove?days=${days}&hours=${hours}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to remove time from config' }));
      throw new Error(error.detail || 'Failed to remove time from config');
    }
  }

  async updateUserRole(userId: string, roleName: string): Promise<void> {
    const response = await this.request(`/users/${userId}/update/role?name=${roleName}`, {
      method: 'POST',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update user role' }));
      throw new Error(error.detail || 'Failed to update user role');
    }
  }

  async getNews(page: number = 1, limit: number = PAGINATION_LIMIT): Promise<PagedResponse<News>> {
    const response = await this.request(`/news/?page=${page}&limit=${limit}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get news' }));
      throw new Error(error.detail || 'Failed to get news');
    }
    return response.json();
  }

  async getNewsItem(newsId: string): Promise<News> {
    const response = await this.request(`/news/${newsId}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get news item' }));
      throw new Error(error.detail || 'Failed to get news item');
    }
    return response.json();
  }

  async createNews(news: { title: { en: string; ru: string }; content: { en: string; ru: string } }): Promise<News> {
    const response = await this.request('/news/', {
      method: 'POST',
      body: JSON.stringify(news),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to create news' }));
      throw new Error(error.detail || 'Failed to create news');
    }
    return response.json();
  }

  async updateNews(newsId: string, news: { title?: { en: string; ru: string }; content?: { en: string; ru: string } }): Promise<News> {
    const response = await this.request(`/news/${newsId}`, {
      method: 'PATCH',
      body: JSON.stringify(news),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update news' }));
      throw new Error(error.detail || 'Failed to update news');
    }
    return response.json();
  }

  async deleteNews(newsId: string): Promise<void> {
    const response = await this.request(`/news/${newsId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete news' }));
      throw new Error(error.detail || 'Failed to delete news');
    }
  }
}

export const adminApiClient = new AdminApiClient();
