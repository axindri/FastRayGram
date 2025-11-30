import { API_URL } from '@/config/settings';
import { tokenStorage } from '@/services/api/tokenStorage';
import { isTokenExpiringSoon } from '@/utils/jwt';
import { ACCESS_TOKEN_REFRESH_THRESHOLD_SEC } from '@/config/settings';
import type {
  LoginRequest,
  TelegramLoginRequest,
  TokenPair,
  User,
  AccountProfile,
  PagedResponse,
  SimpleConfig,
  Config,
  ConfigLimitsUpdate,
  AppSettings,
  RegisterRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ProfileUpdate,
  News,
} from '@/services/api/types';

type FetchOptions = {
  auth?: boolean;
  retryOnAuthError?: boolean;
  autoRefresh?: boolean;
};

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<TokenPair | null> | null = null;

  constructor() {
    this.baseUrl = API_URL;
  }

  private async request(url: string, init: RequestInit = {}, options: FetchOptions = {}): Promise<Response> {
    const { auth = true, retryOnAuthError = true, autoRefresh = true } = options;
    console.log('[apiClient] Fetching request', { url, auth, retryOnAuthError, autoRefresh });
    const headers = new Headers(init.headers ?? {});
    if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (auth) {
      const token = autoRefresh ? await this.ensureFreshAccessToken() : tokenStorage.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      } else {
        console.log('[apiClient] No access token available for request');
      }
    }

    const requestInit: RequestInit = { ...init, headers };
    let response = await fetch(url, requestInit);

    if (auth && response.status === 401 && retryOnAuthError) {
      console.warn('[apiClient] Received 401, attempting refresh');
      const refreshed = await this.refreshTokens().catch(() => null);
      if (refreshed?.access) {
        headers.set('Authorization', `Bearer ${refreshed.access}`);
        console.log('[apiClient] Retry request after refresh');
        response = await fetch(url, requestInit);
      }
    }

    if (auth && response.status === 401) {
      console.warn('[apiClient] Request still unauthorized after refresh attempts, clearing tokens');
      this.clearTokens();
    }

    return response;
  }

  private async ensureFreshAccessToken(): Promise<string | null> {
    const token = tokenStorage.getAccessToken();
    if (!token) return null;
    const isExpiringSoon = isTokenExpiringSoon(token, ACCESS_TOKEN_REFRESH_THRESHOLD_SEC);
    if (!isExpiringSoon) {
      return token;
    }
    console.log('[apiClient] Access token expiring soon, refreshing');
    const refreshed = await this.refreshTokens().catch(() => null);
    return refreshed?.access ?? tokenStorage.getAccessToken();
  }

  private async refreshTokens(): Promise<TokenPair | null> {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) return null;

    if (!this.refreshPromise) {
      console.log('[apiClient] Starting refresh flow');
      this.refreshPromise = this.performRefresh(refreshToken).finally(() => {
        console.log('[apiClient] Refresh flow completed');
        this.refreshPromise = null;
      });
    } else {
      console.log('[apiClient] Reusing pending refresh promise');
    }

    return this.refreshPromise;
  }

  private async performRefresh(refreshToken: string): Promise<TokenPair> {
    console.log('[apiClient] Performing refresh request');
    const response = await fetch(this.buildAuthUrl(`/refresh?token=${encodeURIComponent(refreshToken)}`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.warn('[apiClient] Refresh failed, clearing tokens');
      this.clearTokens();
      throw new Error('Token refresh failed');
    }

    const tokens: TokenPair = await response.json();
    console.log('[apiClient] Refresh succeeded');
    this.saveTokens(tokens);
    return tokens;
  }

  private saveTokens(tokens: TokenPair): void {
    console.log('[apiClient] Saving token pair');
    tokenStorage.setAccessToken(tokens.access);
    tokenStorage.setRefreshToken(tokens.refresh);
  }

  private clearTokens(): void {
    console.log('[apiClient] Clearing stored tokens');
    tokenStorage.clear();
  }

  private handleUnauthorizedRedirect(): void {
    this.clearTokens();
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
  private buildAppUrl(path: string): string {
    const prefix = '/app';
    return `${this.baseUrl}${prefix}${path}`;
  }

  private buildAuthUrl(path: string): string {
    const prefix = '/auth/v1';
    return `${this.baseUrl}${prefix}${path}`;
  }

  private buildBackendUrl(path: string): string {
    const prefix = '/backend/v1';
    return `${this.baseUrl}${prefix}${path}`;
  }

  public authorizedFetch(url: string, init: RequestInit = {}, options: FetchOptions = {}): Promise<Response> {
    return this.request(url, init, options);
  }

  async register(registerRequest: RegisterRequest): Promise<{ detail: string | Array<{ loc: (string | number)[]; msg: string; type: string }> } | { msg: string }> {
    const response = await fetch(this.buildAuthUrl('/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerRequest),
    });

    if (response.status === 422) {
      return response.json();
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async login(credentials: LoginRequest): Promise<TokenPair> {
    const response = await fetch(this.buildAuthUrl('/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const tokens = await response.json();
    this.saveTokens(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    if (tokenStorage.getAccessToken()) {
      try {
        await this.request(this.buildAuthUrl('/logout'), { method: 'POST' });
      } catch (error) {
        console.error('[apiClient] Logout error:', error);
      }
    }
    this.clearTokens();
  }

  async telegramLogin(data: TelegramLoginRequest): Promise<TokenPair> {
    const response = await fetch(this.buildAuthUrl('/login/social/telegram'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Telegram login failed' }));
      throw new Error(error.detail || 'Telegram login failed');
    }

    const tokens = await response.json();
    this.saveTokens(tokens);
    return tokens;
  }

  async refreshToken(): Promise<TokenPair> {
    const tokens = await this.refreshTokens();
    if (!tokens) {
      throw new Error('No refresh token');
    }
    return tokens;
  }

  async checkPermission(role: string): Promise<boolean> {
    try {
      const response = await this.request(this.buildAuthUrl(`/check-permission?role=${role}`), {
        method: 'POST',
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request(this.buildAuthUrl('/me'));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.handleUnauthorizedRedirect();
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to get user');
    }
    return response.json();
  }

  async getProfile(): Promise<AccountProfile> {
    const response = await this.request(this.buildAuthUrl('/account/profile'));

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.handleUnauthorizedRedirect();
        throw new Error('Unauthorized');
      }
      throw new Error('Failed to get profile');
    }

    return response.json();
  }

  async updateProfile(profileUpdate: ProfileUpdate): Promise<AccountProfile> {
    const response = await this.request(this.buildAuthUrl('/account/profile'), {
      method: 'PATCH',
      body: JSON.stringify(profileUpdate),
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        this.handleUnauthorizedRedirect();
        throw new Error('Unauthorized');
      }
      const error = await response.json().catch(() => ({ detail: 'Failed to update profile' }));
      throw new Error(error.detail || 'Failed to update profile');
    }

    return response.json();
  }

  async verifyAccount(): Promise<void> {
    const response = await this.request(this.buildAuthUrl('/request-verification'), {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to verify account');
    }
  }

  async changePassword(changePasswordData: ChangePasswordRequest): Promise<{ msg: string }> {
    const response = await this.request(this.buildAuthUrl('/change-password'), {
      method: 'POST',
      body: JSON.stringify(changePasswordData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to change password';
      try {
        const error = await response.json();
        if (error.detail) {
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            errorMessage = error.detail
              .map((e: any) => {
                const field = e.loc && e.loc.length > 0 ? e.loc[e.loc.length - 1] : 'field';
                return `${field}: ${e.msg || 'Invalid value'}`;
              })
              .join(', ');
          } else if (typeof error.detail === 'object') {
            errorMessage = JSON.stringify(error.detail);
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
      } catch {
        errorMessage = response.statusText || 'Failed to change password';
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async forgotPassword(forgotPasswordData: ForgotPasswordRequest): Promise<{ msg: string }> {
    const url = `${this.buildAuthUrl('/forgot-password')}?login=${encodeURIComponent(forgotPasswordData.login)}`;
    const response = await fetch(url, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to send password reset request' }));
      throw new Error(error.detail || 'Failed to send password reset request');
    }

    return response.json();
  }

  async updateConfigLimits(configId: string, limits: ConfigLimitsUpdate): Promise<void> {
    const response = await this.request(this.buildBackendUrl(`/client/configs/${configId}/update-limits`), {
      method: 'POST',
      body: JSON.stringify(limits),
    });
    if (!response.ok) {
      throw new Error('Failed to update config');
    }
  }

  async renewConfig(configId: string): Promise<void> {
    const response = await this.request(this.buildBackendUrl(`/client/configs/${configId}/renew`), {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Failed to renew config');
    }
  }

  async getConfigs(): Promise<PagedResponse<SimpleConfig>> {
    const response = await this.request(this.buildBackendUrl('/client/configs'));
    if (!response.ok) {
      throw new Error('Failed to get configs');
    }
    return response.json();
  }

  async getOrCreateConfigByType(type: string): Promise<Config> {
    const response = await this.request(this.buildBackendUrl(`/client/configs/by-type/${type}`));
    if (!response.ok) {
      throw new Error('Failed to get config');
    }
    return response.json();
  }

  async getAppSettings(): Promise<AppSettings> {
    const response = await this.request(this.buildAppUrl('/settings'));
    if (!response.ok) {
      throw new Error('Failed to get app settings');
    }
    return response.json();
  }

  async updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
    const response = await this.request(this.buildAppUrl('/settings'), {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to update app settings' }));
      throw new Error(error.detail || 'Failed to update app settings');
    }
    return response.json();
  }

  async terminateSession(sessionId: string): Promise<void> {
    const response = await this.request(this.buildAuthUrl(`/sessions/terminate/${sessionId}`), {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to logout session');
    }
  }

  async getNews(): Promise<PagedResponse<News>> {
    const response = await this.request(this.buildBackendUrl('/news?page=1&limit=3'));
    if (!response.ok) {
      throw new Error('Failed to get news');
    }
    return response.json();
  }
}

export const apiClient = new ApiClient();
