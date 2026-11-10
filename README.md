# KarenFlix Frontend

Web interface for the KarenFlix platform: reviews and rankings of movies, series and anime.
It consumes the REST API of the `karenFlix-backend` repository (`/api/v1`).

Built with **HTML5, CSS3 and vanilla JavaScript (ES modules)**. No frameworks, no build step, no dependencies.

## Features

| Area | What it does |
| --- | --- |
| Catalog (`index.html`) | Featured #1 title, search, filters by type / category, sorting (recent, ranking, popularity), shareable URL filters |
| Detail (`pelicula.html`) | Title info, reviews, create / edit / delete own review, like / dislike |
| Ranking (`ranking.html`) | Top list by weighted score or popularity, by category, top 10-100 |
| Auth (`login.html`, `register.html`) | Registration and login with API validation messages shown per field |
| My activity (`perfil.html`) | Proposed titles with status, own reviews, action history with filters, propose a title |
| Admin panel (`admin.html`) | Stats, approve / reject / edit / delete titles, categories CRUD, list / delete users |

**Admin experience:** when an administrator logs in they are sent straight to the admin panel, and the
"Panel admin" link only appears for that role. This is a UI convenience only: the backend enforces roles
(`401` / `403`) on every protected route.

## Project structure

```
├── index.html, login.html, register.html, pelicula.html,
│   ranking.html, perfil.html, admin.html     # one HTML shell per page
├── assets/                                   # favicon
├── css/
│   ├── tokens.css                            # palette + design tokens (CSS variables)
│   ├── base.css                              # reset and typography
│   ├── layout.css                            # navbar, grids, footer, responsive layout
│   ├── components.css                        # buttons, forms, cards, tables, modal, toasts...
│   └── pages.css                             # page-specific styles
└── js/
    ├── config.js                             # API URL, storage keys, enums
    ├── core/                                 # dom, http (fetch wrapper), session, guards, ui, format, icons
    ├── api/                                  # one module per backend resource
    ├── components/                           # navbar/footer, movie card, shared title form
    └── pages/                                # one entry module per page
```

Data flow: `pages` → `api` → `core/http` (adds `Authorization: Bearer <token>`, normalizes errors).

## Run locally

1. Start the backend (see its README). Default: `http://localhost:3000`.
2. Serve this folder with any static server. ES modules do not work from `file://`.

```bash
python3 -m http.server 5500
```

3. Open `http://localhost:5500`.

### Configuration

- **API URL:** edit `API_BASE_URL` in [`js/config.js`](js/config.js).
- **CORS:** the backend only accepts browser requests from the origin set in its `CORS_ORIGIN`
  variable. Serve the frontend on that origin (the backend `.env` used while developing allows
  `http://localhost:5500`).
- **First administrator:** the public registration never grants the admin role; it is assigned
  manually in the database (see the backend docs).

## Design

Colors come from the project palette (`css/tokens.css`): dark backgrounds `#1E1F24` / `#25262C`,
orange `#FF5A36` for primary actions and the active menu, purple `#615DEC` for type tags, blue `#4F80FF`
for secondary actions, cyan `#39C3D2` for categories. Responsive from phones to desktop, keyboard
focus rings, `aria-*` labels, and `prefers-reduced-motion` support.

## Security notes

- All API text is rendered with `textContent`; there is no `innerHTML` with user data (prevents XSS).
- Post-login redirects (`?next=`) only accept same-site `*.html` paths.
- Image URLs are only used if they are `http(s)`.
- The JWT is stored in `localStorage`. This fits a pure static frontend, but any XSS could read it.
