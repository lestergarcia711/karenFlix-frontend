import { h, render } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { session } from '../core/session.js';
import { initial } from '../core/format.js';

const LINKS = [
  { href: 'index.html', label: 'Catálogo', id: 'home' },
  { href: 'ranking.html', label: 'Ranking', id: 'ranking' }
];

export function mountNavbar(active) {
  const host = document.getElementById('site-header');
  const user = session.user;
  const authed = session.isAuthenticated;

  const links = [...LINKS];
  if (authed) links.push({ href: 'perfil.html', label: 'Mi actividad', id: 'profile' });
  if (session.isAdmin) links.push({ href: 'admin.html', label: 'Panel admin', id: 'admin' });

  const nav = h('header', { class: 'navbar' },
    h('div', { class: 'container navbar-inner' },
      h('a', { class: 'brand', href: session.homePath, 'aria-label': 'KarenFlix, inicio' },
        h('span', { class: 'brand-mark' }, icon('play', 16)),
        h('span', {}, 'Karen', h('em', {}, 'Flix'))),
      h('nav', { class: 'nav-links', id: 'nav-links', 'aria-label': 'Principal' },
        links.map((l) => h('a', { class: `nav-link${l.id === active ? ' active' : ''}`, href: l.href, 'aria-current': l.id === active ? 'page' : null }, l.label))),
      h('div', { class: 'nav-actions' },
        authed
          ? [
              h('div', { class: 'user-chip', title: user.correo || '' },
                h('span', { class: 'avatar' }, initial(user.nombre)),
                h('div', {}, h('strong', {}, user.nombre), h('small', {}, session.isAdmin ? 'Administrador' : 'Usuario'))),
              h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Cerrar sesión', title: 'Cerrar sesión', onclick: logout }, icon('logout'))
            ]
          : [
              h('a', { class: 'btn btn-ghost btn-sm', href: 'login.html' }, 'Ingresar'),
              h('a', { class: 'btn btn-primary btn-sm', href: 'register.html' }, 'Registrarse')
            ],
        h('button', {
          class: 'icon-btn nav-toggle', type: 'button', 'aria-label': 'Abrir menú', 'aria-expanded': 'false', 'aria-controls': 'nav-links',
          onclick: (e) => {
            const open = nav.classList.toggle('open');
            e.currentTarget.setAttribute('aria-expanded', String(open));
          }
        }, icon('menu')))));
  render(host, nav);
}

function logout() {
  session.clear();
  location.href = 'login.html?bye=1';
}

export function mountFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  render(host, h('footer', { class: 'footer' },
    h('div', { class: 'container' },
      h('span', {}, `© ${new Date().getFullYear()} KarenFlix`),
      h('span', {}, 'Reseñas y ranking de películas, series y anime'))));
}

export function mountShell(active) {
  mountNavbar(active);
  mountFooter();
}
