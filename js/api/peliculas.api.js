import { http } from '../core/http.js';

export const peliculasApi = {
  list: (filters) => http.get('/peliculas', filters, { auth: false }),
  ranking: (filters) => http.get('/peliculas/ranking', filters, { auth: false }),
  detail: (id) => http.get(`/peliculas/${id}`, undefined, { auth: false }),
  propose: (data) => http.post('/peliculas', data),
  // Admin
  listAdmin: (estado) => http.get('/peliculas/admin', { estado }),
  setEstado: (id, estado) => http.patch(`/peliculas/${id}/estado`, { estado }),
  update: (id, data) => http.put(`/peliculas/${id}`, data),
  remove: (id) => http.delete(`/peliculas/${id}`)
};
