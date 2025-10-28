# Symbol Quest

A reflective, text-based adventure through metaphors and meaning. An AI Oracle describes symbolic scenes and offers 2–3 choices each round; your actions shape poetic outcomes and a closing insight.

## Features
- Mystical UI: deep purples, silvers, and soft golds; drifting particles and runic buttons
- 4–6 scenes per journey with short, poetic consequences
- Final reflection screen with save option (in-memory per server run)
- Works without API key via safe local fallbacks

## Setup
1. Install deps:
```bash
npm install
```
2. Configure env (optional):
- Copy `.env.local.example` to `.env.local` and fill your OpenRouter key.
- Without a key, a local symbolic fallback is used.

## Env Vars
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (default: `openrouter/auto`)
- `OPENROUTER_BASE_URL` (default: `https://openrouter.ai/api/v1`)

## Run
- Dev (port 3079):
```bash
npm run dev
```
- Production:
```bash
npm run build
npm start
```
