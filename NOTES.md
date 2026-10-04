# Foam Green City — Project Notes

For a standalone account of the artwork, its concept, and the implemented prototype, read [CONCEPT.md](CONCEPT.md). It is the description reference; the early concept and prototype sections below record the project's starting point. Dated entries record subsequent changes.

A virtual installation: a randomly-generated, deliberately lo-fi walkthrough of an
endless Filipino domestic interior. Backrooms meets the old Windows 3D Maze
screensaver, painted in government-surplus mint green.

---

## Concept

- **The thesis.** DepEd (Philippine Dept. of Education) specifies a fixed paint
  scheme for public schools and orders it in bulk. Bulk order → cheap surplus →
  the whole barangay ends up painting homes, fences, and sari-sari stores with
  the same government swatch. "Foam Green City" is literally a city that shares
  one state-issued color. The uniformity *is* the piece.
- **Form.** A first-person wander through procedurally-arranged rooms and halls.
  No goal, no UI, no enemy, no win state. You just move through it.
- **Autonomous by default.** The camera drives itself, like 3D Maze did. Runs
  unattended as an installation. Player control is an optional later toggle, not
  a requirement.
- **Deliberately lo-fi.** Low internal resolution upscaled crunchy, flat/unlit
  shading, hard-edged sprites, tiny textures. "Doesn't have to look good" is a
  design freedom, not a compromise — it buys the uncanny-screensaver mood for free.
- **2D + 3D mix (core aesthetic).** Some objects are real low-poly 3D models,
  some are flat Doom-style billboard sprites. The seam between them is a feature.
  Cheap flat things in the distance, 3D up close, and the inconsistency reads as
  dreamlike rather than broken.

---

## The palette (DepEd MPSS scheme)

Authentic mapping — in real schools **green is trim, not walls**; walls are beige.
We currently run a *stylized* version (green walls) because the title says so, but
the constants are one edit away from authentic.

| Element              | DepEd color            | Our hex     | Used for                       |
|----------------------|------------------------|-------------|--------------------------------|
| Roofing              | Foam Green             | `#BFDCC9`   | **walls** (stylized)           |
| Doors / railings     | Palmyra Green          | `#4E7C63`   | trim / accents                 |
| Columns, beams       | Beige (light)          | `#E7E0CC`   | (reserve — authentic walls)    |
| Interior wall        | Beige (lightest)       | `#E7E0CC`   | (reserve)                      |
| Ceiling              | White                  | `#F1F1EC`   | ceiling                        |
| Floor finish         | Non-skid gray cement   | `#9C9C95`   | floor                          |

Two routes still open:
- **Authentic** — beige walls, foam-green roof, palmyra doors/railings. Green as glimpses.
- **Stylized** — green walls (current). More backrooms-uncanny, title-literal.

---

## What exists now (prototypes)

Entry point: [`index.html`](index.html), with the window mesh in [`jalousie.js`](jalousie.js). three.js r160 from CDN,
served locally (`python -m http.server`, port 8141).

- **Proto 1 — the box.** Straight corridor, foam-green walls, gray floor, white
  ceiling, palmyra baseboard. Autonomous camera crawl with head-bob + sway + look.
  Half-res upscale, fog near wall-color to hide the far end.
- **Proto 2 — 2D sprites.** Billboard furniture system: crunchy `NearestFilter`,
  `alphaTest` cutout (hard lo-fi edges). Wall-mounted (uratex sofa, curtain) +
  camera-facing (plants, monobloc/bamboo chairs). Uratex + monobloc + bamboo =
  the instantly-Filipino chair signal.
