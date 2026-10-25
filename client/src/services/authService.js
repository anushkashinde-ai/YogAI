import api, { unwrap } from './api.js'

export const authService = {
  async register(payload) {
    return unwrap(await api.post('/api/auth/register', payload))
  },

  async login(payload) {
    return unwrap(await api.post('/api/auth/login', payload))
  },

  async logout() {
    return unwrap(await api.post('/api/auth/logout'))
  },

  /** Restores the session from the httpOnly cookie. */
  async me() {
    return unwrap(await api.get('/api/auth/me'))
  },

  async forgotPassword(email) {
    return unwrap(await api.post('/api/auth/forgot-password', { email }))
  },

  async resetPassword(token, password) {
    return unwrap(await api.post('/api/auth/reset-password', { token, password }))
  },
}

export const userService = {
  async getProfile() {
    return unwrap(await api.get('/api/users/me'))
  },

  async updateProfile(payload) {
    return unwrap(await api.patch('/api/users/me', payload))
  },

  async updatePreferences(payload) {
    return unwrap(await api.patch('/api/users/me/preferences', payload))
  },

  async changePassword(payload) {
    return unwrap(await api.post('/api/users/me/change-password', payload))
  },
}

export default authService
