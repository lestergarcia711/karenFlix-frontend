import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { formatScore, safeImageUrl, tipoLabel, toNumber } from '../core/format.js';

export function poster(pelicula, { rank } = {}) {
  const url = safeImageUrl(pelicula.imagen_url);
  const box = h('div', { class: 'poster' });
  const fallback = h('div', { class: 'poster-fallback' }, pelicula.titulo);
  if (url) {
    const img = h('img', { src: url, alt: `Póster de ${pelicula.titulo}`, loading: 'lazy', referrerPolicy: 'no-referrer' });
    img.addEventListener('error', () => { img.remove(); box.prepend(fallback); });
    box.append(img);
  } else {
    box.append(fallback);
  }
  if (pelicula.tipo) box.append(h('span', { class: 'tag tag-purple' }, tipoLabel(pelicula.tipo)));
  if (rank) box.append(h('span', { class: 'rank-badge', 'aria-label': `Posición ${rank}` }, `#${rank}`));
  return box;
}

export function ratingBadge(pelicula, { showCount = true } = {}) {
  const total = toNumber(pelicula.total_resenas);
  return h('span', { class: 'rating', title: `${total} reseña(s)` },
    icon('star', 14), formatScore(pelicula.promedio_calificacion),
    showCount && h('small', {}, `(${total})`));
}

export function movieCard(pelicula, { rank } = {}) {
  return h('a', { class: 'card-movie', href: `pelicula.html?id=${encodeURIComponent(pelicula.id)}`, 'aria-label': pelicula.titulo },
    poster(pelicula, { rank }),
    h('div', { class: 'card-body' },
      h('h3', {}, pelicula.titulo),
      h('div', { class: 'card-meta' },
        h('span', {}, [pelicula.anio, pelicula.categoria_nombre].filter(Boolean).join(' · ')),
        ratingBadge(pelicula, { showCount: false }))));
}
