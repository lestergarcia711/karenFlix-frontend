import { http } from '../core/http.js';

export const usuariosApi = {
  myActivity: () => http.get('/usuarios/mi-actividad'),
  history: (filters) => http.get('/usuarios/historial', filters),
  // Admin
  stats: () => http.get('/usuarios/estadisticas'),
  list: () => http.get('/usuarios'),
  remove: (id) => http.delete(`/usuarios/${id}`)
};
