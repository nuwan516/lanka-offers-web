/**
 * Frontend Web Application Environment Configuration
 * Centralized, type-safe access to environment variables.
 * Safe for Next.js SSR and client execution.
 */

const getEnvVar = (key: string, defaultValue = ''): string => {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env[key]) return process.env[key] as string
  }
  return defaultValue
}

export const env = {
  /**
   * Base URL for the public consumer Backend API.
   * Empty string uses relative requests which Next.js rewrites to the API.
   */
  apiBaseUrl: (
    getEnvVar('NEXT_PUBLIC_API_URL') ||
    getEnvVar('NEXT_PUBLIC_API_BASE_URL') ||
    getEnvVar('VITE_API_BASE_URL') ||
    ''
  ).replace(/\/+$/, ''),

  /**
   * OpenStreetMap tile server URL template.
   */
  mapTileUrl:
    getEnvVar('NEXT_PUBLIC_MAP_TILE_URL') ||
    getEnvVar('VITE_MAP_TILE_URL') ||
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
  mode: process.env.NODE_ENV || 'development',
} as const

export default env
