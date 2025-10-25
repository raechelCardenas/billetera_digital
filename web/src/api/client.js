const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1'

const buildHeaders = () => ({
  'Content-Type': 'application/json',
})

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(payload?.message || 'Error inesperado en el servidor')
    error.status = response.status
    error.code = payload?.code
    error.errors = payload?.errors
    error.raw = payload
    throw error
  }

  return payload
}

export const apiClient = {
  async get(path, params) {
    const url = new URL(`${baseUrl}${path}`)

    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, value)
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: buildHeaders(),
    })

    return parseResponse(response)
  },

  async post(path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(body ?? {}),
    })

    return parseResponse(response)
  },
}
