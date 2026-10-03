# Claude Code instructions — Color Clash

Read all files in this directory, then inspect the existing Vibely repository and its root instructions. Keep the existing navigation, auth, room and LiveKit lifecycle. Implement inside the current app.

GAME_RULES.md and rules.config.json are the source of truth. Use the Color Clash product names from SOURCES.md throughout UI, tests and code. Build original visual assets and layout.

Write the deterministic TypeScript engine and meaningful automated tests before UI. The engine must not import React Native, Expo, LiveKit, Supabase, networking, database, system clock or production randomness. Inject the shuffled deck and time.

The game server is authoritative. Validate user identity from JWT, membership, turn, ownership and every effect. Implement idempotent requestId handling, expectedVersion, serialized room actions, persistent transaction/outbox and explicit public/private projections. Never send opponent hands, deck order or challenge evidence to clients.

Implement phases in IMPLEMENTATION_PLAN.md. Run relevant tests after each phase. Never change a rule test only to make an implementation pass. Record actual commands/results in IMPLEMENTATION_STATUS.md. Do not claim multiplayer completion with local mock players.
