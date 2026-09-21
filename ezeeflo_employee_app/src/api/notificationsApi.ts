/**
 * Notifications API Service
 */

import api from '../services/apiClient';
import type { ApiResponse, AppNotification, PaginatedResponse } from '../types';

const NotificationsAPI = {
  getAll: async (params?: { page?: number; limit?: number; isRead?: boolean }): Promise<PaginatedResponse<AppNotification>> => {
    const response = await api.get('/notifications', { params });
    return response.data as PaginatedResponse<AppNotification>;
  },

  markAsRead: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<ApiResponse<any>> => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  getUnreadCount: async (): Promise<ApiResponse<{ count: number }>> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<any>> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export default NotificationsAPI;
