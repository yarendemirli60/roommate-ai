export class ApiError extends Error {
  constructor(message, status = 0, fields = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

function csrfToken() {
  const item = document.cookie.split('; ').find((part) => part.startsWith('csrftoken='))
  return item ? decodeURIComponent(item.slice('csrftoken='.length)) : ''
}

async function prepareCsrf() {
  if (csrfToken()) return
  const response = await fetch('/api/session-csrf/', {
    credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'text/html' },
  })
  if (!response.ok || !csrfToken()) {
    throw new ApiError('Güvenli oturum başlatılamadı. Sunucu bağlantısını kontrol edip tekrar deneyin.', response.status)
  }
}

async function request(path, method = 'GET', body) {
  try {
    if (method !== 'GET') await prepareCsrf()
    const response = await fetch(`/api/${path}`, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(method === 'GET' ? {} : { 'X-CSRFToken': csrfToken() }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const isJson = response.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await response.json() : null
    if (!response.ok) {
      const message = response.status >= 500
        ? 'Sunucuya ulaşılamadı. Lütfen biraz sonra tekrar deneyin.'
        : response.status === 403
          ? 'Oturumunuz geçerli değil veya güvenlik doğrulaması başarısız. Yeniden giriş yapın.'
          : data?.mesaj || data?.detail || 'Bilgilerinizi kontrol ederek tekrar deneyin.'
      throw new ApiError(message, response.status, data || {})
    }
    if (!isJson) throw new ApiError('Sunucudan beklenen yanıt alınamadı. API bağlantısını kontrol edin.', 502)
    return data
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('Sunucu bağlantısı kurulamadı. İnternet ve uygulama bağlantısını kontrol edin.')
  }
}

export const api = {
  register: (data) => request('kayit/', 'POST', data),
  login: (data) => request('giris/', 'POST', data),
  logout: () => request('cikis/', 'POST', {}),
  getProfile: () => request('profil/'),
  createProfile: (data) => request('profil/olustur/', 'POST', data),
  updateProfile: (data) => request('profil/', 'PATCH', data),
}

export async function readSession(user = null) {
  try {
    return { authenticated: true, profile: await api.getProfile(), user, loading: false, offline: false }
  } catch (error) {
    if (error.status === 404) return { authenticated: true, profile: null, user, loading: false, offline: false }
    if (error.status === 401 || error.status === 403) return { authenticated: false, profile: null, user: null, loading: false, offline: false }
    return { authenticated: false, profile: null, user: null, loading: false, offline: true }
  }
}
