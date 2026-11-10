import { h, render, $ } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { ESTADOS } from '../config.js';
import { formatDate, safeImageUrl, tipoLabel, toNumber, formatScore } from '../core/format.js';
import { usuariosApi } from '../api/usuarios.api.js';
import { peliculasApi } from '../api/peliculas.api.js';
import { categoriasApi } from '../api/categorias.api.js';
import { session } from '../core/session.js';
import { requireAdmin } from '../core/guards.js';
import { mountShell } from '../components/navbar.js';
import { buildTitleForm } from '../components/titleForm.js';
import { confirmDialog, emptyState, errorState, field, loadingState, openModal, showFormError, toastError, toastSuccess, withBusy } from '../core/ui.js';

if (requireAdmin()) init();

const ESTADO_TAG = { pendiente: 'tag-blue', aprobada: 'tag-cyan', rechazada: 'tag-orange' };

function init() {
  mountShell('admin');
  const panel = h('div', {});
  const tabBar = h('div', { class: 'tabs', role: 'tablist' });
  const tabs = [['resumen', 'Resumen', showSummary], ['titulos', 'Títulos', showTitles], ['categorias', 'Categorías', showCategories], ['usuarios', 'Usuarios', showUsers]];

  render($('#app'),
    h('div', { class: 'admin-banner' },
      h('div', {}, h('h1', {}, 'Panel de administración'), h('p', { class: 'muted' }, `Sesión iniciada como ${session.user.nombre}`)),
      h('span', { class: 'tag tag-orange' }, 'Administrador')),
    tabBar, h('div', { class: 'section' }, panel));

  function select(key) {
    render(tabBar, tabs.map(([k, label]) => h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(k === key), onclick: () => select(k) }, label)));
    history.replaceState(null, '', `#${key}`);
    tabs.find(([k]) => k === key)[2](panel);
  }
  const start = location.hash.slice(1);
  select(tabs.some(([k]) => k === start) ? start : 'resumen');
}

/* ------------------------------ Summary ------------------------------ */
async function showSummary(panel) {
  render(panel, loadingState());
  try {
    const s = (await usuariosApi.stats()).data.estadisticas;
    const n = (k) => toNumber(s[k]);
    const stat = (value, label, tone) => h('div', { class: `stat ${tone}` }, h('strong', {}, value), h('span', {}, label));
    const totalTitles = n('peliculas_aprobadas') + n('peliculas_pendientes') + n('peliculas_rechazadas');
    const bar = (label, value, tone) => h('div', { class: 'bar-row' }, h('span', {}, label),
      h('div', { class: 'bar-track' }, h('div', { class: `bar-fill ${tone}`, style: `width:${totalTitles ? Math.round((value / totalTitles) * 100) : 0}%` })), h('strong', {}, value));
    render(panel,
      h('div', { class: 'grid-stats' },
        stat(n('total_usuarios'), 'Usuarios', 'accent-purple'), stat(n('total_categorias'), 'Categorías', 'accent-cyan'),
        stat(n('total_resenas'), 'Reseñas', 'accent-blue'), stat(n('total_reacciones'), 'Reacciones', 'accent-orange')),
      h('div', { class: 'two-col section' },
        h('section', { class: 'panel' }, h('div', { class: 'panel-title' }, h('h2', {}, 'Estado de los títulos')),
          h('div', { class: 'bars' }, bar('Aprobados', n('peliculas_aprobadas'), 'cyan'), bar('Pendientes', n('peliculas_pendientes'), 'purple'), bar('Rechazados', n('peliculas_rechazadas'), 'orange'))),
        h('section', { class: 'panel' }, h('h3', {}, 'Pendientes de revisión'),
          h('p', { class: 'muted', style: 'margin:8px 0 16px' }, n('peliculas_pendientes') ? `Hay ${n('peliculas_pendientes')} título(s) esperando tu decisión.` : 'No hay títulos pendientes.'),
          h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => { history.replaceState(null, '', '#titulos'); $$tab('Títulos'); } }, 'Revisar títulos'))));
  } catch (error) { render(panel, errorState(error.message, () => showSummary(panel))); }
}
const $$tab = (label) => [...document.querySelectorAll('.tab')].find((t) => t.textContent === label)?.click();

