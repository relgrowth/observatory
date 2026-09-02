# Story Shack Mapworks

Mapworks is a local-first fantasy map builder for dungeons, villages, interiors, wilderness regions, and world maps. Paint hand-crafted terrain, build rooms and walls, place semantic objects, add game-master-only labels, and collaborate with compatible browser agents through WebMCP.

The current product name is provisional while the new Story Shack place-name is selected.

## Development

```bash
npm install
npm run dev
npm test
npm run test:e2e
npm run build
```

Map data stays in IndexedDB. There is no authentication, backend, cloud synchronization, or telemetry. The application is an installable offline PWA.

## Features

- Square-grid maps from 8×8 through 96×96 tiles.
- Chunk-backed terrain plus semantic structures, objects, layers, and labels.
- Generated hand-painted terrain and object atlases bundled for offline use.
- Terrain brushes, rectangular room construction, walls, props, hidden information, zoom, grid controls, player view, undo, and redo.
- Portable `.mapworks`, PNG, and Markdown map-key exports.
- Page-aware WebMCP tools for bounded reads and durable bulk map operations.

Licensed under AGPL-3.0-only.
