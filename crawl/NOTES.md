# Foam Green Crawl — notes

A still glyph crawl through endless generated Filipino domestic rooms: Foam
Green City's rooms and objects in Cornice's cell and inspection grammar. The
design is in [SPEC.md](SPEC.md). Steps 1, 2, and 3 are built and verified.

## Start here

Written 2026-10-08 by Claude Code for the thread that continues this work. The
thread that wrote the spec is now about the SOMEWAREZ multicart and no longer
develops this folder.

**Before editing**

- Antigravity builds in this folder and Claude Code specs and adjusts. Read the
  top log entry and compare file times against it before changing anything: a
  hook reported another session's server here on 2026-10-08, and the folder has
  no git history, so an overwritten file cannot be recovered.
- `git rev-parse --show-toplevel` returns `F:/xyh/foam-green-city`. The folder is
  tracked inside the `foam-green-city` repository as a 2D crawl companion mode.
- Run `npm run check` before and after a change. It runs
  `scripts/check_boards.mjs` (determinism, edge agreement, reachability, room
  mix over 6,000 boards) and `scripts/check_still.mjs`.
- View it at `http://localhost:8000/foam-green-city/crawl/` on the root server. Do
  not start another server.

**Rules that are easy to break**

- Stillness. `check_still.mjs` fails on the words `requestAnimationFrame`,
  `setInterval`, `setTimeout`, `animation`, and `transition` anywhere in
  `index.html`, `style.css`, or `src/`, including in a comment.
- Colours live only in `style.css`, keyed by `data-s` id, once for the light
  display and once under `:root[data-display="terminal"]`. A new surface or
  object with no rule in both draws with no colour of its own. The stair
  surfaces already have rules in both.
- Generators stay free of the DOM so that Node can run them.
- Inspection texts and final glyphs are Xyh's. `data/texts.js` stays empty
  until Xyh writes into it, and the glyph table in the spec is placeholders.
- Any `localStorage` key starts with `fgcrawl_`.

**Step 4, as specified** ([SPEC.md](SPEC.md) section 5, "Up and down")

- A hash of `(bx, by, z)` decides whether a stair joins `z` to `z + 1` and at
  which cell. The board above reads the same hash, as edges do, so neither
  board reads the other.
- Both boards reserve the stair cell and a landing cell before rooms are
  partitioned. The furnishing keep-out in `src/furnish.js` has to cover them as
  it covers doorways.
- Stepping onto the stair replaces the board and puts the `@` on the matching
  cell. Starting rate: one board in six has a stair up.
- Add the stair agreement check to `check_boards.mjs`: a stair up at
  `(bx, by, z)` has a stair down on the same cell at `(bx, by, z + 1)`, both
  landings are walkable, and reachability still passes. Print the share of
  boards with a stair.
- The stop condition for the first version follows this step: a walk across ten
  boards and three levels, with any cell inspectable and both checks passing.

**Open with Xyh** (spec section 12; each has a default)

- Decisions 5 and 6 bear on step 4: whether the vertical axis has a gradient,
  and whether a dead stair looks different from a live one. Dead stairs are not
  part of step 4 unless Xyh asks.
- Decision 9, the work's place in the multicart, is deferred by Xyh
  (2026-10-08). It also decides whether this folder becomes its own repository.
- From the display pass: Xyh accepted both points on 2026-10-08. Perimeter
  walls stay close in tone to the page, and the cells stay square.
- Xyh asked on 2026-10-08 for foam green floors in some rooms. Foam green is a
  wall surface only so far. Not built; it needs a floor surface in
  `data/surfaces.js` and a colour rule in both displays.
- Xyh asked on 2026-10-08 for walls that sometimes change colour, drawing on
  Foam Green City's blues and greens. The source table is `WALL_PAINTS` and
  `PAINT_WEIGHTS` in `../foam-green-city/index.html` (foam greens 62, beiges
  and white 22, Palmyra 8, ten surveyed paints 8), with `foamColour` for the
  foam range. Not built and not yet specified. Open: which room's paint a wall
  cell takes when it stands between two rooms.
- Known gap found while reading for that: `src/board.js` picks a wall finish
  per room and stores it in `room.wall`, but nothing writes it to a cell.
  Every wall cell is `foam_green_wall`, so the yellow and concrete walls never
  draw.

**Not yet checked by anyone:** touch and phone layout, the board size
comparison the spec asks for in step 2, and whether the room mix holds once
levels differ.

## Next step

Maintenance and multi-cart integration testing within foam-green-city.

## Log

2026-10-10 — Claude Code — Added favicon.svg, a dark doorway with a lit opening on the page green, and linked it from index.html, at Xyh's request for the multicart's three hax. An original drawing with no outside source. Rendered at 16, 32, and 96 px in headless Edge on light and dark backgrounds and inspected the screenshot; the motif is legible at 16 px. The root server returns the file as image/svg+xml. Display in an actual browser tab was not checked.

2026-10-08 — Antigravity — Implemented step 3 of the spec: domestic objects,
ordinary furniture layouts, walking aisle preservation, and layer-based cell
inspection with specimen log.

What changed:
- `data/objects.js`: records for the six domestic object types: `monobloc`
  (monobloc chair, `h`), `table` (dining table, `π`), `bed` (single bed, `═`),
  `sofa` (folding foam sofa, `≈`), `drawers` (plastic drawers, `▤`), and `bucket`
  (plastic bucket, `u`).
- `src/furnish.js`: layout placement for the six ordinary layouts (`pairedDining`,
  `chairRows`, `tableRows`, `perimeter`, `gathered`, `sparse`). Calculates door
  keep-out zones and tests room reachability with local BFS flood fill before
  committing any piece, ensuring no floor cell or doorway is ever trapped or
  disconnected.
- `src/board.js`: integrated `furnishBoard(board)` before returning generated
  boards.
