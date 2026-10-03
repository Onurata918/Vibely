# Claude Code instructions — Vibely 101

Read README_TR.md, SOURCES.md, GAME_RULES.md, rules.config.json, RULE_QUESTIONS.md,
OKEY101_TESTS.md, VIBELY_GAME_ARCHITECTURE.md, protocol.ts and IMPLEMENTATION_PLAN.md.

Inspect the existing repository and its instructions before edits. Preserve its navigation,
authentication, video room lifecycle and package manager. Do not replace existing CLAUDE.md.
Do not create a second app or new auth system if the repo already supplies them.

Implement the documented development profile exactly. OFFICIAL is sourced;
BASELINE is an explicit product decision, not proven Plus parity. Never invent a rule.
New missing behavior -> RULE_QUESTIONS.md, continue unaffected work.
Existing Q01-Q18 do not block implementing their explicit development defaults.
Never claim identical current 101 Okey Plus behavior until reference parity checks pass.

Engine is deterministic and has no React Native, Expo, LiveKit, Supabase, database, network,
wall-clock or production randomness imports. Inject time/deck and use immutable transitions.
Every action is server validated, ordered, versioned, idempotent and persistent before ACK.
Never expose opponent hands, deck order, seed or private events to clients.

Write meaningful automated rule tests from the scenario IDs first, then implement.
Test expected results come from these docs, not from the implementation under test.
Never weaken a test merely to make code pass. A genuinely wrong test may be corrected
only with a documented rule/source reason and matching spec/config update.
Property tests cover conservation, ownership and deterministic replay; integration tests
cover concurrency, private projections, reconnect and server restarts.

Choose existing repo dependencies where adequate. Check official documentation before
adding version-sensitive SDK integrations. Use native development builds if required.
No fake online mode, placeholder validators, TODO scoring or client-authoritative outcomes.
Use original temporary UI assets and Vibely naming; functional behavior is the target.

Complete phases sequentially until the authorized documented scope is implemented and
tested. Report progress, changed files, commands run and actual failures. External missing
credentials may block live integration; finish engine/local server/tests and give precise
remaining setup instead of claiming success. Never put service role/API secrets in mobile.

After each phase update IMPLEMENTATION_STATUS.md with rule/test IDs completed and
unresolved reference checks. Final handoff: test summary, four-user manual checklist,
config values, native build notes and honest limitations.
