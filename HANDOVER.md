# Codex handover

[CONCEPT.md](CONCEPT.md) describes the artwork and its intended experience for writers and readers outside the development process. Use it when preparing descriptions; this handover records implementation state.

2026-10-03 — Codex

## Passage exits, regenerating rooms, and side-room scatter — 2026-10-05

The route is still one straight logical line; nothing here adds a second axis. A branch is a cut. The `branches` and `cross` side passages now end in a dark doorway (`exit` material in `room-architecture.js`). Reaching it — by the automatic `exitRoute` or by hand, tested in `atPassageExit` — calls `beginCut`: `#veil` fades to near-black over 0.35 s, `takeBranch` discards all six rooms, calls `sequence.reroll()`, and places the walker 0.4 m inside a domestic room 20 to 620 indices ahead, then the veil clears. Room building happens under the veil. Steady-state cost is unchanged: still six rooms, no extra geometry apart from the doorway.

`chooseRoute` runs when automatic movement enters a room: with n passages, each passage and the main doorway have probability 1/(n+1), from `Math.random`. `?fork=always|never` overrides it, and `fork=always` also applies to the starting room so `routeOffset` can reach the exit. Two fork shapes were added to the demo's `unusual` list, so 5% of rooms are forks (4 of 10 exception shapes).

`createWalkSequence` now carries content salts. `hold(index)` fixes a room's salt when it is built, `release(index)` drops it and advances the era when the room is discarded, and `reroll()` releases everything. A nonzero salt offsets `generationIndex` and `branchSeed`, which feed furniture, paint, lighting, scatter, and side rooms. The shell — width, length, height, type, shape, floor, `startZ` — depends on the index alone, so positions never shift. Any room built after the first discard is salted, so a long walk is reproducible only for the same path. `dropSegment` in `index.html` is the single place rooms are disposed.

Side rooms get scatter from `planSideScatter`, fitted to the room rectangle, off fixture blocks and off the strip from the doorway across the room; the objects join the owning room's single scatter mesh. Movement no longer starts paused under `prefers-reduced-motion`; Xyh asked for it to start on Enter. `scripts/check_forks.mjs` covers exit routes and salts.

## Floors: white and maroon tile, the tile bank, narrow joints — 2026-10-06

`floor-variants.js` has three new treatments. `whiteTile` is plain glazed white tile at 0.3, 0.4, or 0.6 m with a light grey joint; `maroonTile` is maroon tile at 0.2 or 0.3 m with a cement joint. Both come from the one grouted-tile generator, which also draws the cream tile. Its joint is now 2 pixels of a 128-pixel tile, about 6 mm on a 0.4 m tile; it was 8 pixels, about 25 mm. `imageTile` repeats a supplied image.

The tile bank is the folder `2d/floor tiles/`. `scripts/index_floor_tiles.py` lists its images into `floor-tiles.js`; the floor width an image covers is read from the file name, as in `marble_60cm.png`, and 40 cm is assumed without one. The folder's README states this. The bank is empty, and while it is, an image floor is drawn as white tile.

`mismatchedTiles`, the floor with coloured replacement tiles, is retired: it is drawn as white tile unless `?floor=mismatchedTiles` asks for it by name, and no room list selects it.

`mixedFloor` in `room-sequences.js` now weights bare cement 68, concrete 5, white tile 14, image tile 3, maroon tile 3, cream tile 3, red linoleum 2, green checkerboard 1, abrupt patches 1. Raised and sunken rooms and the very large ones stay bare.

## Outlets and light switches — 2026-10-06

`addWallFittings` in `index.html` mounts the supplied cutouts flat on walls, from a stream of its own. One to three outlets go on solid side-wall modules, 0.3 m up (six in ten) or at 1.1 m; the white duplex plate is drawn 0.12 m wide and the black surface box 0.07 m wide. In 85% of rooms a light switch sits beside the far doorway at 1.3 m, on the side the door leaf does not cover; the single and triple switch plates are 0.07 m wide. The switch images are `wall_switch_single_white.png` and `wall_switch_3gang_white.png`. These four images are listed in `OUTLETS` and `SWITCHES`, not in the cutout table, which only holds free-standing objects.

## Start here — state at the end of 2026-10-06

Read the last entries of NOTES.md first; this section is the short version for whoever picks the work up.

Before committing a change to any root-level `.js` file: `python scripts/stamp_versions.py`, then `python scripts/check_published_assets.py`. Node checks run with `node --experimental-default-type=module scripts/<name>.mjs`. Other people commit to this folder's `2d/` images during a sitting, and files there have been renamed mid-task; re-read `git status` before staging.

Open, in the order they were raised:

1. **Wall flicker at a narrowing join: fixed 2026-10-06.** See the section below. Baseboards were fitted to each wall's face the same day, and the side-wall face was settled after it; see the two sections below. Still open: a side-room doorway's wall section has its face 0.06 m inside the room's edge, 4 cm behind the modules beside it. Cost is the standing concern; read the section on build cost below before adding anything that runs per room or per frame.
2. **Things not yet seen by anyone:** an electric foam-green room; a hue-shifted T-shirt; tsinelas up close; a real image in the floor tile bank; protrusions in motion.
3. **Still fixed where the rest is procedural:** side rooms and passages have no baseboards, protrusions, kit objects, or wall fittings; the minimum room length is 6 m.
4. **Carried from before:** independent lighting profiles for side rooms.

## Wall flicker at a narrowing join — 2026-10-06

A Kenney wall module is 0.1 m thick with its near face on its origin plane. The partition at the end of room i was placed with that face on the boundary plane, and room i+1's side walls start on the same plane. Where room i+1 is narrower, the end caps of its first two side-wall modules lay in the partition's face, 0.1 m wide and full height at x = ± half the narrower width, and the two surfaces fought for depth. The solid partition pieces now stand `PARTITION_PROUD` (1 cm) toward room i, which covers the caps; the doorway piece is unmoved. The face is also now outside the lighting bands' 2 mm overlap, so it belongs to room i's band alone, and the bands are filled in route order rather than build order.

`?inspect=1` now also sets `window.fgc` to `{THREE,scene,cam,renderer,segments,WALLP}` for console measurement. With the browser pane hidden, `requestAnimationFrame` is paused, so a test can pose `cam`, call `renderer.render`, and `readPixels` in the same task.

## The yero path, the one room that is not a room — 2026-10-06

From Xyh's memory of a path through a long puddle crossed on roofing sheets laid down as they came. About one room in 240 has no floor, walls, ceiling, or furniture: a walkway of corrugated sheets hanging in mint-green air, 24 to 36 m long, the only outdoor place in the walk. `isYero(index,seed)` in `room-generator.js` decides it, never in the first twelve rooms and never where a court falls. For the default seed: rooms 91, 185, 565, 738. `?start=91` opens on it.

It is an ordinary room to walk: 4 m wide, one straight leg down the middle, like every other room. Only the laying is haphazard. `yero-path.js` lays a run of sheets down the middle, lapped end to end and each a little off the line and askew, so the walker's line is always over metal; then throws more to either side, along the way, across it, and at angles between, out to the room's width. How far they spread on each side swells and narrows down the room's length, so the band of sheets seems to bend while the walk does not. A sheet is 0.72 to 0.92 m wide and 1.1 to 2.5 m long, a zigzag in section 76 mm ridge to ridge and 18 mm deep, each a few centimetres higher or lower than the last, a plank under about a fifth of the side ones. Colours by weight: bare galvanised greys 44%, mint 12%, medium and dark green 15%, rust red and brown 15%, blue, off-white, ochre, olive the rest; six in ten are rusted at the cut ends. One mesh in plain colour, 64 sheets and 9,914 triangles in the room measured.

**Do not give this room, or any room, a route of its own.** It was first built with a route that swung from side to side and the sheets laid along it. The camera twitched at each bend, the walker could stand facing open air, and handing back from manual control could leave it stuck: the turning, the rejoin search, and the start offset all assume a room's route is one straight leg.

`buildYeroRoom` in `index.html` builds it apart from `buildSegment`. It makes the next room's front wall and doorway, as wide as that room, which is why the next room is seen ahead as a box standing in the air, and the room behind likewise. Every field the rest of the page reads from a room is filled in there with an empty stand-in; **a new field that `tick`, `dropSegment`, or the inspector reads from every room has to be added there too.** Lighting is daylight whatever the room would have drawn, the air is `COL.wall`, and the fog reaches 44 m.

Floors and the ceiling material are double-sided for this room's sake: the rooms either side are seen from outside, and from below a single-sided floor is not drawn.

A player who takes control can walk the room's 4 m width, which the sheets cover, raggedly; a step at the very edge can still be over air.

## The basketball court room — 2026-10-06

About one room in ninety is a covered court. `isCourt(index,seed)` in `room-generator.js` decides it from a hash of its own, never in the first eight rooms, and `generateRoom` then returns a fixed shell: 18 by 28 m, 7.6 m high, a hall with chairs round the walls (`perimeter`), no stairs, columns, platform, passages, or change of level, and `court:true`. For the default seed the courts are rooms 45, 140, 169, 210, 252; for seed 42, rooms 57, 95, 119. The hash's salt was chosen so the default walk meets one early: the first salt tried put it at room 241. `?start=45` opens on it.

`basketball-court.js` draws the court as one mesh in plain colour, with the shared vertex-colour material: a painted field 15 by 26 m, keys, free-throw and centre circles, three-point lines, and at each end a backboard, rim, and net on arms from the wall, the rim at 3.05 m, over the doorway. Six colour schemes, two of them with bare concrete for the field. Lines are 10 cm wide and cut into half-metre pieces; the paint sits 12 to 20 mm above the floor. The walker's route is the room's centre line: under one hoop, across both keys and the centre circle, out under the other.

Round it: `room-sequences.js` gives a court a concrete floor; `household-items.js` leaves a ball and one to three more, strings banderitas in seven courts of ten, and never makes one a washing room; `fabric-items.js` lays nothing on its floor; the fog reaches 48 m while the walker is in one, where an ordinary room has 26.

## Papers at bond size, hangers on walls, gas stoves — 2026-10-06

`index_raw_objects.py` sizes 83 cutouts. Papers are measured against long bond, 216 by 330 mm: a pad sheet 203 mm wide, a graph sheet and the yellow half sheet 216 mm, an index card 203 mm. The two older pad images, which had been 150 mm, are 300 mm for the pad with a sheet beside it and 240 mm for the cover; both are photographed at an angle, so those are their diagonal extents. The graph sheet and index card join the paper group in `domestic-details.js`.

