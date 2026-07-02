import type {
  AdminInvoice,
  AdminLinks,
  AdminUser,
  AppConfig,
  CreateUserPayload,
  Invoice,
  Paginated,
  RegisterValidation,
  RegistrationCode,
  StatusResponse,
  UpdateUserRoleResponse,
  UserProfile,
  XuiClient,
} from "./types";

export const TOKEN_KEY = "authToken";

const API_PREFIX = "/api";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let unauthorizedHandler: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const text = await response.text();
  let data: unknown = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError("Неверный ответ сервера", response.status);
    }
  }

  if (!response.ok) {
    const detail = (data as { detail?: unknown } | null)?.detail;
    const message = typeof detail === "string" ? detail : response.statusText;

    if (response.status === 401) {
      clearAuthToken();
      unauthorizedHandler?.();
    }

    throw new ApiError(message, response.status);
  }

  return data as T;
}

export function formatDate(value?: string): string {
  return value ? new Date(value).toLocaleString("ru-RU") : "—";
}

function pluralRu(value: number, one: string, few: string, many: string): string {
  const abs = Math.abs(value);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return few;
  }

  return many;
}

export function formatExpiryRemaining(value?: string): string | null {
  if (!value) {
    return null;
  }

  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) {
    return null;
  }

  const diffMs = expiry.getTime() - Date.now();
  if (diffMs <= 0) {
    return "(истекло)";
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const hourMs = 60 * 60 * 1000;

  if (diffMs >= dayMs) {
    const days = Math.floor(diffMs / dayMs);
    return `(осталось ${days} ${pluralRu(days, "день", "дня", "дней")})`;
  }

  const hours = Math.max(1, Math.ceil(diffMs / hourMs));
  return `(осталось ${hours} ${pluralRu(hours, "час", "часа", "часов")})`;
}

const RENEWAL_WINDOW_MS = 24 * 60 * 60 * 1000;

export function canRenewSubscription(expiryDatetime?: string): boolean {
  if (!expiryDatetime) {
    return false;
  }

  const expiry = new Date(expiryDatetime);
  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  return expiry.getTime() - Date.now() < RENEWAL_WINDOW_MS;
}

export async function fetchMe(): Promise<UserProfile> {
  return request<UserProfile>(`${API_PREFIX}/user/me`);
}

export async function refreshMyToken(): Promise<string> {
  return request<string>(`${API_PREFIX}/user/refresh-token`, { method: "POST" });
}

export async function fetchXuiMe(): Promise<XuiClient> {
  return request<XuiClient>(`${API_PREFIX}/user/xui-me`);
}

export async function createInvoice(amount: number): Promise<Invoice> {
  const returnUrl = new URL("/payment/success", window.location.origin).href;
  const failUrl = new URL("/payment/fail", window.location.origin).href;

  return request<Invoice>(`${API_PREFIX}/tw/new-invoice`, {
    method: "POST",
    body: JSON.stringify({
      amount,
      return_url: returnUrl,
      fail_url: failUrl,
    }),
  });
}

export async function confirmPaymentReturn(invoiceId: number, mdOrder?: string | null): Promise<Invoice> {
  return request<Invoice>(`${API_PREFIX}/tw/payment-return`, {
    method: "POST",
    body: JSON.stringify({
      invoice_id: invoiceId,
      md_order: mdOrder || undefined,
    }),
  });
}

export async function fetchStatus(): Promise<StatusResponse> {
  return request<StatusResponse>(`${API_PREFIX}/status`);
}

export async function fetchAdminLinks(): Promise<AdminLinks> {
  return request<AdminLinks>(`${API_PREFIX}/admin/links`);
}

export async function fetchInvoices(page = 1, limit = 3): Promise<Paginated<AdminInvoice>> {
  return request<Paginated<AdminInvoice>>(`${API_PREFIX}/admin/invoices?page=${page}&limit=${limit}`);
}

