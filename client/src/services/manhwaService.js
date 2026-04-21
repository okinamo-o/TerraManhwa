import api from './api';

export const manhwaService = {
  getMeta: () => api.get('/manhwa/meta'),
  getAll: (params) => api.get('/manhwa', { params }),
  getBySlug: (slug) => api.get(`/manhwa/${slug}`),
  create: (data) => api.post('/manhwa', data),
  update: (id, data) => api.put(`/manhwa/${id}`, data),
  delete: (id) => api.delete(`/manhwa/${id}`),
  getFeatured: () => api.get('/manhwa/featured'),
  getTrending: () => api.get('/manhwa/trending'),
  getLatest: () => api.get('/manhwa/latest'),
  getPopular: () => api.get('/manhwa/popular'),
  getBySlugs: (slugs) => api.post('/manhwa/list', { slugs }),
};

export const chapterService = {
  getByManhwa: (slug) => api.get(`/manhwa/${slug}/chapters`),
  getBySlugAndNumber: (slug, number) => api.get(`/chapters/${slug}/${number}`),
  getById: (id) => api.get(`/chapters/${id}`),
  create: (slug, data) => api.post(`/manhwa/${slug}/chapters`, data),
  delete: (id) => api.delete(`/chapters/${id}`),
};

export const searchService = {
  search: (params) => api.get('/search', { params }),
  suggest: (q) => api.get('/search/suggest', { params: { q } }),
};

export const commentService = {
  getByManhwa: (slug, params) => api.get(`/manhwa/${slug}/comments`, { params }),
  getUserComments: (username) => api.get(`/comments/user/${username}`),
  create: (slug, data) => api.post(`/comments`, { slug, ...data }),
  update: (id, data) => api.put(`/comments/${id}`, data),
  delete: (id) => api.delete(`/comments/${id}`),
};

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  scrape: (slug) => api.post('/admin/scrape', { slug }),
  getScraperLogs: () => api.get('/scraper/logs'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getComments: (params) => api.get('/admin/comments', { params }),
  deleteComment: (id) => api.delete(`/admin/comments/${id}`),
  getChapters: (params) => api.get('/admin/chapters', { params }),
  deleteChapter: (id) => api.delete(`/admin/chapters/${id}`),
  scrapeAll: () => api.post('/scraper/run'),
};

export const notificationService = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.patch('/notifications/read-all'),
  markRead: (id) => api.patch(`/notifications/${id}`),
};

export const collectionService = {
  getAll: () => api.get('/collections'),
  getMe: () => api.get('/collections/me'),
  getById: (id) => api.get(`/collections/${id}`),
  create: (data) => api.post('/collections', data),
  update: (id, data) => api.put(`/collections/${id}`, data),
  delete: (id) => api.delete(`/collections/${id}`),
};

export const userService = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateMe: (data) => api.put('/users/me', data),
  bookmark: (manhwaId) => api.post(`/users/me/bookmark/${manhwaId}`),
  unbookmark: (manhwaId) => api.delete(`/users/me/bookmark/${manhwaId}`),
  saveHistory: (data) => api.post('/users/me/history', data),
};
