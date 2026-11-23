import { h } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { accentStyle } from '../core/accent.js';
import { safeImageUrl, tipoLabel } from '../core/format.js';
import { poster, ratingBadge } from './movieCard.js';

const AUTOPLAY_MS = 6500;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Accessible, swipeable carousel. Autoplay pauses on hover/focus and is off with reduced motion.
export function createCarousel(items) {
  let index = 0;
  let timer = null;
  let paused = reducedMotion(); // user-controlled pause
  let hovering = false;

  const slides = items.map(slide);
  const track = h('div', { class: 'carousel-track' }, slides);
  const dots = items.map((p, i) => h('button', { class: 'carousel-dot', type: 'button', 'aria-label': `Ir a ${p.titulo}`, onclick: () => go(i, true) }));
  const progress = h('span', { class: 'carousel-progress' });
  const toggle = h('button', { class: 'icon-btn', type: 'button', onclick: () => { paused = !paused; sync(); } });

  const root = h('section', { class: 'carousel', 'aria-roledescription': 'carousel', 'aria-label': 'Títulos destacados', tabIndex: 0 },
    track,
    h('div', { class: 'carousel-controls' },
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Anterior', onclick: () => go(index - 1, true) }, icon('prev')),
      h('div', { class: 'carousel-dots' }, dots),
      h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Siguiente', onclick: () => go(index + 1, true) }, icon('next')),
      toggle),
    progress);

  root.addEventListener('mouseenter', () => { hovering = true; schedule(); });
  root.addEventListener('mouseleave', () => { hovering = false; schedule(); });
  root.addEventListener('focusin', () => { hovering = true; schedule(); });
  root.addEventListener('focusout', () => { hovering = false; schedule(); });
  root.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(index - 1, true);
    if (e.key === 'ArrowRight') go(index + 1, true);
  });

  // Swipe on touch screens
  let startX = null;
  track.addEventListener('pointerdown', (e) => { startX = e.clientX; });
  track.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 45) go(index + (dx < 0 ? 1 : -1), true);
  });
  document.addEventListener('visibilitychange', schedule);

  function go(i, user = false) {
    index = (i + items.length) % items.length;
    sync();
    if (user) schedule();
  }

  function sync() {
    track.style.transform = `translateX(-${index * 100}%)`;
    slides.forEach((s, i) => { s.setAttribute('aria-hidden', String(i !== index)); s.inert = i !== index; });
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    root.style.setProperty('--slide-ms', `${AUTOPLAY_MS}ms`);
    toggle.setAttribute('aria-label', paused ? 'Reanudar reproducción automática' : 'Pausar reproducción automática');
    toggle.replaceChildren(icon(paused ? 'play' : 'pause', 16));
    schedule();
  }

  function schedule() {
    clearTimeout(timer);
    // Restart the progress bar animation
    progress.classList.remove('run');
    void progress.offsetWidth;
    const running = !paused && !hovering && !document.hidden && items.length > 1;
    if (!running) return;
    progress.classList.add('run');
    timer = setTimeout(() => go(index + 1), AUTOPLAY_MS);
  }

  sync();
  return root;
}

function slide(p, i, all) {
  const img = safeImageUrl(p.imagen_url);
  return h('article', { class: 'carousel-slide', style: accentStyle(p), role: 'group', 'aria-roledescription': 'slide', 'aria-label': `${i + 1} de ${all.length}` },
    img && h('div', { class: 'slide-bg', style: `background-image:url("${img.replace(/"/g, '%22')}")` }),
    h('div', { class: 'slide-copy' },
      h('div', { class: 'hero-tags' },
        h('span', { class: 'tag slide-tag' }, `Nº ${p.posicion ?? i + 1} del ranking`),
        h('span', { class: 'tag tag-muted' }, tipoLabel(p.tipo)),
        p.categoria_nombre && h('span', { class: 'tag tag-muted' }, p.categoria_nombre)),
      h('h2', { class: 'slide-title' }, p.titulo),
      h('div', { class: 'meta-row' }, ratingBadge(p), h('span', {}, p.anio)),
      p.descripcion && h('p', { class: 'slide-desc' }, p.descripcion),
      h('div', { class: 'hero-actions' },
        h('a', { class: 'btn btn-primary', href: `pelicula.html?id=${encodeURIComponent(p.id)}` }, icon('play', 16), 'Ver detalle'),
        h('a', { class: 'btn btn-ghost', href: 'ranking.html' }, 'Ver ranking'))),
    h('a', { class: 'slide-art', href: `pelicula.html?id=${encodeURIComponent(p.id)}`, tabIndex: -1, 'aria-hidden': 'true' }, poster(p)));
}
