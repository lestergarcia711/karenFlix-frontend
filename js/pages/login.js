import { h, render, $ } from '../core/dom.js';
import { authApi } from '../api/auth.api.js';
import { session } from '../core/session.js';
import { redirectIfAuthenticated, safeNext } from '../core/guards.js';
import { mountShell } from '../components/navbar.js';
import { field, showFormError, withBusy, toast } from '../core/ui.js';

if (!redirectIfAuthenticated()) init();

function init() {
  mountShell();
  const params = new URLSearchParams(location.search);
  const form = h('form', { class: 'form', novalidate: true, onsubmit: onSubmit },
    field({ label: 'Correo electrónico', name: 'correo', type: 'email', placeholder: 'tu@correo.com', autocomplete: 'email' }),
    field({ label: 'Contraseña', name: 'contrasena', type: 'password', placeholder: '••••••••', autocomplete: 'current-password' }),
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Iniciar sesión'));

  render($('#app'),
    h('div', { class: 'auth-wrap' },
      h('section', { class: 'auth-card' },
        h('h1', {}, 'Bienvenido de nuevo'),
        h('p', {}, 'Ingresa para reseñar, reaccionar y proponer títulos.'),
        form,
        h('p', { class: 'auth-alt' }, '¿Aún no tienes cuenta? ', h('a', { href: 'register.html' }, 'Regístrate')))));

  if (params.get('expired')) toast('Tu sesión expiró. Inicia sesión nuevamente.', 'error');
  if (params.get('bye')) toast('Sesión cerrada correctamente.', 'success');
  if (params.get('registered')) toast('Cuenta creada. Ya puedes iniciar sesión.', 'success');

  async function onSubmit(e) {
    e.preventDefault();
    const button = form.querySelector('button[type=submit]');
    const data = Object.fromEntries(new FormData(form));
    try {
      const res = await withBusy(button, () => authApi.login({ correo: data.correo.trim(), contrasena: data.contrasena }));
      session.start(res.data);
      // Administrators land on their panel; users return to where they came from.
      location.replace(session.isAdmin ? 'admin.html' : (safeNext(params.get('next')) || 'index.html'));
    } catch (error) {
      showFormError(form, error);
    }
  }
}