`clothes_hanger_blue` is 0.42 m wide and takes a hue turn right round the circle with three levels each of saturation and brightness. It lies flat on tables in bedrooms, salas, and bare rooms, and `addWallHangers` in `index.html` puts one to three on nails in a row on a solid stretch of side wall, each in its own colour: 20% of bedrooms, 16% of bare rooms, 14% of bathrooms, 10% of salas, 6% of kitchens. `?prop=hangers` forces it.

The single-burner stove is a tabletop cutout in kitchens, 0.33 m wide. The two-burner one, 0.68 m, is wider than a tabletop cutout may be and stands on the floor in kitchens and bare rooms.

## Washing lines, hangers, and colours for doors and windows — 2026-10-06

`sampayan.js` is this project's own, not a copy from `fgc-cx`. The kit there, `household-details.js`, draws each hanger as a tube of about 1,150 triangles by its code, which suits one rack and not a room of lines. Here a hanger is two flat ribbons, 16 triangles, and a garment a flat outline: shirt, sando, shorts, trousers, duster, towel, blouse, in `CLOTHES_COLOURS`, on hangers in `HANGER_COLOURS`. `createSampayan(THREE)` gives `line({length,sag,count,hangers,seed,cluster,gap,colours})`, a string along local x with clothes on it, and `rack(...)`, a rail on two uprights. Clothes on hangers hang across the line and face along it; pegged clothes hang along it. So a line run down the room shows its hangers face on to the walker, and a line across the room is pegged. `gap` leaves a stretch bare.

`household-items.js` places them as its fifth set, baked with the rest:

Washing is meant to be met in most rooms in a small way, and now and then in a large one. Its rates do not follow a room's clutter level, unlike the rest of this set.

- Clothes on the wall itself, each on a hanger on a nail (`sampayan.row`): one thing six times in ten, otherwise a set of two to four. Tried up to three times a room, at the full rate, then 45% and 20% of it: 50% of bedrooms, 40% of bare rooms, 35% of bathrooms and salas, 22% of kitchens, 14% of halls. A nail takes any gap on a solid stretch of side wall wide enough for what hangs there; with none, the far wall beside the doorway, once.
- A line along a wall, on hangers: 32% of bedrooms, 30% of bathrooms and bare rooms, 20% of salas, 18% of kitchens, 10% of halls, and a second on the other wall at three-tenths of that. Six in ten are short, 1.2 to 2.6 m with one to four things; the rest run 2.6 to 5.6 m and are full.
- A line across the room, pegged, bare for 0.6 m either side of the centre: 18% of bathrooms, 15% of bare rooms, 10% of kitchens and bedrooms, 5% of salas.
- Two to five hangers hooked along the top of a glazed window: 20% of such windows.
- A room given over to washing: lines the whole length of the room every half metre or so, none within 0.6 m of the centre line, up to 150 garments, sometimes all one colour with white. 8% of bare rooms, 4% of halls, 3% of bedrooms, 2% of salas; not in a room with columns, stairs, a platform, passages, or a rising floor, and never a court. `?prop=sampayan` forces it.
- A rail of hangers on the floor: 10% of bedrooms, 6% of bare rooms, 3% of salas. A folding drying stand with pegged washing, from the kit: 8% of bare rooms, 6% of bathrooms and bedrooms, 4% of salas.
- From the kit also: a wall clock stopped at a random time in 14% of rooms other than bathrooms; a helmet on a table or shelf in 3 to 6% of salas, bedrooms, bare rooms, and kitchens; one or two paper plates on a table in 30% of halls, 20% of auditoriums, 8% of kitchens.

The kit's screen door and screen window are not used: their mesh is a blended texture, which the bake cannot carry. Its hanger rack and its lines on hangers are not used either, for the triangle count above.

Doors and window frames. A room's doors take its trim colour 45% of the time and otherwise one of `DOOR_COLOURS`, weighted toward wood browns and off-white; each side door then has an even chance of the room's door colour or another of its own. Window frames take the trim colour 60% of the time and otherwise one of `WINDOW_COLOURS`, one colour to a room. `repaint(object,group,trim)` takes the colour; the copies it makes are kept apart from the room's trim copies and disposed with the room. `?trim=<hex>` still forces everything to one colour. The inspector reports `doorColor` and `windowColor`.

## Patterned cloth and banig — 2026-10-06

`tela/` and `banig/` hold the patterns as supplied or generated, 119 PNGs and 146 MB, and are not tracked. `python scripts/index_fabrics.py` writes a 256 px, 96-colour copy of each to `2d/fabric/<kind>/` and lists them in `fabric-assets.js`; 117 copies come to 4.1 MB. Run it again after adding or removing a pattern; it rebuilds only what changed and removes copies whose source is gone. `REPEAT` in that script sets how large one repeat of a pattern is in the room, by folder. `EXCLUDE` holds a pattern back from the page and `LOWPOLY` has it redrawn as flat triangles first, each with its reason; two are redrawn, see ASSETS.md.

`fabric-items.js` places things made of them, after the household objects and before the scatter, from a stream of its own:

- Banig spread on the floor: 20% of bedrooms, 14% of bare rooms, 10% of salas, 4% of halls. One time in four it is a length of cloth instead.
- Mattress on the floor, single or double, 0.10 to 0.18 m thick: 16% of bedrooms, 12% of bare rooms, 6% of salas. Along a wall where there is room, otherwise wherever it fits; three in ten lie on a banig of their own. It is low enough to walk over and stops no one.
- Banig rolled and stood against a wall: 8% of the rooms that can have a banig. It stops the walker.
- Cloth hung flat on a wall, 0.9 to 1.6 m wide: tried in 30% of bare rooms, 28% of salas and bedrooms, 22% of halls, and 16% of kitchens. On a solid stretch of side wall where one is free, shrunk to 72% or half if the full size does not fit; it covers a wire run or an outlet and avoids anything standing further out. Failing that, on the far wall beside the doorway, on the side the door leaf does not stand against, clear of the light switch. About a quarter of rooms end up with one.
- Tablecloth on every table of the room, one cloth through the room: 14% of kitchens and salas, 8% of halls.
- Carpet, 1.4 to 2.3 m by 2 to 3.1 m, its pattern drawn half again as large: 18% of salas, 12% of bedrooms, 5% of halls. It lies under whatever stands in the room and avoids only columns, stairs, platforms, and passage mouths.
- Small cloth mat, about 0.5 by 0.75 m, on clear floor: 25% of bathrooms, 20% of kitchens, 15% of bedrooms, 12% of salas.
- Potholders, square pads 0.16 to 0.21 m: one or two lying on a table in 35% of kitchens, and two or three hung by a corner in a row on the wall in 25%. A sala with a kitchen corner counts as a kitchen here.
- Sofa cover: half of the folding sofas take one of the cloths on the seat, back, and matching cushions. A sofa's geometry expects its cloth to repeat one and a half times across a face, which is a setting on the texture, so `upholstery` loads the pattern a second time with that repeat: up to 117 more textures in the worst case, on top of the 117.

`?prop=fabric` forces all of it. Floor pieces are skipped in a room whose floor rises or sinks. Each pattern has one material for the session and each object its own small geometry, so a room's tablecloths merge into one mesh. A pattern is loaded when first used and kept: at most 117 textures of about 0.35 MB each on the graphics card. `wallThingsOf` in `household-items.js` is now exported, and `addHouseholdItems` returns `hung`, the wall positions of what it baked, so a later step can avoid them.

## Mirrors, valances, and cloth decor — 2026-10-06

`mirrors-valances.js` and `decor.js` are unchanged copies from `F:/xyh/fgc-cx`, the fourth set placed by `household-items.js`, after the third and baked into the same per-room mesh. Of the kits in that folder, cardboard, bathroom tools, packaging, and footwear were already in; these two were the new ones.

- Bare mirror, oval or rectangular, 0.28 to 0.45 m wide: on a solid stretch of side wall at 1.45 m, in 45% of bathrooms and 18% of bedrooms and salas. The bake carries colour only, so the face is a pale plate with no reflection.
- Hand mirror: lying face up among the things on a bedroom table or shelf.
- Valance: over glazed windows in salas, bedrooms, and kitchens, a third of curtained windows and a tenth of the rest, one cloth and one style to a room. Plain openings get none. `index.html` passes `windowSpots`, each window module's side, position, variant, and whether it has curtains; the opening's width and top are worked out from the variant as `jalousie.js` does, so the two must change together.
- Bunting: one to three lines from wall to wall, 0.22 m under the ceiling and no higher than 3.1 m, in a quarter of halls and auditoriums, 5% of salas, and 4% of bare rooms, clear of columns and stairs.
- Table skirting: pleated cloth round every table in a quarter of halls and auditoriums.
- Wall cloth: a hanging length on a solid stretch of wall in 8% of salas and bedrooms.

A mirror or wall cloth takes any solid wall module without a protrusion, then checks what already hangs or stands there: `wallClear` measures the room's wall-side objects once, and only if something is to be hung. `?prop=kits` forces all of it. The kit's runner, banner, and fringe are not used; tables already have a runner.

## Per-frame work and garbage — 2026-10-06

The trace found the garbage was made every frame, not when rooms are built. Three things were changed, and the rule they leave is: **nothing in `tick` should walk a room's tree or work out anything that is the same next frame.**

- `roomInView` keeps each room's box points in `userData.boxPoints`, in the route's bent space. It had called `spatialPoint` for every point of every room every frame, and each call builds a dozen small arrays.
- `sequence.room(index)` returns the same object until the room's salt changes; `createWalkSequence` keeps the last 64 and `createRoomSequence` the last 256 shells. It had generated the descriptor afresh on every call, several times a frame. A caller must not change the object it gets; `buildSegment` copies it into `userData`.
- `buildSegment` ends by listing `userData.movers` (camera-facing cutouts and spinning things) and `userData.fanParts`, and on the twisting route sets `frustumCulled=false` once. `tick` had walked every room three times a frame to find them.

`performance.memory` does not change inside one task as far as could be seen, so it cannot time a phase of a build; it does move between frames stepped in a loop. To see what makes garbage, step frames with a suspect switched off and compare the heap's upward movement per frame: `JSON.stringify`, `THREE.Object3D.prototype.traverse`, and `renderer.render` can each be replaced for a run.

## Still meshes merged by material — 2026-10-06

`merge-static.js` runs at the end of `buildSegment`. Every mesh in the room that will not move again is copied, in the room's frame, into one mesh per material, named `merged-static`. The originals stay in the room's tree, because the placement code, the inspector, and `dropSegment` all read it, and are put on layer 1 (`SOURCE_LAYER`), which the camera does not draw. A raycaster reaches them only with `ray.layers.enable(SOURCE_LAYER)`; the merged meshes ignore rays.

