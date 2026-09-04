# Observatory asset and rendering guide

This repository contains Observatory, the local-first Story Shack fantasy map builder created by Martin Hooijmans. Preserve local creative data, offline behavior, deterministic rendering, WebMCP contracts, and portability when extending it.

## Product boundaries

- No authentication, backend, cloud sync, telemetry, runtime CDN dependency, or private production credential.
- Persist logical mutations through the workspace store and IndexedDB transaction boundary. Do not write to IndexedDB from view components.
- Keep each project's fixed frame authoritative for editing, undo, WebMCP, and export. `WORLD_COORDINATE_LIMIT` remains only the outer storage/schema safety ceiling. The visible grid is an optional guide inside the frame.
- Treat rendering as a projection of map data. A visual improvement must not silently change logical coordinates or saved terrain.
- Permanent destructive actions remain human-owned. WebMCP exposes recoverable removal only.

## Story Shack visual direction

Map artwork uses a refined digital-fantasy style with bold, varied line weights, crisp illustrative detail, layered color planes, subtle gradient transitions, painterly material texture, soft dramatic lighting, restrained graphic-novel influence, and polished adventurous atmosphere. All map assets use an orthographic top-down view and consistent neutral overhead lighting.

Avoid generic AI gloss, photographic inconsistency, isometric perspective, text, borders, watermarks, baked shadows from unrelated objects, or obvious focal elements inside repeatable terrain.

## Terrain architecture

`src/components/MapSceneCanvas.vue` is the live renderer. It owns one on-demand PixiJS/WebGL scene with explicit terrain, grid, structure, object, label, selection, and preview layers. New terrain, including precise WebMCP regions, persists as ordered continuous or discrete strokes in `terrainStrokes`; sparse chunks and `terrainStyles` remain only for migration and imported-archive compatibility. Never add one DOM node per terrain cell or return to one raster canvas per chunk.

`src/services/terrainRenderer.js` produces the sharp seamless material sources used by Pixi and export. Materials with strong authored structure use dedicated uniformly lit sources. Remaining atlas materials use deterministic minimum-error quilts plus differently scaled neutral grain. The complete material is sampled in global world space, so a stroke, room, old cell, or export never restarts the texture coordinates.

Important invariants:

- The optional square grid is a guide only. Pointer input, object placement, stroke paths, rooms, and walls may use fractional coordinates.
- Persist brush geometry, not raster pixels. A stroke records ordered points, radius, edge profile, material, painter order, and bounds.
- Render continuous soft active strokes and committed strokes through the same bounded mask generator, geometry, material, and falloff path. The transient mask may use a lower maximum allocation for long gestures, but it must remain visible throughout pointer capture, must not wait for IndexedDB, and pointer-up must not swap render semantics.
- Keep the terrain cursor outline-only. It may describe the full brush footprint, but it must never add color or opacity to the active stroke; releasing the pointer must not make painted terrain appear to shrink.
- Brush softness is persisted independently from edge variation. New continuous strokes default to 100% softness and use a deterministic alpha falloff that leaves the material itself sharp. `crisp`, `natural`, and `wild` control boundary variation; they must not substitute for softness. Existing strokes without a softness value fall back to 0%, 75%, and 100% respectively.
- Treat terrain input as a circular paint footprint, not a thin vector pen. The default diameter is five cells and the UI labels diameter explicitly; at the normal fitted zoom it should read as an approximately 80-100 px brush, with a broad useful range for both details and large landforms.
- Sample every material in world space. `TERRAIN.texturePeriod` is the perceptual scale-normalization control and must be compared at equal map zoom.
- Never restore flat-color material undercoats, raw atlas repetition, mirrored quadrants, or broad crossfades across plank joints, grout, furrows, or other authored linework.
- Use deterministic `cellHash` variation. Never use `Math.random()` in persisted or visible rendering.
- Painter order is data. Assign monotonically increasing `terrainStrokes.order`, sort after IndexedDB loads, and preserve it through duplicate, import, undo, redo, and export.
- A room is one compound vector entity. Its floor is clipped to its polygon and its wall follows that exact closed boundary, preventing floor texture from bleeding beyond the wall.
- A wall is a continuous path with round joins and caps. Never convert new walls into detached cell sprites.
- Keep committed data and transient interaction data separate. A pointer move should update only the lightweight preview scene; pointer-up commits one logical mutation.
- Give each pointer gesture its final persisted entity ID before drawing begins. As soon as that ID appears in committed state, suppress its transient copy in the same render pass so asynchronous persistence can never double-render or flash the stroke.
- PNG export must use the same ordered strokes, world-space material periods, clipped rooms, continuous walls, object transforms, and exact frame as the live scene.

## Large-map performance invariants

