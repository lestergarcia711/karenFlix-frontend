import { h, render, $ } from '../core/dom.js';
import { authApi } from '../api/auth.api.js';
import { session } from '../core/session.js';
import { redirectIfAuthenticated } from '../core/guards.js';
import { mountShell } from '../components/navbar.js';
import { field, showFormError, withBusy } from '../core/ui.js';

if (!redirectIfAuthenticated()) init();

function init() {
  mountShell();
  const form = h('form', { class: 'form', novalidate: true, onsubmit: onSubmit },
    field({ label: 'Nombre', name: 'nombre', placeholder: 'Karen López', autocomplete: 'name', hint: 'Entre 2 y 60 caracteres.' }),
    field({ label: 'Correo electrónico', name: 'correo', type: 'email', placeholder: 'tu@correo.com', autocomplete: 'email' }),
    field({ label: 'Contraseña', name: 'contrasena', type: 'password', placeholder: 'Mínimo 6 caracteres', autocomplete: 'new-password', hint: 'Entre 6 y 100 caracteres.' }),
    field({ label: 'Confirmar contraseña', name: 'confirmar', type: 'password', placeholder: 'Repite tu contraseña', autocomplete: 'new-password' }),
    h('button', { class: 'btn btn-primary btn-block', type: 'submit' }, 'Crear cuenta'));

  render($('#app'),
    h('div', { class: 'auth-wrap' },
      h('section', { class: 'auth-card' },
        h('h1', {}, 'Crea tu cuenta'),
        h('p', {}, 'Únete para opinar sobre tus títulos favoritos.'),
        form,
        h('p', { class: 'auth-alt' }, '¿Ya tienes cuenta? ', h('a', { href: 'login.html' }, 'Inicia sesión')))));

  async function onSubmit(e) {
    e.preventDefault();
    const button = form.querySelector('button[type=submit]');
    const data = Object.fromEntries(new FormData(form));
    if (data.contrasena !== data.confirmar) {
      showFormError(form, { message: 'Corrige los datos indicados.', details: [{ campo: 'confirmar', mensaje: 'Las contraseñas no coinciden.' }] });
      return;
    }
    try {
      const res = await withBusy(button, () => authApi.register({ nombre: data.nombre.trim(), correo: data.correo.trim(), contrasena: data.contrasena }));
      // The API returns a token on register; the user is signed in right away.
      if (res.data?.token && res.data?.usuario) {
        session.start(res.data);
        location.replace(session.homePath);
      } else {
        location.replace('login.html?registered=1');
      }
    } catch (error) {
      showFormError(form, error);
    }
  }
}
