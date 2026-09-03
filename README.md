# Observatory

Observatory is a local-first fantasy map builder for dungeons, villages, interiors, wilderness regions, and world maps. A writer can sketch and refine a map by hand, or ask a compatible browser agent to turn one sentence into a visible, editable landscape through WebMCP.

Created and maintained by Martin Hooijmans.

The application is deliberately standalone: no login, backend, cloud sync, telemetry, private dependency, or Story Shack production credential is required.

## Development

```bash
npm install
npm run dev
npm run check
npm test
npm run test:e2e
npm run lint
npm run typecheck
npm run test:coverage
npm run i18n:check
npm run build
```

Working map data stays in IndexedDB unless the user initiates a local export. There is no authentication, backend, cloud synchronization, or telemetry. The application is an installable offline PWA.

## Features

- A large continuous canvas spanning signed world coordinates from −4,096 to 4,096; the optional square grid is only a guide.
- Ordered vector terrain strokes plus semantic rooms, walls, objects, layers, and labels.
- Generated hand-painted terrain materials with deterministic world-space variation and seamless compositing.
- Natural, crisp, and wild edge profiles with exact live previews and deterministic organic boundaries.
- Terrain brushes, editable geometric shapes, styled lines, props, styled text boxes, layer controls, zoom, grid controls, undo, and redo.
- Portable `.observatory`, PNG, and Markdown map-key exports.
- A stable page-aware WebMCP surface for bounded inspection, creation, styling, transformation, layers, history, and guarded removal.

## WebMCP demo

Open a blank map in a WebMCP-capable browser and try:

> Build a map of a lone tower in a dense forest.

The agent can discover the full style catalog, paint several terrain materials in one transaction, create styled shapes and lines, add semantic landmarks and text boxes, and leave the saved result visible on the canvas. It can inspect stable element IDs and refine geometry or styling while the writer remains free to edit, undo, and export the same map.

The complete project tool set remains available regardless of the selected human toolbar control. Read tools stay quiet, mutations use a compact activity status and revision guard, and recoverable element removal requires explicit in-app preview approval.

See [the WebMCP contract](docs/WEBMCP.md), [architecture](docs/ARCHITECTURE.md), and [privacy model](docs/PRIVACY.md).

## Public release

This repository is intended to be independently cloneable and installable with the commands above. Generated artwork and locally bundled fonts are documented in [the third-party notices](THIRD_PARTY_NOTICES.md). Hosting and publication are separate release steps and are not performed by the build commands.

Licensed under [AGPL-3.0-only](LICENSE).
# observatory
