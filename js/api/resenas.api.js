import { http } from '../core/http.js';

export const resenasApi = {
  create: (peliculaId, data) => http.post(`/peliculas/${peliculaId}/resenas`, data),
  update: (id, data) => http.put(`/resenas/${id}`, data),
  remove: (id) => http.delete(`/resenas/${id}`),
  react: (id, tipo) => http.post(`/resenas/${id}/reacciones`, { tipo }),
  unreact: (id) => http.delete(`/resenas/${id}/reacciones`)
};
