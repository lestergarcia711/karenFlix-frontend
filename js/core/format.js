import { TIPO_LABELS } from '../config.js';

// Decimals from the API can arrive as strings ("9.00"); always convert with Number().
export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const formatScore = (value) => toNumber(value).toFixed(1);

export const tipoLabel = (tipo) => TIPO_LABELS[tipo] || tipo || '';

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function timeAgo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  const units = [['año', 31536000], ['mes', 2592000], ['día', 86400], ['hora', 3600], ['min', 60]];
  for (const [label, size] of units) {
    const amount = Math.floor(seconds / size);
    if (amount >= 1) {
      const plural = label === 'mes' ? 'meses' : label === 'min' ? 'min' : `${label}s`;
      return `hace ${amount} ${amount === 1 ? label : plural}`;
    }
  }
  return 'hace un momento';
}

export const initial = (name = '') => (name.trim()[0] || '?').toUpperCase();

// Only allow http(s) image URLs coming from the API.
export function safeImageUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}
