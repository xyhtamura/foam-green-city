# Foam Green Crawl — spec

Written 2026-10-08 by Claude Code from Xyh's brief. Nothing is built. Sections 1
and 2 record the brief and the two sources; everything from section 3 on is a
proposal, and section 12 lists the decisions that are Xyh's.

## 1. Brief

Xyh's statement, 2026-10-08, condensed:

- Foam Green City through Cornice's grammar. Objects and things turn into glyphs.
- The work is about moving through endless generated rooms, and it is more
  dungeon-like than Foam Green City.
- It can introduce up and down.
- No animations. Everything is still.
- Objects can still carry things to read when inspected.
- The name is Foam Green Crawl.

## 2. Sources

**Cornice** ([`../cornice/index.html`](../cornice/index.html),
[handover](../cornice/cornice_handover.md)) supplies the grammar:

- A grid of cells. Each cell holds a floor or wall tile, an optional overhead
  tile, and an optional entity. The glyph is a skin over a data object with an
  `id`, `name`, `type`, `zLayer`, `solid`, `color`, `tags`, and `whispers`.
- One body, `@`, moves one cell per key press. A solid tile or entity blocks it.
- Clicking any cell inspects it, at any distance. Clicking the same cell again
  cycles its layers: entity, overhead, terrain. The scan panel shows a name, one
  text, and the tags. A specimen log keeps the last 20 inspections.
- Tags are compound, so one object can belong to several kinds at once.

**Foam Green City** ([`../foam-green-city/`](../foam-green-city/README.md),
[concept](../foam-green-city/CONCEPT.md)) supplies the material:

- The object vocabulary of a lower-middle-income Filipino household: monobloc
  chairs, tables, folding foam sofas, plastic drawers, buckets, an LPG cylinder,
  jalousie windows, curtains, small framed photographs, tube lights and bare
  bulbs, sampayan lines, PVC pipe runs, wire runs, and static cockroaches.
- Room types: sala, kitchen, bedroom, bathroom, bare, hall, auditorium.
- Twelve furniture layouts: `chairRows`, `tableRows`, `perimeter`, `gathered`,
  `sparse`, `pairedDining`, and the odd ones `chairStacks`, `tableStacks`,
  `chairsOnTables`, `pushedAside`, `facingWall`, `ring`.
- A generator driven by slow hashed fields (`room-generator.js`): a strangeness
  field, a scale field, and a zone field that produces runs of kitchens or
  bathrooms. Unusual rooms are whatever the draws coincide in. Nothing names a
  particular strange room.
- Wall finishes from the DepEd schedule, floor finishes weighted toward bare
  cement, and lighting profiles from daylight to deep night.
- No inhabitants, no task, no win state.

Foam Green City's twisting route, its 3D deformation, its photographic cutouts,
and its autonomous camera do not carry over. Its `CONCEPT.md` lists connected
storeys as unfinished; this work takes them up in a different form.

## 3. What it is

Foam Green Crawl is a browser glyph work. A visitor moves an `@` one cell at a
time through an unbounded lattice of generated domestic rooms, on several
levels joined by stairs, and can inspect any visible cell to read what occupies
it. Nothing on screen changes unless the visitor acts.

It has no enemies, items to collect, health, score, or exit. "Crawl" names the
movement and the structure: rooms that open into rooms in four directions and
two vertical ones.

## 4. Stillness

The page draws only in response to input.

- No `requestAnimationFrame` loop, timers, CSS `animation`, or CSS `transition`.
- A glyph is chosen once from its alternatives by hash and stays fixed. Cornice
  cycles glyphs and moves some entities; this work does neither.
- Changing board (section 5) replaces the whole grid in one draw.
- Lighting is a fixed colour treatment per room.

A consequence worth measuring: the page should use no CPU between key presses.
`scripts/check_still.mjs` (section 10) fails the build if a source file contains
any of the four mechanisms above, so the rule holds without anyone remembering
it.

## 5. World model

### Boards

The screen shows one **board** at a time, a fixed grid of cells. Walking through
a door in the board's edge replaces it with the neighbouring board. This is the
ZZT arrangement, and it is what keeps every glyph still: a scrolling view would
shift the whole grid on every step.

