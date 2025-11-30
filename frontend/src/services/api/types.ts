// Auth types
export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  user: {
    login: string;
    password: string;
  };
  profile: {
    first_name: string;
    last_name?: string;
    lang_code: string;
    email?: string;
  };
}

export interface TelegramLoginRequest {
  id: number;
  first_name: string;
  last_name?: string;
  username: string;
  language_code: string;
  init_data_str: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  login: string;
}

export interface ProfileUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  lang_code?: string;
}

export interface TokenPair {
  access: string;
  refresh: string;
}

export interface User {
  id: string;
  login: string;
  role: string;
}

export interface UserListItem {
  id: string;
  login: string;
  role_id: string;
  status: string;
}

export interface RoleListItem {
  id: string;
  name: string;
}

export interface AccountProfile {
  user: {
    id: string;
    login: string;
    status: string;
  };
  profile: {
    first_name: string;
    last_name: string | null;
    lang_code: string;
    email: string | null;
  };
  role: {
    name: string;
  };
  socials: Array<{
    name: string;
    login: string;
    email: string | null;
  }>;
  sessions: Array<{
    id: string;
    user_agent: string | null;
    ip_address: string | null;
    device_info: string | null;
    session_name: string | null;
    is_active: boolean;
    expires_at: string;
    last_activity: string;
    is_current: boolean;
  }>;
}

// Pagination types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
}

export interface PagedResponse<T> {
  pagination: Pagination;
  data: T[];
}

// Config types
export interface SimpleConfig {
  id: string;
  type: string;
  status: string | null;
  user_id: string;
}

export interface Config {
  id: string;
  type: string;
  status: string | null;
  user_id: string;
  client_id: string | null;
  client_email: string;
  used_gb: number;
  total_gb: number;
  limit_ip: number;
  subscription_url: string | null;
  connection_url: string | null;
  valid_from_dttm: string;
  valid_to_dttm: string;
  _updated_dttm: string;
}

export interface ConfigLimitsUpdate {
  total_gb: number;
  limit_ip: number;
}

// Request types
export interface Request {
  id: string;
  user_id: string;
  name: string;
  related_id: string;
  related_name: string;
  data: Record<string, any>;
  _inserted_dttm: string;
}

// News types
export interface News {
  id: string;
  title: { en: string; ru: string };
  content: { en: string; ru: string };
  _inserted_dttm: string;
}
// App settings types
export interface AppSettings {
  basic: {
    disable_registration: boolean;
  };
  service: {
    max_limit_ip: number;
    max_total_gb: number;
  };
}
