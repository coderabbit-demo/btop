# AGENTS.md

This file provides guidance for AI agents working on this codebase.

## Project Overview

A web-based system monitor inspired by [btop](https://github.com/aristocratos/btop). Displays real-time CPU, memory, and process information in a cyberpunk-themed dark UI.

**Stack:** React 19, TypeScript, Vite, Recharts (frontend) + Bun HTTP server (backend)

## Development Commands

```bash
bun run dev        # Start Vite dev server (frontend only)
bun run server     # Start Bun API server on port 3001
bun run start      # Start both frontend and backend concurrently
bun run build      # Type-check and build for production
bun run lint       # Run ESLint
```

## Architecture

- `src/` — React frontend
  - `components/` — UI components (Header, CpuGraph, MemoryGraph, ProcessTable, etc.)
  - `hooks/useSystemMetrics.ts` — Polls `http://localhost:3001/api/metrics` at a configurable interval
  - `types.ts` — Shared TypeScript interfaces
  - `App.tsx` — Root component; owns filter and refresh rate state
- `server/index.ts` — Bun server exposing `/api/metrics`, `/api/health`, `/api/environment`
- `plans/` — Existing analysis documents (Agent1.md, Agent2.md) with detailed code reviews

## Component Patterns

- Components are named exports (e.g., `export function Header(...)`).
- Timed updates use `useState` + `useEffect` with `setInterval`; always clear the interval in the cleanup return.
- The `Header` component tracks `elapsedSeconds` (session uptime) and `currentTime` (wall clock) in a single shared 1-second interval. The displayed clock format is `HH:MM:SS` with zero-padding via `.toString().padStart(2, '0')`.
- Color coding for usage levels follows thresholds used across `CpuGraph`, `MemoryGraph`, `CpuBar`, and `MemoryBar`.

## Code Style

- TypeScript strict mode; avoid `any`.
- Use React functional components and hooks only.
- CSS class names use kebab-case and are defined in `App.css`.
- Do not add comments unless the logic is non-obvious.

## Known Issues / Security Notes

- `/api/environment` exposes all process environment variables — do not expand this endpoint.
- No test coverage exists; do not assume tests will catch regressions.
- CORS is open (`*`) — acceptable for local dev only.