const trimTrailingSlash = (value = '') => String(value || '').replace(/\/$/, '')

export const getApiBaseUrl = () => {
  const envBase = trimTrailingSlash(import.meta.env.VITE_API_URL || '')
  if (envBase) return envBase

  if (typeof window !== 'undefined') {
    const { hostname, port } = window.location
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port === '5173') {
      return 'http://localhost:5000'
    }
  }

  return ''
}

export const withApiBase = (path = '') => {
  const base = getApiBaseUrl()
  if (!base) return path
  if (path.startsWith('/')) return `${base}${path}`
  return `${base}/${path}`
}
