import { env } from '@/config/env'

const API_BASE_URL = env.apiBaseUrl

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...init } = options

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  let url = `${API_BASE_URL}${normalizedPath}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    }
    const queryString = searchParams.toString()
    if (queryString) url += `?${queryString}`
  }

  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...init.headers },
    ...init,
  })

  if (!response.ok) {
    const error: { message?: string } = await response.json().catch(() => ({}))
    throw Object.assign(new Error(error.message || `HTTP ${response.status}`), {
      status: response.status,
    })
  }

  return response.json() as Promise<T>
}

export { apiFetch, API_BASE_URL }
