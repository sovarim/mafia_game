# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server on port 3000
- `npm run build` — typecheck with `tsc` then build with Vite
- `tsc --noEmit` — typecheck only (no separate lint command)
- Deploy target: GitHub Pages (static output in `dist/`, base path `/mafia/`)

## Architecture

Online Mafia (social deduction game) — fully client-side SPA with no backend server. The host's browser acts as the authoritative game server; other players connect via WebRTC peer-to-peer (PeerJS). All UI text is in Russian.

### Network: Host-as-Server (Star topology)

- **Host** creates a PeerJS Peer with ID `mafia-{ROOM_CODE}` and runs all game logic
- **Players** connect to the host via WebRTC DataChannel
- Players send actions (`JOIN`, `ACTION`, `VOTE`, `READY`, `PING`) → Host responds with personalized state (`STATE_UPDATE`, `ROLE_ASSIGN`, etc.)
- Room codes are 6-char alphanumeric (no ambiguous chars I/O/0/1), defined in `src/utils/constants.ts`
- STUN-only (Google), no TURN — designed for same-network or home NAT scenarios

### State Management

- **Zustand store** (`src/store/gameStore.ts`) — top-level app state, connection management, bridges between UI and network managers
- **GameEngine** (`src/engine/gameEngine.ts`) — runs only on host; owns authoritative `GameState`, produces per-player `ClientGameState` via `buildClientState()` which filters information by role (mafia see their team, commissioner sees check results, etc.)
- **HostManager** (`src/network/hostManager.ts`) — PeerJS host, routes player messages to GameEngine, broadcasts personalized state to each connection
- **ClientManager** (`src/network/clientManager.ts`) — PeerJS client, sends player actions, receives state updates

### Game Engine Subsystems (all in `src/engine/`)

- `roleDistributor.ts` — Fisher-Yates shuffle role assignment
- `nightResolver.ts` — resolves mafia votes, maniac kill, doctor save, commissioner/don checks
- `voteResolver.ts` — day vote tallying (plurality wins, tie = no elimination)
- `winChecker.ts` — mafia >= others, all threats eliminated, or maniac last standing

### Screen Routing

`App.tsx` routes by `GamePhase` (16 phases from `lobby` through `game_over`). Night phases show `NightActionScreen` for the active role and `NightWaitScreen` for everyone else, determined by `canAct` in the client state.

### Key Design Decisions

- Host player has a hardcoded ID of `'host'` — the host participates as a regular player
- Narration uses Web Speech API (`src/audio/narrator.ts`), plays only on the host device, Russian locale
- Even dead roles get a timed pause during night to prevent information leakage about which roles are still alive
- Doctor cannot heal the same player two consecutive nights (`doctorLastTarget`)
- Don is masked as "civilian" when checked by commissioner; Advocate can mask other mafia members from commissioner checks

### Types

All game types, message types, and role metadata are in `src/types/index.ts`. `ROLE_META` maps each role to its name, team, color, and description.

## Tailwind

Custom theme in `tailwind.config.ts` — semantic color tokens (`bg`, `mafia`, `civilian`, `maniac`, `doctor`, `warn`), custom fonts (Cormorant Garamond display, Outfit body, Space Mono mono), and game-specific animations (flip, glow, confetti).

## Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