- A cell is 0.5 m square. A monobloc chair is one cell, a dining table is 2 by 3,
  a single bed is 2 by 4, and a 4 by 6 m room is 8 by 12 cells.
- Cells are drawn square. Cornice's cells are taller than wide (`1ch` by a line
  height), which would stretch rooms.
- A starting board size is Cornice's 52 by 22 cells, which is 26 by 11 m: two to
  six domestic rooms. The first build should try this and one taller size and
  record which reads better.
- A board is addressed by `(bx, by, z)`, with `z` the level.

### Rooms on a board

Each board is partitioned into rooms using Foam Green City's domestic
dimensions, converted to cells: widths mostly 4 or 6 m, lengths mostly 6 or 8 m.
Rooms connect through doorways in shared walls, in the enfilade manner of the
source: a room opens into the next room. Corridors are occasional.

Furniture comes from the twelve layouts. `chairsOnTables` and the stacks use the
cell's layer stack (section 6). Furniture keeps every doorway and one path
between doorways clear, following the source rule that furniture reserves the
walking aisle.

### Fields

The three fields become functions of board coordinates, built on the same
integer hash and value noise as `room-generator.js`:

| Field | Source behaviour | Here |
| --- | --- | --- |
| Strangeness | Zero for most rooms, rising in short stretches | Same, over `(bx, by, z)` |
| Scale | Slow drift that lengthens the tails | Same |
| Zone | Runs of kitchens or bathrooms | Patches of boards |

The source's numbers are the starting values: its width and length pick lists,
the 0.83 and 0.17 zone thresholds, and odd layouts in about 7% of ordinary
rooms. Its measured mix is about 83% domestic, 15% unusual, and 1 to 2% very
large. A two-dimensional partition will not reproduce those rates on its own,
so the generator check prints the measured mix and the rates are then tuned
toward the target.

The hash and noise functions are about ten lines and are rewritten here, not
imported. Nothing in this folder loads a file from `foam-green-city/`, so there
is no entry to add to `DEPENDENCIES.md`.

### Edges

Two neighbouring boards must agree on their shared edge without either one
reading the other. A hash of the edge's own coordinates decides whether it has
a door and at which cell, and both boards read that hash.

An edge between two boards that are both under high pressure is left open along
its whole length. Halls then span several boards, which is how the source's
largest rooms (up to 80 by 64 m) fit a 26 by 11 m board.

### Up and down

A hash of `(bx, by, z)` decides whether a stair joins level `z` to `z + 1` and at
which cell. Both boards reserve that cell and one landing cell before rooms are
partitioned. Stepping onto the stair cell replaces the board with the one above
or below, with the `@` on the matching cell.

Proposed starting rate: one board in six has a stair up.

The source has stairs that stop at a wall. They carry over as stair glyphs that
link to nothing. Whether a dead stair looks different from a live one is a
decision in section 12.

Raised and sunken floors from the source are deferred. They are a height change
inside one room, and a top-down glyph grid has no direct way to show one.

### Determinism and memory

A board is a pure function of `(seed, bx, by, z)`. Returning to a board
produces the same board, so the lattice can be learned and mapped. Nothing is
stored for the world, and only the current board is held in memory.
`?seed=<whole number>` selects another world, as in the source.

## 6. Cell grammar

A cell holds up to five layers. Inspecting cycles from the top down.

| Layer | Holds | Source examples |
| --- | --- | --- |
| Item | A thing resting on a support | Pitcher, cookware, writing pad, a chair on a table |
| Object | Furniture or a floor-standing thing | Monobloc chair, table, bed, drawers, bucket, LPG cylinder |
| Overhead | Things above head height | Tube light, bare bulb, rafters and yero, sampayan line, wire run |
| Wall thing | A thing fixed to a wall cell | Framed photograph, mirror, switch, outlet, wall TV, pipe run |
| Surface | Floor finish or wall | Bare cement, white tile, red linoleum, foam-green wall, jalousie window, doorway |

The glyph drawn is the highest of item, object, wall thing, or surface. An
overhead layer is drawn as a faint overlay, as in Cornice.

