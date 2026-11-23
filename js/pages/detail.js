import { h, render, $ } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { formatDate, initial, timeAgo, tipoLabel, toNumber, formatScore } from '../core/format.js';
import { peliculasApi } from '../api/peliculas.api.js';
import { resenasApi } from '../api/resenas.api.js';
import { session } from '../core/session.js';
import { mountShell } from '../components/navbar.js';
import { poster, ratingBadge } from '../components/movieCard.js';
import { confirmDialog, emptyState, errorState, field, loadingState, selectField, showFormError, toastError, toastSuccess, withBusy } from '../core/ui.js';

mountShell();
const app = $('#app');
const id = new URLSearchParams(location.search).get('id');

if (!/^\d+$/.test(id || '')) {
  render(app, errorState('El enlace no es válido: falta el identificador del título.'));
} else {
  load();
}

async function load({ scroll = false } = {}) {
  if (!app.children.length) render(app, loadingState('Cargando título...'));
  try {
    const { data } = await peliculasApi.detail(id);
    document.title = `${data.pelicula.titulo} · KarenFlix`;
    draw(data.pelicula, data.resenas);
    if (scroll) $('#reviews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    // The API answers 404 for missing or not-yet-approved titles.
    render(app, error.status === 404
      ? emptyState('Título no encontrado', 'Puede que no exista o que aún esté pendiente de aprobación.', h('a', { class: 'btn btn-primary', href: 'index.html' }, 'Volver al catálogo'))
      : errorState(error.message, () => load()));
  }
}

function draw(p, resenas) {
  const me = session.user;
  const mine = me ? resenas.find((r) => r.usuario_id === me.id) : null;
  render(app,
    h('a', { class: 'muted', href: 'index.html' }, '← Volver al catálogo'),
    h('section', { class: 'detail section' },
      poster(p),
      h('div', { class: 'detail-info' },
        h('div', { class: 'hero-tags' }, h('span', { class: 'tag tag-purple' }, tipoLabel(p.tipo)),
          p.categoria_nombre && h('span', { class: 'tag tag-cyan' }, p.categoria_nombre)),
        h('h1', {}, p.titulo),
        h('div', { class: 'meta-row' },
          h('span', { class: 'score-big' }, icon('star', 28), formatScore(p.promedio_calificacion), h('small', {}, `/ 10 · ${toNumber(p.total_resenas)} reseña(s)`)),
          h('span', {}, p.anio), p.creador_nombre && h('span', {}, `Propuesto por ${p.creador_nombre}`)),
        h('p', { class: 'desc' }, p.descripcion),
        h('div', { class: 'hero-actions' },
          h('a', { class: 'btn btn-primary', href: '#reviews' }, 'Ver reseñas'),
          !me && h('a', { class: 'btn btn-secondary', href: `login.html?next=${encodeURIComponent(`pelicula.html?id=${id}`)}` }, 'Inicia sesión para reseñar')))),
    h('div', { class: 'two-col section', id: 'reviews' },
      h('section', { class: 'panel' },
        h('div', { class: 'panel-title' }, h('h2', {}, `Reseñas (${resenas.length})`)),
        resenas.length
          ? h('div', {}, resenas.map((r) => reviewItem(r, me)))
          : emptyState('Aún no hay reseñas', 'Sé la primera persona en opinar.')),
      me ? reviewForm(p, mine) : h('aside', { class: 'panel' }, h('h3', {}, 'Comparte tu opinión'),
        h('p', { class: 'muted' }, 'Necesitas una cuenta para escribir reseñas y reaccionar.'),
        h('div', { class: 'hero-actions', style: 'margin-top:16px' }, h('a', { class: 'btn btn-primary btn-sm', href: 'register.html' }, 'Crear cuenta')))));
}

function reviewItem(r, me) {
  const own = me && r.usuario_id === me.id;
  const likeBtn = reactButton('like', r, own, me);
  const dislikeBtn = reactButton('dislike', r, own, me);
  return h('article', { class: 'review' },
    h('div', { class: 'review-head' },
      h('span', { class: 'avatar' }, initial(r.autor_nombre)),
      h('div', { class: 'grow' }, h('strong', {}, r.autor_nombre, own && ' (tú)'), h('small', {}, timeAgo(r.fecha_creacion), toNumber(new Date(r.fecha_actualizacion)) > toNumber(new Date(r.fecha_creacion)) + 1000 ? ' · editada' : '')),
      h('span', { class: 'score-pill', title: 'Calificación' }, `${r.calificacion}/10`)),
    h('h4', {}, r.titulo),
    h('p', {}, r.comentario),
    h('div', { class: 'review-actions' }, likeBtn, dislikeBtn,
      own && h('button', { class: 'btn btn-danger btn-sm', type: 'button', style: 'margin-left:auto', onclick: () => removeReview(r) }, icon('trash', 14), 'Eliminar')));
}

function reactButton(tipo, r, own, me) {
  const count = tipo === 'like' ? r.total_likes : r.total_dislikes;
  const label = tipo === 'like' ? 'Me gusta' : 'No me gusta';
  const btn = h('button', {
    class: `react-btn ${tipo}`, type: 'button', 'aria-label': `${label} (${count})`,
    disabled: own || undefined,
    title: own ? 'No puedes reaccionar a tu propia reseña' : (me ? label : 'Inicia sesión para reaccionar'),
    onclick: async () => {
      if (!me) { location.href = `login.html?next=${encodeURIComponent(`pelicula.html?id=${id}`)}`; return; }
      btn.disabled = true;
      try {
        await resenasApi.react(r.id, tipo); // same reaction twice = the API removes it
        await load();
      } catch (error) { toastError(error.message); btn.disabled = false; }
    }
  }, icon(tipo, 15), String(toNumber(count)));
  return btn;
}

async function removeReview(r) {
  const ok = await confirmDialog({ title: 'Eliminar reseña', message: 'Se eliminará tu reseña y se recalculará la calificación del título.', confirmLabel: 'Eliminar', danger: true });
  if (!ok) return;
  try {
    await resenasApi.remove(r.id);
    toastSuccess('Reseña eliminada.');
    await load();
  } catch (error) { toastError(error.message); }
}

function reviewForm(p, mine) {
  const form = h('form', { class: 'form', novalidate: true, onsubmit: onSubmit },
    field({ label: 'Título de la reseña', name: 'titulo', placeholder: 'Resume tu opinión', value: mine?.titulo || '', maxLength: 100 }),
    selectField({ label: 'Calificación', name: 'calificacion', required: true, value: mine?.calificacion ?? '', placeholder: 'Selecciona de 1 a 10',
      options: Array.from({ length: 10 }, (_, i) => ({ value: 10 - i, label: `${10 - i} / 10` })) }),
    field({ label: 'Comentario', name: 'comentario', type: 'textarea', placeholder: '¿Qué te pareció?', value: mine?.comentario || '' }),
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, mine ? 'Guardar cambios' : 'Publicar reseña'));

  async function onSubmit(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const body = { titulo: data.titulo.trim(), comentario: data.comentario.trim(), calificacion: Number(data.calificacion) };
    try {
      await withBusy(form.querySelector('button[type=submit]'), () => (mine ? resenasApi.update(mine.id, body) : resenasApi.create(p.id, body)));
      toastSuccess(mine ? 'Reseña actualizada.' : '¡Reseña publicada!');
      await load({ scroll: true });
    } catch (error) { showFormError(form, error); }
  }

  return h('aside', { class: 'panel' }, h('h3', { style: 'margin-bottom:16px' }, mine ? 'Edita tu reseña' : 'Escribe tu reseña'), form);
}
