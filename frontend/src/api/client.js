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

    register: async (payload) => {
      const { data } = await apiClient.post("/auth/register", payload);
      localStorage.setItem("token", data.token);
      return data;
    },

    logout: () => {
      localStorage.removeItem("token");
      window.location.href = "/login";
    },

    updateProfile: async (payload) => {
      const { data } = await apiClient.put("/auth/profile", payload);
      return data;
    },
  },

  restaurants: {
    list: async (coords = {}, sort, limit) => {
      const params = { ...coords, sort, limit };
      if (params.latitude) { params.lat = params.latitude; delete params.latitude; }
      if (params.longitude) { params.lng = params.longitude; delete params.longitude; }
      
      const { data } = await apiClient.get("/restaurants", { params });
      return data;
    },

    filter: async (params, sort, limit) => {
      if (params.id) {
        const { data } = await apiClient.get(`/restaurants/${params.id}`);
        const actual = data?.data || data;
        return [actual];
      }
      const { data } = await apiClient.get("/restaurants", {
        params: { ...params, sort, limit },
      });
      return data?.data || data;
    },

    getById: async (id) => {
      const { data } = await apiClient.get(`/restaurants/${id}`);
      return data?.data || data;
    },

    recommendations: async (params) => {
      const { data } = await apiClient.get("/restaurants/recommendations", { params });
      return data?.data || data;
    },

    create: async (payload) => {
      const { data } = await apiClient.post("/restaurants", payload);
      return data;
    },

        update: async (id, payload) => {
            const { data } = await apiClient.put(`/restaurants/${id}`, payload);
            return data;
        },
        delete: async (id) => {
            const { data } = await apiClient.delete(`/restaurants/${id}`);
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

      return data?.data || data;
    },

    getById: async (id) => {
      const { data } = await apiClient.get(`/orders/${id}`);
      return data?.data || data;
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
    accept: async (id) => {
      const { data } = await apiClient.post(`/orders/${id}/accept`);
      return data;
    },
    reject: async (id) => {
      const { data } = await apiClient.post(`/orders/${id}/reject`);
      return data;
    },
    subscribeOrder: (orderId, onStatusUpdate, onLocationUpdate) => {
      const socket = io(getSocketUrl() || "/");
      socket.emit("join_order", orderId);
      if (onStatusUpdate) socket.on("order_update", onStatusUpdate);
      if (onLocationUpdate) socket.on("location_update", onLocationUpdate);
      return () => {
        if (onStatusUpdate) socket.off("order_update", onStatusUpdate);
        if (onLocationUpdate) socket.off("location_update", onLocationUpdate);
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

  coupons: {
    list: async (sort, limit) => {
      const { data } = await apiClient.get("/coupons", {
        params: { sort, limit },
      });
      return data;
    },
    create: async (payload) => {
        const { data } = await apiClient.post("/coupons", payload);
        return data;
    },
    delete: async (id) => {
        await apiClient.delete(`/coupons/${id}`);
    },
  },
  
  events: {
    list: async (params) => {
      const { data } = await apiClient.get("/events", { params });
      return data;
    },
    getById: async (id) => {
      const { data } = await apiClient.get(`/events/${id}`);
      return data;
    },
    create: async (payload) => {
      const { data } = await apiClient.post("/events", payload);
      return data;
    },
    delete: async (id) => {
      const { data } = await apiClient.delete(`/events/${id}`);
      return data?.data || data;
    },
    rsvp: async (id) => {
      const { data } = await apiClient.post(`/events/${id}/rsvp`);
      return data?.data || data;
    }
  },

  admin: {
    listUsers: async () => {
      const { data } = await apiClient.get("/admin/users");
      return data?.data || data;
    },
    assignOwner: async (userId, restaurantId) => {
      const { data } = await apiClient.post("/admin/assign-owner", { userId, restaurantId });
      return data?.data || data;
    }
  }
};