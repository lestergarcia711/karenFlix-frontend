import { API_BASE_URL } from '../config.js';
import { session } from './session.js';

export class ApiError extends Error {
  constructor(message, status = 0, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = Array.isArray(details) ? details : [];
  }
}

function buildUrl(path, query) {
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
  }
  return url;
}

export async function request(path, { method = 'GET', query, body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  const token = session.token;
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Verifica que la API esté en ejecución.');
  }

  let payload = null;
  try { payload = await response.json(); } catch { /* empty or non-JSON body */ }

  if (!response.ok) {
    // An expired/invalid token on a protected call: drop the session and ask to log in again.
    if (response.status === 401 && auth && token) {
      session.clear();
      const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
      location.replace(`login.html?expired=1&next=${next}`);
    }
    throw new ApiError(payload?.message || `Error inesperado (${response.status}).`, response.status, payload?.details);
  }
  return payload ?? { ok: true };
}

export const http = {
  get: (path, query, options) => request(path, { ...options, query }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body: body ?? {} }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' })
};