/* ------------------------------ Titles ------------------------------ */
async function showTitles(panel) {
  let estado = 'pendiente';
  const list = h('div', {});
  const filter = h('div', { class: 'chips', role: 'group', 'aria-label': 'Filtrar por estado' });
  render(panel, h('div', { class: 'toolbar' }, filter), list);
  drawFilter();
  load();

  function drawFilter() {
    render(filter, [['', 'Todos'], ...ESTADOS.map((e) => [e, e[0].toUpperCase() + e.slice(1)])].map(([value, label]) =>
      h('button', { class: 'chip', type: 'button', 'aria-pressed': String(estado === value), onclick: () => { estado = value; drawFilter(); load(); } }, label)));
  }

  async function load() {
    render(list, loadingState());
    try {
      const { peliculas } = (await peliculasApi.listAdmin(estado)).data;
      if (!peliculas.length) { render(list, emptyState('Sin títulos', estado ? `No hay títulos en estado "${estado}".` : 'Todavía no hay títulos.')); return; }
      render(list, h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, ['Título', 'Tipo', 'Categoría', 'Estado', 'Nota', 'Acciones'].map((t) => h('th', {}, t)))),
        h('tbody', {}, peliculas.map(row)))));
    } catch (error) { render(list, errorState(error.message, load)); }
  }

  function row(p) {
    const img = safeImageUrl(p.imagen_url);
    const act = (label, ico, cls, fn) => h('button', { class: `btn btn-sm ${cls}`, type: 'button', 'aria-label': `${label}: ${p.titulo}`, title: label, onclick: fn }, icon(ico, 14), label);
    return h('tr', {},
      h('td', {}, h('div', { class: 'cell-title' }, h('div', { class: 'thumb' }, img && h('img', { src: img, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer', onerror: (e) => e.target.remove() })),
        h('div', {}, p.estado === 'aprobada' ? h('a', { href: `pelicula.html?id=${p.id}` }, h('strong', {}, p.titulo)) : h('strong', {}, p.titulo),
          h('div', {}, h('small', { class: 'muted' }, `${p.anio} · por ${p.creador_nombre || '—'} · ${formatDate(p.fecha_creacion)}`))))),
      h('td', {}, tipoLabel(p.tipo)), h('td', {}, p.categoria_nombre || '—'),
      h('td', {}, h('span', { class: `tag ${ESTADO_TAG[p.estado] || 'tag-muted'}` }, p.estado)),
      h('td', {}, p.estado === 'aprobada' ? formatScore(p.promedio_calificacion) : '—'),
      h('td', {}, h('div', { class: 'actions' },
        p.estado !== 'aprobada' && act('Aprobar', 'check', 'btn-secondary', () => setEstado(p, 'aprobada')),
        p.estado !== 'rechazada' && act('Rechazar', 'close', 'btn-danger', () => setEstado(p, 'rechazada')),
        act('Editar', 'edit', 'btn-ghost', () => editTitle(p)),
        act('Eliminar', 'trash', 'btn-danger', () => removeTitle(p)))));
  }

  async function setEstado(p, nuevo) {
    try { await peliculasApi.setEstado(p.id, nuevo); toastSuccess(`"${p.titulo}" ${nuevo}.`); load(); } catch (error) { toastError(error.message); }
  }
  async function removeTitle(p) {
    if (!await confirmDialog({ title: 'Eliminar título', message: `Se eliminará "${p.titulo}" junto con sus reseñas. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', danger: true })) return;
    try { await peliculasApi.remove(p.id); toastSuccess('Título eliminado.'); load(); } catch (error) { toastError(error.message); }
  }
  async function editTitle(p) {
    const holder = h('div', {}, loadingState());
    const modal = openModal({ title: 'Editar título', content: holder });
    const form = await buildTitleForm({ initial: p, submitLabel: 'Guardar cambios', onSubmit: (body) => peliculasApi.update(p.id, body),
      onDone: () => { modal.close(); toastSuccess('Título actualizado.'); load(); } });
    render(holder, form);
  }
}

/* ---------------------------- Categories ---------------------------- */
async function showCategories(panel) {
  const list = h('div', {});
  render(panel, h('div', { class: 'toolbar' }, h('h2', {}, 'Categorías'),
    h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => categoryModal() }, icon('plus', 14), 'Nueva categoría')), list);
  load();

  async function load() {
    render(list, loadingState());
    try {
      const { categorias } = (await categoriasApi.list()).data;
      if (!categorias.length) { render(list, emptyState('Sin categorías', 'Crea la primera para que los usuarios puedan proponer títulos.')); return; }
      render(list, h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, ['Nombre', 'Descripción', 'Acciones'].map((t) => h('th', {}, t)))),
        h('tbody', {}, categorias.map((c) => h('tr', {},
          h('td', {}, h('strong', {}, c.nombre)), h('td', { class: 'muted' }, c.descripcion || '—'),
          h('td', {}, h('div', { class: 'actions' },
            h('button', { class: 'btn btn-ghost btn-sm', type: 'button', 'aria-label': `Editar ${c.nombre}`, onclick: () => categoryModal(c) }, icon('edit', 14), 'Editar'),
            h('button', { class: 'btn btn-danger btn-sm', type: 'button', 'aria-label': `Eliminar ${c.nombre}`, onclick: () => removeCategory(c) }, icon('trash', 14), 'Eliminar')))))))));
    } catch (error) { render(list, errorState(error.message, load)); }
  }

  function categoryModal(cat) {
    const form = h('form', { class: 'form', novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form));
      const body = { nombre: d.nombre.trim(), descripcion: d.descripcion.trim() || undefined };
      try {
        await withBusy(form.querySelector('button[type=submit]'), () => (cat ? categoriasApi.update(cat.id, body) : categoriasApi.create(body)));
        modal.close(); toastSuccess(cat ? 'Categoría actualizada.' : 'Categoría creada.'); load();
      } catch (error) { showFormError(form, error); }
    } },
      field({ label: 'Nombre', name: 'nombre', value: cat?.nombre || '', maxLength: 50 }),
      field({ label: 'Descripción (opcional)', name: 'descripcion', type: 'textarea', required: false, value: cat?.descripcion || '', maxLength: 255 }),
      h('button', { class: 'btn btn-primary', type: 'submit' }, cat ? 'Guardar cambios' : 'Crear categoría'));
    const modal = openModal({ title: cat ? 'Editar categoría' : 'Nueva categoría', content: form });
  }

  async function removeCategory(c) {
    if (!await confirmDialog({ title: 'Eliminar categoría', message: `¿Eliminar "${c.nombre}"? No es posible si tiene títulos asociados.`, confirmLabel: 'Eliminar', danger: true })) return;
    try { await categoriasApi.remove(c.id); toastSuccess('Categoría eliminada.'); load(); } catch (error) { toastError(error.message); }
  }
}

/* ------------------------------- Users ------------------------------- */
async function showUsers(panel) {
  const list = h('div', {});
  render(panel, list);
  load();
  async function load() {
    render(list, loadingState());
    try {
      const { usuarios } = (await usuariosApi.list()).data;
      render(list, h('div', { class: 'table-wrap' }, h('table', { class: 'table' },
        h('thead', {}, h('tr', {}, ['Nombre', 'Correo', 'Rol', 'Registro', 'Acciones'].map((t) => h('th', {}, t)))),
        h('tbody', {}, usuarios.map((u) => {
          const self = u.id === session.user.id;
          return h('tr', {},
            h('td', {}, h('strong', {}, u.nombre), self && h('small', { class: 'muted' }, ' (tú)')), h('td', {}, u.correo),
            h('td', {}, h('span', { class: `tag ${u.rol === 'administrador' ? 'tag-orange' : 'tag-muted'}` }, u.rol)),
            h('td', { class: 'muted' }, formatDate(u.fecha_creacion)),
            h('td', {}, h('div', { class: 'actions' }, h('button', { class: 'btn btn-danger btn-sm', type: 'button', disabled: self || undefined,
              title: self ? 'No puedes eliminar tu propia cuenta desde aquí' : 'Eliminar usuario', 'aria-label': `Eliminar ${u.nombre}`, onclick: () => removeUser(u) }, icon('trash', 14), 'Eliminar'))));
        })))));
    } catch (error) { render(list, errorState(error.message, load)); }
  }
  async function removeUser(u) {
    if (!await confirmDialog({ title: 'Eliminar usuario', message: `Se eliminará a ${u.nombre} (${u.correo}) y sus reseñas. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', danger: true })) return;
    try { await usuariosApi.remove(u.id); toastSuccess('Usuario eliminado.'); load(); } catch (error) { toastError(error.message); }
  }
}
