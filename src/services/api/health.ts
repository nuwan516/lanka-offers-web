import { apiFetch } from './client'

export interface HealthStatus {
  status: string
  timestamp?: string
  version?: string
}

export async function checkHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/api/health')
}
