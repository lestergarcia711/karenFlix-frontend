// Central configuration. Change API_BASE_URL to point the frontend at another backend.
// The backend only accepts browser requests from the origin set in its CORS_ORIGIN variable.
export const API_BASE_URL = 'http://localhost:3000/api/v1';

export const STORAGE_KEYS = Object.freeze({
  token: 'karenflix.token',
  user: 'karenflix.user'
});

export const ROLES = Object.freeze({ admin: 'administrador', user: 'usuario' });
export const TIPOS = Object.freeze(['pelicula', 'serie', 'anime']);
export const TIPO_LABELS = Object.freeze({ pelicula: 'Película', serie: 'Serie', anime: 'Anime' });
export const ESTADOS = Object.freeze(['pendiente', 'aprobada', 'rechazada']);