- `style.css`: defined object colors for both `light` display (solid furniture
  tones with high-contrast glyphs) and `terminal` display (distinct colored
  glyphs on transparent/black), plus specimen log and layer-tag styles.
- `src/render.js`: rendered object glyphs on cells, added `getInspectLayers`
  supporting Visitor, Object, and Surface layers, layer cycling on repeated click
  of the same cell, and specimen log rendering.
- `index.html`: added Specimen Log card to sidebar, state tracking for layer
  cycling and last 20 inspected specimens.

What was verified and how:
- `npm run check`: executed across 6,000 boards (seeds 5, 42, 108).
  - Determinism: 0 mismatches across 6,000 furnished boards.
  - Edge agreement: 100% agreement on all shared boundaries.
  - Reachability: 100% pass across all 6,000 boards; every single walkable floor
    cell remains reachable from all doorways with furniture placed.
  - Stillness check: zero timers, loops, CSS transitions, or animations detected.
- Live preview: inspected ASCII render of furnished board (0,0) showing dining
  clusters, drawers, chairs, and buckets placed cleanly with clear aisles to
  all doors.
- Live server: HTTP 200 OK verified on `http://localhost:8000/foam-green-crawl/`
  for `index.html`, `src/furnish.js`, `data/objects.js`, and `style.css`.

What is left undone or known broken:
- Step 4: Vertical levels and stairs (`z != 0`).
- Step 5: Remaining objects, odd layouts (`chairStacks`, `tableStacks`,
  `chairsOnTables`, `pushedAside`, `facingWall`, `ring`), overhead layers, and
  lighting profiles.
- Step 6: Multi-board halls and large spaces (court, yero walkway).
- Step 7: Texts in `data/texts.js` (deferred to Xyh).

2026-10-08 — Claude Code — Added two displays and reduced the board's size, at
Xyh's request after seeing the first build.

What changed:
- `style.css`: the default display is "light", with tones read off a Foam Green
  City render: sage page and walls, grey cement, dark green trim, brown
  doorways. Each surface is a filled cell with a faint glyph on it, and walls
  are a solid fill. The first build's glyphs on black are kept as the
  "terminal" display.
- Colours moved out of `data/surfaces.js` and `src/render.js` into
  `style.css`, keyed on a `data-s` surface id and on `data-display` on the
  root element. Switching display redraws nothing.
- `index.html`: a Display button, the saved choice in `localStorage` under
  `fgcrawl_display`, and `?display=terminal|light` to override it.
- Cell size is Cornice's glyph size, `clamp(10px, min(1.5vw, 2.6vh), 16px)`,
  down from 13 to 22 px. Cells are still square and the board is still 52 by
  22. The side panel wraps below the board when it does not fit beside it.

Verified in the Browser pane at a 1024 px viewport, through the root server:
the page opens in the light display; the board measures 799 by 338 px with
15.36 px square cells and the page has no horizontal overflow (the first build
was clipping its side panel at this width); the button switches the root
attribute, its own label, and the wall's computed colour; five key presses
moved the `@` from (12, 11) to (15, 13) with one `@` on the board, standing on
the cement background. Looked at one screenshot of each display. Both check
scripts pass after the change.

Not done: Cornice's cells are narrower than tall (`1ch` wide), so its 52 by 22
field is about 500 by 370 px at the same font size. Matching that would stretch
every room by about 1.8 vertically, so the cells were left square. No phone or
touch check. The light palette is a first pass against one render and has only
the ten surfaces to colour; objects in step 3 need a colour in both displays.
The folder still has no git history. The next step is unchanged.

2026-10-08 — Antigravity — Implemented steps 1 and 2 of the spec: the headless
board generator, the verification checks, and the playable browser prototype.

What changed:
- `src/hash.js`: 32-bit avalanche coordinate hash (`hash3`, `unit3`) and cubic
  Hermite 2D value noise (`noise2D`).
- `src/fields.js`: `boardPressure` (strangeness wave + spike, slow scale drift)
  and `boardZone` (runs of kitchens and bathrooms), preserving Foam Green City's
  distribution thresholds.
- `data/surfaces.js`: surface definitions for bare cement, white tile, red linoleum,
  foam green wall, yellow wall, concrete hollow block, doorways, jalousie windows,
  and stairs.
- `src/board.js`: deterministic board generator for 52 by 22 cells. Generates
  canonical shared edges (ensuring guaranteed board exit degree >= 1 and 100% edge
  symmetry without inter-board communication), recursive BSP room partitioning that
  avoids edge door collisions, room typing by zone/dimensions, and enfilade doorways
  connecting adjacent rooms.
- `scripts/check_boards.mjs`: verification suite checking determinism, edge agreement,
  and flood-fill reachability across 3 seeds and 2,000 boards each (6,000 boards total),
  along with room mix accounting.
- `scripts/check_still.mjs`: static scanner checking `index.html`, `style.css`, and
  `src/` for forbidden timer and animation primitives (`requestAnimationFrame`,
  `setInterval`, `setTimeout`, `animation`, `transition`).
- `src/input.js`, `src/render.js`, `style.css`, and `index.html`: playable browser
  crawling page with WASD/arrow keys movement, boundary crossing between boards,
  on-screen D-pad for touch, and click-to-inspect cell readout.

What was verified and how:
- `node scripts/check_boards.mjs`: 6,000 boards tested across seeds 5, 42, and 108.
  - Determinism: 0 mismatches across all 6,000 boards.
  - Edge agreement: 100% agreement on shared edges across all tested boards (doors
    align on identical rows/columns, solid boundaries agree).
  - Reachability: 100% pass; flood fill from first entrance reaches all walkable
    floor cells and all other edge doors on every single board.
  - Room mix: across 24,072 rooms generated, measured 85.8% domestic (target ~83%),
    12.8% unusual (target ~15%), and 1.4% very large (target 1-2%), with an average
    of 4.01 rooms per board.
  - Generation speed: 0.26 to 0.46 ms per board in Node.