Each object type is a data record:

```js
monobloc: {
  id: 'monobloc', name: 'monobloc chair', layer: 'object',
  glyphs: ['h'], solid: true, color: 'var(--plastic-white)',
  tags: ['plastic', 'seat', 'stackable'],
  texts: []
}
```

`solid` blocks the `@`. Doorways, floors, floor scatter, and cockroaches are not
solid.

### Glyphs

Glyph choice is Xyh's. The table below is a placeholder set from Latin, Box
Drawing, and Geometric Shapes, which common monospace fonts cover, so that the
first build has something to draw.

| Thing | Placeholder | Thing | Placeholder |
| --- | --- | --- | --- |
| Bare cement | `·` | Monobloc chair | `h` |
| Tile floor | `+` | Table | `π` |
| Wall | `█` | Bed | `═` |
| Jalousie window | `≡` | Foam sofa | `≈` |
| Doorway | `'` | Plastic drawers | `▤` |
| Stair up, stair down | `<` `>` | Bucket | `u` |
| Column | `O` | LPG cylinder | `δ` |
| Framed photograph | `▪` | Electric fan | `¤` |
| Tube light (overhead) | `─` | Toilet | `ω` |
| Bare bulb (overhead) | `°` | Cockroach | `,` |
| Sampayan (overhead) | `┄` | Visitor | `@` |

The font has to be bundled with its licence and recorded in an `ASSETS.md`,
because Cornice's Google Fonts request would fail in an offline multicart build.

### Displays

The page has two displays, switched by a button and saved per browser. "Light"
is the default: filled cells in Foam Green City's rendered tones, so that the
board reads as that work seen in plan. "Terminal" is glyphs on black. Colours
for both are in `style.css`, keyed by surface or object `id`, and every new
record needs a colour in each.

### Colour

Walls take the room's paint finish, foam green in most rooms, with the source's
occasional beige, yellow-beige, and off-white. The room's lighting profile sets
a fixed brightness and tint for every cell in it. In a night room, cells near a
lit tube or bulb are brighter. Unlit cells stay legible and inspectable.

## 7. Inspection and text

Inspection follows Cornice: clicking any cell on the board opens it in a side
panel, and clicking again steps down its layers. The panel shows the name, one
text, the tags, the room type, and the level.

- The texts are Xyh's to write. They live in `data/texts.js`, keyed by object
  `id`, separate from the object records.
- An object with no text shows its name and tags only. The first build ships
  with every text empty.
- Cornice substitutes `[weather]` into a text. The equivalents here are
  `[room]`, `[light]`, and `[level]`.
- The specimen log carries over as a list of the last 20 things inspected.

Cornice's handover identifies four voice positions in its texts: an entity
speaking, ambient description, address to the reader, and system notation.
Foam Green City's rooms suggest habitation and contain nobody. Which voices
belong in these rooms is open (section 12).

## 8. Controls

| Input | Action |
| --- | --- |
| WASD or arrow keys | Move one cell |
| Click or tap a cell | Inspect it; again to step down its layers |
| On-screen direction pad | Move one cell, for touch |

Cornice has no touch movement. The multicart is for a touch screen, so the
direction pad is part of the first playable build.

## 9. Files

A build-free static project, served from the root server at
`http://localhost:8000/foam-green-crawl/`.

```text
foam-green-crawl/
  index.html
  style.css
  src/
    hash.js          # integer hash and value noise
    fields.js        # strangeness, scale, zone over (bx, by, z)
    board.js         # edges, stairs, room partition: no DOM
    furnish.js       # layouts and object placement: no DOM
    render.js        # one draw per input
    input.js
    inspect.js
  data/
    surfaces.js
    objects.js
    texts.js         # Xyh's writing
  scripts/
    check_boards.mjs
    check_still.mjs
  SPEC.md
  NOTES.md
```

`board.js` and `furnish.js` take coordinates and return plain data, so Node can
generate thousands of boards without a browser. Any `localStorage` key is
prefixed `fgcrawl_`, because every game in a consolidated multicart shares one
origin and one store.

## 10. Checks

