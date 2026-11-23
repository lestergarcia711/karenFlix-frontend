import { h, render, $ } from '../core/dom.js';
import { tipoLabel } from '../core/format.js';
import { peliculasApi } from '../api/peliculas.api.js';
import { categoriasApi } from '../api/categorias.api.js';
import { mountShell } from '../components/navbar.js';
import { ratingBadge } from '../components/movieCard.js';
import { safeImageUrl } from '../core/format.js';
import { emptyState, errorState, loadingState } from '../core/ui.js';

mountShell('ranking');

const filters = { orden: 'ranking', categoria_id: '', limite: '20' };
const list = h('div', { 'aria-live': 'polite' });

const field = (label, control) => h('div', { class: 'field' }, h('label', {}, label), control);
const orderSelect = h('select', { class: 'select', onchange: (e) => update({ orden: e.target.value }) },
  h('option', { value: 'ranking' }, 'Puntaje ponderado'), h('option', { value: 'popularidad' }, 'Popularidad'));
const categorySelect = h('select', { class: 'select', onchange: (e) => update({ categoria_id: e.target.value }) },
  h('option', { value: '' }, 'Todas'));
const limitSelect = h('select', { class: 'select', onchange: (e) => update({ limite: e.target.value }) },
  ['10', '20', '50', '100'].map((v) => h('option', { value: v, selected: v === filters.limite }, `Top ${v}`)));

render($('#app'),
  h('div', { class: 'page-head' },
    h('div', {}, h('h1', {}, 'Ranking'),
      h('p', {}, 'Los títulos mejor valorados por la comunidad, según calificaciones y reacciones.'))),
  h('div', { class: 'filters' }, h('div', { class: 'filters-row' },
    field('Criterio', orderSelect), field('Categoría', categorySelect), field('Cantidad', limitSelect))),
  list);

loadCategories();
load();

function update(patch) { Object.assign(filters, patch); load(); }

async function loadCategories() {
  try {
    const { data } = await categoriasApi.list();
    data.categorias.forEach((c) => categorySelect.append(h('option', { value: c.id }, c.nombre)));
  } catch { /* filter stays on "Todas" */ }
}

async function load() {
  render(list, loadingState('Calculando ranking...'));
  try {
    const { data } = await peliculasApi.ranking(filters);
    if (!data.ranking.length) {
      render(list, emptyState('Aún no hay títulos en el ranking', 'Cuando se aprueben títulos aparecerán aquí.'));
      return;
    }
    render(list, h('ol', { class: 'rank-list', style: 'list-style:none' }, data.ranking.map(row)));
  } catch (error) {
    render(list, errorState(error.message, load));
  }
}

function row(p) {
  const img = safeImageUrl(p.imagen_url);
  return h('li', {},
    h('a', { class: 'rank-row', href: `pelicula.html?id=${encodeURIComponent(p.id)}` },
      h('span', { class: 'rank-pos' }, p.posicion),
      h('div', { class: 'thumb' }, img && h('img', { src: img, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', onerror: (e) => e.target.remove() })),
      h('div', { class: 'rank-info' },
        h('h3', {}, p.titulo),
        h('div', { class: 'tags' }, h('span', { class: 'tag tag-purple' }, tipoLabel(p.tipo)),
          p.categoria_nombre && h('span', { class: 'tag tag-cyan' }, p.categoria_nombre),
          h('span', { class: 'muted' }, p.anio))),
      h('div', { class: 'rating-col' }, ratingBadge(p))));
}
