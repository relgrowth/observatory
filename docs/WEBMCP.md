# WebMCP in Observatory

Observatory exposes a page-scoped WebMCP API for agents running in a compatible browser. It feature-detects secure, top-level `document.modelContext.registerTool`; unsupported browsers and `VITE_WEBMCP_ENABLED=false` continue without registering anything.

The API operates on the same visible Pinia state and IndexedDB persistence path as the human editor. It does not add cloud storage, authentication, telemetry, or a remote MCP server.

## Tool scopes

The library registers four tools:

- `get_observatory_capabilities`
- `list_maps`
- `manage_maps`
- `open_map`

An open map registers one stable project tool set. Drawing tools do not appear and disappear when the human changes the selected toolbar control:

- `get_map_context` reads the map overview or a bounded, paged terrain, object, shape, line, label, or layer view. `include_geometry` returns editable point lists.
- `get_map_asset_catalog` describes every terrain, object, line style, label style, and shape type accepted by the current editor.
- `paint_map_regions` paints mixed semantic cell regions.
- `paint_map_strokes` paints continuous terrain paths with radius, edge variation, and softness.
- `erase_map_terrain` adds terrain-only erase strokes without removing semantic elements.
- `create_map_shapes` creates editable rectangles, ellipses, polygons, and stars with floor and boundary styles.
- `draw_map_lines` creates continuous stone-wall, palisade, cliff, or hedge lines.
- `place_map_objects` places semantic objects with rotation, scale, and z-order.
- `add_map_labels` creates editable text boxes with dimensions, rotation, font size, font family, preset or hex color, and weight.
- `update_map_elements` moves, resizes, rotates, restyles, or replaces the geometry of objects, shapes, lines, and labels by stable ID.
- `set_map_layer_visibility` shows or hides the terrain, structure, object, and label layers.
- `change_map_history` performs one undo or redo step.
- `delete_map_elements` recoverably removes known semantic elements after human approval.
- `export_map` initiates a local PNG, portable archive, or Markdown notes download.

`get_observatory_capabilities` returns this stable project tool list, coordinate limits, batching limits, and safety contract so an agent can plan before opening a map.

It also returns advisory visual guidance. Organic terrain should generally use overlapping, offset strokes with varied radii, `natural` or `wild` edges, and 65–100% softness. Lower softness remains available for roads, masonry, excavated areas, and other intentional hard boundaries. Cell regions are best suited to precise or deliberately blocky layouts. Boundary lines should represent actual cliffs, hedges, walls, or palisades rather than automatically outlining every terrain edge, while related objects should be clustered with subtle rotation and scale variation. These are compositional defaults, not validation rules.

## Coordinates, inspection, and styles

Coordinates are signed world-space grid units with the current limit reported by the capability tool. Objects and labels use anchor coordinates. Shape coordinates describe the top-left of their editable bounding box. Continuous paths accept fractional coordinates.

Agents should read `get_map_context` with `detail: "overview"` before mutation, then request the relevant paged element type. Omitting region coordinates pages through that element type across the whole map; supplying a region filters it spatially. Element reads contain stable IDs and all editable style properties. Shape, line, and terrain-stroke point arrays are opt-in because geometry can be large.

Machine-facing fields use snake_case consistently (`asset_id`, `line_style`, `box_width`, `font_size`, and `z_index`). Catalog calls provide the authoritative enum values and style defaults. Label colors accept either a catalog preset or a six-digit hex value.

## Mutation and safety contract

Every mutation requires:

- a fresh UUID `operation_id`;
- the current `expected_revision` from `get_map_context`; and
- bounded input matching the tool schema.

An exact retry with the same operation ID returns the cached result. Reusing that ID with different input returns `operation_conflict`, preventing ambiguous duplicate work. Successful changes complete only after the shared store and IndexedDB transaction succeed, and each bulk call remains one save, revision increment, and undo step.

Semantic deletion is the only destructive project tool. It first requires an in-app confirmation and returns a single-use preview token bound to the complete request and revision for ten minutes. Unknown IDs are rejected before mutation. Whole-map deletion remains a recoverable human library action and is not exposed to WebMCP.

Terrain erasing is deliberately separate: it changes terrain coverage but preserves objects, shapes, lines, and labels. Agents must inspect and explicitly delete those elements by ID if removal is intended.

## Results and lifecycle

Read tools stay visually quiet. Mutations show compact activity feedback and return a stable `ok`, `preview`, `cancelled`, or `error` envelope. Read pagination and geometry opt-in keep results bounded; oversized results return `result_too_large` instead of silently discarding the requested data.

Tool registrations are scoped to the current page and aborted when the route or component is disposed. Operation and preview caches are bounded for the page session. Capability checks happen at execution time through revision, ID, limit, and catalog validation rather than through toolbar visibility.
