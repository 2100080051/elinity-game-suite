# Elinity Game Suite – API Endpoints Guide

This suite contains many standalone Next.js apps. Each app exposes its own HTTP API under the `/api` path. To discover the exact endpoints available in any app at runtime, open the app and call its catalog endpoint:

- GET /api/endpoints

This endpoint returns a JSON list of all API routes in that app, including the HTTP method to use. It also enables CORS (GET/POST/OPTIONS from any origin) to make it easy to integrate from other sites.

Note: This discovery route has been added to all games that include a `pages/api` folder. If a game runs a custom Node/Express server (no `pages/api`), ask and we’ll add an equivalent `/endpoints` route there as well.

## How to discover endpoints

1) Start the app locally (examples):
- Rap Arena: http://localhost:3086
- Mythic Beast Builder: http://localhost:3087
- AI Puzzle Saga: http://localhost:3088
- Mood Journey: http://localhost:3089
- AI Comic Creator: http://localhost:3090
- Friendship Towers: http://localhost:3091

2) Visit the endpoints catalog in your browser (replace the host/port as needed):
- Rap Arena: http://localhost:3086/api/endpoints
- Mythic Beast Builder: http://localhost:3087/api/endpoints
- AI Puzzle Saga: http://localhost:3088/api/endpoints
- Mood Journey: http://localhost:3089/api/endpoints
- AI Comic Creator: http://localhost:3090/api/endpoints
- Friendship Towers: http://localhost:3091/api/endpoints

Example response (shape):

```json
{
  "service": "Elinity – AI Comic Creator",
  "apiBase": "/api",
  "baseUrl": "http://localhost:3090",
  "count": 8,
  "endpoints": [
    { "method": "POST", "path": "/api/create_session" },
    { "method": "GET",  "path": "/api/state" },
    { "method": "POST", "path": "/api/setup" },
    { "method": "POST", "path": "/api/generate_panel" }
    // ...
  ]
}
```

## Calling from the browser (same-origin)
If you’re calling from the app’s own frontend, use `fetch` like this:

```js
const res = await fetch('/api/create_session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ playerName: 'Ava' }),
});
const data = await res.json();
```

## Calling from another website (cross-origin)
All `/api/endpoints` are CORS-enabled for discovery. Most functional routes are intended for same-origin use. If you need cross-origin access, either:
- Proxy requests via your own backend; or
- Add CORS headers to the specific routes you need (we can enable that on request).

A simple cross-origin discovery from any site:

```js
const res = await fetch('http://localhost:3089/api/endpoints', { method: 'GET' });
const { endpoints } = await res.json();
```

## Quick reference: Core functional endpoints per game
The catalog is the source of truth. Typical routes you’ll see:

- Rap Arena:
  - POST /api/create_room, POST /api/join_room, POST /api/start_round, POST /api/submit, POST /api/judge, POST /api/next_round, POST /api/set_difficulty, GET /api/state

- Mythic Beast Builder:
  - POST /api/create_session, POST /api/join, POST /api/set_theme, POST /api/submit_traits, POST /api/summon, POST /api/name, POST /api/add_to_codex, GET /api/codex, GET /api/random_beast, GET /api/state

- AI Puzzle Saga:
  - POST /api/create_session, POST /api/start_chapter, POST /api/submit_answer, POST /api/skip_puzzle, POST /api/show_hint, POST /api/save_progress, GET /api/state

- Mood Journey:
  - POST /api/create_session, POST /api/start_journey, POST /api/next_mood, POST /api/share_response, GET /api/map, GET /api/state

- AI Comic Creator:
  - POST /api/create_session, POST /api/setup, POST /api/generate_panel, POST /api/regenerate_scene, POST /api/add_dialogue, POST /api/save_progress, POST /api/finish_comic, GET /api/state

- Friendship Towers:
  - POST /api/create_session, POST /api/start_session, POST /api/submit_answers, POST /api/next_layer, POST /api/save_snapshot, POST /api/reflect, GET /api/state

If you want an OpenAPI/Swagger spec or CORS on specific functional routes, tell us which apps and we’ll add it.
