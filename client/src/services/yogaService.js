import api, { unwrap } from './api.js'

export const poseService = {
  async list(params = {}) {
    return unwrap(await api.get('/api/poses', { params }))
  },

  async get(idOrSlug) {
    return unwrap(await api.get(`/api/poses/${idOrSlug}`))
  },

  async create(payload) {
    return unwrap(await api.post('/api/poses', payload))
  },

  async update(id, payload) {
    return unwrap(await api.put(`/api/poses/${id}`, payload))
  },

  async remove(id) {
    return unwrap(await api.delete(`/api/poses/${id}`))
  },

  /** Admin-only image upload for a pose. */
  async uploadImage(id, file) {
    const formData = new FormData()
    formData.append('image', file)
    return unwrap(
      await api.post(`/api/poses/${id}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    )
  },
}

export const favoriteService = {
  async list() {
    return unwrap(await api.get('/api/favorites'))
  },

  async add(poseId) {
    return unwrap(await api.post(`/api/favorites/${poseId}`))
  },

  async remove(poseId) {
    return unwrap(await api.delete(`/api/favorites/${poseId}`))
  },
}

export const routineService = {
  async list(params = {}) {
    return unwrap(await api.get('/api/routines', { params }))
  },

  async get(id) {
    return unwrap(await api.get(`/api/routines/${id}`))
  },

  async generate(payload) {
    return unwrap(await api.post('/api/routines/generate', payload))
  },

  async create(payload) {
    return unwrap(await api.post('/api/routines', payload))
  },

  async update(id, payload) {
    return unwrap(await api.put(`/api/routines/${id}`, payload))
  },

  async remove(id) {
    return unwrap(await api.delete(`/api/routines/${id}`))
  },

  async setVisibility(id, isPublic) {
    return unwrap(await api.post(`/api/routines/${id}/publish`, { isPublic }))
  },
}

export const progressService = {
  async summary() {
    return unwrap(await api.get('/api/progress'))
  },

  async weekly(days = 7) {
    return unwrap(await api.get('/api/progress/weekly', { params: { days } }))
  },

  async history(params = {}) {
    return unwrap(await api.get('/api/progress/history', { params }))
  },

  async saveSession(payload) {
    return unwrap(await api.post('/api/progress/sessions', payload))
  },
}

export const achievementService = {
  async list() {
    return unwrap(await api.get('/api/achievements'))
  },
}

export const moodService = {
  async options() {
    return unwrap(await api.get('/api/mood/options'))
  },

  async recommend(moods) {
    return unwrap(await api.post('/api/mood/recommend', { moods }))
  },
}

export const aiService = {
  async chat(message, history = []) {
    return unwrap(await api.post('/api/ai/chat', { message, history }))
  },

  async status() {
    return unwrap(await api.get('/api/ai/status'))
  },
}

export const communityService = {
  async listPosts(params = {}) {
    return unwrap(await api.get('/api/community/posts', { params }))
  },

  async createPost(payload) {
    return unwrap(await api.post('/api/community/posts', payload))
  },

  async deletePost(id) {
    return unwrap(await api.delete(`/api/community/posts/${id}`))
  },

  async likePost(id) {
    return unwrap(await api.post(`/api/community/posts/${id}/like`))
  },

  async reportPost(id, reason) {
    return unwrap(await api.post(`/api/community/posts/${id}/report`, { reason }))
  },

  async challenges() {
    return unwrap(await api.get('/api/community/challenges'))
  },

  async joinChallenge(key) {
    return unwrap(await api.post(`/api/community/challenges/${key}/join`))
  },

  async leaveChallenge(key) {
    return unwrap(await api.delete(`/api/community/challenges/${key}/join`))
  },
}

export default {
  poseService,
  favoriteService,
  routineService,
  progressService,
  achievementService,
  moodService,
  aiService,
  communityService,
}