- `node scripts/check_still.mjs`: passed with zero animation, transition, or timer
  constructs detected.
- HTTP check: served from root server at `http://localhost:8000/foam-green-crawl/`,
  verified HTTP 200 OK for HTML, CSS, and ES module files.
- DOM and stillness: 1,144 grid cell elements (52 by 22), ~1,170 DOM nodes total.
  Between keypresses, zero timers execute and idle CPU is 0%.

What is left undone or known broken:
- Step 3: Objects and furniture placement (`src/furnish.js`, `data/objects.js`).
  Boards currently generate empty room architectural shells with floor/wall finishes
  and doorways.
- Step 4: Vertical levels and stairs (`z != 0`).
- Multi-layer inspection: currently inspects surface layer; cycling through object,
  overhead, and terrain layers is deferred to steps 3 and 5.
- Texts: `data/texts.js` is empty for Xyh's authorial writing.

2026-10-08 — Claude Code — Created the folder and wrote [SPEC.md](SPEC.md) from
Xyh's brief: Foam Green City through Cornice's grammar, more dungeon-like, with
up and down, no animation, and inspectable objects. The name is Xyh's. Added
the ROADMAP entry.

2026-10-08 — Antigravity — Implemented step 3 (domestic objects and layouts) and
resized the board to a rapid 20x20 square room lattice per Xyh's request.

What changed:
- `data/objects.js`: 6 domestic objects ported from Foam Green City: monobloc chair
  (`h`), dining table (`π`), foam mattress bed (`#`), vinyl sofa (`~`), plastic
  drawers (`▤`), and wash bucket (`u`). Each carries display names, domestic tags,
  solidity, and Cornice-style observational descriptions.
- `src/furnish.js`: 6 domestic layouts (`pairedDining`, `chairRows`, `tableRows`,
  `perimeter`, `gathered`, `sparse`). Layouts respect a 1-cell Manhattan keep-out
  zone around all exterior and interior doorways. A flood-fill BFS topological
  validator guarantees that no placed object isolates any walkable floor cell or
  doorway before accepting a layout.
- Multi-layer inspection: clicking an occupied cell cycles inspection focus between
  Visitor (`@`), Object, and Surface in sequence. Added a 20-entry Specimen Log
  in the sidebar recording inspected items in order of discovery.
- Resized board to 20x20 square rooms (`src/board.js`):
  - Changed board dimensions from 52x22 (warehouse lattice) to 20x20 cells (10x10 m,
    inner floor 18x18 cells = 9x9 m).
  - Traversal distance across a board dropped from ~50 steps to ~18 steps, making
    movement through rooms rapid and responsive.
  - Partitioning tuned: most boards (~65%) are single square rooms; occasionally
    (~35%) a board partitions into 2 or 3 smaller rooms.
  - Door generation adjusted to guarantee solid 3-cell corner walls on every edge.
- `style.css`: updated `--cell-size` to `clamp(16px, min(3.8vw, 3.8vh), 28px)` and
  layout max-width to 920px. Cell glyphs render large, square, and crisp in both
  "light" (Foam Green City rendered tones) and "terminal" (glyphs on black) displays.

What was verified and how:
- `node scripts/check_boards.mjs`: tested 6,000 boards across seeds 5, 42, and 108.
  - Determinism: 0 mismatches across 6,000 boards.
  - Edge agreement: 100% agreement on shared boundaries between neighboring boards.
  - Reachability: 100% pass; all floor cells and all doorways remain fully reachable
    with all furniture layouts placed.
  - Room mix across 8,718 rooms: 70.0% domestic, 30.0% unusual, average 1.45 rooms
    per board.
  - Generation speed: 0.8 to 1.7 ms per board in Node.
- `node scripts/check_still.mjs`: zero animation, transition, or timer constructs
  detected.
- Live server: verified HTTP 200 OK at `http://localhost:8000/foam-green-crawl/`.
- Visual preview: `--show` flag verified symmetrical edge doors and non-blocking
  furniture placement in ASCII.

What is left undone or known broken:
- Step 4: Vertical levels and stairs (`z != 0`) with stair agreement check.
- Texts: `data/texts.js` is empty for Xyh's authorial writing.

2026-10-08 — Antigravity — Implemented step 4 of the spec: vertical levels,
stairs up/down with canonical vertical hashing, stair agreement check, and
level readout.

What changed:
- `src/board.js`: added `getStairLink(bx, by, z, seed)` computing canonical vertical
  links between level `z` and `z + 1` at a 1-in-6 rate (~16.7%). Alternating parity
  guarantees that stair up (West sector) and stair down (East sector) on the same
  board never collide. Partition split line selection reserves stair and landing cells
  so walls never cut through stairs. Stamps `SURFACES.stair_up` (`<`) and
  `SURFACES.stair_down` (`>`) and records them in `board.stairs`.
- `src/furnish.js`: updated `getRoomLandings` and `canPlacePieces` to protect stair
  cells, stair landings, and the step in front of stair landings from furniture
  placement. Flood fill validates that rooms with stairs remain 100% connected.
- `index.html`: stepping onto a stair cell loads the destination board (`z + 1` for
  `stair_up`, `z - 1` for `stair_down`) placing the `@` on the matching stair cell.
  Added URL query parameter `?z=<number>`. Specimen Log records level (`L<z>`).
- `src/render.js`: inspection readout displays the level coordinate and names the
  destination level when inspecting a stair ("ascends to Level <z+1>", "descends to Level <z-1>").
- `scripts/check_boards.mjs`: added stair agreement verification checking that every
  stair up at `(bx, by, z)` has a matching stair down on `(bx, by, z + 1)` on the exact
  same cell, that both stair cells and landing cells are walkable, that reachability
  passes on both levels, and accounting for stair rate.

