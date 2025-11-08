import api from '../config/api';

export const adminService = {
  getOrders: async (params = {}) => {
    const query = new URLSearchParams({ limit: '200', ...params }).toString();
    const res = await api.get(`/admin/orders?${query}`);
    return res.data?.data || [];
  },
  getReviews: async (params = {}) => {
    const query = new URLSearchParams({ limit: '50', ...params }).toString();
    const res = await api.get(`/admin/reviews?${query}`);
    return res.data?.data || [];
  },
  getPendingReviews: async (params = {}) => {
    const query = new URLSearchParams({ status: 'pending', limit: '50', ...params }).toString();
    const res = await api.get(`/admin/reviews?${query}`);
    return res.data?.data || [];
  },
  getMessages: async (params = {}) => {
    const query = new URLSearchParams({ limit: '50', ...params }).toString();
    const res = await api.get(`/contact-messages?${query}`);
    return res.data?.data || [];
  },
  countContactMessages: async (params = {}) => {
    const query = new URLSearchParams({ limit: '1', ...params }).toString();
    const res = await api.get(`/contact-messages?${query}`);
    return res.data?.meta?.total ?? 0;
  },
  updateContactStatus: async (id, status) => {
    const res = await api.patch(`/contact-messages/${id}/status`, { status });
    return res.data?.data;
  },
  getUsers: async (params = {}) => {
    const query = new URLSearchParams({ limit: '50', ...params }).toString();
    const res = await api.get(`/admin/users?${query}`);
    return res.data?.data || [];
  },
  updateOrderStatus: async (id, status, estimatedMinutes = null) => {
    const payload = { status };
    if (estimatedMinutes !== null) {
      payload.estimatedMinutes = estimatedMinutes;
    }
    const res = await api.patch(`/admin/orders/${id}/status`, payload);
    return res.data?.data;
  },
  updateReviewStatus: async (id, status) => {
    const res = await api.patch(`/admin/reviews/${id}/status`, { status });
    return res.data?.data;
  },
  updateUser: async (id, payload) => {
    const res = await api.patch(`/admin/users/${id}`, payload);
    return res.data?.data;
  },
  deleteUser: async (id) => {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data?.data;
  },
  // Menus
  updateMenuItem: async (id, payload) => {
    const res = await api.put(`/menus/${id}`, payload);
    return res.data?.data;
  },
  createMenuItem: async (payload) => {
    const res = await api.post('/menus', payload);
    return res.data?.data;
  },
  deleteMenuItem: async (id) => {
    const res = await api.delete(`/menus/${id}`);
    return res.data?.data;
  },
  // Payments
  getPayments: async (params = {}) => {
    const query = new URLSearchParams({ limit: '50', ...params }).toString();
    const res = await api.get(`/admin/payments?${query}`);
    return res.data?.data || res.data || [];
  },
  // Stats
  getActiveCustomersCount: async () => {
    const res = await api.get('/admin/stats/active-customers');
    return res.data?.data?.count || 0;
  },
};
