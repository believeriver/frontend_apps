import axios from 'axios';
import { API_BASE } from './config';

const BASE_URL = `${API_BASE}/api/auth`;

const authClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export interface LoginResponse {
  access: string;
  refresh: string;
  email: string;
  username: string;
  is_superuser: boolean;
}

export interface RegisterResponse {
  id: string;
  email: string;
  username: string;
}

export const apiLogin = async (email: string, password: string): Promise<LoginResponse> => {
  const { data } = await authClient.post<LoginResponse>('/login/', { email, password });
  return data;
};

export const apiRegister = async (
  email: string,
  password: string,
  password2: string
): Promise<RegisterResponse> => {
  const { data } = await authClient.post<RegisterResponse>('/register/', {
    email,
    password,
    password2,
  });
  return data;
};

export const apiLogout = async (accessToken: string, refreshToken: string): Promise<void> => {
  await authClient.post(
    '/logout/',
    { refresh: refreshToken },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
};

export const apiRefresh = async (refreshToken: string): Promise<string> => {
  const { data } = await authClient.post<{ access: string }>('/refresh/', {
    refresh: refreshToken,
  });
  return data.access;
};

export const apiUpdateProfile = async (
  token: string,
  data: { email?: string; username?: string }
): Promise<{ email: string; username: string }> => {
  const { data: res } = await authClient.patch<{ email: string; username: string }>(
    '/profile/',
    data,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res;
};

export const apiChangePassword = async (
  token: string,
  data: { current_password: string; new_password: string; new_password2: string }
): Promise<void> => {
  await authClient.post('/change-password/', data, {
    headers: { Authorization: `Bearer ${token}` },
  });
};