Left unmerged: a cutout that faces the camera (`userData.billboard`), a spinning object (`userData.spin`), a fan's `fan-rotor` and `fan-head`, blended materials, and a mesh with a material list. A material with one mesh is left alone.

A material whose meshes together pass 40,000 vertices (`VERTEX_LIMIT`) is not copied: a hall of chairs merged to 553,000 vertices and 15 MB. Its meshes are drawn as instances instead, one `instanced-static` mesh for each geometry they share, with the prototype's geometry still shared and 64 bytes per copy. A mirrored object stays a mesh of its own, since instances share one winding. `curvize` reads the instance matrix through two macros, `FGC_PLACED` and `FGC_TURNED`; any new line in that shader that uses `modelMatrix` on a position or a normal must go through them, or instanced objects are drawn at the room's origin. `dropSegment` disposes each instanced mesh, which frees its matrices and leaves the shared geometry.

Rules this sets for later work. An object that will move after the build must carry one of those marks, or it is frozen where it stood. Anything added to a room after `buildSegment` returns is drawn but not merged. Changing a source mesh's material, position, or `visible` after the build changes nothing on screen. `?merge=off` skips the step; `grp.userData.merge` holds the report (`meshes, merged, into, heavy, vertices, bytes, ms`), which `bench()` returns with each row.

Shading differs slightly on the twisting route for objects scaled unevenly: the merge transforms normals by the proper normal matrix, where the route's shader multiplies by the model matrix. On the straight route the two agree.

## Rooms that cannot be seen are not drawn — 2026-10-06

`hideUnseenRooms` in `index.html` runs each frame once the camera is placed, and sets each room's `visible`. A room is skipped when all of it is behind the camera or all of it is past the fog's far distance, where every pixel of it would come out in the background colour. Depth is measured along the camera's view, which is how the fog measures it, at points round a box holding the room; the box reaches 16 m past the side walls for a room with a passage or side room. The points go through `spatialPoint` on the twisting route, so the test follows the bend. The walker's room is always drawn. The test uses the camera's own matrix, so it holds for a player who turns round.

Two flags on a room's `userData` feed it: `held`, set by `ensureSegments` while a newly built room waits for its frame, and `drawn`, so a room is drawn once wherever it is and its upload falls in the frame set aside for it. Nothing else should write a room group's `visible`. `?cull=off` draws every room, for comparison; `#render-stats` reports `drawn`; `window.fgc.cull()` runs the pass on the current camera.

The rule depends on the fog colour and the background being the same colour, and on every material taking fog. A material with `fog:false`, or a background that differs from the fog, would make a hidden room's absence visible.

## Build cost, and how to measure it — 2026-10-06

Xyh's standing instruction: memory, CPU, and GPU use matter, and the walk does not have to be seamless. Holding the walker in a finished room, or bringing the next room in dark and then loading it, are both acceptable if a room ever needs more time than a frame.

A new room costs twice: the time `buildSegment` takes, and the time its first drawn frame spends sending it to the graphics card. `ensureSegments` used to build both rooms of a batch in the frame the walker crossed into it. Now the walker's room and its two neighbours are built and shown at once, as is everything before the walk starts and under the veil of a cut; any other room is built hidden in one frame and shown in a later one, nearest first, and no two rooms share a frame. Fog depth is measured over the rooms the walk keeps, built or not, so it does not move while a room waits.

Measuring. `?inspect=1` puts `build:{last,worst,rooms}` in `#render-stats`, in milliseconds, beside draw calls, triangles, geometries, textures, and programs. On `window.fgc`: `bench(from,count)` builds rooms outside the walk one at a time and returns build time, first-frame time, mesh count, and memory counts for each; `step()` runs one frame, for driving the walk from the console while the pane is hidden and `requestAnimationFrame` is paused. To step, replace `window.requestAnimationFrame` with a no-op first and put it back after, or every call leaves another loop queued; and define `document.hidden` as false, since the walk does not advance while hidden.

Heap. `performance.memory.usedJSHeapSize` swings by 100 MB or more between collections, so one reading says nothing; take the lowest value over a stretch of 25 rooms or more and compare lows. On 2026-10-06 the lows sat at 81 to 108 MB over 480 rooms.

Figures on this machine at 1280 x 720, twisting route, seed 5: an ordinary frame 11 ms; a frame that builds a room 37 ms, 81 ms at the ninetieth percentile; a frame that first shows one 19 ms, 43 ms at the ninetieth. Six rooms are about 1,500 to 1,700 draw calls and 370,000 to 530,000 triangles. Building the eight per-room kits takes 0.5 ms in all.

## Side-wall face, and kits built per room — 2026-10-06

The side-wall face is 0.1 m inside the room's edge (`WALL_INSET` in `index.html`). Imported modules (`wall`, `normalWindow`, `slidingWindow`) had their face on the edge; they are now set in by 0.1 m. This was chosen over moving the fittings because nearly everything already assumed it: photos, outlets, shelves, televisions, pipes, protrusions, the hollow-block face, and furniture stood against a wall were all placed from 0.1 m in, and stood that far off the solid modules. Authored window modules keep their face at 0.08 m. Wire runs moved from 0.04 to 0.11 m and the wall fan from 0.19 to 0.26 m, since those two had been fitted to the old face. A baseboard run now carries `face`, the inset of the wall behind it, in place of `flush`. The room's logical width, collision, and the partition are unchanged; a room with solid walls on both sides is 0.2 m narrower to the eye.

`household-items.js` keeps one tableware kit and one cardboard kit for the session and builds the plastics, linens, household-tools, plastic-storage, and school-chair kits for each room. Those five make new geometry for every object and hold it in a set until disposed, so a session-long kit grew with every room. A kit that is only baked from never reaches the GPU, so dropping the reference is enough.

## Thirty-one more cutouts and a third set of mesh kits — 2026-10-06

Cutouts: `index_raw_objects.py` now sizes 76 of the images in `2d/raw objects/`. The 31 added are groceries and snacks, produce, toiletries, two backpacks, two bayong, an abaniko, a paint can, a food keeper, a dish rack, and three more Orocan pieces. `PLACE` in that script gives a cutout its mode and rooms where the name-prefix rules do not; the teal backpack and the purple bayong take a hue turn. Sizes are estimates from the usual retail pack. The three cans join the condiment group in `domestic-details.js`. Toiletries are listed for bedrooms only, since a bathroom has no table to stand them on.

Kits: `footwear.js`, `bathroom-tools.js`, and `packaging.js` are unchanged copies from `F:/xyh/fgc-cx`. `household-items.js` places them after the second set, so earlier placements keep their positions. Shoes: a pair beside the entry doorway in 30% of domestic rooms other than bathrooms, and by a wall in a quarter of bedrooms. Bathrooms: a toilet brush (60%), plunger (35%), cleaning or spray bottle (50%), and loose paper roll (25%) on the floor by a wall, and a paper holder on a solid stretch of side wall (50%); a spray bottle in 15% of kitchens. Packaging: one or two of a pouch, packet, box, sachet, tissue roll, or toothbrush cup on 35% of tables and one on 20% of shelves; up to two flattened sachets or packets on open floor; a paper bag by a wall in 15% of salas, kitchens, and bedrooms. `?prop=kits` forces all of it. Packaging is in plain colours, because the bake carries vertex colour and no texture; the bake now reads a mesh with several materials by geometry group. These three kits make new geometry for every object and keep it in a set, so they are built per room and dropped after the bake.

## Baseboards against the wall face — 2026-10-06

`baseboards.js` had one offset, 0.112 m, for every wall. Walls have three face positions: the near end wall is the previous partition's back, 0.1 m inside the room less `PARTITION_PROUD`; the far partition's face is on the boundary plus `PARTITION_PROUD`; side-wall faces are given in the section above. A run carries `face`, the inset of the wall behind it; `wallOnEdge(tile)` in `index.html` tells an imported module from an authored one by the prototype's bounds; `createBaseboards` takes `farProud`. End strips run to the room's edge.

## Wall colours, trim rules, and protrusions — 2026-10-06

Foam green is drawn per room by `foamColour` since 2026-10-06, not picked from five values: hue from 126° (green-leaning) to 172° (aqua), in one of five modes — familiar soft foam 32%, dusty 20%, neon pastel 20%, deeper saturated 18%, electric 10%. The four opening rooms use the familiar mode. A room's colour is `userData.wallColor`; `userData.wallPaint` holds only the family name, `foam` for all of these. `?paint=foamElectric` forces `#A7EEC1`, and the five old named greens still work as `?paint=` values.

Walls: `PAINT_WEIGHTS` in `index.html` sums to 100 — foam greens 62, three beiges and white 22, Palmyra as a wall colour 8 (`palmyra`, `palmyraLight`), and ten paints Xyh surveyed on buildings in Metro Manila 8 between them, the pale ones (peach, pastel pink, powder blue, yellow) at 1.1 each down to medium green at 0.4. `?paint=<name>` accepts every key of `WALL_PAINTS`.

Trim: `trimFor(paint,next)` picks by the wall's family. On foam walls: dark green `#203C21` 40, a Palmyra olive 38, the earlier blue-greens 8, foam green itself 8, a surveyed colour 6. On beige and white walls: dark green 35, Palmyra 30, foam green 20, surveyed 15. On Palmyra walls: dark green 45, foam green 35, cream 20. On surveyed-colour walls: cream or white 35, dark green 25, foam green 15, another surveyed colour 25. `TRIM_GREENS` is gone. The title text is `#203C21` as well. Fog and background now fade to the colour of the room being walked through, not always to foam green.

`wall-protrusions.js`: 20% of rooms, rising with the generator's strangeness, get one to three things standing out from solid wall modules (up to five in a strange room): a full-height pilaster, a narrow boxed-in run or a pair, a ledge, a block at any height, or a beam stub under the ceiling, all in the wall colour. Each takes its module out of `solidWalls`, so no photo, shelf, wire, or television is hung there. Floor-standing ones join the architecture reservations, so furniture, props, scatter, and household objects keep off them; anything below 1.8 m stops the walker. The fitted wall of a kitchen or bathroom is skipped. `?prop=protrusions` forces them.

## Second set of mesh kits, and graded tones — 2026-10-06

`household-tools.js`, `plastic-storage.js`, `cardboard.js`, and `school-chair.js` are unchanged copies from `F:\xyh\fgc-cx`. `household-items.js` places them after everything it placed before, so earlier placements keep their positions, and bakes them into the same per-room mesh. Fronts are local −z; `facing(side)` turns a piece against a wall to face the room, and `turned` recomputes bounds for kits that take no rotation.