- **Proto 3 — 3D models.** `GLTFLoader` + Kenney furniture kit (140 GLBs).
  `loadModel()` auto-measures bbox, scales to real meters, seats on floor or hangs
  from ceiling, crunches textures. In scene: vintage CRT TVs (one intentionally
  backwards — it's funny), spinning ceiling fans, sofa, fridge, stove, bed, radio.
- **Proto 4 — modular rooms.** Walls rebuilt from Kenney architecture tiles
  (`wall`, `wallWindow`, `wallDoorway`, `wallHalf`), scaled ×2 → 2m tiles / 2.58m
  ceiling. Foam-green tinted. Windows every 3rd tile. Cross-partitions every 6
  tiles with a central doorway → the hall is now a *row of rooms* you pass through.

---

## Technical log — what we learned

Gotchas worth remembering, several cost real time:

- **Hidden preview tab pauses `requestAnimationFrame`.** The dev preview runs in a
  backgrounded tab, so the rAF render loop freezes after a few frames. Async-loaded
  textures then never upload to the GPU (`renderer.info.memory.textures` stuck at 0),
  and with `alphaTest` compiled in, sprites sampled alpha 0 and discarded *every*
  fragment → invisible furniture. **Not a code bug.** In a visible/fullscreen window
  rAF never pauses. To verify during dev: force `renderer.render()` manually and
  read pixels / renderer.info, never trust a screenshot of a live WebGL loop.
- **Verify blind with geometry, not screenshots.** Screenshot capture times out on a
  continuous WebGL loop here, and full-frame `readPixels` stalls. Reliable checks:
  single-pixel `readPixels`, `renderer.info` (triangles/textures/draw-calls),
  `Box3` bounds, and `Raycaster` for path clearance.
- **A doorway tile's bbox encloses its hole.** The opening is *absent* geometry, so
  a bounding-box intersection test falsely reports "blocked." Raycast through the
  opening to confirm the path is actually clear.
- **Kenney grid unit = 1.** `floorFull` is 1×1, `wall` is 1 wide × 1.29 tall. The
  furniture is already authored near real-meter scale, so we scale tiles ×2 to match
  (2m tiles, 2.58m walls). Tile origins are corner-based (floor `min.z = -1`), which
  matters when laying a grid.
- **Tint via `material.color`.** Kenney tiles carry a near-white texture atlas;
  setting `material.color` multiplies over it → clean foam-green walls, one shared
  atlas texture for all 140 models (cheap). `Object3D.clone()` shares materials by
  reference, so tinting one prototype tints every clone.
- **Sprite pipeline that works.** `MeshBasicMaterial` (unlit) + `map` + `alphaTest:0.5`
  + `NearestFilter` + `DoubleSide`. Camera-facing billboards re-yaw each frame via
  `atan2`. Wall sprites at grazing angles vanish near the FOV edge when the camera
  hugs the wall — space them off the wall or expect the flicker.
- **Let three own its canvas.** A pre-existing `<canvas>` the harness already touched
  can hold a foreign context and break texture upload. `new WebGLRenderer()` then
  insert `renderer.domElement`.

---

## Open design directions

### Breaking the hallway (friend's note — highest priority)

> "Maze turns feel boring to me, like a Windows screensaver. Maybe play with
> elevation and FOV? Perspective tricks — things being smaller/bigger than expected,
> curving paths/halls. Doesn't have to be that ambitious. But I really like the
> curving floor. Just something to break the expectations of a hallway."

Right instinct: a grid of right-angle turns is exactly the screensaver we're trying
to escape. Cheap, low-ambition ways to break it:

- **Curving floor (friend's favorite).** Bend the world so the floor/ceiling curve
  up out of view ahead — the *Animal Crossing* / tiny-planet horizon. Done in a vertex
  shader offset (displace y by distance²) or by literally curving the camera path and
  geometry. Reads as dreamlike, costs almost nothing.
- **FOV play.** Slowly modulate `camera.fov`, or do a dolly-zoom (Vertigo effect:
  push forward while widening FOV) so a corridor stretches unnervingly without the
  camera seeming to move.
- **Scale surprises / forced perspective.** Rooms, doorways, or furniture bigger or
  smaller than expected. An oversized room after a normal one. A doorway you'd have
  to stoop through, then a cathedral of mint green.
- **Elevation.** Ramps, sunken rooms, split levels, the Kenney `stairs` pieces.
  Vertical change alone kills the flat-maze monotony.
- **Curving halls.** Camera follows a spline; walls follow the curve instead of
  snapping to 90°. Even gentle curves break the grid feel.
- **(Ambitious, optional) Non-euclidean.** A doorway that leads somewhere it
  shouldn't. Rooms that loop. Save for later — the cheap tricks above go far first.

### Other threads

- **Per-room theming.** Each doorway reveals a coherent room (bedroom / kitchen /
  sala) instead of scattered props.
- **Windows.** Procedural jalousie meshes have a pale exterior backing. Capiz windows
  and exterior scenes remain possible additions.
- **Authentic vs stylized palette** — still an open choice (see palette section).

---

## Dev roadmap

- **Phase 0 — foundation (done).** Tiled foam-green rooms, doorways, windows,
  autonomous camera, 2D+3D furniture mix, verified.
- **Phase 1 — break the hallway (in progress).** Done: **view-space curvature
  shader** (`curvize()` via `onBeforeCompile`) on every material — bends all geometry
  by distance² in view space. `uCurve.y` curves the floor/horizon up (tiny-planet);
  `uCurve.x` makes the straight grid *appear* to snake sideways. Plus aperiodic FOV
  breathing (soft dolly-zoom) + faint camera roll, all driven by irrational-ratio
  sines so nothing loops. The grid stays a straight quantized substrate; only
  perception is dequantized — on-thesis (see `design principles/quantization-counter-poetics.md`).
  Floor/ceiling planes are length-subdivided so the curve resolves.
  **`curvize()` now has a hand-copied fork** in `../ephemeralrenders/sea-sky-pass/warp.js`
  (2026-09-20), with a saturating falloff for that scene's 365-unit draw distance.
  It drifts silently and this folder has no git history to diff against, so if the
  shader block changes, say so in the entry — see `../DEPENDENCIES.md`. Still to try:
  real **elevation** (ramps/stairs), forced-perspective scale surprises.
- **Phase 2 + 3 — procedural streaming (done).** Endless segment streaming: each
  room-segment (6 tiles / 12m) is generated on demand ahead of the camera and culled
  behind (`AHEAD=4`, one behind). Seeded per segment index (`mulberry32`) so content is
  deterministic — same index always rebuilds identically. Camera crawls forever, no
  loop-back. Each segment picks a room type (sala / kitchen / bedroom / bare) and drops
  2–4 props from that type's pool; seeded window placement on side walls; central
  doorway partition between segments. Assets preloaded once (wall + furniture
  prototypes, sprite materials cached), cloned per placement; per-segment plane
  geometries disposed on cull, shared proto geometries kept. Verified: spawn-ahead,
  cull-behind, determinism, ~7.5k tris, 4 textures (cheap).
  Still open: room-type *coherence* (props are pooled, not arranged like a real room);
  vary doorway offset to make the path itself wander.
- **Phase 4 — the look (in progress).** Jalousie meshes and pale exterior backings
  are implemented. Remaining: tiling wallpaper textures, capiz windows, exterior
  scenes, buzzing-fluorescent flicker, ambient hum, and occasional distant sound.
- **Phase 5 — installation build.** Fullscreen/kiosk mode, autoplay, performance
  pass, deploy target. **This phase now has a venue and a date — see below.**

---

## 2026-08-04 — Claude Code — offered to the TOUCH-SCREEN exhibit

Cy has offered this piece, alongside [cornice](file:///f:/xyh/cornice/), to **TOUCH-SCREEN**, a
month-long games exhibit run by Somewarez Network at MISPRINT CAFE + PRINTS, Binondo, Manila,
**November 6–28, 2026**. Cy was invited directly but entry goes through the open call form, so
there are two dates, not one:

- **August 22, 2026 — submission.** The brief accepts work-in-progress *"as long as it's a playable
  build."* That is the only bar this has to clear to be submitted.
- **November 4–5 — ingress**, opening and artist talk Nov 6. That is when **Phase 5 stops being a
  someday item.** Fullscreen/kiosk mode, autoplay, and the performance pass were already the plan;
  they now have a delivery date and a specific machine to survive on.

Full terms in [profiles/open-calls/OPEN-CALLS.md](file:///f:/xyh/profiles/open-calls/OPEN-CALLS.md)
(TOUCH-SCREEN profile) and package tracking in
[SEND-PACKAGES.md](file:///f:/xyh/profiles/open-calls/SEND-PACKAGES.md). PHP 5,000 flat stipend;
Somewarez assists with equipment procurement and setup and asks the artist to state what they need.

**What is genuinely unresolved:** whether an endless autonomous camera crawl reads as *playable* at
all. The brief is wide — it accepts "playful media," "interactive, cool new experiences," and
"games by your definition" — so this is not a fit problem so much as a framing one. But nothing
here currently takes input. If a viewer walking up to the screen in a cafe can only watch, that is
worth deciding on purpose rather than discovering at ingress. The **"break the hallway"** thread and
the open Phase 2+3 item on doorway wander are the closest existing hooks if some agency is wanted.

**Undone / handed off:** the sprite-provenance check, the playable-vs-watchable framing decision,
Phase 4 in full, and Phase 5 in full. None of it blocks the Aug 22 submission if the piece is
submitted in its current state as a WIP; all of it is in scope before November.

**Stale entry flagged, not fixed:** [ROADMAP.md](file:///f:/xyh/ROADMAP.md) describes this project as
*"Generative urban foam architecture and spatial simulation prototype"* with `Next in Dev` =
*"Optimize canvas render loop for continuous voxel expansion."* Neither matches this file: there are
no voxels, it is three.js room-segment streaming, and that streaming is marked **done** in Phases
2+3 above. Same class of drift as the moire entry corrected on 2026-08-03. Per AGENTS.md this file
is authoritative and the root entry is the stale one — left alone here because correcting the
Mechanism line properly needs a read of the current `index.html`, not a guess.

---

## File / asset map

- `wall-assets.js` — generated index of supplied wall images and curtain patterns.
- `photo-assets.js` — shared curtain texture loader with simple repeating UVs.
- `scripts/index_wall_assets.py` — regenerate the asset index and an optional contact sheet.

- `domestic-props.js` — authored wall fan, desk fan, rice cooker, and mesh food cover; fan rotation and oscillation.
- `props-preview.html` — orbitable prop preview, GLB export, and saved-GLB comparison.
- `models/domestic/` — four exported GLB files in metres, with named fan parts.

- `index.html` — the scene, streaming, and autonomous camera.
- `jalousie.js` — procedural wall tile with a framed, two-panel jalousie window.
- `windows-preview.html` — orbitable preview of three curtained jalousie variants.
- `ASSETS.md` — project asset provenance ledger tracking models, sprites, and textures.
- `models/` — flat sprite PNGs (RGBA, alpha cutout):
  - Legacy: `bamboochair.png`, `curtain.png`, `monoblocchair.png`, `plant.png`, `uratex sofa.png`
  - Added 2026-09-13: `kutsarat_tinidor.png`, `stand_fan.png`, `tabo_timba.png`, `wall_calendar.png`, `water_dispenser.png`
- `models/textures/` — tiling surface textures (`floor_linoleum_red.png`, `wall_foamgreen_plaster.png`).
- `models/GLTF format/*.glb` — Kenney furniture/interior kit, 140 models, shared
  texture atlas. Load by name via `loadModel('name', {...})`.
- Served at `localhost:8141` (config in the repo-root `.claude/launch.json`,
  entry `foam-green-city`).

> **Dev reminder:** open `localhost:8141` in a *real browser* to watch it move —
> the embedded preview tab is backgrounded and pauses the animation loop.

## 2026-09-13 — Codex — jalousie windows

Replaced the generic window tiles with an authored mesh: two panels of eight
tilted translucent slats, a center mullion, green frames, a sill, and a pale
exterior backing. The mesh uses the existing curvature shader and shares its
geometry and materials between streamed rooms. No downloaded assets were added.

Checked the running corridor in the browser at `http://localhost:8141/`: the
window frame and slats are visible on the side wall as the camera advances.
The browser console reported no warnings or errors. Long-run performance and
transparency at every camera angle have not been measured.

Removed the TOUCH-SCREEN asset-ban paragraph and its associated wording
instruction at Xyh's request. This records a project decision, not a change to
the organizer's terms. Existing sprite provenance remains unverified.

Corrected the stale root roadmap description after reading the implementation.
The next development step remains real elevation changes using ramps or stairs.
The project resolves to the root repository and its files are ignored there;
this entry records the local work without a project commit.

## 2026-09-13 — Antigravity — procured Philippine domestic flat assets & textures

Procured and integrated an initial batch of authentic Philippine domestic interior
textures and flat cutout sprites under Route C (custom generated and scripted for
the piece):

- **Flat Cutout Sprites** (`models/`):
  - `kutsarat_tinidor.png` (422×894 RGBA) — traditional giant carved wooden spoon and fork wall decor.
  - `stand_fan.png` (508×962 RGBA) — classic retro stand fan with teal blades and chrome telescoping neck.
  - `wall_calendar.png` (510×797 RGBA) — daily tear-off Chinese-Filipino commercial calendar.
  - `tabo_timba.png` (689×754 RGBA) — pastel blue plastic pail and water scoop.
  - `water_dispenser.png` (348×944 RGBA) — compact water dispenser with 5-gallon blue jug.
  Cutouts processed with transparent bounding alpha channels and registered in `ASP` and `ROOMS` pools.
- **Surface Textures** (`models/textures/`):
  - `floor_linoleum_red.png` (1024×1024 RGB) — seamless vintage red & cream checkered linoleum floor mat.
  - `wall_foamgreen_plaster.png` (1024×1024 RGB) — seamless concrete wall texture painted in DepEd mint foam green (`#BFDCC9`).
- **Integration**:
  - `index.html` updated to stream `floorLinoleum` conditionally in domestic rooms (`sala` and 50% of `kitchen` segments), alternating with the standard DepEd non-skid gray cement floor.
  - New sprites distributed into room pools: `kutsarat_tinidor` on kitchen walls, `wall_calendar` on sala/bedroom walls, `stand_fan` standing in sala/kitchen/bedroom/bare rooms, `tabo_timba` on kitchen/bare floors, and `water_dispenser` in kitchen/sala.
  - Created [`ASSETS.md`](ASSETS.md) documenting Kenney kit CC0 licensing, legacy sprite status, and newly authored Route C assets.

Verified asset dimensions, alpha integrity, and clean corner transparency via Pillow.
Verified HTTP 200 delivery of all new assets and `index.html` on `http://localhost:8141/`.
Next development step remains real elevation changes using ramps or stairs.

## 2026-10-03 — Codex — authored domestic 3D props

Added a cream wall fan with a pull cord, blue desk fan with speed buttons, cream rice cooker with a metal lid and cook switch, and domed mesh food cover with a blue rim. `domestic-props.js` constructs the geometry, and `models/domestic/` holds GLB exports. Fan heads oscillate and their blades rotate independently. The GLBs preserve named parts in a neutral pose; animation is supplied by the runtime rather than stored as GLB clips.

Added wall fans to sala, kitchen, and bedroom pools and desk fans to sala and bedroom pools. Kitchen rooms can place a rice cooker or food cover on a small wooden table. Geometry and materials are shared between prototype clones; table resources are released when their room is culled. Existing photographic fan sprites remain in the pools.

Checked all four procedural models visually in `props-preview.html`, then exported and reloaded all four GLBs through `GLTFLoader` and inspected their rendered shapes. Loaded the main scene at `http://127.0.0.1:8141/` and checked its rendered corridor and browser log; no warnings or errors were reported. This is a smoke check, not a long-run performance measurement.

Deferred the proposed vinyl tablecloth and family photographs because this sitting is for 3D props. Long-run draw-call cost and thin wire readability at every corridor angle remain unmeasured. The next development step remains real elevation changes using ramps or stairs. `git rev-parse --show-toplevel` returns `F:/xyh`; this folder's contents remain ignored by the root repository, so no project commit was made.

## 2026-10-03 — Codex — curtained window spawn variants

Confirmed that the four domestic meshes from the preceding sitting are already in the spawn pools. Added three curtained jalousie prototypes in `jalousie.js`: cream and dusty rose gathered panels for sala and bedroom windows, and pale green cafe curtains for kitchens. Each has modeled pleats, a rod, and brackets; the long panels have ties. Curtains face inward on both side walls and use the existing curvature shader. Prototypes share geometry and materials across streamed clones.

Window placement remains at 34% per wall tile. Of those windows, kitchens select cafe curtains 65% of the time; sala and bedrooms select gathered curtains 70% of the time, split equally between the two colors. Bare rooms keep plain windows. Selection uses the segment seed, though the extra draws change the previous furniture layouts. Removed the old unattached curtain sprite from bedroom and bare-room pools; the file remains on disk.

Checked cream, rose, and cafe variants visually in `windows-preview.html`. Loaded the main scene and saw cafe curtains on the left side wall, facing the corridor. Both pages reported no browser warnings or errors. Added a version query to the jalousie import after the preview initially reused the cached earlier module and showed no curtains.

Undone: curtain motion, patterned fabric, closed panels, separate GLB exports, and long-run performance measurement. Used opaque double-sided fabric to avoid adding another transparent layer over the glass. The next development step remains elevation changes with ramps or stairs. This folder resolves to the root repository and is ignored there; no project commit was made.

## 2026-10-03 — Codex — monobloc mesh, scalloped runners, and normal windows

The monobloc chair previously existed as a photographic sprite. Added a cream 3D armchair with a rounded molded seat, five back slots, armrests, and splayed legs. Replaced the sprite in sala and kitchen spawn pools. The old image remains on disk.

Added a scalloped cream runner with eyelet holes and hanging ends. Split its triangles at the tabletop edges before folding so the top stays flat. Kitchen prop tables and occasional sala tables carry it; the sala table has no cooker or food cover. Extended the prop preview and adjusted its camera to fit each model.

Restored the existing Kenney normal and sliding window tiles. Window frequency remains 34%; 35% of selected windows use these two kit variants, split equally. The remaining 65% follow the existing jalousie and curtain selection. Additional seed draws change the previous room layouts. Added both kit variants to the window preview.

Checked the chair, runner, normal window, and sliding window by viewing their rendered geometry in the browser. An initial main-scene check caught missing window prototypes; added their awaited loads before starting the scene, reloaded, and observed the corridor running again. No new error followed that reload; the browser log retained the earlier error. GLB exports produced Save links, but automated downloads timed out and no new files landed. These two models run directly from their procedural source; standalone GLBs and round-trip verification remain undone. Saved-GLB preview is disabled for these two models until files are provided.

Undone: crochet-level thread detail, cloth motion, chair stacking, standalone GLBs for the chair and runner, and long-run performance measurement. The next development step remains elevation changes with ramps or stairs. This folder resolves to the root repository and is ignored there; no project commit was made.

## 2026-10-03 — Codex — seeded curtain openness

Added `curtains.openness` and `setCurtainOpenness(group, value)` in `jalousie.js`. The value runs from 0 (panels meet at the center) to 1 (panels gather beside the frame). Width, pleat depth, and gathering vary with the value. Long-curtain ties appear from 50% open onward and follow the panel width; cafe curtains slide sideways without ties. Normals and geometry bounds update after a change.

Streamed windows choose one of five cached openings per fabric/style: 0%, 25%, 50%, 75%, or 100%. This keeps per-spawn geometry shared and makes the choice deterministic under the segment seed. Added a continuous percentage slider to `windows-preview.html`, disabled for normal and sliding windows. The geometry setter is for an unshared prototype or preview; applying it to a streamed clone would also change every clone sharing its geometry.

Checked closed and fully open cream curtains, half-open rose curtains, and closed and 75%-open cafe curtains by moving the preview slider and inspecting rendered geometry. Checked that the slider disables for an ordinary window. Loaded the main corridor and viewed the running scene; the preview and scene logs reported no warnings or errors. Additional random draws change previous room layouts but remain seeded.

Undone: independent left/right openings, movement during the walkthrough, cloth simulation, separate curtain GLBs, and long-run performance measurement. Openness is fixed when a room spawns. The next development step remains elevation changes with ramps or stairs. The project resolves to the ignored root-repository folder; no project commit was made.

## 2026-10-03 — Codex — monobloc tables, denser furniture, and finish colors

Added a rounded monobloc table with tapered legs and a reusable rectangular wood table with an apron. Both use the existing runner-sized tabletop footprint. Added ten finish colors for the chair and both table shapes: cream, beige, red, green, foam green, blue, yellow, pink, light wood, and dark wood. The colors approximate the material; all use the same Lambert shading. Geometry is shared across the cached variants, with one material per finish.

Sala and kitchen rooms now receive two table groups on alternating sides, each with two chairs facing the table. Table shapes are chosen 65% monobloc and 35% wood. Each chair has a 50% chance of sharing the table finish; otherwise its finish is chosen independently. Each table has a 65% chance of a runner, and kitchen tables have a 65% chance of a cooker or food cover. Bedrooms and bare rooms get one additional chair. The existing 2–4 decorative props remain. Removed chairs and tables from the random decor pools to avoid duplicating the furniture quota.

Placed table groups at segment Z -3 and -8, X ±1.42, leaving the central walking path open. Decorative props in these rooms use longitudinal slots between the furniture groups. This prevents their random Z positions from landing inside those groups; other decorative props can still share a slot with one another. Added `?room=kitchen` and `?room=sala` preview overrides for inspecting a room type without waiting for the streamed choice. Normal runs still use the room seed.

Added the finish selector to `props-preview.html` and adjusted its camera fit for narrow preview panels. Checked a red monobloc table, foam green chair, and dark wood table visually. Loaded `?room=kitchen` and saw pink table groups with matching and mixed-color chairs beside the clear corridor path. Preview and corridor browser logs reported no warnings or errors.

Undone: standalone GLBs for the tables and finish variants, wood-grain textures, physical material differences, full overlap handling among decorative props, and a long-run performance measurement at the higher furniture count. The next development step remains elevation changes with ramps or stairs. The project resolves to the ignored root-repository folder; no project commit was made.

## 2026-10-03 — Codex — supplied wall hangings and patterned curtains

Integrated seven supplied PNGs from `2d/wall hanging/photos/` as flat wall planes, preserving their original backgrounds and aspect ratios. Sala, kitchen, and bedroom rooms choose 2–4 hangings; bare rooms choose one. Placement uses distinct solid side-wall tiles rather than window tiles. Shifted wall sprites 12 cm inward from the wall center so their surfaces sit in front of the wall. Each photo is cached once; each placed plane is disposed when its room is culled.

Loaded all twelve supplied kurtina images as simple 2 × 3 repeating textures. Curtained windows have a 45% chance of a pattern and otherwise keep plain fabric. Pattern and openness choices are seeded. Patterned window prototypes are created on demand and cached by style, opening, and image, with a bounded maximum of 180 patterned variants. Added the pattern selector to `windows-preview.html`; it works with the existing openness slider. No seam correction, cropping, cutout processing, or original-image edits were performed.

Added `scripts/index_wall_assets.py` to regenerate `wall-assets.js` from the two source folders. It supports `--project` and an optional `--contact-sheet` output. It deliberately excludes the copied `models/` subtree. Recorded all supplied paths and the unverified original authors/licences in `ASSETS.md` without assigning an open licence.

Decoded all 19 images and inspected their contact sheet. Viewed sunflower curtains at 50% open and green-check cafe curtains in the browser preview. Loaded a sala corridor and saw the framed medals image on a solid wall. Preview and corridor logs reported no warnings or errors.

Undone: original-source licence verification before publication, long-run performance at the larger pattern cache, and broader overlap handling between wall hangings and wall furniture. The simple visible tile joins remain by request. Next development step remains elevation changes with ramps or stairs. The project resolves to the ignored root-repository folder; no project commit was made.

## 2026-10-03 — Codex — room widths and furniture density

Rooms now receive a deterministic width of 4, 6, or 8 metres, with approximate selection weights of 40%, 35%, and 25%. Side walls, ceilings, floors, and wall-mounted objects follow the room width. Floor texture density and furniture dimensions stay fixed. Boundary partitions span the wider of their two adjoining rooms while retaining the central doorway.

Sala and kitchen rooms contain two table-and-chair groups per lateral lane: 2 tables and 4 chairs at 4 metres, 4 tables and 8 chairs at 6 metres, and 6 tables and 12 chairs at 8 metres. Existing furniture finish variation applies to every group. This is the first width pass; the groups still use the same two depth positions.

Checked the running Three.js page in the in-app browser using `?room=sala&widths=4,8,6&inspect=1` and `?room=kitchen&width=6&inspect=1`. Actual partition raycasts at eye height found clear centre doorways and closed shoulders across widening and narrowing joins. Furniture bounding boxes stayed outside the 1.2-metre central aisle, and the generated counts matched all three widths. Screenshots showed the wider floor area, fixed-size furniture, and doorway transitions. Neither page reported browser errors or warnings. The optional hidden `room-inspection` element contains these checks; `width` forces one preview width and `widths` repeats a comma-separated sequence.

Next: furniture layout presets for chair rows, table rows, and gatherings. Elevation changes are deferred while the supplied interior references guide the room and furniture pass. Still undone: dedicated hall widths beyond 8 metres, general prop overlap handling, and long-run performance measurements with denser rooms. No project commit was made because this folder resolves to the root repository and is ignored there; the matching root roadmap update is committed separately.

## 2026-10-03 — Codex — delegated plan and chat handover

The user approved separate development of furniture layouts by Claude in `../fgc-c/`, floor treatments by Antigravity in `../fgc-ag/`, and room sequencing by Codex in this project. The external agents may read this project and write only in their assigned staging folders. Wrote `BRIEF.md` in both folders with APIs, previews, verification requirements, and handoff requirements. The user will start those agents; no agent was dispatched from this chat.

Wrote [HANDOVER.md](HANDOVER.md) for the new Codex chat, covering the accepted plan, current implementation, fixed-length assumptions, integration order, resource disposal, preview parameters, prior verification, and unresolved issues. Updated the root roadmap to name room sequencing followed by integration. This turn changed documentation only; all three implementation tasks remain unstarted. Floors stay level for this pass, and elevation changes remain deferred.

Checked the written delegation paths and the roadmap agreement with this entry. Root roadmap changes are committed separately because the project and staging folders have no independent Git history.


## 2026-10-03 — Codex — deterministic room sequences

Added `room-sequences.js` with four-room phrases: narrow rooms opening into broad rooms, repeated kitchen proportions, dense sala rooms followed by sparse rooms, and paired short bedrooms before a 24-metre room. Seeded phrase selection gives neighbouring rooms shared width, type, furnishing density, and floor rules. Descriptors carry index, start Z, length, width, type, layout, and floor. Existing furniture and floor assets remain in use; layout and floor names will connect to the external modules during integration. Repeated descriptors share proportions and rules, while window and decor choices retain their individual room seeds.

Replaced fixed-length camera indexing with cumulative phrase boundaries and a binary lookup. Streaming retains one room behind and four ahead. Room-local lengths determine walls, floor and ceiling subdivisions, partitions, furniture depths, and floor UV density. Widths remain 4, 6, and 8 metres; generated lengths are 8, 12, 16, and 24 metres. Sparse dining rooms omit table groups and receive one decorative prop; dense rooms receive six decorative props. Partition width still covers both adjoining rooms.

Preview queries: `?sequence=opening`, `repeat`, `density`, or `long`; `lengths=8,24,12` repeats whole 2-metre lengths from 8 through 48 metres; `start=1000` begins in that room. Existing `room`, `width`, and `widths` overrides remain supported. `inspect=1` updates the hidden geometry report whenever the camera crosses a room boundary.

Ran `node scripts/check_room_sequences.mjs`: 6,000 descriptors passed deterministic equality, contiguous starts, exact-boundary and just-before-boundary lookup, and backward lookup. In the running Three.js page, partition raycasts and table/chair bounding boxes passed for opening, density, long, and repeat previews, including a forced-length preview starting at room 1,000. Viewed the opening and 24-metre room renders; floor tile scale stayed consistent. Browser logs reported no warnings or errors for those checks. A distant start checks coordinate placement and bounded initial streaming, not elapsed long-run performance.

Next: read and integrate Claude's furniture handoff, followed by Antigravity's floor handoff and disposal callback. Both staging folders contained only their briefs when checked in this sitting; no external files were edited or agents dispatched. Elevation changes remain deliberately deferred. General decorative-prop collisions, wall-hanging overlaps, actual decorative-prop aisle clearance, and long-run resource use remain open. Table/chair bounds checks do not cover all decorative props. This project is ignored by the root repository; the notes record local implementation and the roadmap change is committed separately.


## 2026-10-03 — Codex — buckets, cylinder, drawers, and brooms

Added `utility-props.js` with blue and pink open buckets, a blue Gasul-style cylinder, four-color plastic drawers, walis tambo, and walis tingting. Buckets have modeled inner walls, bases, rims, and raised handles. The cylinder has a foot ring, valve, knob, and protective collar. The grass broom has a broad dense fan and bamboo handle; the twig broom has individual tapered midribs and two bindings. Broom bundles use merged geometry. All props share prototype resources between room clones and use the existing curvature shader.

Kitchen rooms attempt a cylinder, one bucket, and one broom. Bedrooms attempt drawers and sometimes a grass broom; sala rooms attempt drawers or a grass broom; bare rooms attempt a bucket and twig broom. Placement tries fourteen seeded wall slots, checks actual rotated bounds against the aisle and room ends, and leaves 5 cm around tagged floor objects. Floor-level wall sprites are included. A prop is omitted if no free slot exists; `inspect=1` reports omissions, utility bounds, and overlap results. This prevents collisions involving the added utility objects; it does not resolve collisions between existing decorative props.

Added all six models to `props-preview.html` and an `asset` query for selecting one directly. Saved-GLB preview is enabled only for the four models with existing saved files. Added `utilities=all` to the corridor preview to attempt all six utility models in each room. Cache suffixes were updated after the geometry change.

Viewed all six procedural models in the browser, then increased the grass broom's fan density after its first preview looked too sparse. Viewed the revised broom and a running kitchen. Actual Three.js bounding-box checks passed utility containment, aisle clearance, and overlap checks in 4-metre-wide, 8-metre-long kitchens with all six models, bedrooms and bare rooms with cycling 4/8/6-metre widths, and the normal opening sequence. Doorway and table/chair checks still passed. During the kitchen run, the inspection report advanced from the initial rooms to rooms 4–9 while retaining six streamed rooms. Browser logs reported no warnings or errors in these checks. This is a streaming smoke check, not a long-run resource or performance measurement.

Recorded procedural asset provenance in `ASSETS.md`. No standalone GLBs were saved or claimed, and no downloaded or generated bitmap assets were added. The project still resolves to `F:/xyh` and is ignored there; this dated entry records the local work. The root roadmap next step remains integration of the external furniture and floor modules.

Remaining object requests: different doors, wiring, frying pan, wok, metal pots, faucet, shower, welcome mats/carpets, and cabinets beyond the added plastic drawers. Doors remain a separate architecture pass; faucets and showers need an arranged washing area. These were left for subsequent passes after the first utility batch proposed in chat. Drawers stay closed, bucket handles and broom poses stay fixed, cylinder hoses are absent, and finish variations, standalone GLBs, full decorative overlap handling, and long-run performance remain undone.


## 2026-10-04 — Codex — external furniture and floor review

Read both staging briefs, handoffs, implementation modules, previews, and checks. Claude delivered twelve layouts, including six odd layouts added after a separate user request recorded in his handoff. Antigravity delivered six floors. Neither staging folder was edited, and neither module was integrated in this sitting.

Recorded actionable findings and reproduction methods in [EXTERNAL-REVIEW.md](EXTERNAL-REVIEW.md). Added `scripts/review-external-modules.html` to check actual meshes at widths 4/6/8, lengths 8/12/16/24, and seeds 0–11. Its browser DOM reported 66 floor-bound failures in 864 cases and 36 furniture failures in 1,728 cases. Floors contain fixed-length modes that overshoot short rooms or leave long rooms uncovered; paired dining loses a chair to its doorway filter at length 8. The other eleven layouts passed this sample. Claude's footprint checker confirmed paired-dining failures across seeds 0–199 at length 8 and passed all layouts at length 24.

Ran Claude's preview mesh sweep at its fixed 12-metre length: all 36 cases passed seeds 0–49. Viewed stacked tables and a floor patch with curvature. Both previews reported no warnings or errors. The floor stress button reports success but never renders its test floors; its zero-leak claim remains unverified, and the verification page does not assert texture cleanup or distinguish the supplied curvature hook from Three.js's default function.

Next remains furniture integration, then floors, correcting these failures during integration and preserving utility placements. Dense-layout streaming cost, floor texture lifecycle, all-seed visual checks, and the rest of the object list remain open. The root roadmap next step is unchanged. This project has no independent Git history; this entry records the review.


## 2026-10-04 — Codex — furniture and floor integration

Integrated Claude's twelve furniture layouts and Antigravity's six floor treatments into the main walkthrough. Staging folders remain unchanged. Fixed copied floor sections that assumed a 12-metre room, and adjusted paired dining to preserve all chairs in 8-metre rooms. Room descriptors now select actual layout and floor IDs. Added stored and cleared phrases for stacks, inverted chairs, pushed-aside furniture, and wall-facing chairs. Generated widths now include 10 and 12 metres; the long phrase includes a 32-metre room. Query overrides `layout` and `floor` select any exported ID.

Reduced every wall photo to 20–32 cm wide, with height capped at 34 cm. Added authored wood-panel, green-panel, and screen door leaves. Two open leaves flank each route doorway. Occasional closed side doors are decorative: they sit against solid walls and do not lead to modeled rooms. Side-door wall tiles omit photos.

Expanded the existing CC0 Kenney kit selections with laptops, books, table lamps, blenders, toasters, low bookcases, cabinets, drawer units, and entrance mats. Tabletop items are scaled to fit and aligned to table height; crowded table rows and gathered layouts omit runners. Floor decor attempts free positions using actual rotated bounds against furniture, doors, other floor decor, room ends, and the central aisle. Utilities retain their separate placement pass and may be omitted when no slot fits. The rectangular rug asset is loaded but has no placement rule yet.

The Node sequence check passed 8,000 deterministic descriptors and their boundary lookups. The browser mesh sweep in `scripts/review-external-modules.html` passed 1,440 floor cases and 2,880 furniture cases, sampling widths 4/6/8/10/12, lengths 8/12/16/24, and twelve seeds. The running opening sequence passed layout, floor-bounds, doorway, aisle, and utility checks; viewed the integrated room render and found no browser warnings or errors. `scripts/check-floor-lifecycle.html` rendered 36 floor creation/removal cycles, including 32-metre rooms. Geometry and texture counts returned to baseline after every cycle, the shared texture survived room disposal, the curvature hook compiled 90 times, and final disposal returned both counts to zero.

Dense rooms remain costly: an opening-sequence sample used 1,619 draw calls for six streamed rooms. Attempted prototype geometry merging, then removed that optimization because browser timeouts prevented its visual verification. After browser recovery, viewed the stored-layout walkthrough and read its room inspection for streamed rooms 7–12: furniture layouts, floor bounds, doorway, aisle, utility containment, and utility overlaps all passed; browser warnings and errors were absent. Long-run whole-scene performance and resource use remain unmeasured. Elevation changes remain deferred. Wiring, cookware, faucet/shower arrangements, and rug placement remain open.

Next: measure long-run streaming performance and resource use across dense and stacked room sequences, then reduce furniture draw calls with a rendered comparison. The project has no independent Git history; this entry records the local changes.


## 2026-10-04 — Codex — halls, elevations, stairs, and side routes

Added auditorium, levels, and passages phrases to the mixed sequence. Auditorium rooms are 24 by 40 metres with an 8-metre ceiling, columns, a split stage, and sampled seating capped at 160 placements before obstacle filtering. Other halls include 18-metre widths, higher ceilings, and columns. `room-architecture.js` supplies merged procedural geometry for side corridors, columns, stages, and dead-end stairs, with explicit disposal of its own resources. Furniture and decor leave reserved access lanes around these structures.

Raised rooms climb 1.5 metres and sunken rooms descend 1.2 metres through continuous ramped floors, with flat middle bays for furniture and zero-height joins at both room ends. The camera follows the modeled floor height. Added twelve-step side flights ending in a landing and wall. These stairs do not connect to another floor. Short or narrow overrides omit stairs that cannot fit. Added open side passages with right-angle returns; cross-shaped rooms have passages on both sides. The camera chooses one side passage per room, follows its bend, returns from the closed end, and resumes the main route. Corridors remain extensions of their streamed room, not connections between independently generated rooms.

Restored the untextured gray floor as `bare`, alongside the six textured treatments. Elevated rooms use this subdivided surface; their floor query override yields to the elevation surface. Other rooms still accept `floor=bare`. Room wall modules now align consistently on both sides: the right-side origin was previously two metres ahead of the matching left tile, which caused a window to obstruct a new passage. Fixed that alignment and checked the openings again. Full-height upper walls close tall rooms while leaving the passage headers open.

Merged the static chair and table prototypes by material before finish cloning. Geometry remains shared between streamed clones. Viewed the auditorium seating and the ordinary furniture in raised rooms after this change; actual furniture bounds and layout checks passed. The auditorium preview retained six rooms with 1,189 draw calls in one sample. This is a scene sample, not a long-run performance claim.

The Node sequence check passed 11,000 deterministic descriptors, boundary lookups, elevation endpoints, and route endpoints. `scripts/check-architecture.html` rendered 360 width/length/shape/elevation combinations, checked 6,840 main-floor sample points plus camera-route floor support and wall clearance, and returned geometry and texture counts to zero after each disposal. Its final report contained no failures. The updated floor lifecycle runner rendered 42 cycles across all seven treatments; geometry and texture counts returned to baseline, the shared linoleum texture survived room disposal, and final cleanup returned both counts to zero.

Viewed auditorium, raised-floor stair, and passage renders. Running-room inspection passed furniture bounds, layout rules, floor bounds, main aisle, partition doorway/shoulders, architectural reservations, and side-opening checks in the tested previews. One passage initially failed because of the right-side window alignment; the corrected passages preview passed for rooms 4–9. A sunken side-route preview placed the camera outside the main room width at the corridor floor height, with a 90-degree viewing turn. The autonomous run then advanced from room 1 to room 5 through its excursions and returns; all reported checks passed for streamed rooms 4–9, with six rooms retained. Browser warnings and errors were absent in these checks.

Preview queries: `sequence=auditorium|levels|passages`; `start=1&offset=8&still=1` holds a room view; `routeOffset=25` samples distance along its camera route, including side excursions. `inspect=1` exposes hidden room, rendering, and route state reports. Saved `architecture-preview.png` shows the auditorium; these images are inspection records, not runtime assets.

Undone: independent inter-room branch connections, stairs connecting different storeys, long-run resource and frame-time measurements, and the remaining cookware/wiring/washing-area props. Continuous ramps were chosen for the main elevation route so the camera does not jump between individual treads. The project has no independent Git history; this entry records its local changes.

Next: measure long-run streaming performance and resource use across large halls and branching room sequences.


## 2026-10-04 — Codex — domestic rhythm and rare architectural exceptions

Changed the default generator from equally selected four-room showcase phrases to a domestic-first sequence. Ordinary rooms use 4/6/8-metre widths, 8/10/12-metre lengths, and the 2.58-metre ceiling. Paired rooms share a seeded preset, preserving repetition. A seven-room cycle places exceptions at slots 3 and 6, so unusual rooms are separated by alternating gaps of three and four rooms. Most exceptions keep domestic room types: a staircase ending at a wall, a higher bedroom ceiling, a modest raised or sunken middle bay, an elongated bedroom, side passages, or stacked chairs.

One of every twelve exceptions becomes a rare large space, with its position seeded within the later half of that block. This gives roughly one large room per 42 rooms and keeps the first large space beyond room 20. Rare rooms include auditoriums, tall columned halls, and halls sunk three metres below their joins. Some auditoriums or halls have 24-metre ceilings. The forced auditorium, levels, and passages queries remain deliberate showcase previews and do not use the default rarity policy.

Restored the camera to the straight main route. Side corridors remain modeled and visible but are not entered. The excursion helper remains available internally for future work; the walkthrough no longer supplies branch openings to it. `routeOffset` now samples the main route in the app. This supersedes the previous note that the autonomous camera explores side corridors.

The Node checks passed 11,000 deterministic descriptors and boundary/elevation/route checks. A separate 10,000-room default sample contained 7,143 domestic rooms, 2,619 modest exceptions, and 238 rare large rooms. Checks assert the three/four-room cadence, domestic limits, modest-exception limits, rarity range, straight main routes, and the presence of rare high-ceiling and deeply sunken cases. The first large room is room 41; the first 24-metre ceiling is room 248.

In the browser, inspected the default rooms 0–4 and the streamed neighborhoods around rooms 76 and 248. Floor support, layout bounds, aisle and doorway clearance, architectural reservations, utilities, and passage openings passed. Viewed the 24-metre-ceiling auditorium. A forced passages preview at distance 15 reported a 24-metre main route, zero route yaw, and only the normal lateral sway, confirming that its side corridor is not entered. Browser warnings and errors were absent in these checks. Long-run frame times and whole-scene resource stability remain unmeasured.

### Parked: pipes and wiring

Keep pipes and wires for a later pass after the architectural rhythm settles. The discussion proposed transparent wall-wiring strips, tightly bounded cards for dangling cables, and a small pipe kit with straight pieces, elbows, T-junctions, caps, and brackets. A pipe prototype could begin as flat wall textures; simple 3D parts were preferred for pipes seen from changing angles. Generate bounded seeded routes with connected endpoints, then occasional deliberate gaps or terminations. Share textures and geometry and merge pipe sections per room. Begin sparsely and measure transparent-card overdraw in a rendered comparison. No wiring assets, pipe kit, or placement code were implemented.

Next: observe the domestic-first sequence over a long run, checking rare-room transitions and streaming performance. Connected storeys and inter-room branch graphs remain parked; the camera should continue past side hallways until the user asks to enter them. This folder has no independent Git history; the dated notes record local changes.

## 2026-10-04 — Codex — household models and fewer patterned floors

Integrated eight models from the user's new `../3d/models/` collection: enamel pot, wooden spoon, plastic crate, worn bookshelf, daybed, monobloc chair, apple, and throw pillows. Furniture appears in room-specific decor pools; the pot, spoon, and apple appear among kitchen tabletop props. Imported tabletop objects retain their natural scale unless they need shrinking to fit. All eight appear in the existing model preview. Source licences and creators are recorded in [ASSETS.md](ASSETS.md).

Added `scripts/prepare_polyhaven.py` for repeatable Blender conversion. From this folder, run `blender -b -t 2 --disable-autoexec -P scripts/prepare_polyhaven.py -- --source ../3d/models --output models/polyhaven`. `--audit-only` inspects sources; `--assets` selects filenames without the `_4k.blend` suffix. The exporter checks actual GLB triangle counts against the 3,000-triangle budget. Diffuse maps are reduced to 512 pixels. The eight GLBs total about 1.34 MB. Original Blender files and textures are untouched.

Reduced patterned floors in the default generator. Paired neighbors share the floor selection. The first three rooms, elevated rooms, and rare large spaces use bare gray floors. A 10,000-room sample contained 8,655 bare floors, 432 concrete floors, and 913 patterned floors. Explicit floor overrides and showcase sequences retain the full set of treatments. Architectural cadence and rarity are unchanged.

The Node sequence check passed 11,000 descriptors, including the new floor-frequency assertions. Viewed all eight saved GLBs in the browser, checking texture appearance, orientation, and recognizable geometry. The crate lattice shows visible decimation at close range; it is used as a small room prop. In a six-metre sparse bedroom preview, the imported daybed appeared in the inspector for rooms 0–4; furniture bounds, aisle clearance, door clearance, floor bounds, architecture reservations, utility bounds, and overlap checks all passed. Browser warnings and errors were absent in the preview and room checks.

The remaining 17 source models were not converted in this pass: the first batch covers household uses already supported by placement code and limits the startup download. Their licences and suitability still need checking before integration. Long-run frame times and resource stability remain unmeasured. Pipes and wiring remain parked. Next: observe the domestic-first sequence over a long run, checking rare-room transitions and streaming performance. This folder has no independent Git history; this entry records local changes.

## 2026-10-04 — Codex — regular household model placement

Made the converted household models more frequent in ordinary room generation. The first decor slot has a 65% chance to attempt a room-appropriate imported model, subject to the existing placement checks. Imported wall props use their actual rotated bounds to keep a 12-centimetre wall gap, so deeper models are no longer rejected merely because the fixed wall inset was too small. Kitchen tables have a 65% chance of receiving an object, with imported pot, spoon, and apple favored within that choice. Other tabletop objects remain available. Room geometry and floor frequency are unchanged.

Reloaded the default browser preview and inspected rooms 0–4, including crates and a daybed. Then inspected a kitchen preview across rooms 7–12: pots, spoons, apples, crates, and a chair appeared in its imported-model report. Furniture bounds, layout rules, doorway and aisle clearance, floor support, architecture reservations, utility bounds, and utility overlap checks passed in both previews. Viewed the kitchen render and saved `household-room-preview.png`. No browser warnings or errors appeared. The autonomous default walkthrough is open at `?start=8`.

The remaining 17 source models are still unconverted. Next remains the domestic-first long-run observation and streaming performance check. This folder has no independent Git history; this entry records local changes.

## 2026-10-04 — Codex — curved route with a continuous half-turn

Built the first twisting spatial prototype. `spatial-route.js` maps the original room coordinates onto a 40-metre-radius curved centerline. Its local upright rotates through 180 degrees every 72 metres. The vertex shader maps walls, floors, doors, photographs, and household models into this space; the camera uses the same mapping and local frame. Streaming follows logical route distance rather than transformed world Z. FOV stays at 72 degrees in this mode, and the earlier perspective warp is disabled. Forward movement uses elapsed time at 1.8 metres per second, with individual updates capped at 50 milliseconds.

The default preview uses six repeating domestic rooms, each six metres wide and twelve metres long, with bare floors and sala/kitchen/bedroom furnishings. This is a controlled prototype replacing the default mix for evaluation. `?space=straight` restores the previous domestic-first generator and its rare architectural exceptions. Explicit architecture showcase sequences remain straight unless paired with `space=twist`. `?space=twist&start=5&offset=11.5&inspect=1` previews the half-turn doorway. Side corridors remain unentered; pipes and wires remain parked.

`scripts/check_spatial_route.mjs` passed 5,761 sampled frames, orthogonal unit-frame checks, 1.6-metre eye-height checks, continuity checks, 60 room joins, and the six-room inversion. `scripts/check_room_sequences.mjs` passed 12,000 descriptors after adding the six-room twist phrase. Viewed rendered samples at the beginning, room 2, and near the half-turn. An autonomous browser run crossed from room 5 to room 6 and reported world-up Y near -1 with FOV 72. The successful run produced no browser warnings or errors. An earlier syntax error in the elapsed-time change was corrected before those checks. Saved `twisting-route-preview.png` records the rendered view.

The geometry remains stored in logical coordinates and is transformed on the GPU. Existing room inspector bounds and ray checks therefore describe source-space placement, not independent ray tests against the curved render. Frustum culling is disabled for streamed meshes because their original bounds no longer describe their rendered positions. A sampled run retained six rooms with 1,167 draw calls and 142,193 triangles; sustained frame-time and resource measurements remain undone. Surface normals follow the rotating frame; deformation shear is not included in the lighting normal.

The proposed opening that reveals a later upside-down room was deferred until sightlines and curvature are judged in motion. The current route is an ordinary curved, twisting embedding, not a non-Euclidean loop or a room graph that reconnects through ceilings. Next: refine the twisting route through a sustained walkthrough, checking joins and performance before adding views into differently oriented rooms. The remaining model conversions and straight-route rare-room checks remain pending. This folder has no independent Git history; this entry records its implementation.

## 2026-10-04 — Codex — route variations and six more models

Added five continuous spatial profiles in `spatial-route.js`. `route=twist` keeps the original 72-metre half-turn; `route=reverse` reverses its roll. `route=unwind` rolls in alternating directions without completing a full inversion. `route=sway` follows a laterally swaying, vertically undulating passage. The default `route=mixed` combines circular curvature with vertical undulation and a varying roll rate. Each profile supplies a frame aligned to its centerline tangent, and the GPU and camera use the same selected profile. FOV remains 72 degrees. The six domestic room phrase and its bare floors remain unchanged.

Converted and integrated bananas, ginger, sweet potato, notepads, a second plastic crate, and a worn metal rack from the user's model collection. Kitchen tables include the produce; other tables include notepads. Kitchen and bare-room storage pools include the rack and second crate. Ginger and sweet potato lie flat, with ginger reduced to household scale. The model preview exposes all fourteen imported assets. Added the six sources and verified CC0 licences to [ASSETS.md](ASSETS.md). The exporter defaults to all fourteen and preserves existing manifest entries when `--assets` selects a smaller batch.

The expanded spatial check passed 28,805 frames across five profiles, orthogonal unit frames, eye height, position and upright continuity, 60 room joins, and the original half-turn. Viewed the rendered room 3 preview under all five profiles and confirmed the selected profile, world position, up vector, and fixed FOV in the browser route report. Browser warnings and errors were absent. Viewed all six saved models in the asset preview. A mixed-route kitchen preview across rooms 0–5 reported imported racks, sweet potatoes, pots, and apples; source-space furniture bounds, layout, aisle, doorway, architecture reservation, utility bounds, and utility overlap checks passed. Saved `route-variations-preview.png`.

The local preview server had stopped and was restarted on 127.0.0.1:8141. The default mixed walkthrough is the evaluation route. The existing limitations remain: source-space inspection does not independently ray-test shader-deformed surfaces, mesh frustum culling is disabled within the bounded stream, and lighting normals omit deformation shear. Sustained frame-time and resource measurements are unfinished. Eleven source models remain unconverted; the selected batch covers existing tabletop and storage placements, while lamps, tools, and larger furniture need suitable placements before integration. Views into distant differently oriented rooms, non-Euclidean reconnections, pipes, and wires remain deferred.

Next: refine the twisting route through a sustained walkthrough, checking joins and performance before adding views into differently oriented rooms. The root roadmap already states this next step and remains accurate. This folder has no independent Git history; this entry records local changes.

## 2026-10-04 — Codex — standalone concept reference

Added [CONCEPT.md](CONCEPT.md) as a self-contained reference for descriptions and for sharing with an online chat AI. It explains the artwork's form, domestic details, title and color premise, visual construction, autonomous movement, spatial logic, discussion references, and dated implementation limits. A short description provides reusable copy. The document distinguishes intended effects from observed responses and implemented curvature from proposed non-Euclidean connections. It records the early surplus-paint story as an unverified conceptual premise rather than presenting it as established history.

Linked the reference from the beginning of this notes file and [HANDOVER.md](HANDOVER.md). Preserved the earlier concept sections as the starting-point record. Read the saved concept document against the latest development entries and the design discussion, and checked its relative file links. No runtime code or development priorities changed. Next remains the sustained twisting-route walkthrough and performance check. This folder has no independent Git history; this entry records the documentation change.

## 2026-10-04 — Codex — assembled kitchens, bathrooms, and local lights

Added `room-sets.js` to assemble related fixtures rather than relying on unrelated random props. Kitchens have a sink, stove, fridge, cabinets, a short counter return, an enamel pot on the stove, and produce on the counter. A shorter kitchen corner appears in selected salas. Bathrooms contain a shower, toilet, sink, wall mirror, and separately placed bucket. Bathroom rooms omit dining furniture, ceiling fans, and family photographs. The arrangements alternate side walls and reserve their actual source-space bounds before dining furniture and other props are placed.

The six-room twisting phrase includes a four-by-eight-metre bathroom and a four-by-ten-metre kitchen, alongside six-metre-wide domestic rooms. Its total length is 66 metres; the original 72-metre half-turn remains a spatial-profile distance, independent of room boundaries. Added bathrooms and a kitchen-corner sala to the straight domestic pool. This changes domestic room selection while retaining the three/four-room exception rhythm, rare-room count, and floor-frequency policy.

Added authored tube-light fixtures in kitchens, bathrooms, and some ordinary rooms, with the existing Kenney pendant elsewhere. Warm kitchen light and cooler bathroom light distinguish the spaces. Reduced ambient light to 0.55 and added three shared point lights without shadows. Their positions use the same spatial mapping as the rendered room fixtures. Intensity fades with logical distance from each room center. The fixtures are room-owned geometry and materials where authored, with explicit disposal during culling; the reused models remain shared. The fixture intensity was reduced after viewing an initially overexposed ceiling highlight.

The Node sequence check passed 12,000 descriptors and the spatial check passed 28,805 frames with 60 joins, updated for variable room lengths. In the browser, inspected default rooms 1–6 and viewed kitchen and bathroom renders. Room-set bounds, furniture layout, utility overlap and bounds, aisle clearance, doorway clearance, and floor bounds passed. Also checked five-room neighborhoods for forced kitchen, bathroom, and sala cases at the minimum four-by-eight-metre size; all reported clearance checks passed. The bathroom had no dining furniture and included the four expected fixtures. Browser warnings and errors were absent. Saved `bathroom-preview.png` and `kitchen-set-preview.png`; both images reflect the final reduced intensity.

Updated [CONCEPT.md](CONCEPT.md), [HANDOVER.md](HANDOVER.md), and [ASSETS.md](ASSETS.md). No new third-party assets were downloaded; existing Kenney bathroom and light models were reused. Lighting remains a prototype: no shadows, flicker, switches, reflective mirrors, or running water. Sustained light-transition, frame-time, and resource-disposal measurements remain undone; the clearance inspector still checks logical geometry rather than independently ray-testing the GPU deformation. Next remains the sustained twisting-route walkthrough, checking joins and performance before differently oriented room views. The root roadmap's next step remains accurate. This folder has no independent Git history; this entry records local changes.

## 2026-10-04 — Codex — household fixture corrections and varied lighting

Replaced the shower enclosure with an authored wall-mounted head and short arm. Removed the pendant ceiling model and use simple authored tube fixtures. Removed the toaster from tabletop placement and model loading. These choices follow Xyh's household reference; unused source assets remain on disk.

Added deterministic room lighting profiles in `room-lighting.js`: daylight, overcast, shaded daytime, dark daytime, and night. The first five rooms demonstrate the five profiles; later rooms select them from a seeded sequence. Daytime tubes are off, night tubes emit light, and the three shared point lights follow each room's profile. A source-space shader gradient brightens patches toward one side of daytime rooms and preserves darker interiors through the route deformation. Fog and background ease toward the current room's brightness. Preview overrides use `?lighting=daylight|overcast|shaded|darkDay|night`.

Viewed the same bathroom under daylight and night in the browser; the head and arm replace the enclosure, the tube switches off/on, and the renders show different brightness. Browser warnings and errors were absent after correcting a reserved shader identifier. The room inspector reports the four expected bathroom fixtures and passing room-set, utility, aisle, doorway, and layout checks. Saved `bathroom-daylight-preview.png` and `bathroom-night-preview.png`.

Daylight patches are stylized shading, without actual window apertures, occlusion, or cast shadows. Sustained transitions and performance measurements remain unfinished. Next remains the sustained twisting-route walkthrough and performance check; the root roadmap remains accurate. This folder has no independent Git history; this entry records local changes.

Also viewed the dark daytime bathroom render without browser warnings or errors. A Node assertion run checked 10,000 deterministic lighting selections, finite positive brightness, alternating sides, coverage of all five profiles, all preview overrides, and day/night lamp settings; it passed.

## 2026-10-04 — Codex — domestic baseline and fewer counters

Recorded Xyh's core reference in CONCEPT.md: a modernish lower-middle-income Filipino household, with institutional/public spaces, rows of chairs, very large rooms, and middle-to-high-income interiors as occasional departures. This is an artistic reference rather than a general claim about household incomes. Establishing the domestic baseline takes priority over adding more exceptions.

Removed both fitted cabinet units from most kitchen sets and kitchen corners. A seeded choice retains the full pair in about one set out of five. Removed the cabinet from the independent random kitchen decor pool, which otherwise could reintroduce it outside that choice. Sink, stove, pot, produce, and the full kitchen's fridge remain. The sink and stove models still have bases; replacing those models is unfinished.

Viewed the updated daylight kitchen in the browser and saved kitchen-core-preview.png. The inspector found no fitted cabinets in rooms 0 and 1, retained two in room 4, and reported passing room-set, layout, and aisle checks throughout rooms 0–5. Browser warnings and errors were absent. A 10,000-index seeded selection sample gave about 20% fitted arrangements; an initial unmixed hash was corrected before the final browser check.

No large rooms or chair-row arrangements were removed. Next remains refining the twisting route through a sustained walkthrough, including domestic furnishing and joins, and checking performance before differently oriented room views. The root roadmap's existing next step remains accurate. This folder resolves to the root repository and is not independently versioned; this entry records local work.

## 2026-10-04 — Codex — folding sofas and chained wire textures

Inspected the Antigravity sofa module and staging handoff, then copied uratex-sofa.js unchanged. Integrated three shared folded-sofa prototypes: navy trellis with one throw pillow, vintage floral with a throw and bolster, and maroon with two throws. These replace the old sofa sprite in the sala pool and also enter the preferred sala decor pool. Placement uses the rotated bounding box to sit against the wall, then the existing floor, aisle, door, furniture, and architecture checks. Shared prototype geometry, materials, and procedural textures persist across rooms; no room disposes shared sofa resources.

Copied Xyh's transparent wireline.png and wiresag.png unchanged. Added wire-runs.js for deterministic straight, sagging, and mixed runs. Straight pieces anchor at image mid-height; sagging pieces anchor at top corners. All endpoints meet at the same chosen wall height; piece widths stretch to fill the run. Room-height limits keep anchors below the ceiling. Short 1.8-metre runs sit inside solid wall tiles, avoiding windows, branch openings, and generated side doors. Roughly two rooms out of three are eligible, with one or two runs where suitable tiles exist. The wires are static wall strips, with subdivided planes following the camera/GPU route deformation. Plane geometry is room-owned and disposed during culling; the two textures and materials are cached. Added wire and sofa details to the room inspector. The nonexistent wideline.png is interpreted as wireline.png, consistent with the supplied connection explanation.

Ran scripts/check_wire_runs.mjs: 3,000 plans passed endpoint continuity, correct top/mid-height image anchors, full span coverage, and determinism. Viewed a sparse floral sofa sala along the mixed twisting route, including a closer view. The browser inspector reported sofas and wire runs, with layout and aisle checks passing in rooms 0–4; browser warnings and errors were absent. Saved sofa-wires-room-preview.png and sofa-close-preview.png. The first perimeter-layout forced preview omitted the sofa through collision filtering; this is expected placement behavior, so a sparse preview was used to inspect the mesh.

Updated CONCEPT.md, HANDOVER.md, and ASSETS.md. Wire images are user-supplied and their redistribution licences remain unverified; no publication was requested. Real cable depth, dangling or animated cables, pipes, cross-wall networks, and electrical endpoints remain unimplemented. Sustained streaming resource and performance checks are still unfinished. Next remains refining the twisting route through a sustained walkthrough, checking joins and performance before differently oriented room views; the root roadmap remains accurate. This folder is not independently versioned, so this notes entry records the work.

A default-route check then found no sofas in rooms 0–5: dining furniture had occupied their placements first. Added an early reserved sofa position in eligible salas, with tables and chairs filtered around its bounds. The sofa sits opposite the kitchen corner where one exists and is omitted if architecture, aisle, or room-end clearance fails. Reloaded the default route: room 0 now contains the navy sofa and room 3 the floral sofa; rooms 0–5 pass layout, aisle, room-set, utility-overlap, and floor checks, without browser warnings or errors. Also viewed the navy fabric in the close sparse preview. The perimeter preview omission motivated this reservation fix rather than remaining the sole integration result.

## 2026-10-04 — Codex — stable lighting at wall boundaries

Reproduced speckling on the approaching partition at room 0, offset 6, under both mixed twisting and straight-route previews. The new lighting-band shader compared interpolated source Z coordinates against exact room boundaries. Tiny rasterization differences put neighboring pixels on opposite sides of the comparison, selecting different room profiles and window sides. This produced noise even with a forced daylight profile, because adjacent rooms alternate the bright side.

Added a 0.002-metre overlap to both ends of each lighting interval, with the existing ordered first match giving the earlier room a consistent profile at the shared partition. The overlap accommodates interpolation roundoff rather than changing room geometry. A temporary unlit-wall diagnostic also reproduced the noise and was removed after diagnosis; wall materials remain unchanged.

Compared before and after browser renders at the same room 0 offset. The far partition is smooth after the fix. Also viewed room 1 with the default differing lighting profiles, and the straight-route room 0 case; the wall speckles were absent and browser warnings and errors were absent. Saved wall-artifacts-before.png and wall-artifacts-after.png. Restored the autonomous default route in the preview tab. Small pixel stair-steps at geometric edges and patterned-texture aliasing remain part of the low-resolution rendering; this change targets the interior wall speckling. Sustained performance evaluation remains unfinished. The next step and root roadmap are unchanged; this folder has no independent Git history.

## 2026-10-04 — Codex — new coarse photos and raw object cutouts

Copied eight familyphoto_*_coarse.png images from ../fgcphotos/ unchanged into the wall-photo folder and regenerated wall-assets.js using scripts/index_wall_assets.py. The pool grows from seven to fifteen images. Retained the existing 0.20–0.32-metre chosen widths and maximum 0.34-metre photo dimension. Source images and their processing remain in fgcphotos; no new image generation or source reprocessing was needed.

Added raw-object-assets.js with eleven existing raw images, semantic IDs, source aspect ratios, physical widths, placement modes, and room eligibility. Pitchers and cookware are upright camera-facing cutouts on tables; writing pads and the pad-cover image lie flat just above the table. Drawers and coolers enter the floor-decor pools and undergo existing room, furniture, door, architecture, and aisle collision filtering. Upright tabletop cutouts compensate for their table parent's rotation. Every plane shares the room's curvature shader and cached image material, while owning geometry that is disposed on rejection or room cull. Original PNGs are unchanged. Floor cutouts use positions inside the room; explicit prop previews use a mid-room position for inspection. Added raw object IDs and photo filenames to the room inspector.

Ran scripts/check_raw_objects.mjs: all eleven PNG paths, source aspect ratios, unique IDs, and tabletop width/height/depth limits passed. Viewed a daylight kitchen with silver-pot tabletop cutouts and new small photos, then a sparse sala with flat yellow/intermediate pads and a standing drawer cutout. Source-space layout, aisle, room-set, and utility-overlap checks passed in the inspected neighborhoods; browser warnings and errors were absent. Inspector photo dimensions remained at or below 0.34 metres. Saved raw-kitchen-preview.png and raw-drawers-pad-preview.png. raw-object-contact-sheet.png records inspection of all eleven images; wall-assets-preview.jpg was regenerated from the full photo/curtain collection.

Updated CONCEPT.md, HANDOVER.md, and ASSETS.md. These are still flat image representations: upright cookware has no volume and can look photographic beside the low-poly furniture. Image licences remain unverified as recorded in ASSETS.md; no publication was requested. Sustained streaming resource and performance checks remain unfinished. Next remains the sustained twisting-route walkthrough, checking joins and performance before differently oriented room views; the root roadmap remains accurate. This folder has no independent Git history, so this entry records the work.

Also checked the default route without forced assets: room 1 selected a frying-pan cutout and cooler, and rooms 0, 1, and 3 selected new family photos. Rooms 0–5 passed layout, aisle, room-set, and utility-overlap checks, with no browser warnings or errors.

## 2026-10-04 — Codex — bare bulbs and shorter domestic rooms

Added authored bare LED bulb fixtures to room-sets.js: a small ceiling socket, tapered body, and rounded diffuser, without a shade or pendant assembly. Two out of three fixture slots use bulbs; the others retain tubes. Lighting profiles control the emissive state and shared point-light intensity, so daylight/shaded rooms have unlit bulbs and night rooms have lit bulbs. `?fixture=bulb|tube` forces the fixture shape for preview. Every bulb mesh owns its geometry and material, with the existing room-cull disposal flags.

Changed the twisting phrase's lengths from 12, 12, 8, 12, 10, 12 to 6, 10, 6, 12, 6, 8 metres. This keeps a longer sala while shortening the first sala, bathroom, second kitchen, and bedroom. The six-room phrase now totals 48 metres, independent of the original 72-metre half-turn profile. The straight-route domestic pool selects seeded lengths of 6, 8, 10, or 12 metres; the exception rhythm, large-room policy, and exception dimensions are unchanged. Length preview overrides now accept six metres. Updated the spatial test's supported domestic minimum.

Ran scripts/check_room_sequences.mjs: 12,000 descriptors passed deterministic generation, contiguous boundaries, floor heights, exact joins, backward lookup, and route checks. The existing 10,000-room architectural sample retains the domestic/strange/rare counts and rare-height policy. Ran scripts/check_spatial_route.mjs: 28,805 frames across five profiles and 60 joins passed, including the new shorter room boundaries and original half-turn. In the browser, viewed the six-metre night kitchen with a lit bulb and six-metre shaded bathroom with an unlit bulb. Rooms 1–8 passed room-set, layout, aisle, and utility-overlap checks; browser warnings and errors were absent. Saved bare-bulb-night-preview.png and bare-bulb-off-preview.png.

Updated CONCEPT.md, HANDOVER.md, and ASSETS.md. No new third-party assets were needed. Fixtures have no switches or flicker; states are assigned per room. The stronger ceiling highlight in the night kitchen is from the shared point light, without bloom or cast shadows. Sustained short-room pacing and resource/performance measurements remain unfinished. Next remains the sustained twisting-route walkthrough, checking joins and performance before differently oriented room views; the root roadmap remains accurate. This folder has no independent Git history, so this entry records local work.

## 2026-10-04 — Codex — v0.5 sampling demo

Preserved the preceding index entry point unchanged as development.html, then prepared index.html as the v0.5 demo. Both pages share current JavaScript and assets, so the development page preserves its entry point rather than freezing the entire project. Added Pause/Resume, Restart, and Fullscreen controls, reduced-motion startup, hidden-tab suspension, and loading/failure status. Ceiling motion follows the paused movement clock.

Added the seeded demo sequence: six-to-eight-room blocks end with an exception. Domestic rooms retain shorter lengths and mostly bare floors. Most exceptions change proportions or arrangements; rare exceptions have 24-metre ceilings, distant walls in a 48-metre-wide hall, or auditorium seating. The first two exception blocks stay modest. Four seeds sampled over 40,000 rooms yielded approximately 86% domestic rooms, 12% modest exceptions, and 2% rare spaces. Exception gaps were six, seven, or eight rooms. Fog distance expands for tall or wide rooms. Existing showcase and development sequences remain available.

Ran check_demo_sequence.mjs for determinism, domestic bounds, block spacing, rare frequency, and distance lookup. Ran check_room_sequences.mjs: 13,000 descriptors and the existing 10,000-room mixed sample passed. Ran check_spatial_route.mjs: 28,805 frames and 60 joins passed. Browser playback advanced across room boundaries through room 18; inspected the seed-42 room-62 wide-room render without browser warnings or errors. Saved v05-wide-room-preview.png locally. These checks do not establish sustained frame rate or memory use across devices.

Initialized a separate repository on main. Added a publication allowlist, static Pages marker, README, MIT code/documentation licence, CC BY 4.0 artwork scope, and third-party credits. The user confirmed all supplied images are theirs or cleared for public redistribution; recorded that assertion in ASSETS.md, superseding earlier image publication holds. No independent rights audit is claimed. Updated CONCEPT.md, HANDOVER.md, and the root ROADMAP.md. A GitHub remote, push, public Release, and DOI were deliberately left for the user's publication step. No release tag was created. Next: evaluate v0.5 pacing and performance across devices; sustained resource measurements remain undone.

Publication export check: created a ZIP with git archive from the initial commit and extracted it into the ignored .release-check folder. Loaded its index.html from a nested HTTP URL, observed the completed domestic-room render, and read browser logs with no warnings or errors. Resume advanced from room 0 into room 4; Pause stopped playback and Restart reloaded the page. All five documented Node checks passed from the exported files: demo sequence, room sequence, spatial route, wire runs, and raw-object PNGs. The snapshot contains 272 files totaling approximately 19 MB; its largest file is about 1.7 MB. The local archive and render screenshots are excluded from publication.

## 2026-10-04 — Codex — flat-screen TVs and wall pipes

Xyh reports v0.5 is published. The public URL is not yet recorded; no push or publication was performed in this session. Continued local work on the existing main checkout.

Reviewed Antigravity's led-tv.js and Claude Code's pipe-runs.js/pipe-parts.js with their handoff documents, then copied the authored modules into this repository. Added wall-utilities.js to index.html. Eligible salas and bedrooms can receive a 32- or 43-inch wall-mounted TV, with off/standby, no-signal, or colour-bar screens. TV prototypes are cached by size and screen; streamed clones share geometry, materials, and textures. Existing vintage TVs remain in the furnishing pool. The other source screen presets and tabletop mounts are not selected by the integration.

Pipes occupy one clear two-metre wall tile, avoiding windows, side doors, photo tiles, TVs, and furnishing bounds. Kitchens and bathrooms are eligible, with occasional pipes elsewhere. Water runs mix supply lines and risers; bathrooms use orange or grey drain stacks. Explicit previews support ?pipes=supply|riser|loop|stack and ?tv=offStandby|noSignalBlue|colorBars; either can be disabled with =0. Placement skips sloped floors, non-rectangular rooms, and ceilings other than the source kit's 2.58-metre height. Unit fittings and patched materials are shared across rooms, with frustum culling disabled for shader-deformed meshes. Reports include selected TV and pipe metadata.

Ran scripts/check_pipes.mjs: 48,000 deterministic route cases passed. The same source check with --seeds 200 --length 2 passed 9,600 short-route cases. Viewed the integrated no-signal TV in a twisting bedroom and grey drainage stacks in the straight bathroom, without browser warnings or errors. Saved tv-integrated-preview.png and pipes-integrated-preview.png locally. Room streaming uses shared cached resources; sustained resource measurements are still unfinished.

Long pipes across room boundaries, all eight pipe styles, variable-height pipe routes, and tabletop TV placement were deliberately deferred until their placement contracts are extended. development.html retains the preceding entry point and does not invoke the new wall-utility integration. Next remains v0.5 pacing and performance evaluation across devices; the root roadmap's next step is unchanged.

Normal procedural playback advanced from room 2 through room 13 with six streamed room groups and no browser warnings or errors. A single render-stat sample reported 877 draw calls, 85,105 triangles, 312 geometries, and 40 textures; this is a resource snapshot, not a frame-rate measurement or a leak test. Placement also excludes existing utility props. TV depth is aligned using its rear bounding extent so the bracket does not enter the wall. Horizontal pipe ends at the edges of a wall tile receive caps because those edges are not actual room surfaces.

## 2026-10-04 — Codex — manual movement and bidirectional streaming

Added WASD movement, mouse yaw/pitch, and Take control/Resume automatic controls to index.html. Clicking the scene requests pointer lock; dragging provides mouse-look where capture is unavailable. Space now returns to automatic forward movement rather than toggling pause. The Pause button retains its function. Automatic return searches for a clear path to the main route, then moves along it while settling the viewing direction. A blocked return leaves manual mode active and reports the available next action. Focus loss and hidden tabs clear held keys.

Manual state stays in logical room coordinates before rendering through the shared spatial frame. Movement follows local upright, floor elevation, and side-passage floors. Floor regions and a 0.22-metre body radius constrain walls and hallway turns; doorway width and furniture bounds prevent passing through partitions or furnishings. Decorative stairs and raised seating platforms remain blocked rather than climbable. This is logical collision, not a physics simulation or a ray test against deformed GPU meshes.

Added navigation.js. The stream retains previous/current/next batches of two rooms, keeping six rendered groups. Moving across either batch boundary builds the next batch and disposes the distant batch. Revisited cells regenerate from the same seeds. A separately seeded backward sequence permits travel before the original room 0; negative room indices preserve forward doorway ordering and furnishing seeds. Distance-prefix metadata remains cached, while rendered geometry is disposable. Negative ?start values are supported for inspection. development.html retains its earlier movement implementation.

Ran scripts/check_navigation.mjs: 2,000 descriptors spanning indices -1000 through 999 passed deterministic reconstruction, joins, distance lookup, bounded batches, and 48 simulated rebuilds. Navigation cases checked side-passage floors, wall/furniture collision without tunnelling, backward input, normalized diagonal speed, and route return around an obstacle. The existing 40,000-room demo check, 13,000-room sequence check, and 28,805-frame spatial check also passed.

In the browser, WASD entered manual mode; repeated backward input crossed the starting doorway into room -1 and rebuilt a six-room batch spanning negative indices. Drag-to-look changed yaw by -0.55 radians and pitch by -0.15 radians in the twisting frame. Space restored automatic mode from the backward-generated room. In the passages preview, sideways input moved beyond the two-metre main-room half-width into a side hallway at x=2.69, z=-14; the hallway rendered and Space began returning to the route. No browser warnings or errors were observed. Saved manual-hallway-preview.png locally. Pointer lock was not granted in the in-app browser, so captured mouse-look remains to be tested in an ordinary desktop browser; the drag fallback was tested.

Updated README.md, CONCEPT.md, HANDOVER.md, and the root ROADMAP.md. Next: evaluate manual navigation, hallway access, and bidirectional streaming performance across devices. Touch movement, climbable stairs/platforms, and sustained memory/frame-rate measurements remain undone. No push or publication was performed.

Also loaded ?start=-8: six cells with indices -10 through -5 rendered without browser warnings or errors. Fog distance is limited by the retained stream edge, using both directions during manual movement, so discarded geometry fades before its cutoff. The return phase settles yaw and pitch before restarting forward travel.

## 2026-10-04 — Codex — domestic clutter, surface wear, and exposed yero

Incorporated feedback that the rooms were too clean and their walls and floors too empty. Added domestic-details.js, invoked by index.html. Seeded abstract shapes suggest bottles, containers, rounded bundles, and uneven stacks of papers or small objects. Clusters occupy table edges, selected cabinet/fridge/bookshelf tops, narrow wall shelves, and a little floor space near the walls. Small standing frames reuse the cleared family-photo pool. The shelf and floor clusters check furnishing bounds and architecture reservations before insertion; accepted clusters enter manual-walking collision bounds. Table clutter is capped at six tables per room to avoid filling auditorium rows with new meshes.

Broad translucent stains, scuffs, and short cracks overlay existing floors. Bare floors stay bare; the ceramic, concrete, and linoleum variants remain available without increasing tile frequency. Light lower-wall marks are limited to available solid wall sections. Roughly one eligible room in seven replaces its flat ceiling with a corrugated metal sheet and exposed timber rafters. ?roof=yero forces the preview. Existing ceiling fans and bare bulbs remain. Occasional rooms have two tiny static cockroach silhouettes at skirting level; animation is not implemented.

Each streamed room owns its detail geometries, materials, and wear texture, released by its disposal callback. Shared photo materials remain in the existing image cache. Corrugated sheets and long beams are subdivided for the twisting shader. A separate seeded generator produces details without changing the base room/furnishing random sequence. Rebuilt rooms therefore retain the same detail layout.

Viewed normal domestic rooms and an exposed-roof kitchen in the browser. The six inspected rooms retained aisle clearance and utility-overlap clearance; browser warnings and errors were absent. The kitchen preview included photo frames, shelf clutter, tabletop shapes, broad floor wear, and roof beams. Ran check_navigation.mjs: 2,000 bidirectional rooms, 48 reconstructions, collision and automatic-return checks passed. Ran check_room_sequences.mjs: 13,000 descriptors and the existing 10,000-room mix passed. Streaming observations are recorded below. These checks do not establish sustained performance across devices.

Updated ASSETS.md, README.md, CONCEPT.md, and HANDOVER.md. No new third-party assets were used. More object-specific clutter, moving cockroaches, additional floor types, and exposed roof support beyond these first variations remain possible later work, rather than part of this pass. Next remains manual navigation, hallway access, and bidirectional streaming evaluation across devices; the root roadmap remains accurate. Nothing was pushed or published.

Streaming follow-up: automatic playback reached room 21 with six retained rooms (18 through 23) and no browser warnings or errors. The initial sample reported 935 draw calls, 98,760 triangles, 283 geometries, and 33 textures; the room-21 sample reported 1,274 calls, 200,614 triangles, 480 geometries, and 61 textures. Different room content and warmed image/prototype caches make these snapshots unsuitable as a leak test. Saved domestic-clutter-preview.png after viewing the final corrugated-roof, furniture-top clutter, table objects, and wall/floor wear render.

## 2026-10-05 — Codex — broader unusual spaces

Expanded the modest exception pool with taller cross-shaped rooms, longer sparse halls, and a descending sala. Vast exceptions now have six seeded variations: distant walls (80 by 48 metres, 32-metre ceiling), low canopy (64 by 36 metres), column field (56 by 48 metres), deep hall (12 by 64 metres), assembly hall (32 by 40 metres), and vertical void (36-metre ceiling). Exception spacing remains six to eight rooms; roughly 2% of rooms are vast. The first two exception blocks stay modest, and each seed's first vast exception uses distant walls. Wider directional fog and a 180-metre camera clipping distance let their lateral extent remain visible during mouse-look while retaining the stream-edge fade.

Ran check_demo_sequence.mjs over 40,000 rooms: all six vast variants, deterministic reconstruction, contiguous joins, domestic frequency, and exception spacing passed. check_navigation.mjs passed 2,000 bidirectional descriptors and 48 reconstructions; check_room_sequences.mjs passed 13,000 descriptors and its existing 10,000-room sample; check_spatial_route.mjs passed 28,805 frames across five profiles. Viewed default-seed room 29 in the running browser at ?start=29&offset=12&inspect=1&still=1 and turned using drag mouse-look. The inspector reported clear furniture, architecture, utility bounds, aisle and doorway checks for the six retained rooms; browser logs had no warnings or errors. Saved vast-spaces-preview.png. These source-space checks do not independently prove the GPU deformation, which was checked visually in that room.

Updated README.md, CONCEPT.md, and HANDOVER.md. Next remains manual navigation, hallway access, and bidirectional streaming evaluation across devices; the root roadmap remains accurate. Sustained performance and visual walkthroughs of every new variant remain unfinished. No new assets were added, and the user's untracked raw images were left untouched. Nothing was pushed or published.

## 2026-10-05 — Codex — tabletop burners, metal sinks, and clutter variants

Replaced the oven-style kitchen stove with an authored tabletop two-burner unit on a plain stand. Its grey metal top, black body, front knobs, brass-coloured burner discs, rings, and four grate supports per burner follow the supplied reference's proportions without copying its image or brand. Existing pots sit on the grates; some sets have two pots. Kitchen sets use an open aluminum-coloured basin with a recessed bottom, raised rim walls, drain, faucet and metal stand. Occasional fitted cabinets remain. Bathroom fixtures are unchanged.

Expanded domestic-details.js with lidded boxes and small label panels, coloured fruit-like rounded shapes, and wrapped sweets. These reuse the room's shared primitive geometry and material disposal path. Updated the demo's module query versions after browser reloads continued to display cached fixture code.

Viewed ?room=kitchen&space=straight&offset=3&inspect=1&still=1 with drag mouse-look. After the module refresh, the inspector identified aluminumSink and tabletopBurner in all six retained kitchen sets and reported roomSetsClear for each. Pots visibly rest on their burner supports. Browser logs had no warnings or errors; saved kitchen-burner-preview.png. check_navigation.mjs passed 2,000 bidirectional descriptors and 48 reconstructions; check_room_sequences.mjs passed 13,000 descriptors and the existing 10,000-room sample. No sustained performance measurement was made.

No external asset was imported. Updated ASSETS.md and HANDOVER.md using the doc-style skill. Next remains manual navigation, hallway access, and bidirectional streaming evaluation across devices, matching ROADMAP.md. Burner flames, an LPG hose connection, and further material skins remain undone. Pre-existing raw-image deletions and untracked supplied files were left outside this commit. Nothing was pushed or published.

## 2026-10-05 — Codex — walis tingting correction and named cutouts

Reshaped utility-props.js palm midribs into a flared lower bundle, tight neck at 0.78 metres, and short stalk ends extending above the twine to roughly one metre. Three close binding loops follow the narrowed bundle. The supplied photograph is a shape reference only; it is not included.

Updated all renamed raw-object paths and expanded the placement manifest from 11 to 45 cutouts. Existing IDs survive the filename changes. New entries include food containers, condiments, cleaning supplies, flowers, soft toys, a bag, clothing and paper. Floor objects have a seeded chance to join the existing decor selection; tabletop and flat entries use their existing placement path. Two electrical cutouts are retained as supplied files but excluded until wall mounting is implemented. Added scripts/index_raw_objects.py: reads PNG dimensions, assigns placement categories and sizes, and rebuilds the manifest without changing images. Run it after further filename changes, then scripts/check_raw_objects.mjs. These categories follow descriptive filenames and may need further visual tuning.

check_raw_objects.mjs passed all 45 paths, PNG dimensions, unique IDs and tabletop size limits. Viewed the running straight kitchen with utilities=all and raw=rawLigoSardinesGreen. The broom's exposed upper stalks and lower binding were visible beside the table; the new sardine cutout loaded on the table. The six-room inspector reported clear utility bounds and no utility overlap; one crowded room omitted the broom through the existing placement check. Browser logs had no warnings or errors. Saved broom-cutouts-preview.png. All new cutouts have not been individually viewed in-scene.

Next remains navigation, hallway access and bidirectional streaming evaluation across devices; ROADMAP.md remains accurate. Wall electrical mounting, individual cutout placement refinement, and sustained performance checks remain undone. The supplied image renames and additions are included in this commit. Nothing was pushed or published.

## 2026-10-05 — Codex — existing pipe kit variation

Checked the supplied raw-object folder: it still contains the same 47 named PNGs from the preceding integration, with no untracked additions or modified files. All 45 active cutout entries pass check_raw_objects.mjs. The two electrical wall cutouts remain deferred. Compared SHA-256 hashes of pipe-runs.js and pipe-parts.js against fgc-c: both copies are identical. Read fgc-c/HANDOFF.md; no newer pipe implementation needed copying.

Expanded wall-utilities.js selection to use supply, riser, loop, meander, overhead and bundle water styles, and stack, drain and riser in bathrooms. All eight pipe style IDs are accepted by the pipes query override. Existing room eligibility, clear wall-slot checks and pipe occurrence rates remain unchanged. The kit's local two-metre wall sections still end with caps; runs are not connected between rooms.

check_pipes.mjs passed 48,000 seeded cases; check_raw_objects.mjs passed 45 paths and placement sizes. Viewed ?room=bare&space=straight&pipes=bundle&offset=3&inspect=1&still=1 in-browser: blue parallel pipes were visible above the raw drawer cutout, and all six retained rooms reported bundle runs. Browser logs had no warnings or errors. Saved pipe-variation-preview.png. Other newly enabled styles have not each been viewed in the integrated walkthrough during this pass.

Next remains navigation, hallway access and bidirectional streaming evaluation across devices; ROADMAP.md remains accurate. No additional raw files were found, so there was nothing to import from that folder. Cross-room pipe connections, drainage reducers and sustained performance measurements remain undone. Nothing was pushed or published.

## 2026-10-05 — Codex — thinner blue pipes and window variants

Adjusted the integrated water runs to blue 21 or 27 mm pipes; drainage retains its thicker sizes and uses orange. Bathrooms select water runs more often, with two drainage entries in their six-entry style pool. No reference image or brand was imported, and the underlying vendored pipe modules remain unchanged.

Added narrow, wide, high-set, open-frame and grilled variants to createJalousieWall. Window selection rises from 34% to 48% of eligible wall sections, or 42% in bathrooms. Existing curtains and imported window types remain. Open frames retain an exterior light backdrop and do not provide a traversable side passage. Force a variant with ?window=narrow|wide|high|open|grille. Existing hallway connections are unchanged.

Viewed the default mixed window selection and the forced high-set variant in the running straight-room preview using drag mouse-look. High windows rendered as short openings near the ceiling; saved window-variation-preview.png. The mixed preview had no browser warnings or errors. check_navigation.mjs passed 2,000 descriptors and 48 reconstructions. git diff --check passed. Individual visual checks of the other four variants and sustained performance remain undone.

Next remains navigation, hallway access and bidirectional streaming evaluation across devices; ROADMAP.md remains accurate. More traversable openings, exterior views and connected plumbing remain deferred. Nothing was pushed or published.

## 2026-10-05 — Codex — hollow-block wall sections

Added the supplied models/textures/hollow-blocks.png to occasional solid side-wall sections. Roughly 22% of rooms select the unfinished-wall treatment, and 65% of their eligible solid sections receive it. Painted window surrounds and partitions remain. The texture repeats at a fixed scale on subdivided planes so it follows the route deformation; shared texture/material resources survive room disposal while overlay geometries are released. ?walls=blocks forces eligible sections, and ?walls=paint disables them.

Viewed the forced straight-room preview in-browser: block courses were visible behind the broom and small family photo without covering windows. Browser logs had no warnings or errors; saved hollow-block-preview.png. The texture's edges are visibly repeated; seamless reworking, window-surround masonry and upper sections of tall walls remain undone. No image edits were made. Next remains navigation, hallway access and bidirectional streaming evaluation across devices, matching ROADMAP.md. Nothing was pushed or published.

## 2026-10-05 — Codex — plain windows and varied room lighting

Plain rectangular openings now account for 72% of eligible window choices, with standard, narrow, wide and high-set proportions. Imported framed windows take roughly 14%; jalousies and their curtained variants make up the remainder. Side-wall opening frequency is unchanged. Plain variants omit slats and the central mullion and retain the exterior backdrop.

room-lighting.js adds deepNight, dawn, dusk, red and violet profiles. Night uses lower ambient brightness; deepNight has its fixture off. Weighted selection keeps daylight and ordinary domestic lighting common: about 19% night/deep night, 12% dawn/dusk and 4% red/violet. Coloured profiles affect material tint, fog and ceiling point-light colour. The lighting override accepts every profile. Corrected negative-index selection so regenerated backward rooms always receive a complete lighting profile.

Sampled 10,000 indices from -5,000 through 4,999 in Node: all profiles had finite base brightness, with 1,860 night/deep-night rooms, 1,212 dawn/dusk rooms and 383 red/violet rooms. Viewed violet lighting, plain openings at dawn, and deepNight in the running browser. Violet showed a dark blue-purple room; deepNight was nearly dark with its fixture off. Saved violet-lighting-preview.png and plain-window-dawn-preview.png. The violet preview reported no browser warnings or errors. Red and dusk were not separately viewed in this pass.

Next remains navigation, hallway access and bidirectional streaming evaluation across devices, matching ROADMAP.md. These are stylized room lighting profiles rather than a continuous clock or physical daylight simulation. Exterior scenes and sustained lighting-transition/performance evaluation remain undone. Nothing was pushed or published.

## 2026-10-05 — Codex — household tools and denser small clutter

Expanded domestic-details.js with authored hollow pitchers and handles, chopping boards with knives, folded shirt-like blocks, varied rectangular files/paper stacks, occasional string mops, and three generic bottle profiles. Bottles vary height, width, colour, cap and plain label bands. Their lathed bodies share geometry within a room. Existing candy, fruit-like shapes, lidded boxes and containers remain in the assortment.

Small cutouts also appear within clutter groups. Kitchen tables select pairs from the condiment pool, including Silver Swan; other tables select papers and envelopes. Selected furniture tops and shelves receive small cutouts, while up to three accepted floor-edge clusters can contain flat clothing. Floor clusters and mops use existing bounding-box collision and doorway reservations. Retained detail counts exclude rejected placement candidates. New geometry and cutout planes are released through the room-owned disposal path; image materials remain in the shared sprite cache. The table limit remains six to bound auditorium clutter growth.

The user clarified that the cutouts were already visible and requested more new objects; this pass retains a moderate increase in cutout appearances while adding authored meshes. Viewed the forced daylight kitchen with drag mouse-look: bottles, a mop, condiment cutouts, boxes and paper-like stacks were visible. The six-room inspector included Silver Swan and clothing IDs, with clear aisles and utility overlaps. Browser logs reported no warnings or errors. Saved expanded-clutter-preview.png. check_raw_objects.mjs passed 45 entries; check_navigation.mjs passed 2,000 descriptors and 48 reconstructions. git diff --check passed.

New mesh details are stylized and low resolution. Not every object type was individually inspected up close, and sustained frame-rate/resource testing with the denser clusters remains undone. No new external assets were added. Next remains navigation, hallway access and bidirectional streaming evaluation across devices; ROADMAP.md remains accurate. Nothing was pushed or published.

## 2026-10-05 — Codex — object arrangement plan

Wrote ARRANGEMENTS.md as a proposed system, with an existing-state summary and a catalogue of food preparation, drinking, paperwork, clothes left behind, storage, cleaning, television viewing, displaced objects, localized accumulation, and unexplained arrangements. It records support surfaces, valid poses, group footprints, object-specific color/size/angle variation, uneven room density, and deterministic regeneration. The first implementation is a tabletop TV fitted to a compatible support, followed by migrating existing clutter to the same support rules. Density weights and size ranges are provisional tuning values.

Linked the plan from CONCEPT.md and HANDOVER.md and admitted it to the project Git allowlist. Updated the root ROADMAP.md Next in Dev to shared support placement. Navigation, hallway access, and cross-device streaming evaluation move after the arrangement pass; they were deferred to follow the user's arrangement direction, not completed or dropped. No renderer or placement behavior changed in this documentation pass.

Checked the plan against domestic-details.js's existing cluster behavior and led-tv.js's tabletop feet/pedestal modes. Checked relative document links on disk and the roadmap wording against the implementation order. git diff --check passed. Browser tests were not run because this pass changes documentation only. The full arrangement system, including tabletop TV integration, remains unimplemented. Nothing was pushed or published.

## 2026-10-05 — Codex — tabletop TV placement

Added object-supports.js with local bounds, top heights and reservations for upright, unstacked monobloc and wooden tables. wall-utilities.js now selects a tabletop attempt for half of eligible TV rooms, using a small32 screen with seeded splayed feet or center pedestal. Its full footprint must fit the table's usable area; existing tabletop props and other room furniture must leave it unobstructed. Accepted TVs stand 2 mm above the nominal support top and follow their table's transform through the twisting route. When a table does not fit, the existing wall placement is attempted. Tables occupied by TVs skip later domestic clutter. Shared TV prototypes include mount mode in their cache key.

Preview with ?start=1&room=sala&tvMount=table&tv=colorBars&lighting=daylight&offset=3&inspect=1&still=1; space=straight gives the straight view. tvMount=wall forces the preceding mount selection. The inspector includes tabletop mount, support kind, measured local contact gap, footprint and rejection reasons. Rooms with no compatible table may have a wall TV or no accepted TV.

Viewed the tabletop pedestal on room 1 in both straight and twisting routes; the TV base visibly rests on the table. The six-room straight preview also accepted splayed-foot mounts, and reported clear aisles. Browser logs had no warnings or errors. Saved tabletop-tv-preview.png. check_object_supports.mjs passed upright eligibility, overhang rejection, occupied-area rejection and free-area acceptance for both table kinds. check_navigation.mjs passed 2,000 descriptors and 48 reconstructions. git diff --check passed. Sustained resource checks and actual streaming reconstruction of tabletop TV mounts were not run in this pass.

Updated ARRANGEMENTS.md, HANDOVER.md and the root roadmap. Next: migrate existing clutter to the table support/reservation rules, then extend them to shelves and cabinet tops. General clutter still uses its preceding positions; the entire arrangement plan is not complete. This pass reuses the existing authored TV and furniture models and adds no external assets. Nothing was pushed or published.

## 2026-10-05 — Codex — supported clutter on tables, shelves, and cabinet tops

Migrated surface clutter to object-supports.js. Each group is measured, given a seeded yaw, and tried in bounded surface positions. Its footprint reserves accepted space before the next item. Existing tabletop props and TV reservations remain occupied; remaining space beside TVs can hold clutter. Tables retain a six-table cap. Authored wall shelves reserve their standing photo frame, and selected closed cabinets/fridges use local top bounds. Open racks and tall imported bookshelves are excluded because their outer bounds do not establish a continuous support surface. Floor-edge clutter and mops retain their preceding collision path.

Cutout billboards reserve their turning envelope. Corrected the runtime billboard angle to subtract all ancestor yaw rotations, including shelves and nested groups. Cabinet-top clutter is parented to its support instead of positioned from a world bounding box. The room inspector reports accepted/rejected counts, rejection categories, measured contact gaps and support-bound checks. Room-owned geometries remain in the existing disposal path, including rejected candidates until the room is culled.

Viewed the straight daylight kitchen: its six loaded rooms had 60 accepted supported objects, all within their support bounds with the intended 2 mm contact gap, and clear aisles. After the billboard correction, viewed a twisting sala with tabletop TVs and nearby clutter; the six-room support report had no bound or contact failures. Browser logs had no warnings or errors. Saved supported-clutter-preview.png. check_object_supports.mjs passed table/shelf bounds and occupied-area cases; check_navigation.mjs passed 2,000 descriptors and 48 reconstructions; check_raw_objects.mjs passed 45 entries. git diff --check passed.

Updated ARRANGEMENTS.md, HANDOVER.md and the root roadmap. Next: food preparation, paperwork, clothing and storage presets on the shared support system. Seat supports, open-rack interiors, room-level density presets, sustained performance, and an actual cull/revisit comparison of the new clutter remain undone. The user's modified sardine PNGs were left unstaged. No external assets were added. Nothing was pushed or published.


## 2026-10-05 — Codex — domestic arrangement presets

Added food preparation, paperwork, clothing, and storage groups in `domestic-details.js`. Food groups combine a board and knife with ingredient-like shapes and a bottle. Paperwork uses layered files, loose sheets, a supplied flat pad or envelope, and a small box. Clothing combines folded blocks and a supplied garment; storage uses two supported lidded boxes and a bottle. Selection varies by room use, with compact shelf/cabinet versions and seeded colors, dimensions, stack heights, and yaw. Each group reserves its complete footprint. Tables attempt two groups plus one or two single items; the six-table, four-cabinet, and two-shelf limits remain. Floor clutter remains under its preceding rules.

Added `?arrangement=food|paperwork|clothing|storage` preview overrides. Inspector records include accepted preset IDs and footprints. Viewed all four forced presets and a naturally mixed scene in the browser, including a twisting route and tabletop TV. Accepted objects had bounds inside their supports and contact gaps of 2 mm; the inspected six-room scenes retained clear aisles. Reloading the storage preview produced identical detail and placement metadata. Browser logs reported no warnings or errors. Saved `food-arrangement-preview.png` and `arrangement-presets-preview.png`. `check_object_supports.mjs`, `check_navigation.mjs`, and `check_raw_objects.mjs` passed; `git diff --check` passed.

Small cabinets or occupied TV tables can reject full groups. This pass uses flat clothing cutouts and block folds; draping, open boxes, nested cookware, seat supports, and open rack interiors remain unfinished. Actual room-cull/revisit placement comparison and sustained resource/frame-rate checks remain undone; the reload check establishes initial reconstruction only. Next: seat and open shelf interior supports, matching the root roadmap. No new external assets were added. The user's two sardine PNG edits remain unstaged. Nothing was pushed or published.


## 2026-10-05 — Codex — chair seat supports

Added `seatSupport` for upright, unstacked monobloc chairs on the floor. The usable inset avoids the rounded edge, arms, and backrest. `domestic-props.js` preserves the actual seat height and chair-part obstruction bounds before static mesh merging, because merged chair meshes no longer contain named seat parts. Domestic details fit one compact clothing or paperwork group, an authored handled bag, or a lidded box onto selected seats. Candidates check chair parts, nearby furniture, room bounds, and shared footprint reservations. Seeded selection uses 32% of eligible chairs, capped at three attempts per room. Stacked/inverted chairs, chairs stored on tables, and unsupported imported chairs remain empty.

Preview with `?seats=mixed`, `clothing`, `paperwork`, `bag`, or `box`; `?seats=off` disables seat objects. Inspector entries identify seat support, measured contact, footprint bounds, and chair-part clearance. Viewed mixed seat objects in paired dining and bags in perimeter seating on the twisting route. The mixed six-room scene accepted 17 seat groups; all had the intended 2 mm contact gap, support bounds, chair-part clearance, and clear aisles. Reloading reproduced identical detail metadata. The perimeter preview accepted three bags per room with the same checks. The chairs-on-tables preview had chairs in all six rooms and zero seat attempts. Browser logs had no warnings or errors; saved `chair-seat-preview.png`.

`check_object_supports.mjs` passed seat eligibility, occupied-area, armrest-overhang, and backrest-intrusion cases alongside table/shelf cases. `check_navigation.mjs` and `check_raw_objects.mjs` passed; `git diff --check` passed. Draping over chair backs, imported chair/sofa supports, open shelf interiors, actual cull/revisit placement comparisons, and sustained performance measurements remain unfinished. Next: open shelf interior supports, matching the root roadmap. No external assets were added. User sardine PNG edits remain unstaged. Nothing was pushed or published.


## 2026-10-05 — Codex — connected side rooms and hallways

Added `side-spaces.js` as the shared seeded plan for domestic side spaces. Eligible rectangular, level-floor rooms up to 8 m wide and 4 m high select one side space on roughly 34% of indices. Some connect directly through a doorway or plain opening; others have a 2.4–3.6 m hallway leading into a small room. Existing unusual branch/cross corridors remain. Annex footprints stay within their parent cell's longitudinal bounds. Each annex has a floor, ceiling, perimeter walls, and a shallow storage ledge. Door leaves stand open into the side space; interactive opening/closing is deferred.

`room-architecture.js` renders the shared rectangles and replaces a skipped wall strip with doorway infill and trim. `navigation.js` uses the same plan for walkable regions. Wall, open-door, and storage-ledge bounds participate in collision; main-room furnishings reserve the doorway approach. A descriptor decoration fix makes distance lookup and room-index lookup agree about side-space preview choices and seeds. Side geometry follows the same curved/twisting transform and is culled with its owning room. Space returns through the doorway to the main route.

Force previews with `?sideSpaces=room` or `hallway`, or disable domestic annexes with `off`. `&sideStart=1` starts inside the annex, facing its entrance; `inspect=1` includes side-space dimensions and regions. Viewed a straight hallway and a plain side-room opening on the twisting route. The loaded six-room preview reported open branch raycasts, clear architecture reservations, and clear main aisles. Pressing Space from inside the straight hallway and twisting side room returned to automatic mode near the centre route, as recorded in `#route-state`. Reloading the hallway preview reproduced identical side-space metadata. Browser logs had no warnings or errors. Saved `side-room-preview.png` and `side-hallway-preview.png`.

`check_side_spaces.mjs` passed 120 direct/hallway cases across widths, lengths, and positive/negative indices: manual entry with `moveWalker`, doorway/exterior collision, route return, deterministic plans, and owning-cell bounds. It also checks agreement between navigation descriptor lookups. `check_navigation.mjs` passed 2,000 bidirectional descriptors and 48 reconstructions; object-support and raw-asset checks passed. `git diff --check` passed.

Side rooms remain lightly furnished with a ledge; distinct bedroom, storage, and washroom fittings are next. Door interactions, branching into further cells, cross-cell loops, independent side-room light profiles, sustained resource/frame-rate checks, and an actual cull/revisit comparison remain unfinished. Open shelf interior supports are deferred while the user-requested side-space work proceeds; they remain in `ARRANGEMENTS.md`. The root roadmap names side-room furnishing next. No external assets were added. User sardine PNG edits remain unstaged. Nothing was pushed or published.

## 2026-10-05 — Codex — side bedrooms

Two domestic annex variants now receive bedroom furnishings; the third retains its storage ledge. `side-spaces.js` reserves bed and drawer footprints for collision and route return. `side-bedrooms.js` fits an existing single bed or upholstered daybed, adds a blanket with seeded color, pillows on the single bed, plastic drawers facing into the room, a supplied flat garment, and a small supplied family photo. Furniture leaves the centre and entrance clear. Prototype resources stay shared, while authored bedroom geometry and materials are disposed with their owning cell. Added `sideRoom=bedroom|bare` preview overrides and bedroom model/bounds/contact reports to the inspector.

Viewed the daybed and single-bed variants in the browser, including the twisting route. The final six-room preview had twelve bed/drawer pieces inside their side-room bounds, with 2 mm floor contact gaps; branch openings and main aisles remained clear. Space returned from the furnished annex to automatic mode near the centre route (`#route-state` reported x = -0.119 m). Reloading reproduced identical bedroom furniture metadata. Browser logs had no warnings or errors. Saved `side-bedroom-preview.png`. `check_side_spaces.mjs` passed 360 bedroom/ledge cases for direct and hallway entry, wall/furniture collision, route return, deterministic plans, and owning-cell bounds. Navigation passed 2,000 bidirectional descriptors and 48 reconstructions; object-support and raw-asset checks passed. `git diff --check` passed.

The first drawer asset looked too small at the intended footprint, so this pass uses the existing plastic drawers. Daybeds retain their modelled cushions rather than receiving extra pillows. Independent bedroom lighting, washroom fittings, interactive doors, open shelf interiors, actual cull/revisit comparisons, and sustained performance measurements remain unfinished. Next: storage arrangements in side rooms, then washroom fittings; the root roadmap names storage next. No external assets were added. User edits to the two sardine PNGs remain unstaged. Nothing was pushed or published.

## 2026-10-05 — Codex — side storage rooms

The third seeded domestic annex variant now receives storage furnishings instead of the ledge. `sideRoom=storage` forces it; bedroom and bare overrides remain. `side-storage.js` adds an authored open shelf with six taped cartons, three offset floor cartons, existing plastic drawers with a small carton on top, and an existing blue/pink bucket. Carton colors and shelf-carton heights vary by index and annex variant. Shelf, stack, drawer, and bucket footprints come from the shared side-space plan, leaving the centre and entrance clear. Cloned asset resources stay shared; authored geometry and materials are disposed with the owning cell. Inspector entries report each storage group's bounds and floor contact. Fixed the inspector's initial sentinel so starting at room -1 produces its report.

Viewed direct and hallway storage rooms on both sides of the twisting route. The direct six-room preview had 24 storage groups inside their room bounds, all with 2 mm floor contact; branch openings and main aisles were clear. The negative-index hallway preview also reported all storage bounds and entrances clear; Space returned from it to automatic mode at x = -0.113 m. A preview without a furnishing override selected three bedrooms and three storage rooms across its six loaded cells. Reloading the direct preview reproduced identical storage metadata. Space returned from the direct annex to automatic mode near the main route (x = -0.109 m in `#route-state`). Browser logs had no warnings or errors. Saved `side-storage-preview.png`. `check_side_spaces.mjs` passed 480 bedroom/storage/ledge cases, including fixture overlap, collision, entry, route return, deterministic plans, and owning-cell bounds. Navigation passed 2,000 bidirectional descriptors and 48 reconstructions; object-support and raw-asset checks passed. `git diff --check` passed.

This shelf's cartons use known authored dimensions; general support fitting inside imported open racks remains deferred. Openable boxes, independent annex lighting, interactive doors, actual cull/revisit comparisons, and sustained frame-rate/resource measurements remain unfinished. Next: washroom fittings in side rooms, matching the root roadmap. No external assets were added. The user's two sardine image edits remain unstaged. Nothing was pushed or published.

## 2026-10-05 — Codex — side washrooms

Added `side-washrooms.js` with existing toilet, basin, and bucket meshes, plus authored mirror, towel, nozzle shower, thin blue pipe and wall clamps, low faucet, soap dish, and flat floor drain. The annex retains its bare floor. Fixtures face into the room and reserve footprints through the shared plan. The shower has no enclosure or overhead lamp attachment. Authored resources are disposed with the owning cell; cloned model resources remain shared. A seeded furnishing choice now gives bedrooms, storage rooms, and washrooms weights of 2:2:1, independently of annex dimensions. Existing furnishing overrides remain, with `sideRoom=washroom` added.

Viewed direct and hallway washrooms on opposite sides of the twisting route, including negative room indices. The direct six-room preview had 18 floor fixtures inside their room bounds with approximately 2 mm floor contact; branch entrances and main aisles were clear. The hallway preview also reported clear entrances and fixture bounds; Space returned to automatic mode at x = 0.112 m. A preview without a furnishing override selected two bedrooms, three storage rooms, and one washroom across its six cells. Reloading reproduced identical washroom fixture metadata. Space returned from the direct washroom to automatic mode near the main route (x = -0.037 m in `#route-state`). Browser logs had no warnings or errors. Saved `side-washroom-preview.png`. `check_side_spaces.mjs` passed 600 furnishing/geometry cases, including pairwise fixture clearance, collision, entry, route return, deterministic plans, and owning-cell bounds. Navigation passed 2,000 bidirectional descriptors and 48 reconstructions; object-support and raw-asset checks passed. `git diff --check` passed.

The mirror uses a plain grey surface without reflections. Water flow, wet surfaces, independent annex lighting, door interactions, open rack support fitting, actual cull/revisit comparisons, and sustained performance measurements remain unfinished. Next: independent lighting profiles for side rooms, matching the root roadmap. No external assets were added. The user's two sardine image edits remain unstaged. Nothing was pushed or published.
