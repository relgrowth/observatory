# Architecture

Pinia owns the visible map state and IndexedDB is the durable boundary. Each logical mutation updates one project revision and saves only its changed stores in one transaction before completion. BroadcastChannel announcements prevent stale writes across tabs.

New terrain is stored as ordered continuous brush strokes in world coordinates. Sparse chunks remain as a migration and import compatibility layer for maps created by the original cell editor. Shapes are compound vector structures: their floor is clipped to the selected rectangle, ellipse, polygon, or star and their styled boundary follows that exact geometry. Lines, landmarks, buildings, furniture, and text boxes remain semantic records with stable IDs so human and WebMCP operations can inspect and modify them at map scale.

WebMCP is a page-scoped adapter over those same stores, not a parallel map model. Its stable project tool set translates bounded snake_case schemas into normal store mutations, checks project revisions at execution time, and relies on the shared undo and persistence path. Toolbar selection does not alter agent capabilities.

The WebMCP implementation separates its generic registration, validation, approval, idempotency, and result-envelope runtime (`webMcpRuntime.js`) from the Observatory-specific schemas and tool catalog (`webMcp.js`). Editor-wide styles live in `main.css`; canvas, map tooling, selection, and responsive editor styles live in `map-editor.css`.

The live scene is one PixiJS/WebGL canvas. Terrain materials are sampled in shared world space so texture coordinates never restart at brush samples or old cells. The renderer draws continuous terrain, structures, objects, labels, selection, and the active brush preview in explicit layers. It renders on demand rather than running a permanent animation loop. The grid is only a visual guide and is not a geometry boundary.

Undo treats terrain strokes as an append log, so a new stroke does not clone the full paint history. IndexedDB persistence diffs records in changed stores rather than deleting and rewriting every row. PNG export uses the same world-space materials, ordered strokes, clipped rooms, and vector walls as the editor.

The app has no runtime asset service or normal-use network dependency beyond deliberately opened Story Shack links.

## Quality gate

Run `npm run check` before release. It enforces ESLint, Vue template type checking, unit tests, locale parity, and a production build. `npm run test:coverage` produces the V8 coverage report; end-to-end browser behavior remains covered separately by `npm run test:e2e`.
