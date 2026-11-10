import { session } from './session.js';

const currentPage = () => location.pathname.split('/').pop() || 'index.html';

// Redirect visitors away from pages that need a session.
export function requireAuth() {
  if (session.isAuthenticated) return true;
  const next = encodeURIComponent(currentPage() + location.search);
  location.replace(`login.html?next=${next}`);
  return false;
}

// UI-level gate only: the API enforces the role with 403 regardless.
export function requireAdmin() {
  if (!requireAuth()) return false;
  if (session.isAdmin) return true;
  location.replace('index.html');
  return false;
}

// Authenticated users have no business on login/register.
export function redirectIfAuthenticated() {
  if (!session.isAuthenticated) return false;
  location.replace(session.homePath);
  return true;
}

// Only allow same-site relative redirects after login.
export function safeNext(raw) {
  if (!raw || /^[a-z]+:|^\/\//i.test(raw) || raw.includes('..')) return null;
  return /^[\w-]+\.html(\?.*)?$/.test(raw) ? raw : null;
}
