# 🎭 AI Role Swap

A playful, empathy-building social game where players pretend to be each other while ElinityAI moderates with scenarios, twists, and reflections.

## Setup

1. Copy `.env.example` to `.env.local` and set:
   - `OPENROUTER_API_KEY=...`
   - `OPENROUTER_MODEL=openai/gpt-oss-20b:free` (or your preferred model)
   - `NEXT_PUBLIC_APP_URL=http://localhost:3023`
2. Install and run:

```
npm install
npm run dev
```

Visit http://localhost:3023

## Actions
- Start New Scenario → calls `/api/role_swap` with `action: "scenario"`
- Next Twist → `action: "twist"`
- End Round → `action: "reflect"`
- End Game → `action: "summary"`

All responses are strict JSON (server enforces it and has fallbacks).
