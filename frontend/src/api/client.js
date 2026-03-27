import axios from 'axios';
import { io } from 'socket.io-client';

export const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  auth: {
    me: async () => {
      try {
        const { data } = await apiClient.get('/auth/profile');
        return data;
      } catch {
        return null;
      }
    },
    redirectToLogin: () => {
      window.location.href = '/login';
    },
    login: async (credentials) => {
      const { data } = await apiClient.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      return data;
    },
    logout: () => {
      localStorage.removeItem('token');
      window.location.href = '/login';
    },
    updateMe: async (payload) => {
      const { data } = await apiClient.put('/auth/profile', payload);
      return data;
    }
  },
  restaurants: {
    list: async (sort, limit) => {
      const { data } = await apiClient.get('/restaurants', { params: { sort, limit } });
      return data;
    },
    filter: async (params, sort, limit) => {
      const { data } = await apiClient.get('/restaurants', { params: { ...params, sort, limit } });
      return data;
    },
    getById: async (id) => {
      const { data } = await apiClient.get(`/restaurants/${id}`);
      return data;
    },
    create: async (payload) => {
      const { data } = await apiClient.post('/restaurants', payload);
      return data;
    },
    update: async (id, payload) => {
      const { data } = await apiClient.put(`/restaurants/${id}`, payload);
      return data;
    }
  },
  menuItems: {
    filter: async (params) => {
      if (params.restaurant_id) {
        const { data } = await apiClient.get(`/restaurants/${params.restaurant_id}/menu`);
        return data.data || data; // backend returns { success: true, count: X, data: items }
      }
      const { data } = await apiClient.get('/menu-items', { params });
      return data.data || data;
    },
    create: async (payload) => {
      const { data } = await apiClient.post('/menu-items', payload);
      return data;
    },
    update: async (id, payload) => {
      const { data } = await apiClient.put(`/menu-items/${id}`, payload);
      return data;
    },
    delete: async (id) => {
      await apiClient.delete(`/menu-items/${id}`);
    }
  },
  orders: {
    filter: async (params, sort, limit) => {
      if (params.user_email || params.userId) {
          const { data } = await apiClient.get(`/orders/user/${params.user_email || params.userId}`);
          return data;
      }
      if (params.id) {
          const { data } = await apiClient.get(`/orders/${params.id}`);
          return [data];
      }
      const { data } = await apiClient.get('/orders', { params: { ...params, sort, limit } });
      return data;
    },
    list: async (sort, limit) => {
      const { data } = await apiClient.get('/orders', { params: { sort, limit } });
      return data;
    },
    create: async (payload) => {
      const { data } = await apiClient.post('/orders', payload);
      return data;
    },
    update: async (id, payload) => {
      const { data } = await apiClient.put(`/orders/${id}`, payload);
      return data;
    },
    subscribe: (cb) => {
      const socket = io('http://localhost:5000');
      socket.on('order_update', cb);
      return () => socket.off('order_update', cb);
    }
  },
  reviews: {
    filter: async (params) => {
      if (params.restaurant_id) {
          const { data } = await apiClient.get(`/reviews/restaurant/${params.restaurant_id}`);
          return data;
      }
      const { data } = await apiClient.get('/reviews', { params });
      return data;
    },
    create: async (payload) => {
      const { data } = await apiClient.post('/reviews', payload);
      return data;
    }
  },
  reservations: {
    filter: async (params, sort, limit) => {
      const { data } = await apiClient.get('/reservations', { params: { ...params, sort, limit } });
      return data;
    },
    create: async (payload) => {
      const { data } = await apiClient.post('/reservations', payload);
      return data;
    },
    update: async (id, payload) => {
      const { data } = await apiClient.put(`/reservations/${id}`, payload);
      return data;
    }
  },
  users: {
     list: async (sort, limit) => {
      const { data } = await apiClient.get('/users', { params: { sort, limit } });
      return data;
     }
  },
  coupons: {
     list: async (sort, limit) => {
      const { data } = await apiClient.get('/coupons', { params: { sort, limit } });
      return data;
     },
     filter: async (params) => {
      const { data } = await apiClient.get('/coupons', { params });
      return data;
     }
  }
};