- The Pixi ticker stays stopped. Render only after data, camera, viewport, selection, or transient preview changes.
- A pointer move must not rebuild committed scene layers, query IndexedDB, or clone the saved stroke history.
- Build a transient preview with the same material, width, and alpha falloff. Continuous strokes are round vector paths; never approximate their boundary with dense overlapping circle meshes.
- Keep transient pointer samples sparse and mutate the in-progress path in place. Simplify its display path at roughly screen-pixel tolerance so a long drag does not clone or rebuild thousands of redundant points per pointer event.
- Rasterize the active continuous stroke's alpha falloff into a bounded temporary mask over a sharp world-space material fill. Keep its dimensions capped and destroy the owned texture on replacement. Never retain dense contour or circle geometry in the live scene.
- Composite committed terrain into adaptive-resolution 32-cell render chunks and display only chunks intersecting the viewport. Retain strokes as source data, invalidate only chunks touched by changed stroke bounds, and enforce a bounded LRU texture budget. Camera movement must reuse cached chunk sprites rather than replaying stroke masks.
- Generate and upload only terrain materials required by the active map and current selection. Do not eagerly quilt all sixteen atlas materials at canvas startup or during export.
- Persist only the IndexedDB stores changed by a logical mutation. A terrain stroke must not rewrite objects, labels, structures, or layers.
- Treat ordered terrain strokes as an append log for undo/redo. Retain the 50-operation contract without cloning the full accumulated paint history for each stroke.
- Diff records inside changed IndexedDB stores. Appending one stroke must not delete and rewrite all older strokes.
- The project list summary is updated from the successful local commit; do not reread every project from IndexedDB after each stroke.
- Serialize logical commits, and make undo/redo wait for an in-flight save before restoring their store snapshots.
- Performance acceptance includes a large multi-stroke map at low zoom, one renderer canvas, zero per-terrain-cell DOM nodes, a visible exact live preview, and one committed redraw after pointer-up.

## Terrain atlas contract

The canonical lossless sources live in `artwork-sources/generated`. Optimized runtime assets live in `public/assets/terrain`.

The four terrain atlases must retain the exact 4x4 ordering below:

1. Worn stone, Dungeon stone, Grass, Dark grass
2. Packed earth, Sand, Shallow water, Deep water
3. Cobblestone, Mud, Snow, Volcanic rock
4. Wooden planks, Mossy stone, Farmland, Mountain scree

Current runtime files:

- `story-shack-terrain-atlas.webp` — base atlas
- `story-shack-terrain-atlas-v2.webp`
- `story-shack-terrain-atlas-v3.webp`
- `story-shack-terrain-atlas-v4.webp`
- `natural-details-atlas.webp` — sparse cross-cell details
- `connected-walls-atlas.webp` — sixteen cardinal wall masks
- `story-shack-line-{stone,palisade,cliff,hedge}.png` — transparent illustrated fragments repeated along free-drawn paths; lossless combined source in `artwork-sources/generated/story-shack-line-materials.png`
- `story-shack-material-grain.jpg` — generated neutral painterly detail layer, mirrored at runtime before world-space compositing
- `observatory-wood-floor-seamless.jpg` — dedicated uniform wood material; lossless source in `artwork-sources/generated`
- `observatory-mossy-stone-seamless.jpg` — dedicated uniform mossy-stone material; lossless source in `artwork-sources/generated`

When adding terrain:

1. Add one stable English ID and display label to `TERRAIN` in `src/constants.js`.
2. Add the material in the same atlas cell across every base variant. If the atlas grows, change all sprite-grid calculations together.
3. Keep companion variants palette-, scale-, and lighting-compatible. Change material distribution and marks, not material identity.
4. Prefer four base variants. Add 4-8 family detail overlays and 3-5 large feature splats before adding more base variants.
5. Retain the generated PNG source and ship an optimized WebP. Do not reference the lossless source from application code.
6. Update the asset catalog, WebMCP schema, notices, tests, and this document.
7. Inspect large contiguous regions, mixed-material edges, negative coordinates, chunk boundaries, every zoom level, and export output.

Suggested image-generation prompt constraints: exact equal atlas cells, no gutters or labels, orthographic top-down flat terrain, repeating texture source, no objects or central focal point, exact material ordering, and the Story Shack visual direction above.

## Terrain details and feature splats

Small details should cross cell boundaries and remain sparse. Use deterministic coordinate selection so they survive reload unchanged. Large feature splats should cover roughly two to five cells and be rendered above the material canvas but below structures and semantic objects.

Do not bake important gameplay objects into terrain. If users may select, move, resize, rotate, connect, or describe something independently, it belongs in the object model.

## Object atlas contract

Object source artwork lives in `artwork-sources/generated/story-shack-object-atlas.png`; the optimized runtime atlas is `public/assets/objects/story-shack-object-atlas.webp`. `OBJECTS` in `src/constants.js` is the authoritative sprite order and semantic footprint.

For every new object:

- Use an orthographic top-down transparent cutout with a clean silhouette.
- Match the terrain palette, line treatment, scale, and overhead lighting.
- Define a meaningful width and height in logical cells; do not default every object to one cell.
- Keep empty transparent padding consistent so selection bounds feel accurate.
- Verify placement ghost, selection box, resize, rotation, bring-to-front, framed export, frame-aware WebMCP discovery, and boundary adjustment.
- `OBJECT_ATLAS_COLUMNS` is the shared atlas-grid contract. Change it together with the source builder, picker background sizing, Pixi frame slicing, PNG export, tests, and catalogue whenever the grid grows.

## Persistence and schemas

- Map schema version is defined by `SCHEMA_VERSION` in `src/constants.js`.
- IndexedDB version and object stores live in `src/services/db.js`.
- New terrain geometry lives in the ordered `terrainStrokes` object store. Sparse chunks and `terrainStyles` remain readable for schema migration and archive compatibility.
- Schema changes require migration tests, import compatibility, archive round-trip coverage, and an IndexedDB upgrade that creates only missing stores.
- IDs and machine-facing WebMCP names remain stable English identifiers.

## Required verification

Before handing off terrain or asset changes, run:

```bash
npm test
npm run test:e2e
npm run lint
npm run typecheck
npm run test:coverage
npm run i18n:check
npm run build
git diff --check
```

Browser QA must include live painting before pointer-up, persistent edge profiles after reload, a chunk boundary, Basic and Charcoal themes, mobile controls, object transforms, and at least one PNG export. Do not claim deployment or production verification from local checks.
