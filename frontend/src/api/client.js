const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token')
  }

  setToken(token) {
    this.token = token
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      this.setToken(null)
      window.location.reload()
      throw new Error('Unauthorized')
    }

    if (response.status === 204) {
      return null
    }

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Request failed')
    }

    return data
  }

  // Google Auth
  async googleAuth(credential) {
    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    })
    this.setToken(data.token)
    return data
  }

  async getMe() {
    return this.request('/auth/me')
  }

  logout() {
    this.setToken(null)
  }

  // Sets
  async getSets() {
    return this.request('/sets')
  }

  async getSet(id) {
    return this.request(`/sets/${id}`)
  }

  async createSet(name, description) {
    return this.request('/sets', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    })
  }

  async updateSet(id, name, description) {
    return this.request(`/sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name, description }),
    })
  }

  async deleteSet(id) {
    return this.request(`/sets/${id}`, { method: 'DELETE' })
  }

  async duplicateSet(id) {
    return this.request(`/sets/${id}/duplicate`, { method: 'POST' })
  }

  async setVisibility(id, isPublic) {
    return this.request(`/sets/${id}/visibility`, {
      method: 'PUT',
      body: JSON.stringify({ is_public: isPublic }),
    })
  }

  // Public Sets
  async getPublicSets(search = '') {
    const params = search ? `?search=${encodeURIComponent(search)}` : ''
    return this.request(`/sets/public${params}`)
  }

  async getPublicSet(id) {
    return this.request(`/sets/public/${id}`)
  }

  async copyPublicSet(id) {
    return this.request(`/sets/public/${id}/copy`, { method: 'POST' })
  }

  // Cards
  async createCard(set_id, front, back, front_image = null, back_image = null) {
    return this.request('/cards', {
      method: 'POST',
      body: JSON.stringify({ set_id, front, back, front_image, back_image }),
    })
  }

  async createCardsBulk(set_id, cards) {
    return this.request('/cards/bulk', {
      method: 'POST',
      body: JSON.stringify({ set_id, cards }),
    })
  }

  async updateCard(id, data) {
    // data can include: front, back, front_image, back_image
    return this.request(`/cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCard(id) {
    return this.request(`/cards/${id}`, { method: 'DELETE' })
  }

  // Study
  async startSession(set_id, mode) {
    return this.request('/study/sessions', {
      method: 'POST',
      body: JSON.stringify({ set_id, mode }),
    })
  }

  async recordResults(sessionId, results) {
    return this.request(`/study/sessions/${sessionId}/results`, {
      method: 'POST',
      body: JSON.stringify({ results }),
    })
  }

  async getStudyStats(setId) {
    return this.request(`/study/stats/${setId}`)
  }
}

export const api = new ApiClient()
