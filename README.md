# Shorojontro: Vercel + PostgreSQL

The production game now uses Next.js on Vercel and Neon PostgreSQL. Connect the Neon integration to the project so DATABASE_URL (or POSTGRES_URL) is supplied. Vercel runs the idempotent PostgreSQL schema migration before building. Preview deployments use isolated database branches when enabled in the integration.

Local setup: install dependencies with `npm install`, pull the Vercel development environment into `.env.local`, run `npm run db:migrate`, then `npm run dev`. Do not commit `.env.local`. Run `npm test` for isolated PostgreSQL and game tests; `npm run build` verifies the Next.js build.

The old Sites/D1 deployment is retained separately. Existing D1 rooms and sessions are not copied by this schema migration; new Vercel sessions and rooms are stored in PostgreSQL. No old database is deleted.

---

# Shorojontro

A responsive Bengali bluffing card game for 2–6 human and computer players. Uses the user's custom nine-card artwork and confirmed house rules. Public lobby, password-protected private rooms, host-selected cast, ready checks, live polling, challenges, blocks, exchanges, tax, rematches and reconnection.

## Architecture

Vinext/React on Cloudflare Workers. D1 stores rooms as versioned state snapshots and guest sessions. Updates use compare-and-swap on revision; stale and duplicate moves cannot commit. Passwords use salted PBKDF2-SHA256. A private HttpOnly SameSite cookie authenticates each guest, with only its SHA256 stored in D1. Responses reveal only the requesting player's living cards and everyone’s already-lost cards. Deck order and effect continuations never leave the server.

Polls every 1.5 seconds during matches and 5 seconds in the lobby. Server-enforced deadlines: 60 seconds per turn, 25 seconds per response. A timeout accepts claims, skips optional blocks/shares, takes income (or mandatory 7-coin kill at >=10 coins), or chooses the first legal cards. Deadlines advance when a player next contacts the room. Rooms expire after 24 hours of no updates; guest sessions after 30 days. Clearing cookies loses the guest identity.

## Development

Use the existing Sites install/build scripts. `npm run db:generate` generates schema migrations. The platform binds D1 as `DB`; no external keys are needed. All nine card definitions and rules are in `lib/game/cards.ts`; game rules are implemented in `lib/game/engine.ts`.

## Verification

- `node --test tests/game.test.mjs`: 22 game-rule tests, including 96 complete simulations across every legal cast with 2–5 bots.
- `node tests/multiplayer.test.mjs`: actual API handlers against isolated in-memory SQLite, seven guest sessions, password checks, membership, capacity, host permissions, six-player start, hidden hands, concurrent writes, claims, reconnect and public listing. This does not substitute for browser or deployed Cloudflare QA.
- `npx tsc --noEmit`
- `npm run build`

## House rules

One blue, one purple, one black and two green characters, three copies each. Two cards/two coins per player. Export removed. Bir +3; Mamdo +4 then seat-order shares capped at two paid shares. Orun draws 1, Petuk 2; only live cards can be exchanged. Brahmodotto costs 3 and Betal 5, both remove one life and cannot be blocked. Kalu takes up to 2 and can be blocked by Kalu/Petuk. Chichke takes up to 1 per other living player; each Chichke block protects only that player. Nantu replaces the tax collector and character. One coin is collected only when the taxed character successfully earns coins. General income +1 and 7-coin kill cannot be challenged. At >=10 coins, 7-coin kill mandatory. Proof returns to the shuffled deck and an unseen replacement is drawn. Costs never refunded. Last survivor wins.

All game artwork is provided by the user’s card design workflow. The original game publisher is not represented as operating or endorsing this implementation.

## Bengali and computer players

The UI, role instructions, examples, rulebook, validation and new game logs are Bengali. The host can add one or multiple bots to free seats before starting; bots stay ready across cast changes and rematches. One human plus 2–5 bots is supported within the room capacity. Bots decide only from the same redacted view available to that player, with paced server-side moves, bounded bluffing, challenges, blocks and card choices. Polling drives bot progression; no cron or external AI service is required. The last human leaving closes a bot-only room.

Actions and responses include a phase token: stale revisions may still be accepted within the identical decision phase, while atomic compare-and-swap and engine validation prevent duplicate or obsolete moves. API tests cover concurrent same-phase accepts, bot permissions, capacity, solo start and hidden bot hands.

## Game table interface

The Bengali start menu leads directly to room creation or joining. Match seating surrounds the central deck, with life markers, active-seat highlights, coins, the private hand and a dedicated decision panel. Targeted actions open a confirmation picker for any living opponent. Attack targets are announced before a role challenge. Victims select their own lost card using artwork; robbery victims can claim Kalu or Petuk to block their own loss, subject to challenge. Mobile layouts stack the board, hand and controls.
