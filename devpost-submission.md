# Title

Observatory

## One-line Summary

Observatory is a local-first fantasy map builder where writers and browser agents collaborate on the same visible, editable canvas through WebMCP.

## Problem

Fantasy maps are useful thinking tools for writers, game designers, and worldbuilders, but creating one usually means choosing between two awkward extremes: a complex professional graphics application or an AI image generator that produces a flattened result the creator cannot meaningfully revise.

Agent assistance introduces another problem. A general browser agent can try to click through a visual editor, but canvas interactions are difficult to infer, slow to execute, and fragile. The agent lacks a reliable vocabulary for terrain, rooms, walls, landmarks, labels, coordinates, and revisions.

## Solution

Observatory combines a polished human map editor with a structured, page-aware WebMCP interface. A writer can paint terrain, compose rooms, draw walls, place semantic objects, style labels, adjust layers, undo changes, and export the result. A compatible browser agent can inspect and modify that exact same map through bounded tools rather than guessing how to operate the canvas.

The agent can turn a high-level request—such as a flooded forest shrine with a broken causeway and a safe refuge—into editable terrain strokes, vector structures, objects, and text. The writer remains in control: changes are visible immediately, use the normal undo and persistence path, reject stale revisions, and require an in-app approval flow before semantic deletion.

## Why This Matters

Creative work is iterative. A generated picture may inspire an idea, but it does not preserve the semantic structure needed to keep developing that idea. Observatory lets people delegate the tedious first pass without surrendering authorship or editability.

WebMCP is a particularly strong fit because it gives the agent a mapmaking vocabulary and safe operating contract while preserving the application as a complete tool for humans. People and agents can inspect, create, refine, and export the same local project—something that is difficult to achieve reliably through visual browser automation alone.

## How We Used AI

WebMCP is the collaboration layer. Observatory registers four library tools and a stable project tool set through `document.modelContext.registerTool`. These tools expose capability discovery, local project management, bounded map inspection, style catalogs, terrain painting and erasing, vector shape and line creation, object and label placement, element updates, layer visibility, undo/redo, guarded removal, and export.

The implementation uses strict JSON schemas, bounded pages and geometry responses, optimistic revision checks, idempotent operation IDs, abort handling, compact result envelopes, and single-use approval tokens for destructive semantic changes. Agent actions flow through the same Pinia store and IndexedDB transaction boundary as human edits, so there is no hidden parallel state.

Generated terrain and object artwork was created with OpenAI image generation and then processed into deterministic, locally bundled runtime materials. Observatory does not call a model API at runtime and does not require accounts, cloud storage, or private credentials.

## How We Used Codex

Codex was used as an implementation and review partner throughout the build. It helped develop and refine the Vue, Pinia, IndexedDB, PixiJS, WebMCP, PWA, export, and test layers; investigate rendering and persistence edge cases; extract oversized components and runtime plumbing; remove dead compatibility APIs; and establish automated lint, type-check, coverage, unit, locale, browser, and production-build gates.

The final review included repository-wide checks for DRY violations, dead code, accidental globals, stale documentation, secret leakage, dependency vulnerabilities, and open-source readiness. Codex also helped keep the WebMCP contract and human editor aligned while preserving transactional rollback, undo history, and deterministic rendering behavior.

## Key Features

- Large continuous fantasy-map canvas with signed coordinates from −4,096 to 4,096.
- Natural, crisp, and wild terrain strokes with independent softness and exact live previews.
- Deterministic hand-painted terrain materials composited in world space.
- Editable rectangles, ellipses, polygons, stars, styled walls, objects, and text boxes.
- Layer controls, selection transforms, keyboard shortcuts, undo/redo, and cross-tab revision protection.
- Local-first IndexedDB persistence with no login, backend, telemetry, or cloud synchronization.
- Portable `.observatory` archives plus PNG and Markdown map-key exports.
- Installable offline PWA with desktop and mobile layouts.
- Page-scoped WebMCP tools with bounded inspection, stable IDs, schema validation, idempotency, revision guards, and approval-gated removal.

## Architecture

Observatory is a Vue 3 and Pinia application rendered through one on-demand PixiJS/WebGL canvas. IndexedDB is the durable boundary: each logical mutation increments one project revision and persists only the changed stores in a single transaction. Failed saves roll visible state and history back, while `BroadcastChannel` notifications prevent stale cross-tab writes.

Terrain is stored as ordered vector strokes. The renderer composites those strokes into adaptive 32-cell cached chunks while retaining vectors as authoritative data. Structures, objects, labels, and layers remain semantic records with stable IDs. The WebMCP adapter translates bounded snake_case schemas into the same store operations used by the editor. Generic registration, validation, approvals, idempotency, and result formatting are separated from Observatory-specific tool definitions.

The production bundle contains all normal runtime assets and registers an offline service worker. Deliberately opened Story Shack links are the only ordinary path out of the standalone application.

## Testing Instructions

### Judge walkthrough

