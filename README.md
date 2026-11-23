# KarenFlix Frontend

Interfaz web de la plataforma KarenFlix: reseñas y ranking de películas, series y anime.
Consume la API REST del repositorio `karenFlix-backend` (`/api/v1`).

Construido con **HTML5, CSS3 y JavaScript puro (módulos ES)**. Sin frameworks, sin paso de compilación y sin dependencias.

## Funcionalidades

| Área | Qué hace |
| --- | --- |
| Catálogo (`index.html`) | Carrusel con el top del ranking, búsqueda, filtros por tipo y categoría, orden (recientes, ranking, popularidad) y filtros compartibles por URL |
| Detalle (`pelicula.html`) | Información del título, reseñas, crear / editar / eliminar la reseña propia, like / dislike |
| Ranking (`ranking.html`) | Lista por puntaje ponderado o popularidad, por categoría, top 10 a 100 |
| Autenticación (`login.html`, `register.html`) | Registro e inicio de sesión con los mensajes de validación de la API mostrados por campo |
| Mi actividad (`perfil.html`) | Títulos propuestos con su estado, reseñas propias, historial de acciones con filtros y propuesta de títulos |
| Panel admin (`admin.html`) | Estadísticas, aprobar / rechazar / editar / eliminar títulos, CRUD de categorías, listar / eliminar usuarios |

**Experiencia del administrador:** al iniciar sesión, el administrador es enviado directamente al panel
de administración y el enlace "Panel admin" solo aparece para ese rol. Esto es una comodidad de la
interfaz: el backend valida los roles (`401` / `403`) en cada ruta protegida.

## Estructura del proyecto

```
├── index.html, login.html, register.html, pelicula.html,
│   ranking.html, perfil.html, admin.html     # una página HTML por vista
├── assets/                                   # logo (también usado como favicon)
├── css/
│   ├── tokens.css                            # paleta, fuentes y tokens de diseño (variables CSS)
│   ├── base.css                              # reset y tipografía
│   ├── layout.css                            # navbar, grillas, footer y layout responsivo
│   ├── components.css                        # botones, formularios, tarjetas, carrusel, tablas, modal, toasts...
│   └── pages.css                             # estilos específicos de página
└── js/
    ├── config.js                             # URL de la API, claves de storage, enumeraciones
    ├── core/                                 # dom, http (cliente fetch), session, guards, ui, format, icons, accent
    ├── api/                                  # un módulo por recurso del backend
    ├── components/                           # navbar/footer, tarjeta, carrusel, formulario de título
    └── pages/                                # un módulo de entrada por página
```

Flujo de datos: `pages` → `api` → `core/http` (agrega `Authorization: Bearer <token>` y normaliza los errores).

## Ejecutar en local

1. Inicia el backend (ver su README). Por defecto: `http://localhost:3000`.
2. Sirve esta carpeta con cualquier servidor estático. Los módulos ES no funcionan desde `file://`.

```bash
python3 -m http.server 5500
```

3. Abre `http://localhost:5500`.

### Configuración

- **URL de la API:** edita `API_BASE_URL` en [`js/config.js`](js/config.js).
- **CORS:** el backend solo acepta peticiones del navegador desde el origen definido en su variable
  `CORS_ORIGIN`. Sirve el frontend en ese origen (el `.env` del backend usado en desarrollo permite
  `http://localhost:5500`).
- **Primer administrador:** el registro público nunca otorga el rol de administrador; se asigna
  manualmente en la base de datos (ver la documentación del backend).

## Diseño

- **Colores:** salen del logo (`css/tokens.css`): fondos pizarra `#1F252D` / `#272E38`, coral `#FF6B4A`
  para acciones principales y menú activo, rojo `#F03A2E`, ámbar `#FFB400` y amarillo `#FFE41F`. (Los
  nombres de los tokens `purple`, `blue` y `cyan` se conservaron, pero ahora son rojo, ámbar y amarillo.)
  Cada título recibe su propia combinación de acentos, calculada a partir de su `id`.
- **Tipografías (Google Fonts):** Bebas Neue (logo, carrusel, números), Outfit (encabezados y botones) e
  Inter (texto). Sin conexión se usan fuentes de respaldo del sistema.
- **Responsivo** desde teléfonos hasta escritorio, con foco visible en teclado, etiquetas `aria-*`,
  y soporte de `prefers-reduced-motion`.

## Notas de seguridad

- Todo texto de la API se muestra con `textContent`; no se usa `innerHTML` con datos de usuario (previene XSS).
- Las redirecciones posteriores al login (`?next=`) solo aceptan rutas `*.html` del mismo sitio.
- Las URLs de imagen solo se usan si son `http(s)`.
- El JWT se guarda en `localStorage`. Es adecuado para un frontend estático, pero cualquier XSS podría leerlo.
