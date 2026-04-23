import axios from "axios";
import { io } from "socket.io-client";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.endsWith("/api") ? apiUrl.slice(0, -4) : apiUrl;
};

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const api = {
  auth: {
    me: async () => {
      try {
        const { data } = await apiClient.get("/auth/profile");
        return data;
      } catch {
        return null;
      }
    },

    redirectToLogin: () => {
      window.location.href = "/login";
    },

    login: async (credentials) => {
      const { data } = await apiClient.post("/auth/login", credentials);
      localStorage.setItem("token", data.token);
      return data;
    },

    // ✅ FIXED: added missing register method
    register: async (payload) => {
      const { data } = await apiClient.post("/auth/register", payload);
      localStorage.setItem("token", data.token);
      return data;
    },

    logout: () => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    },

    updateMe: async (payload) => {
      const { data } = await apiClient.put("/auth/profile", payload);
      return data;
    },
  },

  restaurants: {
    list: async (sort, limit) => {
      const { data } = await apiClient.get("/restaurants", {
        params: { sort, limit },
      });
      return data;
    },

    filter: async (params, sort, limit) => {
      const { data } = await apiClient.get("/restaurants", {
        params: { ...params, sort, limit },
      });
      return data;
    },

    getById: async (id) => {
      const { data } = await apiClient.get(`/restaurants/${id}`);
      return data;
    },

    create: async (payload) => {
      const { data } = await apiClient.post("/restaurants", payload);
      return data;
    },

    update: async (id, payload) => {
      const { data } = await apiClient.put(`/restaurants/${id}`, payload);
      return data;
    },
  },

  menuItems: {
    filter: async (params) => {
      if (params.restaurant_id) {
        const { data } = await apiClient.get(
          `/restaurants/${params.restaurant_id}/menu`
        );
        return data.data || data;
      }

      const { data } = await apiClient.get("/menu-items", { params });
      return data.data || data;
    },

    create: async (payload) => {
      const { data } = await apiClient.post("/menu-items", payload);
      return data;
    },

    update: async (id, payload) => {
      const { data } = await apiClient.put(`/menu-items/${id}`, payload);
      return data;
    },

    delete: async (id) => {
      await apiClient.delete(`/menu-items/${id}`);
    },
  },

  orders: {
    filter: async (params, sort, limit) => {
      if (params.user_email || params.userId) {
        const { data } = await apiClient.get(
          `/orders/user/${params.user_email || params.userId}`
        );
        return data;
      }

      if (params.id) {
        const { data } = await apiClient.get(`/orders/${params.id}`);
        return [data];
      }

      const { data } = await apiClient.get("/orders", {
        params: { ...params, sort, limit },
      });

      return data;
    },

    list: async (sort, limit) => {
      const { data } = await apiClient.get("/orders", {
        params: { sort, limit },
      });
      return data;
    },

    create: async (payload) => {
      const { data } = await apiClient.post("/orders", payload);
      return data;
    },

    update: async (id, payload) => {
      const { data } = await apiClient.put(`/orders/${id}`, payload);
      return data;
    },
    subscribeOrder: (orderId, cb) => {
      const socket = io(getSocketUrl() || "/", { transports: ['polling'] });
      socket.emit("join_order", orderId);
      socket.on("order_update", cb);
      return () => {
        socket.off("order_update", cb);
        socket.disconnect();
      };
    },
    subscribeRestaurant: (restaurantId, onNewOrder, onUpdate) => {
      const socket = io(getSocketUrl() || "/", { transports: ['polling'] });
      socket.emit("join_restaurant", restaurantId);
      if (onNewOrder) socket.on("new_order", onNewOrder);
      if (onUpdate) socket.on("order_update", onUpdate);
      return () => {
        if (onNewOrder) socket.off("new_order", onNewOrder);
        if (onUpdate) socket.off("order_update", onUpdate);
        socket.disconnect();
      };
    },
    subscribeAdmin: (onNewOrder, onUpdate) => {
      const socket = io(getSocketUrl() || "/", { transports: ['polling'] });
      // Admins just listen to broadcasts if we broadcast, or we can listen to all
      if (onNewOrder) socket.on("new_order", onNewOrder);
      if (onUpdate) socket.on("order_update", onUpdate);
      return () => {
        if (onNewOrder) socket.off("new_order", onNewOrder);
        if (onUpdate) socket.off("order_update", onUpdate);
        socket.disconnect();
      };
    },
  },

  reviews: {
    filter: async (params) => {
      if (params.restaurant_id) {
        const { data } = await apiClient.get(
          `/reviews/restaurant/${params.restaurant_id}`
        );
        return data;
      }

      const { data } = await apiClient.get("/reviews", { params });
      return data;
    },

    create: async (payload) => {
      const { data } = await apiClient.post("/reviews", payload);
      return data;
    },

    getSuggestions: async (orderId) => {
      const { data } = await apiClient.get(`/reviews/suggestions/${orderId}`);
      return data;
    }
  },

  reservations: {
    filter: async (params, sort, limit) => {
      const { data } = await apiClient.get("/reservations", {
        params: { ...params, sort, limit },
      });
      return data;
    },

    create: async (payload) => {
      const { data } = await apiClient.post("/reservations", payload);
      return data;
    },

    update: async (id, payload) => {
      const { data } = await apiClient.put(`/reservations/${id}`, payload);
      return data;
    },
  },

  users: {
    list: async (sort, limit) => {
      const { data } = await apiClient.get("/users", {
        params: { sort, limit },
      });
      return data;
    },
  },

  coupons: {
    list: async (sort, limit) => {
      const { data } = await apiClient.get("/coupons", {
        params: { sort, limit },
      });
      return data;
    },

    filter: async (params) => {
      const { data } = await apiClient.get("/coupons", { params });
      return data;
    },
  },
};