import { h } from '../core/dom.js';
import { TIPOS } from '../config.js';
import { tipoLabel } from '../core/format.js';
import { categoriasApi } from '../api/categorias.api.js';
import { field, selectField, showFormError, withBusy } from '../core/ui.js';

// Shared by "propose a title" (users) and "edit title" (admin). `onSubmit(body)` does the API call.
export async function buildTitleForm({ initial = {}, submitLabel, onSubmit, onDone }) {
  let categorias = [];
  try { categorias = (await categoriasApi.list()).data.categorias; } catch { /* handled below */ }

  const form = h('form', { class: 'form', novalidate: true, onsubmit: submit },
    field({ label: 'Título', name: 'titulo', value: initial.titulo || '', placeholder: 'Nombre del título', maxLength: 150 }),
    h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:12px' },
      selectField({ label: 'Tipo', name: 'tipo', required: true, value: initial.tipo || 'pelicula', options: TIPOS.map((t) => ({ value: t, label: tipoLabel(t) })) }),
      field({ label: 'Año', name: 'anio', type: 'number', value: initial.anio || '', placeholder: '2024', min: 1888, max: 2100 })),
    selectField({ label: 'Categoría', name: 'categoria_id', required: true, value: initial.categoria_id || '', placeholder: 'Selecciona una categoría',
      options: categorias.map((c) => ({ value: c.id, label: c.nombre })) }),
    field({ label: 'Descripción', name: 'descripcion', type: 'textarea', value: initial.descripcion || '', placeholder: 'De qué trata' }),
    field({ label: 'URL de la imagen (opcional)', name: 'imagen_url', type: 'url', required: false, value: initial.imagen_url || '', placeholder: 'https://...', hint: 'Debe ser una URL válida de imagen.' }),
    h('button', { class: 'btn btn-primary', type: 'submit' }, submitLabel));

  if (!categorias.length) {
    form.prepend(h('div', { class: 'form-error' }, 'No hay categorías disponibles todavía. Un administrador debe crearlas primero.'));
  }

  async function submit(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const body = {
      titulo: d.titulo.trim(), descripcion: d.descripcion.trim(), tipo: d.tipo,
      categoria_id: d.categoria_id ? Number(d.categoria_id) : undefined,
      anio: d.anio ? Number(d.anio) : undefined,
      imagen_url: d.imagen_url.trim() || undefined
    };
    try {
      await withBusy(form.querySelector('button[type=submit]'), () => onSubmit(body));
      onDone?.(form);
    } catch (error) { showFormError(form, error); }
  }
  return form;
}
