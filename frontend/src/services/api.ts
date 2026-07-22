import axios from 'axios';
import type { ChatRequest, ChatResponse } from '../types/chat';
import keycloak from '../keycloak';

const api = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (keycloak.token) {
    // Optionally update token if it's expired
    try {
      await keycloak.updateToken(30);
      config.headers.Authorization = `Bearer ${keycloak.token}`;
    } catch (error) {
      console.error('Failed to refresh token', error);
      keycloak.login();
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export const sendMessage = async (question: string, active_document?: string): Promise<ChatResponse> => {
  const payload: ChatRequest = { question, active_document };
  const { data } = await api.post<ChatResponse>('/chat', payload);
  return data;
};

export const fetchDocuments = async () => {
  const { data } = await api.get('/documents');
  return data;
};

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const { data } = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get('/me');
  return data;
};

export const fetchUsers = async () => {
  const { data } = await api.get('/admin/users');
  return data;
};

export const createUser = async (userData: { username: string; password: string; roles: string[] }) => {
  const { data } = await api.post('/admin/users', userData);
  return data;
};

export const updateUserRoles = async (userId: string, roles: string[]) => {
  const { data } = await api.put(`/admin/users/${userId}/roles`, { roles });
  return data;
};

export const deleteUser = async (userId: string) => {
  const { data } = await api.delete(`/admin/users/${userId}`);
  return data;
};

export const fetchAdminStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const deleteDocument = async (docName: string) => {
  const { data } = await api.delete(`/admin/documents/${docName}`);
  return data;
};

export default api;
