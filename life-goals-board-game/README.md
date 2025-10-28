# Life Goals Board Game

A hybrid vision-setting and play experience. Generate a 5×5 board of Goal Spaces, roll a die, land, name the space, describe how you’d reach it, and let Elinity AI produce a short journey narrative. Infinite replayability.

## Stack
- Next.js 14 (pages router), React 18, Tailwind CSS (board theme)
- OpenRouter for AI (API-only)
- HMR-safe in-memory store (no database)

## Env
```
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=minimax/minimax-m2:free
```

## Run
```
npm install
npm run dev
# http://localhost:3051
```

## API
- POST `/api/game` → new board; returns `{ game, markdown }`
- GET `/api/game` → snapshot `{ game }`
- POST `/api/game/roll` → apply a die roll; returns `{ player, roll, space, description:"", journey_image_url:"", next_player, markdown, game }`
- POST `/api/game/describe` body `{ description }` → returns `{ player, roll:null, space, description, journey_image_url:"", next_player, markdown, game }`
- POST `/api/game/goal` body `{ index, title }` → name/rename a Goal Space
