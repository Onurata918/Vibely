# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Repo layout and commit convention

Each feature lives in its own folder so a single feature can be added or
removed without touching the others.

```
src/lib/<feature>/     pure logic: types.ts, engine.ts, data, __tests__/
src/hooks/use<X>.ts    useReducer wrapper around an engine
src/components/call/   one overlay component per game/effect
supabase/migrations/   numbered SQL, run in order, safe to re-run
```

Backend code is kept apart from gameplay code:

- `src/lib/supabase/` — client, queries, realtime. Nothing game-specific.
- `src/lib/livekit/` — room connection and media. Nothing game-specific.
- `src/lib/payments/` — jetons, premium, limits.
- `src/lib/<game>/`, `src/lib/<effect>/` — one folder each, self-contained.

`src/context/AppContext.tsx` is legacy and holds several older games inline.
Do not add new games there; new ones follow the folder layout above.

Commit one feature per commit, so `git revert <sha>` cleanly removes that
feature and nothing else. Do not bundle a backend change and a gameplay
change in the same commit.