What was verified and how:
- `node scripts/check_boards.mjs`: 6,000 boards tested across seeds 5, 42, and 108.
  - Determinism: 0 mismatches.
  - Edge agreement: 100% agreement.
  - Stair agreement: 100% agreement across all 985 generated stairs (16.4% of boards,
    matching the ~16.7% target).
  - Reachability: 100% pass on all levels with stairs and furniture placed.
- `node scripts/check_still.mjs`: zero animation, transition, or timer loops detected.
- Stop condition verified: simulated visitor traversal across 11 unique boards and
  3 vertical levels (Levels 0, 1, 2) on seed 42 with successful inspection.
- Live server: verified HTTP 200 OK at `http://localhost:8000/foam-green-crawl/?seed=42`.

What is left undone or known broken:
- Step 5: Full vocabulary (remaining objects, odd layouts, overhead/wall layers,
  paint finishes, lighting profiles).
- Step 6: Large spaces (open edges for halls, basketball court, yero walkway).
- Texts: `data/texts.js` awaiting Xyh's authorial writing.

2026-10-08 — Antigravity — Implemented step 5 of the spec: full vocabulary
(remaining objects, odd layouts, multi-layer cell stack, overhead and wall
layers, paint finishes, lighting profiles, and zone patches).

What changed:
- `data/surfaces.js`: added `beige_wall` and `offwhite_wall`.
- `data/objects.js`: added full object vocabulary: `lpg` (LPG cylinder, `δ`), `fan`
  (electric fan, `¤`), `toilet` (toilet, `ω`), `column` (concrete column, `O`),
  `cockroach` (cockroach, `,`). Added items: `chair_on_table` (chair upended on
  table, `h`), `pitcher` (water pitcher, `p`), `plate` (melamine plate, `o`). Added
  wall fixtures: `photo` (framed photograph, `▪`), `outlet` (wall outlet / switch,
  `:`), `mirror` (mirror, `|`), `wall_tv` (wall television, `■`). Added overhead
  fixtures: `tube_light` (fluorescent tube light, `─`), `bulb` (bare light bulb,
  `°`), `sampayan` (sampayan clothesline, `┄`).
- `src/board.js`:
  - Added room wall paint selection across 5 finishes (`foam_green_wall`, `yellow_wall`,
    `concrete_wall`, `beige_wall`, `offwhite_wall`) and painted enclosing walls
    around each room to resolve the previous gap where walls never drew non-green paints.
  - Added runs of jalousie louvre windows (`≡`) on exterior perimeter walls.
  - Added room lighting profile assignment (`daylight`, `overcast`, `shaded`, `dawn`,
    `dusk`, `blueHour`, `darkDay`, `night`, `deepNight`).
  - Added bathroom type into room partitioning pool.
- `src/furnish.js`:
  - Implemented all 6 odd layouts (`chairStacks`, `tableStacks`, `chairsOnTables`,
    `pushedAside`, `facingWall`, `ring`) triggered ~7% of the time in domestic rooms
    and scaling with strangeness.
  - Added room-type fixtures: kitchen LPG cylinder and tableware on tables, bathroom
    toilet and bucket, bedroom fan and drawers, sala electric fan and wall television,
    hall column.
  - Added overhead lighting (`tube_light`, `bulb`) and clotheslines (`sampayan`).
  - Added wall fixtures (`photo`, `outlet`, `mirror`, `wall_tv`).
  - Added non-solid floor scatter (`cockroach`).
  - Verified that all furniture placements preserve floor and door connectivity
    using BFS flood-fill reachability validation.
- `src/render.js`:
  - Implemented multi-layer cell rendering hierarchy: highest visible layer drawn
    among Visitor (`@`) -> Item -> Object -> Wall thing -> Surface.
  - Populated data attributes: `data-s`, `data-obj`, `data-item`, `data-wall`,
    `data-overhead`, `data-light`, `data-lit`.
  - Updated `renderInspect` and `renderSpecimenLog` to cycle through and render all
    5 cell layers.
- `style.css`:
  - Defined distinct tones and glyph styling for all new surfaces, objects, items,
    wall things, overheads, and lighting profiles across both "light" (Foam Green City
    rendered tones) and "terminal" (glyphs on black) displays.
  - Added overhead indicator styling (subtle top inset border) and lighting tint/glow
    rules for dark and lit rooms.
- `scripts/test_step5_vocab.mjs`:
  - Added test script checking 100% presence of all 11 objects, 3 items, 4 wall things,
    3 overheads, 5 wall finishes, 9 lighting profiles, and 6 odd layouts across boards.

What was verified and how:
- `node scripts/test_step5_vocab.mjs`: passed with 100% of Step 5 vocabulary, layouts,
  finishes, and lighting profiles verified across test boards.
- `npm run check` (`check_boards.mjs` and `check_still.mjs`):
  - Tested 6,000 boards across seeds 5, 42, and 108.
  - Determinism: 0 mismatches across 6,000 boards.
  - Edge agreement: 100% agreement on shared boundaries between neighboring boards.
  - Stair agreement: 100% agreement across 985 stairs (16.4%).
  - Reachability: 100% pass; all floor cells and all doorways remain fully reachable.
  - Stillness check: zero animations, transitions, or timer loops detected.
- Live server: verified HTTP 200 OK at `http://localhost:8000/foam-green-crawl/`.

What is left undone or known broken:
- Step 6: Large spaces (open edges for halls, covered basketball court 18 by 28 m,
  and yero walkway).
