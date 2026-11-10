import { h, $, render } from './dom.js';
import { icon } from './icons.js';

/* ---------- Toasts ---------- */
function toastRoot() {
  let root = $('#toasts');
  if (!root) {
    root = h('div', { id: 'toasts', class: 'toasts', role: 'status', 'aria-live': 'polite' });
    document.body.append(root);
  }
  return root;
}

export function toast(message, type = 'info', duration = 4200) {
  const el = h('div', { class: `toast ${type}` }, h('p', {}, message));
  toastRoot().append(el);
  setTimeout(() => el.remove(), duration);
}
export const toastSuccess = (m) => toast(m, 'success');
export const toastError = (m) => toast(m, 'error', 6000);

/* ---------- Modal ---------- */
export function openModal({ title, content, onClose }) {
  const previous = document.activeElement;
  const close = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
    document.body.style.overflow = '';
    previous?.focus?.();
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Cerrar', onclick: close }, icon('close'));
  const backdrop = h('div', { class: 'modal-backdrop', onmousedown: (e) => { if (e.target === backdrop) close(); } },
    h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
      h('div', { class: 'modal-head' }, h('h2', {}, title), closeBtn),
      content));
  document.body.append(backdrop);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKey);
  (backdrop.querySelector('input, select, textarea, button.btn') || closeBtn).focus();
  return { close };
}

export function confirmDialog({ title, message, confirmLabel = 'Confirmar', danger = false }) {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (value) => { if (!settled) { settled = true; resolve(value); } };
    const modal = openModal({
      title,
      onClose: () => settle(false),
      content: h('div', {},
        h('p', { class: 'lead' }, message),
        h('div', { class: 'form-actions' },
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: () => { settle(false); modal.close(); } }, 'Cancelar'),
          h('button', { class: `btn ${danger ? 'btn-danger' : 'btn-primary'}`, type: 'button', onclick: () => { settle(true); modal.close(); } }, confirmLabel)))
    });
  });
}

/* ---------- Loading / empty / error states ---------- */
export function loadingState(label = 'Cargando...') {
  return h('div', { class: 'state', role: 'status' }, h('div', { class: 'spinner' }), h('p', {}, label));
}

export function emptyState(title, text, action) {
  return h('div', { class: 'state' }, icon('film', 40), h('h3', {}, title), text && h('p', {}, text), action);
}

export function errorState(message, onRetry) {
  return h('div', { class: 'state', role: 'alert' },
    h('h3', {}, 'Algo salió mal'), h('p', {}, message),
    onRetry && h('button', { class: 'btn btn-ghost', type: 'button', onclick: onRetry }, 'Reintentar'));
}

export function skeletonGrid(count = 8) {
  return h('div', { class: 'grid-cards', 'aria-hidden': 'true' },
    Array.from({ length: count }, () => h('div', { class: 'skeleton card' })));
}

/* ---------- Forms ---------- */
export function clearFormErrors(form) {
  form.querySelectorAll('.field.invalid').forEach((f) => f.classList.remove('invalid'));
  form.querySelectorAll('.field-error').forEach((e) => e.remove());
  form.querySelector('.form-error')?.remove();
}

// Shows API validation details (campo/mensaje) under each field, plus a general banner.
export function showFormError(form, error) {
  clearFormErrors(form);
  const unmatched = [];
  for (const detail of error.details || []) {
    const input = form.elements[detail.campo];
    const field = input?.closest?.('.field');
    if (field) {
      if (field.classList.contains('invalid')) continue; // one message per field is enough
      field.classList.add('invalid');
      field.append(h('p', { class: 'field-error', role: 'alert' }, detail.mensaje));
    } else {
      unmatched.push(detail.mensaje);
    }
  }
  const text = [error.message, ...unmatched].filter(Boolean).join(' ');
  form.prepend(h('div', { class: 'form-error', role: 'alert' }, text));
  form.querySelector('.field.invalid input, .field.invalid select, .field.invalid textarea')?.focus();
}

// Disables the submit button and shows a spinner while the task runs.
export async function withBusy(button, task) {
  const label = button.textContent;
  button.disabled = true;
  render(button, h('span', { class: 'spinner' }), label);
  try {
    return await task();
  } finally {
    button.disabled = false;
    render(button, label);
  }
}

export function field({ label, name, type = 'text', placeholder, required = true, value = '', hint, autocomplete, ...rest }) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
  const control = type === 'textarea'
    ? h('textarea', { class: 'textarea', id, name, placeholder, required, value, ...rest })
    : h('input', { class: 'input', id, name, type, placeholder, required, value, autocomplete, ...rest });
  return h('div', { class: 'field' }, h('label', { for: id }, label), control, hint && h('p', { class: 'hint' }, hint));
}

export function selectField({ label, name, options, value = '', required = false, placeholder }) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 7)}`;
  const select = h('select', { class: 'select', id, name, required },
    placeholder !== undefined && h('option', { value: '' }, placeholder),
    options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value) }, o.label)));
  return h('div', { class: 'field' }, h('label', { for: id }, label), select);
}
