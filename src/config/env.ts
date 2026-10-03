/**
 * Frontend Web Application Environment Configuration
 * Centralized, type-safe access to environment variables.
 *
 * All environment variables must be prefixed with VITE_ to be exposed to Vite client code.
 */

export const env = {
  /**
   * Base URL for the public consumer Backend API.
   * If not set or empty, relative requests ('') are used which Vite proxies in development.
   */
  apiBaseUrl: (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''),

  /**
   * OpenStreetMap tile server URL template.
   */
  mapTileUrl:
    import.meta.env.VITE_MAP_TILE_URL ||
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',

  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const

export default env
