import { http } from '../core/http.js';

export const authApi = {
  register: (data) => http.post('/auth/register', data, { auth: false }),
  login: (data) => http.post('/auth/login', data, { auth: false }),
  profile: () => http.get('/auth/profile')
};