`scripts/check_boards.mjs`, over three seeds and at least 2,000 boards each:

- **Determinism.** The same seed and coordinates produce an identical board.
- **Edge agreement.** For every shared edge, the two boards have their door on
  the same cell, or both have none, or both are open.
- **Stair agreement.** A stair up at `(bx, by, z)` has a stair down on the same
  cell at `(bx, by, z + 1)`, and both landing cells are walkable.
- **Reachability.** Every walkable cell on a board is reachable from every door
  and stair on it. This is the check that catches furniture sealing a doorway.
- **Mix.** Prints the share of domestic, unusual, and very large rooms, and the
  share of boards with a stair, for comparison with section 5.

`scripts/check_still.mjs` searches `index.html`, `style.css`, and `src/` for
`requestAnimationFrame`, `setInterval`, `setTimeout`, `animation`, and
`transition`, and fails on any match.

In the browser: board generation time, idle CPU, and DOM node count are
measured and written into `NOTES.md`. No figure is claimed here.

## 11. Build order

1. **Headless generator.** `hash.js`, `fields.js`, and `board.js` with walls,
   floors, doors, and edges on one level. `check_boards.mjs` passes
   determinism, edge agreement, and reachability.
2. **Walkable page.** Render, movement, board change, the direction pad, and
   `check_still.mjs`. Record the board size comparison.
3. **Objects.** Six object types and the six ordinary layouts, then inspection
   with names and tags.
4. **Levels.** Stairs, the stair check, and the level readout.
5. **Full vocabulary.** The remaining objects, odd layouts, overhead and wall
   layers, paint finishes, lighting profiles, and zone patches.
6. **Large spaces.** Open edges for halls, then the covered basketball court
   (18 by 28 m, taller than one board) and the yero walkway.
7. **Texts.** Xyh writes into `data/texts.js`.

Steps 1 to 4 are the first version worth walking. The work has no completion
state of its own, so the stop condition for the first version is: a visitor can
walk across at least ten boards and three levels, inspect any cell, and both
checks pass.

## 12. Decisions for Xyh

Each has a default so that building is not blocked.

1. **Board change or scrolling.** Default: board change, for the reason in
   section 5. Scrolling gives continuous space at the cost of moving every glyph
   on each step.
2. **Sound.** Default: silent, as Foam Green City is. Cornice's footsteps by
   floor finish are the obvious carry-over, and a footstep is a response to
   input, so it would not break the stillness rule.
3. **Stable or shifting rooms.** Default: stable. Foam Green City rebuilds a
   revisited room with the same shell and different contents; the same could be
   done here by salting the furnishing hash on each visit.
4. **Cuts.** Foam Green City's dark doorways lead to a distant run of rooms. A
   door here could lead to a far board, one way, which would make the lattice
   impossible to map. Default: none in the first version.
5. **What the vertical axis means.** Default: every level draws from the same
   fields. An alternative gives the axis a gradient, for example more roofing,
   sampayan, and daylight upward and more storage, pipes, bare cement, and large
   halls downward.
6. **Dead stairs.** Default: the same glyph as a live stair, found out by
   stepping on it.
7. **The `@`.** Foam Green City has no body in it. Cornice's `@` is the thing the
   texts address. Resolved by Xyh (2026-10-09): eliminate the `@`. Whole-board
   dungeon crawl / DOS adventure navigation via WASD and RF, or tapping perimeter
   doors and stairs to travel; clicking room cells inspects them.
8. **Voices and glyphs.** The text register (section 7) and the glyph set
   (section 6).
9. **Place in the multicart.** A sixth entry, a variant listed beside Foam Green
   City, or a separate work. This also decides whether the folder becomes its
   own repository for GitHub Pages.

## 13. Not carried over, and deferred

- Raised and sunken floors, platforms, and room height. A ceiling 36 m up is
  one of the source's strongest effects and has no top-down equivalent yet.
- The photographs themselves. A framed photograph is a glyph with a text.
- Cornice's weather, distant vistas, pack registry, and control transfer.
- Side rooms with their own furnishing sets (bedroom, storage, washroom). They
  become ordinary rooms in the partition.