- Tsinelas: pairs just inside the entry doorway of domestic rooms (55%, and a second pair 20%), and against a wall in bedrooms, bathrooms, and salas (30%). The two-rectangle `slippers` kind is removed from `floor-scatter.js`.
- Painting tools: a tray, roller, and brush together, 6% of rooms and 22% of bare rooms, with paint in the room's own wall colour (`paint` option).
- Plastic storage: ice boxes and water jugs in kitchens; lidded bins and drawer units in salas, bedrooms, and bare rooms.
- Cardboard: cartons standing about, most in bare rooms; flattened or folded ones on the floor; a panel leaning flush on a wall; rarely a box seat or a box bed.
- School chairs: one to three in a third of halls and auditoriums, a stray one in 7% of salas, bedrooms, and bare rooms.

`?prop=kits` forces every one of these on, for inspection.

Tones are now uniforms (`uTurn`, `uGrade`, `uLiftTo`), so toned materials share one compiled program per material kind instead of one per value. A tone carries hue angle, lift, saturation, and brightness. `HUES` in `index_raw_objects.py` may give a cutout `sat` and `light` ranges; `cutoutTone` picks one of three levels of each. The T-shirt has 12 hues × 3 saturations × 3 brightnesses; jeans and shorts have brightness, jeans saturation too. Cloth materials get a small saturation and brightness drift with their hue turn.

## Cloth hue — 2026-10-06