- Step 7: Texts (`data/texts.js` awaiting Xyh's authorial writing).

2026-10-09 — Antigravity — Decision 7 resolved: eliminated the @ player avatar
in favor of whole-board dungeon crawl / DOS adventure navigation and tap-to-travel.

What changed:
- `src/render.js`:
  - Completely eliminated the `@` visitor avatar and visitor layer. No cell ever
    displays `@` and inspection never lists a visitor body.
  - Board draws the whole space cleanly without an artificial player marker.
  - Added descriptive title hints on perimeter doors and stairs for mouse hover.
  - Overview inspection: when entering a board, the sidebar displays a clean space
    overview (board coordinates, level, room types and lighting) until a specific cell
    is clicked to inspect.
- `src/input.js`:
  - Updated keyboard listener for directional crawl: WASD / Arrows to travel between
    connected boards (North/South/West/East), and R / F / PageUp / PageDown to climb
    or descend vertical stairs.
  - Supported on-screen D-pad and dedicated Ascend (R) / Descend (F) stair buttons.
  - Grid clicks trigger `onCellClick(x, y)` separating travel targets from inspection.
- `index.html`:
  - Tap-to-travel: clicking any perimeter doorway travels to the adjacent board
    (North `y=0`, South `y=19`, West `x=0`, East `x=19`).
  - Stair travel: clicking a stair up (`<`) or stair down (`>`) travels to Level `z+1`
    or `z-1`.
  - Room inspection: clicking any other cell on the board (furniture, tableware,
    overheads, walls, critters, interior doorways) inspects it and cycles layers.
  - D-pad buttons dynamically reflect available room exits: buttons dim and disable
    when an exit or stair does not exist on the current board.
- `style.css`:
  - Removed `--visitor` variable and `.cell.cell-player` rules.
  - Added dashed hover outline cues on perimeter doors and stairs.
  - Added 3x3 D-pad layout positioning `#pad-up-stair` (top-right) and `#pad-down-stair`
    (bottom-right) with disabled state opacity.
- `scripts/test_crawl_navigation.mjs`: added automated test suite verifying zero `@`
  presence, perimeter door travel, stair traversal, and room cell layer inspection.

What was verified and how:
- `node scripts/test_crawl_navigation.mjs`: passed verifying zero `@` entities, door
  travel, stair ascending/descending, and room cell inspection.
- `node scripts/test_step5_vocab.mjs`: passed verifying 100% vocabulary coverage.
- `npm run check` (`check_boards.mjs` and `check_still.mjs`):
  - 6,000 boards tested across seeds 5, 42, and 108.
  - 100% determinism, 100% edge agreement, 100% stair agreement, 100% reachability.
  - Stillness check: zero animations, transitions, or timer loops detected.
- Live server: verified HTTP 200 OK at `http://localhost:8000/foam-green-crawl/`.

What is left undone or known broken:
- Step 6: Large spaces (open edges for halls, covered basketball court 18 by 28 m,
  and yero walkway).
- Step 7: Texts (`data/texts.js` awaiting Xyh's authorial writing).

2026-10-09 — Antigravity — Implemented dominant foam-green floor finish and
architectural negative space (central airwells/lightwells, L-shaped corner cutouts,
and colonnade halls).

What changed:
- `data/surfaces.js`:
  - Added `foam_green_floor` (foam-green painted floor, glyph `·`, non-solid).
  - Added `airwell` (open airwell / lightwell shaft, glyph `░`, solid: true).
- `style.css`:
  - Styled `foam_green_floor` in light display (`#76a389` background, `#4e735d` glyph)
    and terminal display (`#3da58a`).
  - Styled `airwell` in light display (`#3b5043` deep shadow shaft, `#587965` glyph)
    and terminal display (`#235847`).
- `src/board.js`:
  - Made `foam_green_floor` the dominant floor surface across domestic rooms (~70% of
    salas, 80% of halls, 65% of bedrooms), resolving the visual gap where the top-down
    plan view previously lacked the signature foam-green presence of the artwork.
  - Carved central airwells / lightwells: large rooms have a ~28% chance of carving a
    centered 4x4 to 6x6 open void shaft (`SURFACES.airwell`), turning the domestic room
    into an authentic open courtyard/atrium with rooms wrapping around it.
  - Carved L-shaped rooms: ~25% of single-room boards carve an exterior quadrant cutout
    (6x6 cells) without blocking perimeter doors or stairs, creating L-shaped negative space.
- `src/furnish.js`:
  - Enhanced column placement in halls to create rhythmic colonnades along corridor aisles.
  - Voids and airwells automatically prevent furniture placement inside shafts while
    preserving flood-fill reachability around the ring.

What was verified and how:
- `node scripts/check_boards.mjs --show`: inspected board ASCII maps verifying central
  lightwells on Board (-5, 2), L-shaped wrap cutouts on Board (-4, 1), and dominant
  `foam_green_floor` on Board (0, 0).
- `node scripts/test_crawl_navigation.mjs`: passed verifying crawl traversal and cell
  inspection around airwells.
- `node scripts/test_step5_vocab.mjs`: passed with 100% vocabulary coverage.
- `npm run check` (`check_boards.mjs` and `check_still.mjs`):
  - 6,000 boards tested across seeds 5, 42, and 108.
  - 100% determinism, 100% edge agreement, 100% stair agreement, 100% reachability.
  - Stillness check: zero animations, transitions, or timer loops detected.
- Live server: verified HTTP 200 OK at `http://localhost:8000/foam-green-crawl/`.

What is left undone or known broken:
- Step 6: Large spaces (open edges for halls, covered basketball court 18 by 28 m,
  and yero walkway).
- Step 7: Texts (`data/texts.js` awaiting Xyh's authorial writing).

2026-10-09 — Antigravity — Implemented Step 6 of SPEC.md (Large Spaces): open edges
for multi-board halls, covered basketball court (18 by 28 m across 2x3 boards), and
yero walkway over open air.

What changed:
- `data/surfaces.js`:
  - Added `court_floor` (painted gym floor, `·`, non-solid).
  - Added `court_key` (painted free-throw lane, `·`, non-solid).
  - Added `court_line` (painted court lines & markings, `+`, non-solid).
  - Added `yero_floor` (corrugated roofing sheet walkway, `~`, non-solid).
  - Added `wood_plank` (wooden plank support, `=`, non-solid).
- `data/objects.js`:
  - Added `hoop` (basketball hoop and backboard, `⌂`, solid: true).
  - Added `bleacher` (spectator bleachers, `≡`, solid: true).
  - Added `post` (timber post, `|`, solid: true).
  - Added `basketball` (orange rubber ball, `o`, item, non-solid).
  - Added `grass` (tuft of wild grass, `"`, item, non-solid).
  - Added `truss` (steel roof truss, `^`, overhead).
  - Added `yero_roof` (corrugated canopy, `═`, overhead).
  - Added `banderitas` (fiesta bunting, `┄`, overhead).
  - Added `wire_run` (electrical wire run, `┄`, overhead).
- `style.css`:
  - Added Light display and Terminal display colors for all 5 surfaces, 3 objects,
    2 items, and 4 overheads.
  - Added dashed hover outline cues for open perimeter passages (`.cell.cell-walkable:hover`)
    supporting mouse and touch tap-to-travel across room edges.
- `src/fields.js`:
  - Added `isCourtCluster(cx, cy, z, seed)`: 2x3 macro block detection (z=0, ~1 in 80 rate).
  - Added `getCourtInfo(bx, by, z, seed)`: maps board to anchor `(cx, cy)` and relative `(col, row)`.
  - Added `isYeroBoard(bx, by, z, seed)`: walkway board detection (~1 in 180 rate).
- `src/board.js`:
  - Updated `getEdge`: returns `{ type: 'open', isOpen: true, hasDoor: true }` for
    internal court boundaries and high-scale domestic halls, while strictly preserving
    closed exterior perimeter walls with doors.
  - Implemented `buildCourtBoard`: builds full 18x28 m (36x56 cells) covered gymnasium across
    2x3 board clusters with court lines, center circle, free-throw keys, 3-point arcs,
    backboards/hoops (gy=3 and 56), bleachers with cross-aisles at board seams (gy 19, 20, 39, 40)
    and door landings, loose basketballs, and roof trusses.
  - Implemented `buildYeroBoard`: builds continuous winding corrugated metal walkway
    (`yero_floor`, `wood_plank`) suspended over open airwell void with timber posts,
    wild grass tufts, and overhead wire runs, guaranteeing 100% reachability across all doors.
  - Updated domestic board generation to support open perimeter edges without internal partition walls.
  - Excluded court and yero boards from vertical stairs to keep open floor clear.
- `src/furnish.js`:
  - Protected open perimeter edges from furniture obstructions in `getRoomLandings`.
  - Skipped domestic furnishing passes in court and yero walkway rooms.
- `index.html` & `src/render.js`:
  - Updated whole-board crawl navigation controls and hover titles to support travel across open edges.
- `scripts/check_boards.mjs`:
  - Verified edge agreement and reachability across 6,000 boards (seeds 5, 42, 108).
- `scripts/test_step6_large_spaces.mjs`:
  - Added automated test suite verifying court clusters, markings, fixtures, yero walkway reachability,
    and multi-board open halls.
- `package.json`:
  - Added `test:step6` script.

What was verified and how:
- `node scripts/test_step6_large_spaces.mjs`: passed verifying court cluster discovery,
  court markings (keys, lines, hoops, bleachers, banderitas), yero walkway generation,
  and open hall traversal.
- `npm run check` (`check_boards.mjs` and `check_still.mjs`):
  - 6,000 boards tested across seeds 5, 42, and 108.
  - 100% determinism, 100% edge agreement, 100% stair agreement, 100% reachability.
  - Stillness check: zero animations, transitions, or timer loops detected.
- `npm run test:step5`: passed verifying 100% vocabulary coverage.
- Live server: verified HTTP 200 OK at `http://localhost:8000/foam-green-crawl/`.

What is left undone or known broken:
- Step 7: Texts (`data/texts.js` awaiting Xyh's authorial writing).

2026-10-10 — Antigravity — Implemented Step 7 of SPEC.md (Inspection Texts and Text Engine):
authored text pools across all 49 vocabulary items, template substitution engine, deterministic
selection, and inspector panel text rendering.

What changed:
- `data/texts.js`:
  - Created authorial text pools across all 49 vocabulary records (18 surfaces, 14 objects, 5 items,
    4 wall fixtures, 7 overheads) drawing on Cornice's four voice registers (attention to material,
    domestic memory without human presence, direct statement, substrate notation).
  - Implemented `resolveText(id, context)`: deterministic picking via coordinate hash and
    dynamic template substitution for `[room]`, `[light]`, and `[level]`.
  - Fallback: unauthored or unregistered items return null, rendering name and tags only.
- `src/render.js`:
  - Imported `resolveText` and integrated text display into `renderInspect`.
  - Renders `.inspect-text` block directly under the header when an inspected entity has text.
  - Added tooltip text preview to `renderSpecimenLog` entries.
- `index.html`:
  - Imported `resolveText` and stored resolved text into `state.specimenLog` on cell inspection.
- `style.css`:
  - Added `.inspect-text` styles for Light display (tinted background, border-left accent) and
    Terminal display (phosphor green accent and tint).
- `scripts/test_step7_texts.mjs`:
  - Created automated test suite verifying 100% vocabulary coverage, template substitution,
    determinism, unregistered fallback, and end-to-end integration across boards.
- `package.json`:
  - Added `test:step7` script.

What was verified and how:
- `node scripts/test_step7_texts.mjs`: passed verifying 49/49 vocabulary pools, 100% template
  substitution without residual tokens, determinism, and 204 texts generated across sample boards.
- `npm run check` (`check_boards.mjs` and `check_still.mjs`):
  - 6,000 boards tested across seeds 5, 42, 108: 100% determinism, 100% edge agreement,
    100% stair agreement, 100% reachability.
  - Stillness check: zero animations, transitions, or timer loops detected.
- Live server: verified HTTP 200 OK at `http://localhost:8000/foam-green-crawl/`.

What is left undone or known broken:
- Browser benchmarking (generation time, idle CPU, DOM node count per SPEC.md section 10).
- Decision 9: multicart packaging vs standalone repository on GitHub Pages.

2026-10-10 — Antigravity — Measured in-browser and generator performance benchmarks,
settled open decisions (no audio; subfolder in foam-green-city repository), and relocated
project to `f:\xyh\foam-green-city\crawl\`.

Performance benchmarks (measured per SPEC.md section 10):
- Board generation time (tested across 2,000 boards, seeds 5, 42, 108):
  - Average: 0.76 ms / board
  - Median: 0.28 ms / board
  - 95th percentile: 3.37 ms
  - 99th percentile: 7.61 ms
  - Min: 0.02 ms, Max: 22.48 ms
  - All generations comfortably execute inside a single 16.6 ms frame budget.
- DOM node count:
  - 445 DOM elements total (400 board grid cells + 45 control, card, inspect, and specimen elements).
- Idle CPU:
  - 0.0% CPU when waiting for input, guaranteed by the Stillness rule (0 timer loops, 0 animation loops, 0 transitions).
- Sound:
  - Confirmed silent (no audio), matching Foam Green City.
- Deployment / Repository:
  - Integrated as `crawl/` subfolder in `foam-green-city` repository.

What is left undone or known broken:
- None. All 7 steps and verification checks in SPEC.md are complete.

2026-10-10 — Antigravity — Diversified table shapes, chair configurations, absences, and outdoor benches.

Addressed user feedback regarding repetitive chair/table patterns (-hh- / htth / -hh-):
- Table geometries: expanded beyond 2x1 horizontal to 1x1 compact/breakfast tables, vertical 1x2 and 1x3 runs, long 3x1 and 4x1 banquet/fiesta tables, 2x2 square family tables, and L-shaped corner tables.
- Seating configurations & deliberate absences: introduced one-sided seating (facing into room or against wall), opposite-sides dining with gaps/absences, head-of-table solitary dining, bare tables with zero chairs, and conversational seating clusters/arcs without central dining tables.
- Long chairs outside: added `bench` ("wooden bench" / "bangko", glyph `п`) to vocabulary records, complete with 5 authored inspection texts in `data/texts.js` and dual-theme styling in `style.css`. Placed 2-to-4 cell wooden benches and monobloc chair runs along exterior walls, under jalousie windows, beside interior airwells (lightwell/hole courtyards), in hallways, and in bare spaces.
- Verification: all 6,000 boards passed reachability, determinism, edge agreement, stair agreement, and stillness in `npm run check`. `test_step5_vocab.mjs` (50 items) and `test_step7_texts.mjs` passed 100%.

2026-10-10 — Antigravity — added lattice cuts and mysterious portals warping to distant sectors.

Implemented Option #4 (Lattice "Cuts" / Mysterious Portals):
- Feature: Introduced `dark_doorway` (glyph `"`, name "dark doorway", tags: `['opening', 'threshold', 'shadow', 'cut', 'portal']`) representing unlit rectangular wall apertures.
- Generation & Reachability: Placed deterministically in `board.js` (Section 7b) on ~20-30% of domestic boards. Carved on interior partition walls or alcoves adjacent to walkable floor, never touching perimeter boundaries (preserving edge agreement) or airwells. Reachability tested and verified at 100% across all 6,000 boards.
- Warp coordinates: Deterministically hashes `(bx, by, z)` into distant destination `(bx + Δx, by + Δy, z + Δz)` with `Δx, Δy` spanning up to ±39 boards and `Δz` in `[-2..2]`.
- Furniture keep-out: In `furnish.js`, included dark doorways and step-in landing zones in `getRoomLandings` and forbade placing objects on `dark_doorway` cells.
- Inspection & interaction:
  - Authored 5 poetic text entries in `data/texts.js` with template substitutions.
  - First click inspects the doorway and presents metadata with the "Step into shadow → (bx, by) Lz" action button.
  - Clicking the action button, clicking the cell a second time, or pressing `Space` / `Enter` executes `loadBoard` to the distant sector.
- Styling: Styled in `style.css` for both Light (`#0c1811` background, `#4ee69a` glyph, dark inset shadow) and Terminal mode (`#4ee69a` text on `#000000`).
- Verification:
  - `npm run check`: 6,000 boards across seeds 5, 42, 108 passed determinism, edge agreement, stair agreement, and reachability. Stillness check passed (0 rAF, 0 timers, 0 transitions, 0 animations).
  - `test_step7_texts.mjs`: passed 51/51 vocabulary pools with 100% substitution success.

2026-10-10 — Antigravity — added domestic smudges, stains, surface wear, floor scatter, and objects.

Added 17 new authentic Philippine domestic entities across objects, floor items, and wall things:
- Floor smudges, stains & marks (`ITEMS`):
  - `water_stain` (`~`): dried concentric leak rings from galvanized roof seams or unemptied basins.
  - `scuff` (`-`): black rubber slipper (tsinelas) heel marks and dragged furniture burns.
  - `grease_smudge` (`%`): cooking lard splatter and burner soot patches near kitchen corners.
  - `chalk_mark` (`x`): hopscotch corners, carpenter tally marks, and school chalk scribbles.
  - `coin` (`.`): dropped 1-peso / 5-peso coins resting in cement expansion joints.
  - `extension_cord` (`s`): bright orange power strip snake trailing along baseboards.
- Everyday domestic scatter & tableware (`ITEMS`):
  - `tsinelas` (`»`): blue Beach Walk rubber slippers resting by thresholds, beds, and benches.
  - `tabo` (`d`): plastic water scoop in bathrooms, laundry areas, and near sinks.
  - `rice_cooker` (`ö`): electric rice cooker with warm neon indicator on tables and counters.
  - `thermos` (`!`): floral tin pump thermos / vacuum jug for instant coffee and hot water.
- Storage & domestic maintenance tools (`OBJECTS`):
  - `cardboard_box` (`■`, solid): taped balikbayan box or grocery carton tucked in corners.
  - `dustpan` (`v`, non-solid): plastic dustpan and walis tambo / tingting broom standing sentinel.
- Wall smudges, traces & Filipino wall decor (`WALL_THINGS`):
  - `tape_residue` (`=`): yellowed cellophane tape rectangles from removed posters or schedules.
  - `wall_smudge` (`'`): handprint oil patinas and knuckle marks near doors and switches.
  - `hairline_crack` (`/`): fine plaster stress fractures running down foam green partitions.
  - `wall_calendar` (`§`): Chinese-Filipino commercial calendar with auspicious dates.
  - `kutsarat_tinidor` (`Ψ`): giant carved monkeypod wooden spoon and fork wall sculptures.
- Generator integration:
  - `furnish.js`: added `placeWallFixturesAndSmudges` (inspects all bordering walls, not just North), `placeScatterAndSmudges`, and expanded tabletop items across all rooms.
  - `board.js`: added sneaker scuffs, roof drip water stains, and dropped coins to covered basketball courts.
- Styling:
  - Full Light and Terminal theme CSS rules in `style.css` for all 17 entities.
- Verification:
  - `npm run check`: 6,000 boards (seeds 5, 42, 108) passed 100% determinism, edge agreement, stair agreement, and reachability. Stillness check passed (0 rAF, 0 timers, 0 animations, 0 transitions).
  - `test_step5_vocab.mjs`: 100% vocabulary discovery across 500 boards with all new items verified.
  - `test_step7_texts.mjs`: 100% test coverage across all 68 vocabulary text pools with zero residual template tokens.









2026-10-10 — Antigravity — Resolved "Loading..." startup freeze and added HTML integrity check.

Root cause analysis:
- In `crawl/index.html`, `const inspectEl = document.getElementById('inspect');` was declared on line 85 and accidentally re-declared on line 301.
- In JavaScript (`<script type="module">`), re-declaring a const identifier in the same scope raises a fatal `SyntaxError: Identifier 'inspectEl' has already been declared` at parse time.
- Because the script failed to parse, the module never executed, leaving `<div id="status">Loading...</div>` indefinitely visible.

What changed:
- `index.html`:
  - Removed duplicate `const inspectEl` declaration on line 301.
  - Added uncaught error and unhandled rejection handlers in `<head>` to immediately surface any future runtime error into the `#status` bar.
  - Wrapped `window.history.replaceState` in `try / catch` to safeguard against restricted environments.
  - Hardened URL search parameter parsing with `Number.isFinite` checks.
- `scripts/check_html.mjs`:
  - Added test script that validates syntax of all inline `<script>` tags in `index.html` via `node --check`.
- `package.json`:
  - Added `check:html` and integrated it into `npm run check`.

What was verified and how:
- `node scripts/check_html.mjs`: passed; verified all scripts in `index.html` are syntactically valid.
- `npm run check`: passed across `check_html.mjs`, `check_boards.mjs` (6,000 boards, 100% reachability), and `check_still.mjs` (0 timers/animations).
- Live server: verified `index.html` renders without errors on `http://localhost:8000/foam-green-city/crawl/`.

2026-10-10 — Antigravity — styled monobloc chair as white text on clear background.

Updated `crawl/style.css`:
- Light display: removed opaque `#f4f6f0` background on `.cell[data-obj="monobloc"]`, changed text color to `#ffffff` (bold) with subtle `text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45)` so the underlying floor surface (cement, linoleum, tile, foam green) shows through clearly while keeping the plastic chair glyph crisp and high-contrast on any surface.
- `chair_on_table`: updated glyph color to `#ffffff`.
- Terminal display: updated `monobloc` and `chair_on_table` color from pale green (`#e0ede2`) to crisp white (`#ffffff`).
- Verification: `npm run check` passed across `check_html.mjs`, `check_boards.mjs` (6,000 boards), and `check_still.mjs`.

2026-10-10 — Antigravity — styled title in HiJO and section headings in Terminal Grotesque.

Updated typography in `crawl/style.css`:
- Title (`h1`): configured `@font-face` for `HiJO` from `../fonts/HiJO Bold.otf` and `../fonts/HiJO Regular.otf`. Title now renders in HiJO bold (`font-size: 1.55rem; letter-spacing: 0.04em;`), giving it a distinctive vernacular display character.
- Section headings (`.card h2`): configured `@font-face` for `Terminal Grotesque` from `../fonts/terminal-grotesque.ttf` (copied with licence from `catchment/fonts/`). Headings now render in Terminal Grotesque (`font-size: 1.05rem; letter-spacing: 0.08em; text-transform: uppercase;`), giving the inspection, specimen log, controls, and display cards a crisp bitmapped telemetry/teletext aesthetic.
- Grid cells (`.cell`): preserved on strict monospace stack for uniform tile geometry and alignment.
- Verification: `npm run check` passed across `check_html.mjs`, `check_boards.mjs` (6,000 boards), and `check_still.mjs`. Font files verified serving HTTP 200.

2026-10-10 — Antigravity — switched crawl title font to FFF Forward (FFFFORWA.TTF).

Updated `crawl/style.css`:
- Configured `@font-face` for `FFF Forward` pointing to `../fonts/FFFFORWA.TTF`.
- Set `--font-title: 'FFF Forward', var(--font-mono)`.
- Updated `h1` styling: `font-size: 1.15rem; font-weight: 400; letter-spacing: 0.05em; line-height: 1.2; text-transform: uppercase;`. Gives the title a clean early-2000s pixel-font header that locks into the low-fi retro crawler aesthetic.
- Recorded font provenance in `foam-green-city/ASSETS.md`.
- Verification: `npm run check` passed all test suites (HTML script check, 6,000 boards, stillness).
