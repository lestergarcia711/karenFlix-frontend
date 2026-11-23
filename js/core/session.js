import { STORAGE_KEYS, ROLES } from '../config.js';

// Session lives in localStorage. Real authorization is always enforced by the backend;
// this only drives what the UI shows.
const read = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key, value) => {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch { /* storage unavailable */ }
};

export const session = {
  get token() { return read(STORAGE_KEYS.token); },
  get user() {
    try { return JSON.parse(read(STORAGE_KEYS.user)); } catch { return null; }
  },
  get isAuthenticated() { return Boolean(this.token && this.user); },
  get isAdmin() { return this.user?.rol === ROLES.admin; },
  start({ token, usuario }) {
    write(STORAGE_KEYS.token, token);
    write(STORAGE_KEYS.user, JSON.stringify(usuario));
  },
  updateUser(usuario) { write(STORAGE_KEYS.user, JSON.stringify(usuario)); },
  clear() {
    write(STORAGE_KEYS.token, null);
    write(STORAGE_KEYS.user, null);
  },
  // Landing page after authentication: admins go straight to their panel.
  get homePath() { return this.isAdmin ? 'admin.html' : 'index.html'; }
};