Textured cloth takes the same hue turn as toned cutouts, per room. A material counts as cloth if it is in `VARIED` as `textile` (the sofas' upholstery and patterned pillows, registered at start-up for any sofa mesh with a texture) or carries `userData.textile` (curtain fabric, set in `jalousie.js`, patterned or plain). In `varyColours` a cloth material is left alone in 45% of rooms, turned 30° or 60° either way in 35%, and turned anywhere round the circle in 20%, in 30° steps so at most eleven extra shader programs exist. Every curtain of one pattern in a room turns together. An untouched material is not put in the room's cache, because that cache is disposed with the room and the material is shared. `?cloth=<degrees>` forces one turn on all cloth. The table runner is in `VARIED` as plain colour, and side-bedroom bedding shifts by room inside `side-bedrooms.js`.

## Table sizes — 2026-10-06

`varyTables` in `furniture-layouts.js` runs after an arrangement is fixed and gives a table that stands by itself a `scale:{x,y,z}` on its width, height, and length. Length is 0.65 to 0.95 for three in ten and 1.15 to 1.7 for about a third; a longer or wider size is stepped back down until the enlarged footprint clears the room rules and every other piece by 2 cm, so a table grows into free floor and never into a chair. A table with a chair within 0.25 m shortens no further than 0.86 and may sit a little low (0.86 to 0.96 of standard height, three in ten); a table with no chairs may be coffee-table low (0.55 to 0.85) and wider or narrower. Tables pushed together, stacked, or upside down are untouched. Sizes use a stream of their own, so every arrangement is what it was before.

`furnitureFootprint` and `tableSupport` read `scale`, so collision, clearance checks, and whatever is fitted to the tabletop follow the resized table. `index.html` scales the table's own meshes, not its group, because objects standing on it are children of the group and would be stretched; the runner is scaled in plan to match. `scripts/check_table_sizes.mjs` covers this. About 37% of tables in ordinary small rooms are resized, and 7% across all layouts, where most tables are in rows or stacks.

## Colour variation — 2026-10-06

Meshes: `VARIED` in `index.html` maps a shared material to `plastic` or `wood`. It is filled at start-up with the ten monobloc and table finishes, the bucket bodies, and the coloured parts of fans, rice cookers, and food covers. `varyColours(grp,i)` runs once per room, after furnishing, and swaps each registered material for a per-room copy whose colour `variedColour` draws from the room's own stream: near the listed colour for most, a colour of its own one time in six, off-whites sometimes tinted, 14% faded, 10% grimy; wood stays within browns. All objects sharing a source material in one room share the result, so colours differ between rooms, not between two chairs of one finish in a room. Copies live in the room's material cache and are disposed with it. A material not in `VARIED` keeps its colour everywhere; the gas cylinder has its own material in `utility-props.js` for that reason. Baked objects drift per object instead: `household-items.js` shifts hue, saturation, and lightness slightly for each placed object, and `floor-scatter.js` shifts hue.

Cutouts: an entry in `HUES` in `scripts/index_raw_objects.py` gives a cutout a hue range, and for dark images a `lift` toward a colour. `cutoutTone(asset,roll)` picks one of twelve steps three times in four. `spriteMat(file,tone)` returns a material variant whose shader turns the texture's hue about the grey axis; variants share the texture and have their own program cache key. Listed: the T-shirt, shorts, jeans (±25° only), basin, two pitchers, tumbler, and backpack. Branded packaging and photographs are not listed.

Also in `index_raw_objects.py`: a file is indexed only if it has an entry in `REAL_SIZE`, so a stray image in the folder cannot reach the page, and `FIXED_SIZE` exempts the sardine cans from the deliberate wrong-size rule.

## Lit cutouts — 2026-10-06

`spriteMat` now returns a `MeshLambertMaterial` flagged `userData.upNormal`. For that flag `curvize` replaces the vertex normal with world up (through the route's basis on the twisting route) and undoes the fragment shader's back-face flip, so a cutout is lit like the floor under it whichever way its plane faces. These materials set `customProgramCacheKey`, because Three.js shares compiled programs between materials whose `onBeforeCompile` source is identical, and the patch here differs only by that flag. Wall photos, tabletop and floor cutouts, camera-facing sprites, and wire images all use it.

## Doorway leaf on the jamb — 2026-10-06

The Kenney `wallDoorway` model, at the 2× wall scale, has its opening from 0.43 m either side of the centre line and its frame out to 0.486 m; its room-side face is 0.04 m proud of the partition plane. The leaf's hinge is now at 0.47 m and 0.05 m, on that jamb. It had been at 0.96 m and 0.14 m, half a metre along the wall from the frame. The leaf stands open 7° to 41° past square, toward the wall, from the leaf's own hash. The inspector reports each leaf's hinge position and bounds.

## Publication faults: missing sprite, mixed module versions, error message — 2026-10-06

Two scripts now guard publication, and both should run before a commit that touches a root-level `.js` file.

`scripts/check_published_assets.py` reads every asset path out of the JavaScript and `index.html` and fails if one is not in `git ls-files`, with exact letter case. The repository ignores whatever it does not whitelist, so a file can load locally and be absent from GitHub Pages. That was the case for `models/bamboochair.png`, which the kitchen and bedroom prop pools used: any room that drew it raised a loader error, and the page showed its load-failure message mid-walk. The sprite's licence is recorded as unverified in ASSETS.md and it was never whitelisted, so the two pool entries were removed rather than the file published.

`scripts/stamp_versions.py` rewrites every `./name.js` import in the root modules and pages to carry one stamp, a hash of all module sources. Before, each import had a hand-edited `?v=` tag or none, and several modules changed many times under an unchanged tag, so a browser or the Pages cache could pair a new `index.html` with an old module whose exports no longer matched. `--check` reports stale stamps. The node checks import modules without a query and are unaffected.

`index.html` separates two failures. Until `walkReady` is set at the end of `init`, any error shows the load-failure message. After it, an uncaught error shows "The walk stopped because of an error" and an asset that fails to load is only logged. `?speed=<m/s>` hurries automatic movement for soak tests.

Three.js r160 is bundled in `vendor/three/` as of 2026-10-06 and every import map points there, including the dev pages in `scripts/`. To change version, replace the files from the same npm release and keep the folder layout, because `GLTFLoader` imports `../utils/BufferGeometryUtils.js` by relative path. `check_published_assets.py` covers the import-map targets and each `three/addons/` import.

The title is set in bundled Yatra One, in capitals with the first letter of each word at 1.4 times the size of the rest. The heading carries `aria-label="Foam Green City"` because its text is split across spans.

## Basketball — 2026-10-05

`basketball.js` builds a 24 cm ball: a 14 × 10 sphere with five thin seam rings (three great circles and a smaller circle on each side), stopped at a seeded rotation, in four orange-to-brown colours. `household-items.js` stands one against a wall or on open floor in 12% of salas, bedrooms, bare rooms, halls, and auditoriums at medium clutter, one in seven of them at three-quarter size, and bakes it with the room's other household objects. `?prop=basketball` puts one in every room and the inspector reports its position.

## Door hardware and doormat colours — 2026-10-05

`doors.js`: each leaf has a handle plate flush on both faces with a grip on it, placed on the stile of a screen door, and three hinge knuckles centred on the hinge edge. The old handle was a single block 1.75 cm clear of one face, and on a screen door it hung in the mesh beside the stile. `index.html`: the entry doormat takes one of fourteen `MAT_COLOURS` and a width of 0.6 to 0.95 m from its own hash; its material is cloned into the room's material cache and disposed with the room.

## Cutout sizes and doorway leaves — 2026-10-05

`scripts/index_raw_objects.py` now holds `REAL_SIZE`: the real height or width in metres of each supplied cutout, from which the generated `width` follows. Before, every tabletop cutout was scaled to 0.43 m tall or 0.3 m wide and every floor cutout to 0.4 m wide, which made a sardine can 0.43 m and a bleach bottle 1.26 m. A cutout missing from `REAL_SIZE` falls back to the generic size and the script names it. Files whose names start with a digit — unnamed captures — are skipped and named. The script keeps everything after the generated table, so functions added to `raw-object-assets.js` survive a rebuild.

Garments carry `tabletop:false` and are no longer offered to tabletops, where they had been shrunk to fit; on the floor they are laid out at full size. The whole garment shrunk beside a clothes stack on a table or seat now appears for one arrangement in ten, and the doll-sized garment on side-bedroom drawers in one room in nine.

`oddSize(asset,roll)` is the deliberate exception: 2.5% of cutouts come out 2 to 4 times too large and 1.5% at 0.4 times. Callers pass a roll from a stream of their own (`grp.userData.oddRoll` in `index.html`, `oddRoll` in `domestic-details.js`), so furniture and arrangement streams are untouched. `check_raw_objects.mjs` keeps the tabletop limits for tabletop items and has a separate limit for garments.

The doorway at the far end of a room has one leaf (55%, on either side) or none (45%), from its own hash. `?door=one|none` forces it.

## Zones, smaller rooms, and drawer variants — 2026-10-05

`roomZone(index,seed)` in `room-generator.js` reads a third value-noise field with a six-room period: above 0.83 the room is in a kitchen zone, below 0.17 a bathroom zone. In a zone every room takes that type, except shells large enough to be a hall or auditorium. A bathroom is always 4 m wide, so the width is set before features are drawn. Ordinary widths are now weighted 4 m 58%, 6 m 33%, 8 m 8%, and lengths 6 m 45%, 8 m 36%, 10 m 9%, 12 m 9%. Shorter rooms mean fewer passage rooms, which need 12 m: 2.0% of rooms, down from 3.2%. The generator's hash was replaced with a full-avalanche mix, so every generated shell differs from the previous commit's.

`createDrawerVariants` in `utility-props.js` builds 32 plastic drawer units from seeds: two to six drawers, 0.34 to 0.60 m wide, nine frame colours, twenty drawer colours, and five colour schemes (one colour, two alternating, a set of three, same as the frame, or all different). Each is one vertex-coloured mesh; the old unit was about 25 meshes. They are stored as `plasticDrawers_0` to `_31` beside the original. Main rooms pick by room index without drawing from the furniture stream; side rooms pick in `sideSpacePlan`, and no longer scale a drawer unit up to fill its fixture box. `DRAWER_VARIANTS` lives in `side-spaces.js` because that module has no dependencies.

## Green ranges, baseboards, and railings — 2026-10-05

Colours are ranges now. `TRIM_GREENS` in `index.html` holds seven weighted trim greens: five olives and yellow-greens inside the reference hue range (default `#6B8A3A`, 30%), plus the earlier blue-green `#4E7C63` (8%) and a teal near the poster's roof colour (6%). Each room draws one from the paint stream's second value. The 70% of rooms with foam-green walls are split across five foam greens (`foamGreen` 30%, `foamMint`, `foamSage`, `foamAqua`, `foamDeep` 10% each); beige and white weights are unchanged. `?paint=` accepts the new names and `?trim=<hex>` forces one trim.

Shared prototypes are built in `COL.wall` and `COL.trim`. `repaint(object,group)` swaps in the room's wall and trim colours on any clone — wall modules, window frames, door leaves — through the per-room material cache that is disposed with the room. Architecture trim takes the room's colour directly. The checkerboard floor and the TV stripe keep `#4E7C63`.

`baseboards.js` builds one mesh per room: a 0.1 m strip along both side walls and both end walls, following the floor in raised and sunken rooms. It skips passage openings and bare hollow-block wall, and keeps the wall either side of a side-room doorway. Side rooms and passages have none.

Railings are architecture trim: a handrail with posts on both sides of an open wooden stair and on the room side of a solid one, continuing along the landing; and a rail along the aisle edge of each platform.

## Route inversions and trim preview — 2026-10-05

The `mixed` route profile adds `inversionRoll(d)`: one half-turn of roll in each 190 m stretch, eased over 32 m, starting at `(71k+97) mod 158` metres into stretch `k`, so inversions fall 103 or 261 m apart and the first begins at 97 m. The camera still follows the local frame, so what is seen is the rooms ahead rolling over, at up to 0.2 rad per metre. `SPATIAL_GLSL` repeats the arithmetic; the two must be changed together, since the camera is placed by the JavaScript and the geometry by the shader. `check_spatial_route.mjs` allows 0.25 rad per metre and checks the inversion roll for continuity, one half-turn per stretch, and no overlap.

`?trim=<hex>` overrides `COL.trim` for window frames, door leaves, and architecture trim. The checkerboard floor and the TV stripe keep `#4E7C63`.

## Tableware, plastics, and linens — 2026-10-05

`tableware.js`, `plastics.js`, and `linens.js` are unchanged copies of Codex's kits from the sibling folder `F:\xyh\fgc-cx`, which has no history of its own; re-copy them from there if they change. `household-items.js` is the only consumer. It keeps one set of kits for the whole session at ten radial segments, uses them to assemble objects, and never renders the kit meshes: each room's objects are placed, baked into one non-indexed vertex-coloured mesh in the room's frame, and removed. The room therefore pays one draw call and the generic `userData.own` disposal, and the kits' Phong materials and `patchMaterial` hook are unused. `householdMaterial` in `index.html` is the shared double-sided Lambert material.

Placement runs after wood details and before scatter, on its own random stream. Table and shelf objects go through `placeOnSupport` against the `supportSurface` that `domestic-details.js` left on each table, cabinet, and shelf, so they respect its reservations: place settings, bowls, drinks, cup and saucer, plate and bowl stacks, a tray of cups, containers, dishcloths, folded clothes. Floor objects stand against a wall, clear of the aisle and of furniture: basins, pails, bags, laundry piles, and laundry baskets that may carry a towel over the rim and a pile inside. Salas and bedrooms sometimes get a rug on open floor, and a bedroom rug sometimes carries a pillow and folded blanket. The amount follows the room's scatter level (none 0, light 0.6, medium 1, heavy 1.4), and floor footprints are passed to the scatter planner as blocked. Objects taller than 0.24 m stop the walker.

## Parametric passages, platforms, and side rooms — 2026-10-05

Every opening returned by `branchOpenings` now carries its own dimensions, and rendering, routes, and navigation read them from the portal instead of recomputing them from the room shape.

Passages: `generateRoom` emits `passages:[{side,j,reach,turn,height}]`, one or two, never two on one side. `j` is the wall module (any from 1 to where a 2 m return leg still fits), `reach` is 5 to 14 m, `turn` is the return leg at 2 to 10 m capped at the room's far end, and `height` is 2.4 to 4.8 m capped at the room height. `shape` is still set to `branches` or `cross` as a label. Authored shapes without a `passages` array get the old values: mid-room, 8 or 10 m, full height. The opening is still 4 m wide because it replaces two wall modules, and the return leg is still 3 m wide and turns toward the far end.

Platforms: `platform:{depth,height,inset,sides}` — 2 to 8 m deep and at most a quarter of the room length, 0.3 to 1.2 m high, set back 1.2 m or more from the centre line, on both sides or one. `platform:true` and the `auditorium` shape select the old 4 × 0.6 m block.

Side rooms: position along the wall, depth (3 to 5.5 m), span (2.8 to 4.8 m, limited so the room stays inside its owning cell), hallway length (1.8 to 5.5 m), doorway width, and ceiling height (2.35 to 2.8 m) are separate draws. A quarter of rooms 8 m or longer that have a side room get a second one on the opposite wall. Fixtures keep their offsets from the walls, so larger rooms have more open floor. `variant` remains as a style index for bedding, cartons, and buckets.

## Generated room shells — 2026-10-05

`room-generator.js` replaces the demo run's `unusual` and `vast` lists. `roomPressure(index,seed)` returns two values in 0–1 from value noise over the room index: `strange` (zero unless a 4.5-room-period wave passes 0.78, plus a 2.5% single-room spike) and `scale` (a 31-room-period drift). `generateRoom` then draws, each from its own hash: width, length, and height as a domestic base plus a tail scaled by the pressures; a floor rise limited to a slope of 0.3; side passages (`branches` or `cross`); `stairs:{steps,side,wooden}`; `columns:{inset,across,spacing,rows}`; `platform`; type; and layout, with odd layouts at 7% plus half the strangeness. `category` is read off the result: `domestic` when nothing departs from the base, `rare` at 24 m wide, 12 m high, or 40 m long, otherwise `strange`. To change how often something appears, change its rate there; there is no list to edit.

Constraints live in the generator and are asserted by `check_demo_sequence.mjs`: stairs need 6 m width and 14 m length, stop 1.1 m below the ceiling, and take the wall opposite a passage; columns and platforms need 10 m width; a platform excludes stairs, passages, and a rise; paired furniture layouts stay in rooms of 120 m² or less, because only `chairRows` and `perimeter` can be thinned to the 160-piece cap.

`room-architecture.js` now reads `room.stairs`, `room.columns`, and `room.platform`, so features combine; the old `deadStairs`, `colonnade`, and `auditorium` shape names still select the same defaults for the authored phrases. Columns stand in rows from each wall inward, start at the local floor height, and skip anything already reserved. `userData.solids` lists what stops the walker, separately from `reservations`, which also hold passage mouths. `plainRoom` in `side-spaces.js` is the test for a shell with no features.

`room-sequences.js` stays import-free: `createRoomSequence` takes `generate`, and `createWalkSequence` passes `generateRoom`. The authored phrases and the `mixed` sequence still use their lists and are reachable with `?sequence=<name>`.

## Side-room exits — 2026-10-05

`sideSpacePlan` returns `exit` for 30% of side rooms by hash, dropped where a fixture stands within 0.95 m in front of the doorway; washrooms never keep one, so the measured share is 23%. The doorway is 0.86 m wide in the far wall, 0.25 m off the room's centre line, and the far wall is split around it. `roomExits(room)` in `navigation.js` lists every exit of a room, passage or side room, each with a trigger zone and a one-way route; `index.html` uses it for both the automatic choice and the manual trigger. `?sideExits=all|off` overrides the hash. Side hallways lead to a side room, so a hallway is a passageway when its room has an exit.

## Floor scatter and lighting weights — 2026-10-05

`floor-scatter.js` plans small floor objects per room and builds them as one merged, vertex-coloured mesh: one draw call per room, sharing `scatterMaterial` from `index.html`. Thirteen shapes (bottles, cans, jugs, cartons, carton stacks, crumpled paper, tied bags, sacks, tubs, flat sheets, slippers) are assembled from seven unit geometries. Colour comes from per-kind palettes, mixed 22% toward a floor grey. `RATE` sets objects per metre of side wall for each level; `MIX` sets the kinds per room type. Halls and auditoriums get 40% of the domestic rate, bathrooms 50%, and no room exceeds 170 objects.

`scatterLevel` picks none, light, medium, or heavy from its own hash: 10% of rooms get none, 35% for `bare` rooms. `?clutter=<level>` forces it. Scatter is fitted after wood details, around the bounds of furniture, props, doors, room sets, loose boards, and architecture reservations, and stays 0.72 m clear of the centre line. It uses its own random stream, so existing furniture and paint decisions are unchanged. Carton stacks and sacks add walker blocks; the other kinds can be walked through. Side rooms and `development.html` do not use it.

`room-lighting.js` now weights daylight 36, overcast 22, shaded 14, dawn 10, dusk 4, darkDay 4, night 6, deepNight 2, red 1, violet 1. The first five rooms are daylight, overcast, daylight, shaded, dawn. Profile values are unchanged. `scripts/check_floor_scatter.mjs` checks both; run node checks with `node --experimental-default-type=module`, because the folder has no `package.json`.

## Palette grounding and wall colours — 2026-10-05

The title states the DepEd green/beige/white scheme and links to references/index.html, which transcribes the supplied presentation and links the official 2021 annex. Alternate commercial names are attributed to the presentation. Its date is not established, and the 2021 annex differs in some element assignments. The surplus-paint narrative remains a speculative premise in CONCEPT.md and the source page.

Wall paint uses a separate deterministic random stream, leaving furniture decisions unchanged: 70% foam green, 10% Crisp Ecru, 10% Bright Wonder, 6% Yellow Rain, and 4% off-white by selection weight. `paint=foamGreen|crispEcru|brightWonder|yellowRain|white` forces a preview. Side-room architecture follows the owning room. Window surrounds and partitions recolour matching wall materials; trim and unfinished block overlays retain their finishes. Cell-owned material copies are disposed on culling. Next remains independent side-room lighting.

## Title and loading gate — 2026-10-05

The public index opens with a title screen using bundled Permanent Marker. Enter stays disabled until the initial six cells, their assets, the font, shader compilation, and first render are ready. Movement waits for entry; reduced-motion playback remains paused afterward. WASD and Space do not control the scene while the title is open. Loading failures show a reload instruction. `?skipTitle=1` bypasses the title for development previews. `development.html` retains its earlier entry behavior.

Browser checks covered the loading/ready states, frozen route before entry, canvas focus after entry, Space resumption, and title bounds at 360×640 and 700×360. Network failure injection and sustained loading measurements remain undone. Next remains independent side-room lighting.

## v0.5 demo and repository — 2026-10-04

`index.html` is the public sampling entry point. `development.html` preserves the previous entry point unchanged, while sharing current modules and assets. The default `demo` sequence uses seed 5; `?seed=42` selects another reproducible sequence. Blocks contain six to eight rooms and finish with one exception. Most exceptions alter domestic proportions or arrangements; about one in eight exception blocks can be a very tall room, a 48-metre-wide enclosed hall, or an auditorium. The first two blocks have modest exceptions. The default route remains curved and twisting.

Pause/Resume, Restart, and Fullscreen controls are available. Reduced-motion preferences start paused; hidden tabs stop advancing. The sequence check sampled 40,000 rooms across four seeds, and browser playback crossed room boundaries. Viewed the seed-42 wide room (`?seed=42&start=62&offset=1&still=1`) without warnings or errors. Sustained resource and performance measurements across devices remain unfinished.

This folder is now its own Git repository on `main`. The publication allowlist includes runtime assets, modules, documentation, and checks, while excluding source-model duplicates and inspection screenshots. The user confirmed all supplied images are theirs or cleared for redistribution. Code/documentation use MIT, artwork uses CC BY 4.0, and third-party assets retain their licences. Read README.md, ASSETS.md, and THIRD_PARTY.md. No remote, push, GitHub Release, or DOI has been created. Next: evaluate v0.5 pacing and performance across devices.
## Fixture corrections and room lighting — 2026-10-04

Ceiling fixtures mix authored bare LED bulbs and tubes. The selected lighting profile controls their on/off state; `?fixture=bulb|tube` forces the shape for inspection. Default room lengths are 6, 10, 6, 12, 6, and 8 metres, totaling 48 metres per six-room phrase. Straight-route domestic rooms also select 6, 8, 10, or 12 metres; exceptional-room sizes remain unchanged. `?lengths=6,12` is supported. The original 72-metre half-turn is independent of room boundaries.

Eight `familyphoto_*_coarse.png` files from `../fgcphotos/` join the small wall-photo pool, now 15 images including the earlier wall hangings. Regenerate `wall-assets.js` with `scripts/index_wall_assets.py`. `raw-object-assets.js` catalogs eleven supplied images in `2d/raw objects/`: upright pitchers/cookware for tables, standing drawers/cooler, and flat writing pads. Original images remain unchanged. Preview tabletop objects with `?raw=rawPotSilver|rawYellowPad|rawIntermediatePad` and standing objects with `?prop=rawDrawers|rawCooler`. The latter preview uses a mid-room position but still follows collision filtering. `scripts/check_raw_objects.mjs` checks PNG paths, aspect ratios, IDs, and tabletop dimensions.

The lighting-band shader uses a 0.002-metre boundary overlap and ordered first match to keep shared partition faces on one profile. Exact comparisons previously caused pixel speckles through interpolated-coordinate roundoff. Viewed the corrected mixed and straight route walls on 2026-10-04; see wall-artifacts-after.png and the latest notes entry.

Integrated `uratex-sofa.js` from `../fgc-ag/`: three shared folding sofa prototypes replace the old sofa sprite in the sala pool. Eligible salas reserve sofa space before dining furniture; default rooms 0 and 3 contain sofas. Preview with `?room=sala&layout=sparse&prop=uratexFloral`. `wire-runs.js` assembles supplied `2d/wiring/wireline.png` and `wiresag.png` on solid wall tiles. Straight anchors use mid-height; sag anchors use top corners. Runs share cached textures/materials and own only their subdivided planes, which are disposed with rooms. `?wires=1` forces eligibility where a suitable solid wall exists. There was no `wideline.png`; the integration reads that mention as `wireline.png`. Provenance is in ASSETS.md; sustained streaming performance remains unchecked.

The core furnishing reference is a modernish lower-middle-income Filipino household; read CONCEPT.md before adding assets. Fitted cabinet pairs occur in roughly one kitchen set out of five, and cabinets are removed from the independent random kitchen decor pool. Rooms 0 and 1 demonstrate the simpler sets; room 4 retains the fitted variation. Large spaces, chair rows, and wealthier interiors remain permitted departures. The sink and stove models still have bases.

The bathroom now has an authored wall-mounted shower nozzle and arm, without an enclosure. Ceiling pendants and toasters are no longer loaded or placed. Overhead fixtures are simple tubes, off in daytime profiles. `room-lighting.js` selects daylight, overcast, shaded daytime, dark daytime, and night; `?lighting=daylight|overcast|shaded|darkDay|night` forces a preview. Daylight uses stylized brighter patches toward one side, without window apertures or cast shadows. Viewed daylight, dark daytime, and night bathroom renders without browser warnings or errors. Placement checks passed. Sustained transition and performance evaluation remain next.

## Assembled kitchens, bathrooms, and lights — 2026-10-04

`room-sets.js` assembles kitchen work areas, sala kitchen corners, and bathroom fixtures from shared existing models. The twisting phrase includes a four-metre-wide, six-metre-long bathroom and a smaller second kitchen. Bathrooms also occur in the straight domestic pool. Furniture placement reserves the room-set bounds; `roomSetsClear` reports aisle, wall, end, and furniture clearance. Ceiling fixtures and three shared point lights follow the selected spatial mapping. Room-owned light geometry and materials are disposed during streaming.

Viewed kitchen and bathroom renders and checked the smallest four-by-eight-metre cases. The sequence and spatial checks passed. See the latest [NOTES.md](NOTES.md) entry for checks and remaining work. `?start=2` enters the default bathroom; `?start=1` enters the kitchen. Sustained performance and light-transition evaluation remain unfinished.

## Route variations and fourteen models — 2026-10-04

The default spatial profile is `route=mixed`, with vertical undulation and a varying roll rate. Compare `route=twist|reverse|unwind|sway|mixed`. All use the shared camera/GPU frame and fixed FOV. The original half-turn is available through `route=twist`. Fourteen Poly Haven models are integrated; the latest batch adds produce, notepads, a second crate, and a metal rack. Read the latest [NOTES.md](NOTES.md) entry and [ASSETS.md](ASSETS.md).

The five-profile spatial check passed 28,805 frames, and all five rendered previews were viewed. The six new saved model previews loaded without errors. Long-run performance and distant-room views remain the next work. Eleven source models remain unconverted.

## Curved and twisting route — 2026-10-04

The default walkthrough is a six-room domestic prototype along a curved route, with a continuous half-turn every 72 metres. `spatial-route.js` supplies the shared shader and camera mapping. FOV is fixed at 72 degrees; furniture and camera follow local upright. `?space=straight` restores the previous domestic-first generator. Explicit showcase sequences retain their straight routes unless `space=twist` is supplied.

Read the latest [NOTES.md](NOTES.md) entry for rendered checks and limits. The camera crossed the room 5/6 half-turn doorway; spatial and sequence checks passed. Source-space inspection does not independently test GPU-deformed geometry. Frustum culling is disabled within the bounded room stream. Distant-room openings and non-Euclidean reconnections are not implemented. Next: judge the twisting route in a sustained walkthrough, checking joins and performance before adding differently oriented room views.

## New household models and fewer tiles — 2026-10-04

The latest placement pass favors an imported model in the first decor slot and cookware on kitchen tables. Imported wall props now fit using their actual rotated bounds. Default rooms 0–4 and kitchen rooms 7–12 passed the browser inspector; see the latest notes entry. `household-room-preview.png` records the kitchen render.

Eight models from `../3d/models/` are converted and integrated: pot, spoon, crate, bookshelf, daybed, monobloc chair, apple, and pillows. `model-assets.js` loads the lightweight GLBs; `scripts/prepare_polyhaven.py` reproduces them. Source files remain unchanged. Read the latest entries in [NOTES.md](NOTES.md) and [ASSETS.md](ASSETS.md) for conversion, provenance, checks, and remaining models. Preview `props-preview.html?asset=phDaybed`.

The default 10,000-room sample now has 86.55% bare floors, 4.32% concrete floors, and 9.13% patterned floors. Room cadence and rarity are unchanged. All eight saved models were viewed in the browser; imported daybed placement passed the room inspector. The remaining 17 models and long-run performance checks are unfinished. Next remains the domestic-first long-run observation.

## Domestic-first generation — 2026-10-04

The latest direction is mostly domestic rooms with an unusual room every three or four rooms. Large halls, very high ceilings, and deep sunken rooms are rare. Read the final entry in [NOTES.md](NOTES.md): the default 10,000-room sample was 71.43% domestic, 26.19% modest exceptions, and 2.38% rare large spaces. Showcase `sequence` overrides intentionally retain their dense architectural samples.

The camera stays on the main route; side hallways are visible and are not entered. Earlier side-excursion instructions are historical. Pipes and wiring are recorded as a parked proposal in the notes, with no implementation. Next: observe the domestic-first sequence over a long run, checking rare-room transitions and streaming performance.

## Architecture expanded — 2026-10-04

Read the final entry in [NOTES.md](NOTES.md). Auditorium, levels, and passages sequences now add tall halls, columns, stages, raised/sunken floors, dead-end stairs, and side corridors with right-angle bends. The autonomous camera explores a chosen branch and returns to the main route. `bare` restores the untextured gray floor. Static furniture geometry is now merged and its rendered result was inspected. Earlier statements that elevation is deferred or prototype merging is removed are historical.

The architecture sweep passed 360 rendered cases with route support, clearance, and disposal checks. The sequence check passed 11,000 descriptors; the floor lifecycle check passed 42 cycles. Preview `?sequence=auditorium&start=1&offset=8&still=1`, or `?sequence=levels&start=0&offset=5&still=1`. `routeOffset` samples a camera detour. Side branches terminate inside their own room footprint in Z; they are not independent room connections.

Next: measure long-run streaming performance and resource use across large halls and branching room sequences. Cookware, wiring, washing-area fixtures, inter-room branch connections, and connected storeys remain undone.

## Integration completed — 2026-10-04

The furniture and floor modules are now integrated, with the review failures corrected in the main copies. Read the final entry in [NOTES.md](NOTES.md) for implementation, checks, and limits. Photos are much smaller; rooms include wider and longer proportions; authored doors and additional Kenney household items are placed. Preview `sequence=opening|repeat|density|long|stored|cleared`, with optional `layout` and `floor` overrides.

Next: measure whole-scene streaming performance and resource use across dense and stacked rooms. The floor lifecycle check passed actual rendered disposal cycles; the opening and stored walkthroughs passed actual room inspection and were viewed after browser recovery. A prototype-merging optimization was removed pending a rendered comparison. Earlier integration instructions below are historical.

## External modules reviewed — 2026-10-04

Both handoffs have arrived. Read [EXTERNAL-REVIEW.md](EXTERNAL-REVIEW.md) before integration: several floor modes fail variable room lengths, paired dining drops a chair at length 8, and the floor cleanup checks overstate their evidence. An independent actual-geometry runner lives in `scripts/review-external-modules.html`. The staging modules remain unchanged and have not been integrated. Earlier statements that the staging folders hold only briefs are historical.

## Utility props added — 2026-10-03

`utility-props.js` supplies blue/pink buckets, a Gasul-style cylinder, plastic drawers, walis tambo, and walis tingting through `createDomesticProps()`. `index.html` adds these after ordinary decor through `furnishUtilities()`, using rotated bounds and free wall slots. Preserve this placement pass when integrating external furniture, and keep external floor disposal separate from shared prop resources. `utilities=all&inspect=1` checks all six in a room; `props-preview.html?asset=walisTambo` opens a model preview. Read the final notes entry for checks and the remaining object list. No utility GLBs were saved.

## Sequence implementation completed — 2026-10-03

Codex completed the room-sequence pass after this handover. Read the final dated entry in [NOTES.md](NOTES.md). `room-sequences.js` supplies deterministic four-room phrases, variable lengths, descriptors, and boundary lookup; `index.html` uses them for geometry, furniture depths, floor UVs, camera indexing, and streaming. `scripts/check_room_sequences.mjs` checks 6,000 descriptors and their boundaries. Browser geometry checks passed opening, density, long, and distant repeat previews; long-run performance remains unmeasured.

Next: integration in the order below. `fgc-c/` and `fgc-ag/` still held only briefs when checked; external work was not dispatched. The original plan and fixed-length implementation description below are historical. Preview `sequence=opening|repeat|density|long`, `lengths=8,24,12`, and `start=1000`; existing room/width overrides and `inspect=1` remain.

## Original resume instructions

The user approved the three-agent plan below, requested delegation notes and housekeeping, and is starting a fresh Codex chat because the context is full. This turn writes documentation only. Implementation of the new plan has not started. Claude and Antigravity will be started by the user; no messages or tool-spawned agents were dispatched.

Read [NOTES.md](NOTES.md), [ASSETS.md](ASSETS.md), the root `AGENTS.md`, and [ROADMAP.md](../ROADMAP.md). The project resolves to the root Git repository (`F:/xyh`) and is ignored there, so its files have no project history. Record work in the notes. Commit root roadmap changes separately, staging only that path. Worktrees require explicit user approval.

## Approved division of work

| Agent | Task | Writable folder |
| --- | --- | --- |
| Claude | Six furniture layouts, placement-data module, and preview | `F:/xyh/fgc-c/` |
| Antigravity | Six floor treatments, Three.js floor module, and preview | `F:/xyh/fgc-ag/` |
| Codex | Room sequencing and eventual integration | `F:/xyh/foam-green-city/` |

External agents can read the original project but must write only in their assigned folders. Their briefs are [Claude's brief](../fgc-c/BRIEF.md) and [Antigravity's brief](../fgc-ag/BRIEF.md). These are staging folders, not worktrees. Codex owns edits to the main project; do not edit another agent's staging files while that agent is working.

The direction is stranger spaces through familiar furniture, repetition, emptiness, changing proportions, and abrupt floor treatments. Keep floors level and the central camera path clear in this round. Elevation changes are deliberately deferred.

## Codex's next task

Build deterministic room sequences: narrow rooms opening into broad rooms, repeated rooms, dense rooms followed by sparse rooms, and occasional unusually long rooms. Start by extracting room descriptors from the current fixed segment assumptions. Descriptors should carry start Z, length, width, room type, layout choice, and floor choice. Until the other modules arrive, use current furniture and floors.

Variable room length needs an explicit boundary lookup: `Math.floor(-cam.position.z / SEG_LEN)`, `-i*SEG_LEN`, fixed `SEG_TILES`, fixed furniture Z positions, and partition inspection rays all currently assume 12-metre rooms. Preserve seeded generation and culling, and keep boundary partitions wide enough for both adjoining rooms. Update floor UVs and side-wall counts for each length. Use whole 2-metre wall modules.

Do not vary all parameters independently on every room. Give several neighbouring rooms a shared rule, then introduce a visible break. Keep width selections within the existing 4/6/8-metre set initially. Longer rooms can be introduced without new furniture meshes. Add forced sequence previews for repeatable visual checks.

## Reintegration

1. Read both external handoffs and previews. Integrate furniture layouts first; preserve runners and kitchen tabletop props in the main scene adapter.
2. Integrate floor variants and their explicit disposal callback. The current culler only disposes meshes with `userData.own`; it needs to call floor cleanup when a room leaves the stream.
3. Connect room sequences to layout and floor choices. Check transitions, clear aisles, actual furniture bounds, surface scale, and streaming performance. Avoid copying whole external project trees over the original.

The furniture contract returns plain placement records in metres with room-local Z from 0 to `-length`. The floor contract returns a group in the same coordinate system and accepts the existing curvature callback. Both briefs require seeded generation, selectable previews, verification, and remaining-problem notes.

## Existing implementation

- `index.html`: Three.js r160, autonomous straight centre route, view-space distance-squared curvature, room streaming, source photo wall planes, curtain patterns, and furniture spawning. Room types are sala, kitchen, bedroom, and bare.
- `room-widths.js`: deterministic 4/6/8-metre choices with approximate weights 40/35/25%; partition pieces span the larger adjoining width; lateral furniture lanes.
- `domestic-props.js`: authored wall fan, desk fan, rice cooker, food cover, monobloc chair, scalloped runner, monobloc table, and wood table; ten colour finishes. Fan parts animate independently. Geometry and variant materials are shared.
- `jalousie.js`: gathered/cafe curtains with fixed seeded openness; exported setter supports continuous preview changes. Normal and sliding windows also spawn.
- `wall-assets.js` and `photo-assets.js`: seven supplied wall photos and twelve tiled curtain patterns. Regenerate the manifest with `scripts/index_wall_assets.py`. Exclude copied `models/` subtrees from image indexing.
- `props-preview.html` and `windows-preview.html`: asset and curtain inspection pages. Only the first four domestic props have saved GLBs in `models/domestic/`; subsequent GLB download attempts failed. Newer props work from source geometry. Do not claim their GLBs exist.

Current sala/kitchen counts are 2/4/6 tables and 4/8/12 chairs for widths 4/6/8. Furniture uses two depth positions, -3 and -8, alternating sides. Decorative props may still overlap each other, and wall furniture can overlap wall hangings. General overlap handling and long-run performance remain open.

## Preview and verification

The project was served at `http://127.0.0.1:8141/` by Python's HTTP server from this folder. A new chat should check that it still responds and reuse it if available. A previously running process is not guaranteed to survive. The bundled Python executable is `C:/Users/Cy Tamura/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe`.

Preview parameters: `?room=sala`, `?room=kitchen`, `?width=6`, and `?widths=4,8,6`. Adding `&inspect=1` populates a hidden `#room-inspection` element with actual Three.js partition raycasts, doorway clearance, furniture aisle checks, and counts. Read this DOM element through supported browser tools. The last width pass passed these checks for expanding and contracting boundaries and had no browser warnings or errors. Screenshots showed the wider rooms and fixed-size furniture. This is not a long-run performance result.

Use the in-app browser through `cua_repl`; after session restoration, read its documentation before continuing. Browser evaluation is read-only. Cache query suffixes on imports were previously needed after module changes. Check actual loaded scenes rather than only source parsing.

## Housekeeping and limitations

No publication was requested. Supplied image licences and original authors remain unverified in `ASSETS.md`; keep those facts visible. No new bitmap generation is required for the planned first pass. Root files had unrelated changes in `.agents/skills/abstract-to-minipaper/SKILL.md`, `scholarship/abstract-to-minipaper.md`, `serve_diary.bat`, and `.claude/skills/indeterminate-juxtaposition/`; leave them alone. The preceding scoped roadmap commit was `1ff5c7f`.

## TV and pipe integration — 2026-10-04

index.html now uses wall-utilities.js with authored modules copied from fgc-ag and fgc-c. TVs use cached wall-mounted prototypes, while pipes use shared unit fittings. Preview with ?start=3&tv=noSignalBlue&still=1 or ?start=2&pipes=stack&still=1. Pipes stay in clear two-metre wall sections of rectangular, level-floor, standard-height rooms. TV and pipe metadata are in room-inspection. Read the latest NOTES.md entry for checks and the deferred placement cases. Xyh reports v0.5 is published; this integration remains local until pushed.

## Manual movement and backward streaming — 2026-10-04

index.html supports WASD, mouse-look, and Space to restore automatic movement. Click the canvas for pointer lock or drag to look; Pause remains a separate button. navigation.js supplies logical collision, route-return path search, three retained two-room batches, and a separately seeded sequence behind room 0. Discarded cells rebuild deterministically in either direction. Inspect with ?start=-8&inspect=1 or ?sequence=passages&space=twist&offset=14&inspect=1. scripts/check_navigation.mjs covers reconstruction, batching, collision, and route return. Captured mouse-look in an ordinary browser, climbable stairs, touch controls, and cross-device streaming measurements remain unfinished. The root roadmap and latest NOTES.md entry name the next evaluation step.

## Domestic clutter and exposed roofs — 2026-10-04

index.html adds domestic-details.js after furnishing. It places seeded abstract household shapes on tables, selected furniture tops, small framed-photo shelves, and clear floor edges; wear marks leave bare floors untiled. Occasional standard-height rooms have exposed rafters and corrugated metal sheets; ?roof=yero forces the preview. Cockroach silhouettes are small and static. Detail resources are disposed with each streamed room, and shelf/floor objects participate in walking collision. development.html retains its preceding furnishing entry point. See the latest NOTES.md entry for checks and limits.

## Broader unusual spaces — 2026-10-05

The demo exception pool includes more modest variations and six rare vast forms: distant walls, low canopy, column field, deep hall, assembly hall, and vertical void. Roughly 2% of rooms remain vast; exception spacing stays six to eight rooms. The first vast exception for each seed uses distant walls. Default seed 5 reaches the 80-metre-wide expanse at room 29: ?start=29&offset=12&inspect=1&still=1. Camera clipping and lateral fog depth accommodate wider rooms. Read the latest NOTES.md entry for sequence, navigation, spatial-route and browser checks. Cross-device performance evaluation remains next; these changes are local until pushed.

## Tabletop burners and metal sinks — 2026-10-05

room-sets.js assembles an authored two-burner tabletop stove on a plain stand and an open aluminum-coloured sink basin with faucet, drain and stand. Existing pots sit on the burner grates; occasional fitted cabinets remain. domestic-details.js adds lidded boxes, fruit-like shapes and wrapped sweets to its seeded clutter pool. Preview with ?room=kitchen&space=straight&offset=3&inspect=1&still=1 and turn towards the wall strip. The latest NOTES.md entry records rendered placement checks and remaining work. No external image or brand was copied from the stove reference.

## Named cutouts and broom correction — 2026-10-05

utility-props.js narrows the walis tingting at its twine binding and retains a short bundle of stalks above it. The cutout manifest uses the descriptive filenames in 2d/raw objects and includes 45 placement entries. Rebuild with python scripts/index_raw_objects.py and validate with node scripts/check_raw_objects.mjs after further renames. Existing raw-object IDs remain supported. The electrical outlet and surface receptacle cutouts are stored but await wall placement. See the latest NOTES.md entry for browser checks and limits.

## Pipe selection expanded — 2026-10-05

The local pipe kit matches fgc-c byte for byte. wall-utilities.js selects six water styles and three bathroom choices, including drainage; all eight pipe style names work with ?pipes=<style>. Existing clear wall-section placement and standard-height room restrictions remain. The raw folder still has 47 supplied PNGs, with 45 active cutouts and two electrical cutouts awaiting wall mounting. See the latest NOTES.md entry for checks and remaining work.

## Windows and pipe proportions — 2026-10-05

Water runs use thin blue 21–27 mm pipes; thicker drainage uses orange. Window sections are more frequent, with narrow, wide, high-set, open-frame and grilled variants. ?window=<variant> forces inspection. Open frames have a light backdrop, and hallway connectivity remains unchanged. See the latest NOTES.md entry for rendered checks and unfinished work.

## Hollow-block walls — 2026-10-05

Occasional solid side-wall sections use models/textures/hollow-blocks.png. Preview with ?walls=blocks or disable with ?walls=paint. Window surrounds, partitions and upper tall-wall sections retain their preceding finish. See NOTES.md for the rendered check and texture-repeat limitation.

## Plain openings and lighting profiles — 2026-10-05

Plain openings dominate the window pool. room-lighting.js includes daylight, overcast, shaded, darkDay, night, deepNight, dawn, dusk, red and violet. Force a profile with ?lighting=<name>. Deep night switches the fixture off; red and violet colour the ceiling point light as well as room tint and fog. Read the latest NOTES.md entry for frequencies and rendered checks.

## Household tools and small clusters — 2026-10-05

Domestic clutter includes authored pitchers, chopping boards and knives, folded clothing-like blocks, paper/file stacks, occasional mops and three generic bottle profiles with cap and label variations. Condiments, envelopes/pads and clothing use small category-specific cutout groups on tables, surfaces and clear floor edges. Per-room geometries are disposed with the room. See the latest NOTES.md entry for rendered checks and performance limits.

## Object arrangement plan — 2026-10-05

Read [Object arrangements](ARRANGEMENTS.md) for the proposed catalogue and placement rules. Next: shared object supports, beginning with a tabletop TV and then existing clutter. Arrangement density, valid poses, color/size/angle variation, collision reservations, and rendered acceptance checks are specified there. Navigation and cross-device streaming evaluation remain pending after this pass. No arrangement-system code was added with this plan.

## Tabletop TV placement — 2026-10-05

wall-utilities.js can fit a 32-inch TV with feet or a pedestal to upright monobloc/wooden tables through object-supports.js. Existing props and neighboring furniture can reject a candidate; wall placement remains the fallback. Accepted TV tables skip later clutter. Inspect with ?start=1&room=sala&tvMount=table&tv=colorBars&lighting=daylight&offset=3&inspect=1&still=1. Next is migrating existing clutter to the same support rules. Read the latest NOTES.md entry for rendered contact checks and remaining tests.

## Shared clutter supports — 2026-10-05

object-supports.js fits and reserves surface areas for TVs and domestic clutter. Tables, authored wall shelves, selected closed cabinets and fridge tops use these rules. Cutouts reserve space to turn toward the viewer, accounting for parent rotations. Empty or partly filled supports report rejected-placement counts and categories through the room inspector. Open racks and seats remain outside this pass. Next: arrangement presets for food preparation, paperwork, clothing and storage; see ARRANGEMENTS.md and the latest NOTES.md entry.


## Domestic arrangement presets — 2026-10-05

`domestic-details.js` fits food preparation, paperwork, clothing, and storage groups as whole reserved footprints. Room use weights their selection; shelves and cabinet tops receive compact versions. Force inspection with `?arrangement=food`, `paperwork`, `clothing`, or `storage`. The inspector includes accepted preset IDs and footprints. Read `ARRANGEMENTS.md` for the implemented scope and `NOTES.md` for browser checks and limits. Next: supports on chair seats and inside open shelves. User edits to the two sardine PNGs remain outside this commit.


## Chair seat supports — 2026-10-05

`object-supports.js` includes eligible floor-chair seats. `domestic-props.js` stores seat height and obstruction bounds before chair mesh merging; retain this metadata when changing chair geometry. Domestic details fit compact clothing/paperwork, authored bags, and boxes to up to three chairs per room. Force inspection with `?seats=mixed|clothing|paperwork|bag|box`, or disable with `?seats=off`. The inspector records seat bounds, contact gaps, and clearance from arms/backrest. Read `NOTES.md` for browser checks and limits. Next: open shelf interiors.


## Connected side spaces — 2026-10-05

Domestic rectangular rooms can include a direct side room or a short hallway leading to one. `side-spaces.js` supplies seeded rectangles, doorway bounds, perimeter walls, and collision regions to rendering and navigation. Existing branch/cross corridors remain. Doors stand open; plain openings also occur. Previews: `?sideSpaces=room|hallway|off`, with `&sideStart=1&inspect=1&still=1` to start inside an annex. Space returns to the main automatic route. See `scripts/check_side_spaces.mjs` and the latest `NOTES.md` entry for checks and limits. Next: furnish annexes as bedrooms, storage rooms, or washrooms; open shelf supports remain deferred.

## Side bedrooms — 2026-10-05

`side-spaces.js` reserves bed and drawer footprints for two of the three domestic annex variants. `side-bedrooms.js` fits existing single-bed/daybed and plastic-drawer assets, adds bedding, a flat garment, and a small supplied family photo. Shared prototype resources remain cached; authored bedroom geometry and materials are disposed with the owning cell. Inspector entries include model bounds and floor contact. Force a preview with `?start=1&room=sala&sideSpaces=room&sideRoom=bedroom&sideStart=1&lighting=daylight&inspect=1&still=1`; `sideRoom=bare` retains the ledge. See the latest `NOTES.md` entry for checks. Next: storage arrangements in annexes, then washroom fittings.

## Side storage — 2026-10-05

The third seeded annex variant now contains storage. `sideRoom=storage` forces it; `bedroom` and `bare` retain their overrides. `side-storage.js` creates an open shelf with cartons, a floor stack, plastic drawers with a carton on top, and a bucket. `side-spaces.js` reserves their footprints for collision. Keep model resources shared when cloning and dispose authored geometry/materials with the parent cell. Inspector entries include bounds and floor contact. `check_side_spaces.mjs` covers 480 plans, including pairwise fixture clearance. Next: washroom fittings. Open shelf supports elsewhere remain deferred.

## Side washrooms — 2026-10-05

`side-spaces.js` now selects bedrooms, storage rooms, and washrooms independently of annex dimensions, with weights 2:2:1. Force washrooms with `sideRoom=washroom`. `side-washrooms.js` fits existing toilet, basin, and bucket assets, then adds a small mirror, towel, nozzle shower, thin blue pipe with wall clamps, low faucet, soap dish, and floor drain. Bare annex floors remain. The shared plan reserves the floor fixtures; authored geometry/materials are disposed with the parent cell, while cloned assets stay shared. Inspector reports cover bounds and floor contact. Side-space checks now cover 600 plans. Next: independent side-room lighting profiles; fittings currently inherit the parent scene lighting.

## Wood surfaces and boards — 2026-10-05

`index.html` loads the supplied `models/textures/wood.png` once with mipmaps. `domestic-details.js` uses it on chopping boards and exposed roof beams. `wood-details.js` adds seeded wall sections, short dividers, and pairs of loose boards in eligible domestic rectangles. Divider bounds join `walkBlocks`; loose boards remain below the walking obstruction threshold. Placement rejects bounds outside the room and conflicts with existing furniture/collision bounds. Preview with `wood=all|walls|divider|planks|off`; category overrides add that category alongside natural selection. Authored wood geometry and materials belong to their cell, while the texture remains shared. See the latest notes entry for browser checks. Next remains independent side-room lighting.

## Open wooden stairs — 2026-10-05

`room-architecture.js` accepts the shared wood texture and an optional stair style. Most `deadStairs` rooms now use twelve thin treads, two sloping side boards, and a thin landing. The spaces between and beneath the treads remain open. Solid stairs remain on indices divisible by four; `stairs=wood|solid` overrides the style. Preview with `?sequence=passages&start=3&offset=4&stairs=wood&lighting=daylight&inspect=1&still=1&space=straight`. Existing stair reservations still block manual traversal; climbing and upper-floor connections remain unfinished. Next remains independent side-room lighting.
