import { http } from '../core/http.js';

export const categoriasApi = {
  list: () => http.get('/categorias', undefined, { auth: false }),
  create: (data) => http.post('/categorias', data),
  update: (id, data) => http.put(`/categorias/${id}`, data),
  remove: (id) => http.delete(`/categorias/${id}`)
};
