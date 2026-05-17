import { defineStore } from 'pinia';
import api from '../utils/axios';
import { jwtDecode } from 'jwt-decode';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,

    isGuest: (state) => {
      console.log('isGuest getter called, state.user:', state.user);
      if (state.user && typeof state.user.is_guest === 'boolean') {
        console.log('Returning from state.user.is_guest:', state.user.is_guest);
        return state.user.is_guest;
      }
      if (state.token) {
        try {
          const decoded = jwtDecode(state.token);
          console.log('Decoded token:', decoded);
          console.log('isGuest from token:', decoded.isGuest);
          return jwtDecode(state.token).isGuest === true;
        } catch (err) {
          console.error('Decode error:', err);
          return false;
        }
      }
      return false;
    },

    displayName: (state) => {
      if (state.user?.name) return state.user.name;
      if (state.token) {
        try {
          const email = jwtDecode(state.token).email;
          return email ? email.split('@')[0] : 'Guest User';
        } catch { }
      }
      return 'Guest User';
    },

    userEmail: (state) => {
      if (state.user?.email) return state.user.email;
      if (state.token) {
        try {
          return jwtDecode(state.token).email || '';
        } catch { }
      }
      return '';
    },
  },

  actions: {
    async init() {
      const token = this.token;
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          await this.fetchUser();
        } catch (error) {
          if (error.response?.status === 404) {
            // No /users/me endpoint – fallback to token data
            console.warn('User endpoint missing, using token data');
            this.user = null;
          } else {
            await this.createGuestSession();
          }
        }
      } else {
        await this.createGuestSession();
      }
    },

    async createGuestSession() {
      console.log('Creating guest session...');
      this.loading = true;
      try {
        const { data } = await api.post('/guest/init');
        this.token = data.token;
        // Convert snake_case to camelCase
        this.user = {
          id: data.user.user_id,
          email: data.user.user_email,
          name: data.user.user_name,
          createdAt: data.user.created_at,
          is_guest: data.user.is_guest,
        };
        localStorage.setItem('token', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return true;
      } catch (error) {
        console.error('Guest session creation failed:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async signup(email, password, fullName = '') {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/signup', { email, password, fullName });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return true;
      } catch (error) {
        console.error('Signup failed:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async login(email, password) {
      this.loading = true;
      try {
        const { data } = await api.post('/auth/login', { email, password });
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('token', data.token);
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return true;
      } catch (error) {
        console.error('Login failed:', error);
        return false;
      } finally {
        this.loading = false;
      }
    },

    async fetchUser() {
      try {
        const { data } = await api.get('/auth/me');
        this.user = data;
      } catch (error) {
        console.error('Failed to fetch user:', error);
        throw error;
      }
    },

    async updateProfile({ fullName, email }) {
      try {
        const { data } = await api.put('/auth/me', { fullName, email });
        this.user = { ...this.user, ...data };
        return data;
      } catch (error) {
        console.error('Profile update failed:', error);
        throw error;
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    },
  },
});