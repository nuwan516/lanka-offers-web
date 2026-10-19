import { env } from '@/config/env'

const API_BASE_URL = env.apiBaseUrl
const DEFAULT_TIMEOUT_MS = 15_000

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  timeoutMs?: number
}

export class ApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { params, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...init } = options

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

  // One controller covers both the caller's cancellation and the request timeout.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onCallerAbort = () => controller.abort()
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener('abort', onCallerAbort, { once: true })
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
      signal: controller.signal,
    })

    if (!response.ok) {
      const body: { message?: string } = await response.json().catch(() => ({}))
      throw new ApiError(body.message || `HTTP ${response.status}`, response.status)
    }

    return (await response.json()) as T
  } catch (err) {
    if (err instanceof ApiError) throw err
    if (signal?.aborted) throw err
    if (controller.signal.aborted) throw new ApiError('The request timed out', 408)
    throw new ApiError('Network error', undefined)
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onCallerAbort)
  }
}

export { apiFetch, API_BASE_URL }
