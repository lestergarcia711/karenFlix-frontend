// Every title gets its own pair of palette accents (derived from its id), so cards, posters
// and carousel slides are colorful and varied instead of one static color. Only palette colors are used.
const ACCENTS = ['--accent-orange', '--accent-purple', '--accent-blue', '--accent-cyan'];

export function accentFor(pelicula) {
  const seed = Number(pelicula?.id) || 0;
  const first = ACCENTS[seed % ACCENTS.length];
  const second = ACCENTS[(seed + 1 + (seed % 3)) % ACCENTS.length];
  return { first, second: second === first ? ACCENTS[(seed + 2) % ACCENTS.length] : second };
}

// Inline custom properties consumed by .card-movie, .poster and the carousel.
export function accentStyle(pelicula) {
  const { first, second } = accentFor(pelicula);
  return `--c1: var(${first}); --c2: var(${second});`;
}