1. Open the public live URL in ChatGPT's in-app browser, or in Google Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Create a blank map from the library.
3. Ask the browser agent: “Build a map of a lone tower in a dense forest.”
4. Observe that the agent discovers Observatory's catalog and uses structured tools to create editable terrain, shapes, lines, objects, and labels.
5. Select or edit an agent-created element manually, use undo/redo, and export the map as PNG or `.observatory`.
6. Ask the agent to inspect specific element IDs and refine part of the map. For removal, verify that Observatory requires visible approval before committing the change.

No account or credentials are required. Maps remain in the browser's IndexedDB.

### Local verification

```bash
npm install
npm run check
npm run test:coverage
npm run test:e2e
```

Current verified results: 40 unit tests and 23 Playwright browser tests pass; ESLint, Vue template type-checking, 14-locale parity, coverage thresholds, the production build, and `git diff --check` pass. `npm audit --omit=dev` reports zero known production dependency vulnerabilities.

## Public Demo Link

TODO: Add the deployed public URL.

## Public Repository Link

TODO: Add the public GitHub, GitLab, or Bitbucket URL.

The repository includes an AGPL-3.0-only license, source, locally bundled assets, build instructions, architecture documentation, privacy documentation, security reporting guidance, and third-party notices.

## Demo Video

TODO: Add the public YouTube URL. The final video must be under three minutes and include audio.

Suggested outline:

1. **0:00–0:20 — Problem:** Canvas editors are hard for agents to operate reliably, while generated images are difficult for creators to edit.
2. **0:20–0:40 — Human product:** Create a map and quickly demonstrate terrain, structures, objects, labels, and undo.
3. **0:40–1:40 — WebMCP collaboration:** Give the shrine prompt, show tool discovery and visible map construction, then inspect and refine a stable element.
4. **1:40–2:15 — Safety and shared state:** Demonstrate human editing, undo, revision-aware operations, and approval-gated removal.
5. **2:15–2:40 — Architecture:** Briefly show the WebMCP tool registration, shared store transaction path, and deterministic renderer.
6. **2:40–2:55 — Result:** Export the finished map and close on the human-agent creative workflow.

## Screenshot Shot List

Existing source screenshots:

- `public/screenshots/observatory-basic-1440x900.jpg` — wide Basic-theme editor with a completed map.
- `public/screenshots/observatory-charcoal-1440x900.jpg` — wide Charcoal-theme editor demonstrating visual polish.
- `public/screenshots/observatory-mobile-390x844.jpg` — narrow mobile project library.

Additional recommended evidence:

- A wide screenshot of a newly agent-created map with the compact WebMCP activity indicator visible.
- A before/after pair showing a natural-language refinement applied to editable map elements.
- The approval prompt for guarded removal, with no private browser or account information visible.

## Submission Readiness Notes

- The application and repository quality gates pass locally.
- Devpost confirms Martin Hooijmans is authenticated and registered for The WebMCP Challenge.
- Git history begins September 2, 2026, during the challenge period, so the draft classifies the app as **New**.
- The live Devpost schedule reported submissions open with a deadline of September 4, 2026 at 08:00 UTC when this draft was prepared.
- The public live URL, public repository URL, public YouTube video, and confirmed WebMCP test client remain required before final review.
- Nothing has been sent to Devpost by this preparation step.

## Known Limitations

- WebMCP requires a compatible secure, top-level browser context. Unsupported browsers continue as a normal human editor without registering tools.
- Projects are local to one browser profile unless the user exports and imports a portable archive.
- The canvas is intentionally bounded to signed coordinates from −4,096 to 4,096.
- There is no real-time multi-user collaboration or cloud synchronization.
- Automated tests validate WebMCP schemas, execution behavior, persistence, and browser workflows, but the exact agent/client used for the final judge walkthrough still needs to be recorded.

## TODO Official Form Fields

- **28249 — Submitter Type (required):** TODO — choose `Individual`, `Team of Individuals`, or `Organization`.
- **28250 — Country of residence of yourself and team members if applicable (required):** TODO.
- **28251 — Organization name:** Not applicable unless submitting as an organization.
- **28252 — App Status (required):** Draft answer: `New`.
- **28253 — Existing-project update explanation:** Not applicable if `New` is confirmed.
- **28254 — Live URL (required):** TODO.
- **28255 — Testing instructions:** Use the judge walkthrough above; no credentials are required.
- **28256 — Public code repository URL (required):** TODO.
- **28257 — Agents or clients used to test WebMCP (required):** TODO — run the deployed workflow in ChatGPT's in-app browser or Chrome 149+ and record the exact client(s).
- **28258 — AI tools used (required):** Draft answer: OpenAI Codex for implementation, debugging, refactoring, testing, and documentation; OpenAI image generation for locally bundled map artwork.
- **28259 — Learning derived (required):** TODO — choose `None`, `Moderate`, or `Significant`.
- **28260 — Career AI value (required):** TODO — choose `Yes` or `No`.
