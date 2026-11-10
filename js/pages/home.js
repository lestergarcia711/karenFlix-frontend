import { h, render, $, debounce } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { TIPOS } from '../config.js';
import { tipoLabel } from '../core/format.js';
import { peliculasApi } from '../api/peliculas.api.js';
import { categoriasApi } from '../api/categorias.api.js';
import { mountShell } from '../components/navbar.js';
import { movieCard, poster, ratingBadge } from '../components/movieCard.js';
import { emptyState, errorState, skeletonGrid, toastError } from '../core/ui.js';
import { session } from '../core/session.js';

mountShell('home');

const params = new URLSearchParams(location.search);
const filters = {
  busqueda: params.get('busqueda') || '',
  tipo: params.get('tipo') || '',
  categoria_id: params.get('categoria_id') || '',
  orden: params.get('orden') || 'recientes'
};

let requestId = 0; // guards against out-of-order responses
const heroHost = h('div', {});
const results = h('div', { 'aria-live': 'polite' });
const info = h('p', { class: 'results-info' });

const searchInput = h('input', { class: 'input', type: 'search', placeholder: 'Buscar por título...', 'aria-label': 'Buscar por título', value: filters.busqueda });
const categorySelect = h('select', { class: 'select', 'aria-label': 'Categoría', onchange: (e) => update({ categoria_id: e.target.value }) },
  h('option', { value: '' }, 'Todas las categorías'));
const orderSelect = h('select', { class: 'select', 'aria-label': 'Ordenar por', onchange: (e) => update({ orden: e.target.value }) },
  [['recientes', 'Más recientes'], ['ranking', 'Mejor ranking'], ['popularidad', 'Más populares']]
    .map(([value, label]) => h('option', { value, selected: value === filters.orden }, label)));
const chipsHost = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar por tipo' });

searchInput.addEventListener('input', debounce(() => update({ busqueda: searchInput.value.trim() }), 350));

render($('#app'),
  heroHost,
  h('section', { class: 'section' },
    h('div', { class: 'section-head' }, h('h2', {}, 'Explora el catálogo'),
      session.isAuthenticated && h('a', { class: 'btn btn-ghost btn-sm', href: 'perfil.html#proponer' }, icon('plus', 16), 'Proponer título')),
    h('div', { class: 'filters' },
      h('div', { class: 'filters-row' },
        h('div', { class: 'search' }, icon('search', 18), searchInput), categorySelect, orderSelect),
      chipsHost),
    info, results));

renderChips();
loadCategories();
loadHero();
load();

function renderChips() {
  const options = [['', 'Todos'], ...TIPOS.map((t) => [t, tipoLabel(t)])];
  render(chipsHost, options.map(([value, label]) =>
    h('button', { class: 'chip', type: 'button', 'aria-pressed': String(filters.tipo === value), onclick: () => update({ tipo: value }) }, label)));
}

function update(patch) {
  Object.assign(filters, patch);
  renderChips();
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) if (v && !(k === 'orden' && v === 'recientes')) qs.set(k, v);
  history.replaceState(null, '', qs.size ? `?${qs}` : location.pathname);
  load();
}

async function loadCategories() {
  try {
    const { data } = await categoriasApi.list();
    for (const c of data.categorias) {
      categorySelect.append(h('option', { value: c.id, selected: String(c.id) === String(filters.categoria_id) }, c.nombre));
    }
  } catch { /* the catalog still works without the category filter */ }
}

async function load() {
  const current = ++requestId;
  render(results, skeletonGrid(8));
  info.textContent = '';
  try {
    const { data } = await peliculasApi.list(filters);
    if (current !== requestId) return; // a newer search superseded this one
    const items = data.peliculas;
    info.textContent = `${items.length} ${items.length === 1 ? 'título' : 'títulos'}`;
    if (!items.length) {
      render(results, emptyState('No encontramos resultados', 'Prueba con otra búsqueda o quita algunos filtros.',
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { searchInput.value = ''; categorySelect.value = ''; update({ busqueda: '', tipo: '', categoria_id: '' }); } }, 'Limpiar filtros')));
      return;
    }
    render(results, h('div', { class: 'grid-cards' }, items.map((p) => movieCard(p))));
  } catch (error) {
    if (current !== requestId) return;
    render(results, errorState(error.message, load));
  }
}

// Featured title = current #1 of the ranking. Hidden if the catalog is empty.
async function loadHero() {
  try {
    const { data } = await peliculasApi.ranking({ limite: 1 });
    const top = data.ranking[0];
    if (!top) return;
    render(heroHost, h('section', { class: 'hero' },
      h('div', { class: 'hero-copy' },
        h('div', { class: 'hero-tags' }, h('span', { class: 'tag tag-orange' }, 'Nº 1 del ranking'),
          h('span', { class: 'tag tag-cyan' }, top.categoria_nombre || tipoLabel(top.tipo)), ratingBadge(top)),
        h('h1', {}, top.titulo),
        top.descripcion && h('p', {}, top.descripcion),
        h('div', { class: 'hero-actions' },
          h('a', { class: 'btn btn-primary', href: `pelicula.html?id=${encodeURIComponent(top.id)}` }, icon('play', 16), 'Ver detalle'),
          h('a', { class: 'btn btn-ghost', href: 'ranking.html' }, 'Ver ranking completo'))),
      h('div', { class: 'hero-art' }, poster(top))));
  } catch (error) {
    if (error.status === 429) toastError(error.message);
  }
}