export async function fetchUsers(page = 1, limit = 4): Promise<Paginated<AdminUser>> {
  return request<Paginated<AdminUser>>(`${API_PREFIX}/admin/users?page=${page}&limit=${limit}`);
}

export async function checkInvoices(): Promise<Invoice[]> {
  return request<Invoice[]>(`${API_PREFIX}/admin/invoices/check`);
}

export async function cancelInvoice(id: number): Promise<Invoice> {
  return request<Invoice>(`${API_PREFIX}/admin/invoices/${id}/cancel`, { method: "POST" });
}

export function buildAuthLink(token: string): string {
  const url = new URL("/", window.location.origin);
  url.searchParams.set("authToken", token);
  return url.toString();
}

export function buildRegistrationLink(code: string): string {
  const url = new URL("/register", window.location.origin);
  url.searchParams.set("code", code);
  return url.toString();
}

export async function validateRegistrationCode(code: string): Promise<RegisterValidation> {
  return request<RegisterValidation>(`${API_PREFIX}/register/validate?code=${encodeURIComponent(code)}`);
}

export async function registerUser(payload: { code: string; username: string; mark: string }): Promise<string> {
  return request<string>(`${API_PREFIX}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchRegistrationCodes(page = 1, limit = 4): Promise<Paginated<RegistrationCode>> {
  return request<Paginated<RegistrationCode>>(`${API_PREFIX}/admin/registration-codes?page=${page}&limit=${limit}`);
}

export async function createRegistrationCode(validDays = 7): Promise<RegistrationCode> {
  return request<RegistrationCode>(`${API_PREFIX}/admin/registration-codes`, {
    method: "POST",
    body: JSON.stringify({ valid_days: validDays }),
  });
}

export async function deleteRegistrationCode(id: number): Promise<void> {
  await request<null>(`${API_PREFIX}/admin/registration-codes/${id}`, { method: "DELETE" });
}

export async function extendRegistrationCode(id: number, extendDays: number): Promise<RegistrationCode> {
  return request<RegistrationCode>(`${API_PREFIX}/admin/registration-codes/${id}/extend`, {
    method: "POST",
    body: JSON.stringify({ extend_days: extendDays }),
  });
}

export async function fetchConfig(): Promise<AppConfig> {
  return request<AppConfig>(`${API_PREFIX}/config`);
}

export async function createUser(payload: CreateUserPayload): Promise<string> {
  return request<string>(`${API_PREFIX}/admin/users/create`, { method: "POST", body: JSON.stringify(payload) });
}

export async function fetchUserById(id: number): Promise<AdminUser> {
  return request<AdminUser>(`${API_PREFIX}/admin/users/get/${id}`);
}

export async function refreshUserToken(id: number): Promise<string> {
  return request<string>(`${API_PREFIX}/admin/users/${id}/refresh-token`, { method: "POST" });
}

export async function updateUserRole(id: number, role: "user" | "admin"): Promise<UpdateUserRoleResponse> {
  return request<UpdateUserRoleResponse>(`${API_PREFIX}/admin/users/${id}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await request<null>(`${API_PREFIX}/admin/users/delete/${id}`, { method: "DELETE" });
}

export async function fetchXuiClient(email: string): Promise<XuiClient> {
  return request<XuiClient>(`${API_PREFIX}/xui/clients/get/${encodeURIComponent(email)}`);
}

export async function updateXuiClient(
  email: string,
  payload: { expiry_time_days: number; enable: boolean },
): Promise<string> {
  return request<string>(`${API_PREFIX}/xui/clients/update/${encodeURIComponent(email)}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function resetXuiClientTraffic(email: string): Promise<string> {
  return request<string>(`${API_PREFIX}/xui/clients/reset-traffic/${encodeURIComponent(email)}`, { method: "POST" });
}

export async function deleteXuiClient(email: string): Promise<string> {
  return request<string>(`${API_PREFIX}/xui/clients/delete/${encodeURIComponent(email)}`, { method: "DELETE" });
}
