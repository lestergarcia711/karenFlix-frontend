import { h, render, $ } from '../core/dom.js';
import { formatDate, formatDateTime, initial, tipoLabel, toNumber, formatScore } from '../core/format.js';
import { usuariosApi } from '../api/usuarios.api.js';
import { peliculasApi } from '../api/peliculas.api.js';
import { session } from '../core/session.js';
import { requireAuth } from '../core/guards.js';
import { mountShell } from '../components/navbar.js';
import { buildTitleForm } from '../components/titleForm.js';
import { emptyState, errorState, loadingState, toastSuccess, selectField } from '../core/ui.js';

if (requireAuth()) init();

const ESTADO_TAG = { pendiente: 'tag-blue', aprobada: 'tag-cyan', rechazada: 'tag-orange' };

function init() {
  mountShell('profile');
  const user = session.user;
  const panel = h('div', {});
  const tabs = [['actividad', 'Mi actividad'], ['historial', 'Historial'], ['proponer', 'Proponer título']];
  const tabBar = h('div', { class: 'tabs', role: 'tablist' });

  render($('#app'),
    h('div', { class: 'profile-head' },
      h('span', { class: 'avatar' }, initial(user.nombre)),
      h('div', {}, h('h1', {}, user.nombre), h('p', { class: 'muted' }, `${user.correo || ''} · ${session.isAdmin ? 'Administrador' : 'Usuario'}`))),
    tabBar, h('div', { class: 'section' }, panel));

  const views = { actividad: showActivity, historial: showHistory, proponer: showPropose };
  function select(key) {
    render(tabBar, tabs.map(([k, label]) => h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(k === key), onclick: () => select(k) }, label)));
    history.replaceState(null, '', `#${key}`);
    views[key](panel);
  }
  select(views[location.hash.slice(1)] ? location.hash.slice(1) : 'actividad');
}

async function showActivity(panel) {
  render(panel, loadingState());
  try {
    const { actividad } = (await usuariosApi.myActivity()).data;
    render(panel, h('div', { class: 'two-col' },
      h('section', { class: 'panel' },
        h('div', { class: 'panel-title' }, h('h2', {}, 'Títulos propuestos'), h('span', { class: 'tag tag-purple' }, actividad.total_peliculas_propuestas)),
        actividad.peliculas_propuestas.length
          ? actividad.peliculas_propuestas.map((p) => h('div', { class: 'list-item' },
              h('div', { class: 'grow' },
                p.estado === 'aprobada' ? h('a', { href: `pelicula.html?id=${p.id}` }, h('strong', {}, p.titulo)) : h('strong', {}, p.titulo),
                h('small', { class: 'muted' }, `${tipoLabel(p.tipo)} · ${formatDate(p.fecha_creacion)}`)),
              h('span', { class: `tag ${ESTADO_TAG[p.estado] || 'tag-muted'}` }, p.estado)))
          : emptyState('Sin propuestas', 'Propón un título y un administrador lo revisará.')),
      h('section', { class: 'panel' },
        h('div', { class: 'panel-title' }, h('h2', {}, 'Mis reseñas'), h('span', { class: 'tag tag-purple' }, actividad.total_resenas_escritas)),
        actividad.resenas_escritas.length
          ? actividad.resenas_escritas.map((r) => h('div', { class: 'list-item' },
              h('div', { class: 'grow' },
                h('a', { href: `pelicula.html?id=${r.pelicula_id}` }, h('strong', {}, r.pelicula_titulo)),
                h('small', { class: 'muted' }, `${r.titulo} · 👍 ${toNumber(r.total_likes)} 👎 ${toNumber(r.total_dislikes)}`)),
              h('span', { class: 'score-pill' }, `${r.calificacion}/10`)))
          : emptyState('Sin reseñas', 'Explora el catálogo y comparte tu opinión.', h('a', { class: 'btn btn-primary', href: 'index.html' }, 'Ir al catálogo')))));
  } catch (error) { render(panel, errorState(error.message, () => showActivity(panel))); }
}

const ACCION_LABEL = { registro: 'Registro', edicion: 'Edición', eliminacion: 'Eliminación' };

async function showHistory(panel) {
  const filters = { tipo_accion: '', orden: 'recientes' };
  const list = h('div', {});
  const refresh = (patch) => { Object.assign(filters, patch); load(); };
  render(panel, h('section', { class: 'panel' },
    h('div', { class: 'panel-title' }, h('h2', {}, 'Historial de acciones')),
    h('div', { class: 'filters-row', style: 'grid-template-columns:1fr 1fr;margin-bottom:20px' },
      selectField({ label: 'Tipo de acción', name: 'tipo_accion', value: '', placeholder: 'Todas',
        options: Object.entries(ACCION_LABEL).map(([value, label]) => ({ value, label })) }),
      selectField({ label: 'Orden', name: 'orden', value: 'recientes', options: [{ value: 'recientes', label: 'Más recientes' }, { value: 'antiguos', label: 'Más antiguos' }] })),
    list));
  panel.querySelector('[name=tipo_accion]').addEventListener('change', (e) => refresh({ tipo_accion: e.target.value }));
  panel.querySelector('[name=orden]').addEventListener('change', (e) => refresh({ orden: e.target.value }));
  load();

  async function load() {
    render(list, loadingState());
    try {
      const { historial } = (await usuariosApi.history(filters)).data;
      render(list, historial.length
        ? h('div', { class: 'timeline' }, historial.map((i) => h('div', { class: 'timeline-item' },
            h('span', { class: `dot ${i.tipo_accion}` }),
            h('div', {}, h('strong', {}, i.descripcion),
              h('div', {}, h('small', {}, `${ACCION_LABEL[i.tipo_accion] || i.tipo_accion} · ${formatDateTime(i.fecha_creacion)}`,
                i.pelicula_titulo ? ` · ${i.pelicula_titulo}` : '', i.calificacion ? ` · ${i.calificacion}/10` : ''))))))
        : emptyState('Sin movimientos', 'Aquí aparecerán tus reseñas creadas, editadas y eliminadas.'));
    } catch (error) { render(list, errorState(error.message, load)); }
  }
}

async function showPropose(panel) {
  render(panel, loadingState());
  const form = await buildTitleForm({
    submitLabel: 'Enviar propuesta',
    onSubmit: (body) => peliculasApi.propose(body),
    onDone: (f) => { f.reset(); toastSuccess('Propuesta enviada. Quedará pendiente hasta que un administrador la revise.'); }
  });
  render(panel, h('section', { class: 'panel', id: 'proponer', style: 'max-width:640px' },
    h('div', { class: 'panel-title' }, h('h2', {}, 'Proponer un título')),
    h('p', { class: 'muted', style: 'margin-bottom:20px' }, 'Tu propuesta se publicará en el catálogo cuando un administrador la apruebe.'),
    form));
}
