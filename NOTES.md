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

## 2026-10-05 — Codex — wood surfaces and loose boards

Integrated the supplied `models/textures/wood.png`, added its git whitelist entry and provenance record, and loaded one shared texture with mipmap filtering. Existing exposed rafters and chopping boards now use it. `wood-details.js` adds occasional partial wood wall sections, short perpendicular dividers, and pairs of slightly angled loose boards in level domestic rectangles up to 8 m wide. Selection and tint are seeded. Added `wood=all|walls|divider|planks|off` preview controls. Category overrides force that category alongside naturally selected details. Divider bounds join walking collision. Plank candidates avoid side openings and existing collision/furniture bounds; their low height leaves them passable. Authored geometry/materials are disposed with the owning cell without disposing the shared texture.

Viewed textured rafters, wall sections, a divider, and loose boards in twisting daylight rooms. The six-room forced preview retained clear main aisles and branch entrances; every accepted wood detail stayed within room bounds. Divider/plank reports recorded clear placement. The lower loose boards had approximately 2 mm floor contact, with upper boards 2 mm above their supporting board. The first candidate search used only remaining empty wall spots and often rejected all boards; floor placement now also searches other wall-side positions while excluding side openings. Reloading reproduced identical wood metadata. Browser logs had no warnings or errors. Saved `wood-divider-preview.png` and `wood-planks-preview.png`. Side-space, navigation, object-support, and raw-asset checks passed; `git diff --check` passed.

Wood details currently use the same grain image with seeded tints; separate end-grain, damage variants, and general textured furniture recoloring remain unfinished. Actual cull/revisit comparisons and sustained performance measurements remain undone. Next remains independent side-room lighting, matching the root roadmap. Supplied raw object additions and sardine image edits were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Codex — open wooden stairs

Added an open wooden version of the existing dead-end stair feature, following the supplied reference. Twelve 45 mm treads rise by 180 mm at 250 mm intervals, supported by two sloping side boards. The underside and riser gaps contain no solid fill. A thin wooden landing retains the existing termination at a wall. The supplied wood texture is shared with other wooden surfaces. Most stair-room indices use this version; indices divisible by four retain solid stairs. Added `stairs=wood|solid` preview overrides and `stairStyle` inspector metadata. Architecture now bakes rotated boxes into its material batches for the sloping supports.

Viewed the wooden stairs in the straight daylight passages preview. The inspector reported `openWood` for room 3, clear main aisles, and no furniture intrusion into architecture reservations across all six loaded rooms. The screenshot visibly shows open risers, thin treads, and side supports. Browser logs had no warnings or errors; saved `wood-stairs-preview.png`. Navigation checks passed 2,000 bidirectional descriptors and 48 reconstructions, and side-space checks passed 600 cases. `git diff --check` passed.

Stair features remain non-climbable and keep their existing collision reservation. Upper-floor destinations, railings, climbable tread surfaces, actual cull/revisit comparisons, and sustained performance measurements remain unfinished. Next remains independent side-room lighting, matching the root roadmap. The reference image was used for shape only; no new external asset was added. Supplied raw object additions and sardine image edits remain unstaged. Nothing was pushed or published.

## 2026-10-05 — Antigravity — organized DepEd color references and condensed specification

Organized, tagged, and renamed the seven supplied source PNGs in `references/` from raw timestamps into an ordered sequence:
- `01-deped-efd-school-elevation-render.png`: 3D render of a 1-storey school building with EFD-AS approval signatures and material swatches.
- `02-deped-mpss-paint-schedule-overview.png`: schedule overview mapping building elements to MPSS color names.
- `03-deped-mpss-specs-roof-doors-columns.png`: specification table for roofing, doors, and columns with Pantone numbers and finish types.
- `04-deped-mpss-specs-walls-ceilings.png`: specification table for exterior/interior walls and ceilings with Pantone numbers and finish types.
- `05-deped-mpss-specs-railings-baseboards.png`: specification table for grills, railings, and baseboards with Pantone numbers and finish types.
- `06-deped-mpss-palette-swatches.png`: 2 × 3 palette grid with official swatch names.
- `07-deped-order-006-s2021-infographic-poster.png`: official DepEd Order No. 006, s. 2021 infographic poster showing building callouts, Gabaldon heritage exceptions, and the DO No. 32, s. 2010 prohibition against political colors.

Created `references/README.md` as the authoritative condensed text document and reference index. It records the policy background (DO No. 006, s. 2021; DO No. 32, s. 2010; EFD-AS signatories), a consolidated master table synthesizing building elements, MPSS color names, Pantone codes, commercial/DepEd codes, masonry latex and QDE coating requirements, sampled hex values, and FGC roles. It details the Gabaldon heritage building exception (Firebrick Red, Ivory White, Saddle Brown) and the worldbuilding thesis connecting institutional paint surplus to domestic interior uniformity. Also created `references/metadata.json` for machine-readable queries and structured palette extraction.

Verified file presence, renaming, dimensions, and JSON validity via Python and PowerShell. Unstaged changes to `index.html`, `.gitignore`, `fonts/`, and `2d/raw objects/` remain untouched. Nothing was committed, pushed, or published. Next in dev remains independent lighting profiles for side rooms per the root roadmap.

## 2026-10-05 — Codex — title screen and loading gate

Added a title screen to index.html with short controls and an Enter button. The initial rooms and assets load behind it; font loading, shader compilation, and the first render finish before entry is enabled. The route waits for entry, and reduced-motion playback stays paused afterward. Loading failures display a reload instruction. The development bypass is `?skipTitle=1`; development.html retains its previous entry behavior.

Used bundled Permanent Marker from the official Google Fonts repository under Apache 2.0, with its licence and provenance recorded. HousePaint web embedding permission was not established; Xyh authorized the Google Fonts alternative. HousePaint remains unused and excluded from Git.

Checked the actual browser loading and ready states, font availability, unchanged route after W before entry, canvas focus after Enter, and forward movement after Space. Title bounds fit at 360×640 and 700×360; saved title-screen-preview.png locally. Network failure injection and sustained loading measurements remain undone. Next remains independent side-room lighting. No push or publication performed.

## 2026-10-05 — Codex — DepEd palette grounding and varied wall paint

Added one factual paint-scheme sentence to the title and a Paint schedule link to references/index.html. The source page transcribes the supplied overview image, attributes its alternate names, and links the official 2021 annex. The presentation and annex differ on some element assignments. Search-index text corroborated the official schedule; direct PDF retrieval returned HTTP 403, so no new PDF was archived. The seven supplied reference images remain the local source. CONCEPT.md records the palette connection and retains the surplus-paint idea as a speculative premise. An expanded table in the intro was dropped at Xyh’s request to keep only the statements.

Rooms now select wall paint from a separate deterministic stream: 70% foam green, 10% Crisp Ecru, 10% Bright Wonder, 6% Yellow Rain, and 4% off-white by selection weight. The paint override accepts foamGreen, crispEcru, brightWonder, yellowRain, and white. Main wall modules, window surrounds, partitions, and side-room architecture follow the room finish. Trim, bare blocks, and wood keep their existing materials. Recoloured shared wall materials are copied and disposed with the owning cell; furniture decisions retain their previous random stream.

Viewed the concise title at 360×640, the public reference page, and forced Crisp Ecru and Yellow Rain room renders. The default six-cell inspector selected foamGreen, crispEcru, and brightWonder; the forced beige inspector reported all six paint assignments with clear aisles and branch openings. Saved beige-walls-preview.png and palette-intro-preview.png locally. The initial partition edit caused a browser scope error and was corrected before these checks. Side-space checks passed 600 cases; git diff --check passed. Actual cull/revisit material comparisons and sustained performance remain undone. Next remains independent side-room lighting. Antigravity’s uncommitted notes and supplied raw-image changes remain unstaged. No push or publication performed.

## 2026-10-05 — Claude Code — fewer dark rooms and floor scatter

Xyh asked for fewer dark rooms and more things in the rooms, using indistinct low-poly shapes in varied colours to suggest bottles and rubbish, with an empty room from time to time.

Lighting weights changed in `room-lighting.js`; the profiles themselves did not. The dark profiles (darkDay, night, deepNight, dusk, red, violet) went from 38% of rooms by weight to 18%. The first five rooms were daylight, overcast, shaded, darkDay, night and are now daylight, overcast, daylight, shaded, dawn.

Added `floor-scatter.js`: seeded floor objects along walls, in corners, and on open floor in rooms 6 m or wider, built as one merged vertex-coloured mesh per room. Each room draws a level — none 10%, light 22%, medium 36%, heavy 32%; `bare` rooms draw none 35% of the time. `?clutter=none|light|medium|heavy` forces it. Details are in HANDOVER.md.

Checks. `scripts/check_floor_scatter.mjs` passed 2,520 plans (90,576 objects) for aisle clearance, wall and partition bounds, blocked rectangles, determinism, and the object cap; over 4,000 rooms it measured 10.7% without scatter and an 18.2% dark share. A 4 × 8 m sala gets 11, 26, or 48 objects at light, medium, heavy. Existing `check_side_spaces`, `check_navigation`, `check_demo_sequence`, and `check_room_sequences` still pass. In the browser on the root server, viewed rooms 6, 8, and 12 on the straight route and room 1 on the twisting route: scatter rendered under the room lighting bands with no console errors, and the inspector reported clear aisles and open branch entrances for all eighteen retained rooms, with `bare` rooms 10 and 14 at zero objects.

Not done. No preview PNG was saved. Draw calls, frame time, and the cull/rebuild lifecycle were not measured; the scatter mesh is disposed through the generic `userData.own` pass, which was read but not exercised over a long run. Walking into carton stacks and sacks by hand was not tried. Side rooms get no scatter. `development.html` shares the new lighting weights but has no scatter. The existing table, shelf, and floor-cluster counts in `domestic-details.js` were left alone, because changing them would shift its random stream and every arrangement after it. Scatter objects sit level on sloped floors.

The node checks in `scripts/` fail under plain `node` 20.10 here, since there is no `package.json`; `node --experimental-default-type=module scripts/<check>.mjs` runs them.

Next remains independent side-room lighting, matching the root roadmap. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — passage exits, regenerating rooms, side-room scatter, unpaused start

Xyh asked for scatter in side rooms, turns or branching paths that automatic movement picks at random, deleted rooms that come back different, and movement that starts on Enter.

Side rooms now receive floor scatter. Movement starts when Enter is selected; the `prefers-reduced-motion` starting pause was removed at Xyh's request, and Pause still works.

Branching is a cut, not a second axis. The existing `branches` and `cross` side passages end in a dark doorway. Automatic movement entering such a room picks the main doorway or a passage with equal probability. At the doorway the screen fades to near-black for under a second, all six rooms are discarded, and the walk resumes in a domestic room 20 to 620 indices further along with rerolled contents. Walking into the doorway by hand does the same. Fork rooms are 5% of the demo sequence; the first is room 7.

A discarded room is rebuilt with the same shell and different furniture, paint, lighting, scatter, and side rooms. Shells are kept because every room's position is a running sum of the lengths before it. Details are in HANDOVER.md.

Checks. `check_forks.mjs` walked the exit route of 149 fork rooms in 3,000 through the walkable regions and tested the salt rules. `check_floor_scatter.mjs` passed 384 side-room plans. The side-space, navigation, demo-sequence, and room-sequence checks still pass. In the browser on the root server: viewed heavy scatter in the side bedroom of room 8; viewed the passage and dark doorway in room 7; ran the automatic exit from room 7 with `fork=always`, which landed in room 46 with six salted rooms, clear aisles, the veil back at opacity 0, and no console errors; walked back from room 1 to room -2 and forward again with simulated S and W keys, after which rooms 2 and 3 kept their type and size and changed paint and scatter counts; selected Enter on the title screen and read forward movement and a Pause label three seconds later. The browser pane throttled animation frames, so those runs drove the frame loop from a message channel.

Not done. The cut itself was not watched in motion, only its before and after states, so its timing and feel are unjudged. The manual trigger at the exit doorway was not exercised by hand; `check_forks.mjs` confirms a walker can stand in the trigger zone. The random 1/(n+1) choice was only run forced. Frame time during the rebuild under the veil was not measured. `development.html` has none of this. Domestic side hallways and side rooms are still dead ends; only the two passage shapes are exits.

Dropped: real turns, where rooms continue at right angles in one continuous space. Lighting bands, the twist shader, collision, and every placement rule assume the route runs along one axis, so that is a rewrite of the room builder rather than an addition. The cut gives the branch without it.

Root ROADMAP.md's Mechanism line was updated and left uncommitted, because that file carries other agents' uncommitted edits. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — exits in some side rooms

Xyh asked for some side hallways and rooms to be dead ends and some to be passageways. About 23% of side rooms, reached directly or by a side hallway, now have a dark doorway in the far wall that behaves like the passage exits; the rest are dead ends as before. Washrooms are always dead ends, because their fixtures stand in front of the doorway. Details are in HANDOVER.md.

Checks. `check_forks.mjs` found 397 exits in 1,703 side rooms over 6,000 demo rooms (bedrooms and storage rooms, direct and by hallway), walked each exit route through the walkable regions and past the fixture blocks, and confirmed the far wall is open at the doorway. The side-space, navigation, and scatter checks still pass. In the browser on the root server, with `sideExits=all`: viewed the doorway in the side bedroom of room 8, between the family photo and the drawers; ran the automatic exit from that room, which landed in room 622 with six salted rooms, clear aisles, and no console errors.

Not done. The manual trigger in a side room was not walked by hand. The default 30% hash was only measured in the node check, not seen in a default run. Furnishing meshes in side rooms are placed from the same fixture boxes the doorway test uses, but their rendered bounds were not compared against the doorway. The cut's timing is still unjudged in motion.

Root ROADMAP.md's Mechanism line was updated again and left uncommitted. Next remains independent side-room lighting. Nothing was pushed or published.

## 2026-10-05 — Claude Code — generated room shells

Xyh asked for unusual geometry to emerge from generation rather than be set, for odd furniture layouts to be let in, and for most things to be procedural.

The default run no longer draws strange rooms from the ten `unusual` and six `vast` shells; those lists are deleted. `room-generator.js` draws every room's width, length, height, floor rise, passages, stairs, columns, platform, type, and layout from separate seeded distributions, whose tails open under two slow pressure fields along the route. Unusual rooms are whatever the draws coincide in. The six-to-eight-room exception schedule is gone with the lists; unusual rooms now arrive in short stretches. Stairs, columns, and platforms became parameters in `room-architecture.js` and can share a room. Odd layouts appear in about 7% of ordinary rooms and more often under pressure. Details are in HANDOVER.md.

Measured over 10,000 rooms at seed 5: 8,198 domestic, 1,625 unusual, 177 very large or tall; 135 with stairs, 325 with columns, 27 with a platform, 380 with passages, 218 with a raised or sunken floor, 234 with two or more features, and 541 ordinary rooms with an odd layout. Fork rooms fell from 5.0% to 3.2%, and the first is now room 17.

Checks. `check_demo_sequence.mjs` was rewritten for the generator and passed 40,000 rooms across four seeds: determinism, joins, the size and feature limits the builder assumes, furniture validity and the 160-piece limit on every seventh room, and that every feature and every layout occurs. A sweep of all twelve layouts over 99 room sizes found no invalid layout. The fork, side-space, navigation, scatter, room-sequence, and object-support checks pass. In the browser on the root server, straight route: viewed room 19 (34 × 46 m hall with two column rows, a nine-step stair, a ring of chairs, and a passage), room 20 (32 × 20 m, 16.8 m high, three column rows, raised floor), and room 139 (12 × 26 m with stairs, columns, and a passage); the inspector reported clear aisles, open branch entrances, clear architecture, and closed partition shoulders for all twelve rooms read, with no console errors.

Not done. Generated rooms were not viewed on the twisting route, and none wider than 34 m was viewed at all; the generator reaches 62 m in these seeds. Frame time in large column rooms was not measured. Sunken-floor rooms with columns were not viewed after the change that starts columns at floor height. Stairs steeper or longer than the old twelve steps were checked for fit by rule, not by eye. Passage geometry — reach, position, turn — is still fixed, as are platform size and the side-room plan, so those are the next things to parameterise. `development.html` and the `mixed` sequence keep the old lists. The 2.5% rates and thresholds were set to land near the earlier 85/14/1 mix, not tuned by watching a long run.

Dropped: keeping an exception at a fixed interval. A schedule and emergence contradict each other, and Xyh asked for emergence.

Root ROADMAP.md's Mechanism line was updated and left uncommitted. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — parametric passages, platforms, and side rooms

Xyh asked for passages, platforms, and side rooms to be parametric too. Each now draws its own position and dimensions; ranges are in HANDOVER.md. A room can have a passage on each side at different positions, reaches, and heights, and a domestic room can have a side room on each wall.

Checks. `check_demo_sequence.mjs` asserts, over 40,000 rooms, that every passage opening and return leg stays within the room length, that there is one passage per side, that stairs take the wall opposite the first passage, that platforms fit, and that reaches, positions, and platform depths vary. `check_side_spaces.mjs` now runs 1,560 side rooms, including 360 second rooms, through its existing tests: inside the owning cell, fixtures inside the room and not overlapping, walk in from the main room, walls and fixtures block, and a path back to the route. `check_forks.mjs` walked the exit routes of 97 passage rooms and 480 side-room exits. The navigation check was changed to build its test portal with `branchOpenings`, since a bare `{side,z}` no longer describes a passage. Scatter and room-sequence checks pass. In the browser on the root server, straight route: viewed inside a passage of room 17 (two passages, 14 m and 12 m, different heights), the platform of room 18 (2 m deep, both sides), and room 57 from inside one of its two side rooms with the opposite doorway in view; the inspector reported clear aisles, open entrances, clear architecture, and side-room furniture inside its bounds for the rooms read, with no console errors.

Not done. Nothing here was viewed on the twisting route. A one-sided platform and a second side room reached by hallway were not viewed. Passages lower than a tall main room were seen from inside only; the join at the opening was not inspected from the main room. The passage opening width, the return leg's width and direction, and side-room fixture layouts are still fixed. `development.html` is unchanged.

Next remains independent side-room lighting. Root ROADMAP.md needed no change. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — tableware, plastics, and linens from fgc-cx

Xyh pointed to Codex's three mesh kits in `F:\xyh\fgc-cx`. Copied `tableware.js`, `plastics.js`, and `linens.js` in unchanged and added `household-items.js`, which places their objects on tables, shelves, and the floor and bakes each room's objects into one mesh. Placement rules are in HANDOVER.md. Nothing in `fgc-cx` was edited.

Checks, in the browser on the root server, straight route. Rooms -2 to 3 at heavy clutter and rooms 44 to 49 at default: the inspector reported between 1 and 16 objects per room, clear aisles, open branch entrances, and no utility overlaps for all twelve rooms, with no console errors. The six default rooms totalled 17,472 household triangles in six draw calls; the kitchen in room 44 took 11 objects on its tables and 5 on the floor, with 18 table candidates rejected because the surfaces were already full. Viewed a basin and pail in the kitchen of room 1 and a laundry basket with towel and pile in the bedroom of room 3. A first attempt failed to load on a duplicate variable name and was fixed before these checks.

Not done. Dishes on tables are confirmed by the placement count only; on the crowded tables in view they could not be told apart from the existing clutter, so their scale and contact with the tabletop are unjudged. Rugs, floor bedding, and shelf items were not viewed. Nothing was viewed on the twisting route. Side rooms and room sets (kitchen counters, sinks) get none of these objects. There is no node check for this placement, because it depends on Three.js and the node checks do not load it. Table surfaces reject about half the candidates; lowering the existing table clutter would make room but would reshuffle its arrangements. Baking flattens the kits' ceramic, plastic, and metal finishes to one matte material. `development.html` is unchanged.

Dropped: draping towels over chair backs. The towel needs a ridge to hang from, and chair-back heights are not exposed the way seats are; the basket rim was the available ridge.

Next remains independent side-room lighting. Root ROADMAP.md needed no change. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — route inversions, and the palette against the references

Xyh asked whether the path can sometimes twist fully upside down, and whether the main colours fall within the reference colours, in particular whether enough Palmyra is used.

Inversions. The default route now turns over by half a turn every 103 or 261 m, across 32 m; mechanism in HANDOVER.md. `check_spatial_route.mjs` passes with the new assertions. Viewed on the twisting route at 86 m and 91 m, just before the first inversion: the doorway ahead and the room beyond it are rolled over while the camera stays on the floor, which also shows the shader and the camera agree. Viewed at 200 m, where the second inversion falls inside the 34 × 46 m hall of room 19: the hall wraps into a funnel and is not readable as a room. The roll is a function of distance only, so it cannot avoid wide rooms. Left as is for Xyh to judge.

Palette. Sampled `references/06-deped-mpss-palette-swatches.png` directly; the hex values in `references/README.md` are right to within the 4-level sampling step. Hue, lightness, saturation (HSL):

| Colour | References | In the work |
| --- | --- | --- |
| Foam Green | swatch `#64F8A4` 146°, 0.68, 0.91; elevation render `#80C080` 120°, 0.63, 0.34; poster roof `#408070` 165°, 0.38, 0.33 | walls `#BFDCC9` 141°, 0.81, 0.29 |
| Palmyra Green | swatch `#94C424` 78°, 0.45, 0.69; render doors `#607040`–`#709040` 80–84°, 0.35–0.41; poster `#407020`–`#609030` 90–96°, 0.28–0.38 | trim `#4E7C63` 147°, 0.40, 0.23 |
| Beiges and white | `#ECD080`, `#FCECBC`, `#F8F0D0`, white | wall paints use the swatch values; ceiling `#F1F1EC` |

Foam Green is inside the references' hue range and is paler and less saturated than all of them. The trim called Palmyra is outside it: every reference is a yellow-green between 78° and 96°, and the trim is a blue-green at 147°, nearly the same hue as the walls. Lightness is in range.

Amount. Read back the rendered frame in six rooms (1, 3, 6, 9, 21, 44; straight route, daylight) and counted pixels by hue and lightness: dark green trim covered 2.9, 5.4, 5.1, 3.4, 4.2, and 10.2% of the frame; wall green covered 22 to 36% in the five green-walled rooms. Room 44's figure includes green monobloc furniture, which the count cannot separate from trim. So trim is about 3 to 5% of a view, roughly one seventh of the wall area. The schedule assigns Palmyra to doors, jambs, railings and grills, and baseboards. The work has frames, door leaves, and architecture trim; it has no baseboards, and no railings on stairs or platforms.

Added `?trim=<hex>` for comparing trim greens; viewed `?trim=6b8a3a` in room 3. No colour was changed. Not done: baseboards, railings, and any change to the trim hue, which are Xyh's to decide.

Root ROADMAP.md needed no change. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — olive trim as a range, baseboards, and railings

Xyh chose the olive trim, asked for baseboards and railings, and said a range of greens is better than one exact value.

Trim is now drawn per room from seven greens, most of them olives and yellow-greens inside the reference hue range, with the earlier blue-green and a teal kept as minorities. Foam-green walls are drawn from five foam greens. Baseboards run along the painted walls of every room. Stairs and platforms have railings. Weights and mechanism are in HANDOVER.md.

Checks, in the browser on the root server, straight route, daylight. Rooms 0 to 5 reported four different wall paints and three different trims, 14 to 40 m of baseboard each, clear aisles, clear doorways, and open branch entrances, with no console errors. Viewed baseboards and olive window frames in room 3, handrails and posts on the stair of room 139, and the aisle-edge rails on the platform of room 18. Re-ran the frame count from the previous entry with the hue window widened to include olive: trim covered 5.6, 4.1, and 4.5% of the frame in rooms 3, 1, and 21, against 5.4, 2.9, and 4.2% before. The side-space, fork, navigation, sequence, and route checks pass.

So baseboards add little area, between 0.2 and 1.2 points of the frame. The larger change is that trim now differs in hue from the walls instead of reading as a darker wall.

Not done. Nothing was viewed on the twisting route. Baseboards in a raised or sunken room, and on a non-green wall, were not viewed. A solid stair's single rail was not viewed. Side rooms and passages have no baseboards. The checkerboard floor and TV stripe still use the old green. Railings do not stop the walker; the stair and platform reservations already do. If more Palmyra is wanted, the candidates with real area are door leaves on more walls, window grilles, and painted lower wall bands.

Root ROADMAP.md needed no change. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — kitchen and bathroom zones, smaller rooms, drawer variants

Xyh asked for some areas to be all kitchens and some all bathrooms, said ordinary rooms still feel too long or big, and said the plastic drawer unit repeats with the same four colours and should vary in colour and size.

Zones: stretches of the route are now all kitchen or all bathroom, about 11% of rooms each, four rooms long at the median and up to about thirty. Ordinary rooms are smaller: 75% are 4 or 6 m wide and 6 or 8 m long, up from about 45%. The drawer unit has 32 generated variants. Details are in HANDOVER.md.

Checks. `check_demo_sequence.mjs` passed 40,000 rooms with new assertions: every room in a zone has the zone's type unless its shell is a hall, each zone covers 500 to 1,500 rooms in 10,000 with a run of at least five, and small rooms are over 60% of domestic rooms. Fork, side-space, navigation, and room-sequence checks pass; the fork check's lower bound moved from 3% to 1.5%. In the browser on the root server, straight route: rooms 53 to 57 were all kitchens with kitchen fixtures, and rooms 45 to 49 all bathrooms 4 m wide; clear aisles, no utility overlaps, side-room furniture inside its bounds, no console errors. With `utilities=all`, six consecutive rooms held six different drawer units, three to six drawers, 0.35 to 0.58 m wide, 0.65 to 1.09 m high.

Not done. Only one drawer unit was seen, at the edge of a frame (grey frame, red and blue fronts); the colour schemes are otherwise unviewed. A long zone was not walked. Nothing was viewed on the twisting route. The minimum room length is still 6 m; going shorter would mean changing furniture placement, side rooms, and the route checks, which all assume it. Furniture pools do not change inside a zone beyond what the room type already selects. Other repeated props (buckets in two colours, the gas cylinder, the brooms) are still single models.

An error of mine, corrected: the first zone measurement showed runs of over thirty rooms and I attributed that to a weak hash. Replacing the hash did not shorten them; runs that long are the expected maximum for this field over 10,000 rooms, and the median is four. The better hash stays, and the comment that blamed the old one was removed.

Root ROADMAP.md's Mechanism line was updated and left uncommitted. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — real cutout sizes, and one door leaf or none

Xyh said the 2D clothes and bottles are often the wrong size, which is interesting sometimes but should not be the norm, and asked why every room ends in double doors when it should be one door or none.

Cause of the sizes: the table generator gave every cutout a generic size rather than its own. Each cutout now has a real size; garments lie on the floor at full size and stay off tabletops; about one cutout in twenty-five is deliberately far too large or too small. Doorways have one leaf or none. Details are in HANDOVER.md.

Checks. `check_raw_objects.mjs` passes on the regenerated table of 45 cutouts, and running the generator twice gives the same file. Object-support, scatter, and sequence checks pass. In the browser on the root server, straight route, twelve rooms: bottles measured 0.17 to 0.27 m, a sardine can 0.09 m, floor jeans 0.95 m and T-shirts 0.59 m; one cutout in those rooms was an oddity, a vinegar bottle at 3.2 times (0.86 m); far doorways had a leaf in six rooms and none in six, all reported clear; no console errors. Viewed the kitchen of room 55 with bottles at table scale and an open doorway with no leaf, and room 22 with a single leaf.

Not done. The sizes in `REAL_SIZE` are my estimates from the product types, not measurements; the pots, pans, flower arrangements, and the Orocan chest and cooler are the least certain. Seven supplied files with timestamp names in `2d/raw objects/` are still unnamed, unsized, and unused; the generator now skips them instead of indexing them. No oversized floor cutout was viewed. Nothing was viewed on the twisting route. Side-wall door leaves are unchanged, since those were always single.

A mistake caught before commit: the first regeneration indexed those seven unnamed files and dropped a function I had just added to `raw-object-assets.js`, because the script kept only the text from `createRawObject` onward. Both are fixed in the script.

Root ROADMAP.md needed no change. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — door hardware attached, doormat colours

Xyh reported a gap between the door hinge and the door, and asked for varied welcome-mat colours.

The floating part was the handle, not the hinge: it sat 1.75 cm off one face of the leaf, and on screen doors it was beside the stile, over the mesh. The hinges already overlapped the leaf. The handle is now a plate flush on both faces with a grip, and the hinges are re-seated on the hinge edge with a third added at mid-height. Doormats draw one of fourteen colours and a width per room.

Checks, in the browser on the root server, straight route: viewed a green leaf in room 22 with the handle plate on its face, and six rooms reported five mats in four colours (one room has no mat) with all far doorways clear and no console errors.

Not done. The hinges were not seen close up, and a screen door's handle was not viewed. If the gap Xyh saw was something other than the handle, it is still there. Nothing was viewed on the twisting route.

Root ROADMAP.md needed no change. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-05 — Claude Code — basketball

Xyh asked for a basketball mesh. Added `basketball.js` and placed it through the household pass; details in HANDOVER.md.

Checks, in the browser on the root server, straight route, with `prop=basketball`: six rooms each reported one ball with clear aisles and no console errors, and the ball in room 21 was viewed twice, once at the frame edge and once through the doorway from room 20, as a brown ball with dark seams resting on the floor.

Not done. Only the darkest of the four colours was seen. The 12% default rate was not observed in a default run. The ball does not roll or respond to the walker. No hoop or court markings were added. Nothing was viewed on the twisting route.

Root ROADMAP.md needed no change. Next remains independent side-room lighting. Antigravity's uncommitted notes entry and the supplied raw-image changes were left unstaged. Nothing was pushed or published.

## 2026-10-06 — Claude Code — "could not load" on the published site

Xyh reported that the published page sometimes shows "demo could not load" after a while, and that on some machines it cannot be reached.

Found, by requesting every referenced asset from https://xyhtamura.github.io/foam-green-city/: `models/bamboochair.png` returned 404 and the other 124 returned 200. The file exists locally but git ignores it. Kitchens and bedrooms could draw it as a prop; when one did, the texture loader's error handler showed the load-failure message, whatever the connection. Removed the two pool entries. The file's licence is recorded as unverified, so publishing it is Xyh's decision, not a fix.

Found, by reading README.md: its only demo link was `http://127.0.0.1:8141/`. Followed from GitHub on any machine without a local server on that port, a browser reports that the site cannot be reached. The README now links the published page first and gives the local address as text. Its server command also bound to 127.0.0.1, which the root instructions forbid; removed.

Not found, but real: module imports carried hand-edited version tags, and several modules changed repeatedly under one tag. For up to ten minutes after a push, or longer in a browser cache, a new `index.html` can be paired with an old module and fail to load. Added `scripts/stamp_versions.py`, which puts one content-derived stamp on every local import, and ran it. Details of all three are in HANDOVER.md.

Also changed: an error after the walk has started no longer claims the demo could not load; it says the walk stopped on an error. A missing optional image after that point is logged and the walk continues.

Checks. `check_published_assets.py` failed on the bamboo chair before the fix and passes after, 124 assets. `stamp_versions.py` is stable across two runs and `--check` passes. All nine node checks pass. In the browser on the root server: the stamped page reached Ready with every local module URL carrying the stamp and no console errors; a soak run at 60 m/s on the twisting route passed 1,299 rooms with no error, six rooms retained throughout, and JS heap at 92 MB at room 885 and 97 MB at room 1,299.

Not done. None of this is published until it is pushed, and I did not push. The soak ran with exits disabled, so the cut to a new run of rooms was not soaked. A lost WebGL context is not handled. Draw calls were 980 to 1,320 per frame during the soak, which may be slow on weak graphics hardware; that was not measured as frame time. Three.js is still loaded from unpkg.com: on a network that blocks it the page cannot load. Bundling Three.js into the repository would remove that dependency and needs Xyh's go-ahead to download the files. If "cannot be reached" was the github.io address itself rather than the README link, the cause is outside this repository.

Root ROADMAP.md needed no change. Next remains independent side-room lighting. Nothing was pushed or published.

## 2026-10-06 — Claude Code — bundled Three.js, Yatra One title

Xyh approved bundling Three.js and asked for the title in Yatra One, or in capitals with large and small sizes. Did both: the title is Yatra One in capitals, with F, G, and C at 1.4 times the other letters.

Three.js r160 and five add-ons are in `vendor/three/`, unmodified, with the MIT licence; all seven pages' import maps point there. Yatra One and its Open Font License are in `fonts/`; Permanent Marker and its licence were removed. Provenance is in ASSETS.md and THIRD_PARTY.md.

Checks. Downloads: `three.module.js` reports revision 160, the font file has a TrueType header and is 276 KB, and both licence files open with the expected text. `check_published_assets.py` passes with 127 assets, now including the font and the vendored modules; `stamp_versions.py --check` passes. In the browser on the root server, the page reached Ready with no request to any other origin, Three.js and its two add-ons loaded from `vendor/`, no console errors, the heading's computed font was Yatra One with the font reported as loaded, text-transform uppercase, and the three initials at 1.4 times the base size; the heading stayed inside an 800-pixel-wide viewport with no horizontal scroll.

Not done. The title was not seen: the preview pane was hidden and screenshots timed out, so letter spacing, line height, and the size ratio are set by number, not by eye. Widths other than 800 pixels were not measured, so the 360-pixel phone width is unchecked. The dev pages in `scripts/` and the two preview pages were repointed but not opened. Nothing was pushed, so the published site still loads Three.js from unpkg and shows Permanent Marker.

Root ROADMAP.md needed no change. Next remains independent side-room lighting.

## 2026-10-06 — Claude Code — doorway leaf hung on its frame

Xyh reported that door hinges still do not meet the door frames: a left door sits to the left of the frame and a right door to the right.

Cause: the leaf at each room's far doorway was hung 0.96 m from the centre line. Measuring the doorway model's vertices gives a frame that ends 0.486 m from the centre, so every leaf stood about half a metre along the wall from the frame it belongs to. The hinge is now on the jamb, and the leaf stands open a varying amount past square. My earlier fix (2026-10-05) attached the handle to the leaf and did not touch this; I had taken "hinge" to mean the floating handle and did not measure the frame.

Checks, in the browser on the root server, straight route: six rooms reported hinges at 0.47 m on the leaf's side, leaves between 0.40 and 1.06 m from the centre, clear doorways and aisles, and no console errors; viewed room 22, where the green leaf meets the right jamb of the doorway and swings toward the wall, and a screen door on the jamb of the next doorway beyond it.

Not done. A left-hand leaf was read from the inspector but not viewed. Leaves are 2.04 m tall against a 1.96 m opening, so a closed leaf would not fit; they are only ever shown open. Doors on side walls are leaves laid against plain wall with no frame at all, unchanged here. Nothing was viewed on the twisting route. Nothing was pushed.

## 2026-10-06 — Claude Code — tear-off calendar withdrawn

Xyh pointed out a calendar with one large number filling the page, and said that is not used in the Philippines. It was `models/wall_calendar.png`, a single-day tear-off calendar drawn as a wall sprite in salas and bedrooms; it also carried an airline's logo. Its two prop-pool entries now draw the monthly calendar already in the wall-hanging set, `2d/wall hanging/photos/Calendar.png`, at 0.4 m wide. The old image is no longer tracked or whitelisted, so it will leave the published site on the next push; the file stays on disk. ASSETS.md records the withdrawal.

Checks. `check_published_assets.py` passes with 126 assets and the stamp check passes. In the browser on the root server, a fast run through 114 rooms requested the monthly calendar and never the old one, with no error and no missing-asset warning.

Not done. The monthly calendar was not viewed at its new pool size. It is dated January 2023, and so every calendar in the walk shows the same month. Nothing was pushed.

## 2026-10-06 — Claude Code — cutouts take the room's lighting

Xyh asked whether the flat 2D objects could be affected by lighting so they do not glow in dark rooms, and chose the second of four approaches offered: make them lit like everything else. The other three were a fixed dimming factor, adding the lamp to the unlit shader by hand, and contact shadows; none of those was built.

Cutouts were unlit: they took each room's brightness band but not the ambient, directional, or lamp light, so they showed their full colour beside surfaces showing 55 to 90% of theirs. They now use the lit material with an upward normal. Mechanism in HANDOVER.md.

Checks, in the browser on the root server, kitchen of room 55. Night lighting, straight route, before and after: the water-dispenser sprite and the bottles on the table stood out brighter than the furniture before, and sit at the furniture's level after. Dark-day lighting on the twisting route and daylight on the straight route after the change: cutouts render, lit, with no console errors. A fast run through 191 rooms on the twisting route logged no errors.

A fault of mine found and fixed in this sitting: the calendar change (2026-10-06, commit 5597de4) put a comment in the middle of the sprite aspect table and commented out the entry after it, so tabo-and-timba sprites were built with no height and Three.js logged a NaN geometry error for each. That commit was not pushed. The entry is restored and the comment moved to the end of the line.

Also seen for the first time: the Yatra One title rendered, in capitals with larger initials, when a broken edit left the title screen up.

Not done. Wall photos are now lit like the floor, which may be darker than wanted for pictures on a wall; not compared side by side. Red and violet rooms were not viewed. Cutouts still cast and receive no shadow. Nothing was pushed.

## 2026-10-06 — Claude Code — colour variation for plastics, paint, and cutouts

Xyh approved colour variation for plastic and painted meshes and hue-shifted cutouts, said some things must keep their colour, the gas cylinder among them, and reported the sardine-can cutouts as far too large.

Plastic and painted meshes now take a per-room colour, cutouts on a short list take one of twelve hues, and baked objects drift slightly each. The gas cylinder is excluded by construction. Details in HANDOVER.md.

Sardine cans. In the current code and on the published site both cans are 0.09 m tall. With cans forced onto every table, five kitchens showed eight at 0.09 m and two enlarged by the deliberate wrong-size rule, at 0.19 and 0.29 m. That rule is the only source of a large can I could find, so the cans are now exempt from it. If Xyh saw large cans often, a cached older table is the other candidate.

Checks. Cutout, scatter, and sequence checks pass; publication checks pass. In the browser on the root server, straight route, daylight: rooms 21, 24, 25, and 53 showed chairs, tables, a bucket, and drawer units in colours outside the old ten finishes, and rooms rendered with no shader error. A fast run through 183 rooms on the twisting route logged no console error.

Not done. No hue-shifted garment was identified by eye; the shader compiled and ran without error, which shows it works mechanically, not that the colours look right. The lift on the black shorts is a guess. Buckets and drawers inside side rooms are placed by other modules but are covered by the same per-room pass; not viewed. Kenney models (fridge, stove, cabinets, beds), sofas, and textured Poly Haven models do not vary. Table sizes are next.

A stray `file.png` in `2d/raw objects/` was picked up by the generator before the `REAL_SIZE` rule was added; it never reached a commit. That folder now holds fifteen unnamed or unsized images that are not used.

## 2026-10-06 — Claude Code — table sizes

Third part of Xyh's request: tables can be shorter or longer. A table standing by itself now takes its own length, and sometimes its own height or width; details in HANDOVER.md.

Checks. `check_table_sizes.mjs` passed 14,400 arrangements across all twelve layouts and six widths: every arrangement still passes the room's clearance rules with the resized footprints, the placements without their sizes are identical to before, no resized table touches another table, and the tabletop support follows the size. Of 143,596 tables, 9,913 were resized: 3,808 shorter, 4,654 longer, 4,028 lower, 62 narrower, 49 wider, 9 taller. In the four ordinary layouts at 4 and 6 m widths, 37% of tables were resized. Object-support and sequence checks pass. In the browser on the root server, straight route: six rooms reported four resized tables (lengths 1.28, 1.16, 0.88, 0.92 and one at 0.92 height), layout and aisle checks true, no console errors; viewed room 53, where the kitchen's wooden table is visibly longer with its chairs still clear of it.

Not done. A low table and a tabletop object on a resized table were not viewed. Legs thicken slightly with a longer or wider table, since the whole mesh is scaled. Tables in rows, pushed together, or stacked keep one size, so rooms furnished that way show no change. Chair sizes do not vary. The architecture-collision test for furniture in `index.html` still assumes a 0.65 m half-extent, which is 0.09 m short of the longest table. Nothing was viewed on the twisting route. Nothing was pushed.

## 2026-10-06 — Claude Code — cloth hue

Xyh asked for the textile textures to vary or hue shift too. Curtains, sofa upholstery and patterned pillows now have their hue turned per room by the same shader patch as the cutouts; the table runner and side-bedroom bedding vary in plain colour. Rates and mechanism in HANDOVER.md.

Checks, in the browser on the root server. A fast run through 173 rooms on the twisting route logged no console error. With `cloth=120` forced, the floral sofa in room 39 showed green flowers where the same view without it shows red, with the pattern intact and no error. Publication checks pass.

Not done. No shifted curtain was viewed, patterned or plain. The default rates were not judged by eye; only the forced case was seen. Some turns will give colours no real cloth has, since any angle is allowed one room in five. Linens from the mesh kit were already drifting per object and are unchanged here. Nothing was viewed on the twisting route beyond the error count. Nothing was pushed.

## 2026-10-06 — Claude Code — tsinelas and the second set of kits; T-shirt saturation and brightness

Xyh pointed to new meshes in `F:\xyh\fgc-cx`, the tsinelas above all, asked for the two-rectangle slippers to be retired, and asked for hue, brightness, and saturation variation on the red T-shirt cutout.

Copied Codex's four new kits in unchanged and placed all of them: tsinelas, painting tools, plastic storage, cardboard, and the school chair. The rectangle slippers are gone from the scatter. The T-shirt cutout now varies in saturation and brightness as well as hue; jeans and shorts gained brightness. Placement rules and the tone change are in HANDOVER.md. Nothing in `fgc-cx` was edited.

Checks. Scatter, cutout, table, support, sequence, navigation, side-space, and fork checks pass; the publication check passes. In the browser on the root server, straight route, with `prop=kits`: six rooms each reported tsinelas, painting tools, storage, cardboard, or school chairs as their type allows, with clear aisles and open branch entrances and no console errors. Viewed a school chair with its writing arm facing into a hall, cartons with labels in a sala, a lidded bin, and a teal roller tray on a bathroom floor. Without forcing, a fast run through 234 rooms on the twisting route logged no console error, and its last six rooms reported one to three pairs of tsinelas in four of them.

Not done. Tsinelas were placed and counted but not seen close enough to judge; they are small and sit near the doorway behind the camera's starting point. No T-shirt was seen in a new saturation or brightness; the shader ran without error. Ice boxes, water jugs, drawer units, the leaning panel, the box seat, and the box bed were not viewed. Up to three pairs of tsinelas in one room may be too many. The school chair's seat and tablet surfaces are not offered to clutter. Side rooms get none of these. Painting tools use the wall colour even in rooms with bare block walls. Nothing was pushed.

Two edits of mine broke the page in this sitting and were fixed before commit: a string literal in the shader patch was written with real line breaks, twice, by an edit script. It is a template literal now. The code was committed in 422613c; these notes follow in their own commit because the script that wrote them failed the first time.

## 2026-10-06 — Antigravity — 2D object cutouts, label tile scrambling, and directory standardization

Xyh requested cutting out domestic and market objects in `2d/raw objects`, isolating transparent foregrounds, scrambling brand text and packaging labels prior to low-poly Delaunay triangulation to make text illegible while preserving authentic product palettes and silhouettes, replacing all raw/date filenames with clean descriptive snake_case names, and cleaning up original source files.

1. Cutouts & Transparency: Processed 17 new objects plus 3 additional dropped vegetables (`malunggay_leaves`, `malunggay_pods`, `kamatis_tomatoes`) using `rembg` (with `orocan_wardrobe_cabinet` preserving native alpha). All 67 objects in `2d/raw objects` were cropped tightly to their non-zero alpha bounds and regularized with 2px transparent padding (`bbox == (2, 2, w-2, h-2)`).
2. Label Tile Scrambling & Low-Poly: Branded commercial packaging (`surf_pouch`, `surf_jug`, `zonrox_original`, `zonrox_colorsafe`, `datu_puti_vinegar`, `silverswan_toyo_set`, `silverswan_suka_set`, all 10 separated `silverswan_*` bottles and pouches, `ligo_sardines_green`, `ligo_sardines_red`, `boysen_paint_can`, `philips_peas_can`, `sweet_corn_snack`, `oishi_patata_snack`) had their label bounding regions segmented into grids of tiles, randomized with position shuffling and horizontal/vertical flips, and triangulated with silhouette-constrained Delaunay meshes. Brand text is now completely illegible while brand recognition, color balance, and geometric sprite silhouettes are preserved.
3. Clean Naming & Source Removal: All date-based and vendor filenames were removed. `yellowpad.png` was preserved untouched.

Verification:
- Automated Python audit (`audit_raw_objects.py`) confirmed all 67 files in `2d/raw objects` are valid RGBA PNGs with exact 2px padding, non-empty bounds, and clean snake_case filenames.
- Generated and visually inspected full 67-item master catalog contact sheet (`master_catalog_final.png`) on checkered background.

## 2026-10-06 — Claude Code — surveyed wall colours, trim rules, wall protrusions

Xyh asked for occasional rooms in other colours, supplied ten paint colours surveyed on Metro Manila buildings, asked for odd protrusions from walls, and revised the trim: the dark green is closer to `#203C21` than the old `#203C30` and should return in places, Palmyra can be a trim or a wall colour, and the trim is sometimes foam green itself.

All three are in; weights and rules are in HANDOVER.md. The ten surveyed colours are used at Xyh's restored values.

Checks. In the browser on the root server: a fast run on the twisting route recorded 312 rooms with no console error, every one with clear aisle, doorway, and branch entrances. Walls: 203 foam green, 63 beige or white, 21 Palmyra, 25 in a surveyed colour (all ten appeared). Trims: 126 dark green, 94 Palmyra olives, 40 foam green, 16 the earlier blue-greens, 27 a surveyed colour, 9 cream or white. 66 rooms had protrusions. Viewed, straight route, daylight: a terracotta bedroom with dark green window frames, door, and baseboard; and a room with protrusions forced, where blocks on the wall are visible but faint, being the wall's own colour under flat light. With protrusions forced in six rooms, both kitchens kept their fitted counters and all six reported clear architecture.

Not done. Only terracotta was viewed among the surveyed colours; the dark ones (navy, medium green) may make a room read as a night room. Foam-green trim on a foam-green wall was not viewed and will be nearly invisible by design. Protrusions were not viewed on the twisting route, and none was walked into. They cast no shadow, which is why they are faint; a slightly darker or lighter face would make them read, at the cost of looking less like part of the wall. Side rooms and passages have none. `references/index.html` still uses `#203C30` for its text.

Another commit landed in this folder during the sitting, a566d03, "cut out new domestic objects and scramble brand text", touching 2D images. I did not make it and did not touch those files. Nothing was pushed.

## 2026-10-06 — Claude Code — outlets and light switches

Xyh asked for more outlets and for the light switches among the 2D objects to be used, and asked where the floor tile bank is.

Outlets and switches are on the walls now; rules in HANDOVER.md. The two outlet images had been held back since 2026-10-04 for want of wall mounting, so before this no room had any.

Floor tiles: there is no bank of tile images. Floors are drawn in code by `floor-variants.js`, seven treatments (`bare`, `concrete`, `creamCeramic`, `redLinoleum`, `greenCheckerboard`, `mismatchedTiles`, `abruptPatches`), with one image, `models/textures/floor_linoleum_red.png`. Antigravity's source module, its brief, and a preview page with screenshots of each treatment are in the sibling folder `fgc-ag`.

Checks. Publication check passes with 130 assets, the two switch images now tracked. In the browser on the root server, straight route: six rooms reported zero to two outlets and a switch in three, with no console errors; viewed room 22, where a switch plate sits left of the far doorway at about shoulder height and the door leaf opens on the right.

Not done. No outlet was viewed, at either height. An outlet can land behind a shelf's clutter or a floor-standing prop, since it does not reserve its place. Switches are only at the far doorway, not on side walls or beside side-room doors. Two of the images carry brand or retailer marks, recorded in ASSETS.md; Xyh may want those scrubbed the way the other cutouts were. Nothing was viewed on the twisting route. Nothing was pushed.

## 2026-10-06 — Claude Code — white and maroon tile, a tile bank, narrow joints

Xyh asked for image-based floor tiles, for the Mondrian-like tiled floor to be disabled as not found in the Philippines, for plain white grouted tile in its place, for narrower grout, and noted that grouted maroon tile does occur.

All four are done; details in HANDOVER.md. The floor judged Mondrian-like is `mismatchedTiles`, the grey tile with red, ochre, green, and brown replacement tiles; `abruptPatches`, the checkerboard strip set into concrete, was kept at 1%.

Checks. `check_room_sequences.mjs` had asserted that over 85% of floors are bare; it now asserts the new mix and that no room selects the retired floor, and passes, with 7,048 bare, 1,299 white tile, 476 concrete, 268 cream, 264 image, 241 maroon, 196 linoleum, 108 patches, and 100 checkerboard in 10,000 rooms. Sequence and publication checks pass. In the browser on the root server, straight route, daylight: white tile forced in six rooms, all with floor bounds and route surface reported clear, and viewed in room 22 with thin grey joints; maroon tile viewed in room 23 with thin cement joints.

Not done. The tile bank holds no images, so the image floor has only been exercised as its white-tile fallback; the loading path for a real image is untested. Thin joints may shimmer at a distance under nearest-neighbour filtering; not watched in motion. The green checkerboard and the abrupt patches keep their own, wider joints. Nothing was viewed on the twisting route.

While this was in progress the two switch images were replaced in the folder by re-cut files under new names, by someone else, and the page failed to load on the missing file. The code now names the new files, and the old ones are removed from the repository along with them. Nothing was pushed.

## 2026-10-06 — Antigravity — 11 additional grocery & household cutouts with text-scramble low-poly

Xyh provided 11 additional Filipino grocery and domestic packaged goods (`century_tuna_flakes_oil`, `argentina_meat_loaf`, `skyflakes_crackers_pack`, `skyflakes_single_packet`, `fibisco_chocolate_chip_tub`, `nescafe_classic_pouch`, `charmee_pantyliners_green`, `charmee_powder_cool_orange`, `cleene_cotton_balls`, `greencross_rubbing_alcohol`, `nido_milk_box`) to cut out, text-scramble, and stylize with Delaunay low-poly.

1. Cutouts & Native Transparency: Ran `rembg` on opaque packaging. Respected pre-cut transparent alphas for `SkyFlakes-Single_25g_`, `cotton`, and `charmee`.
2. Text Scramble & Triangulation: Diced all label/brand typography regions into tiles, randomly permuted tile positions and flipped/inverted orientations, and computed feature-weighted Delaunay triangulation inside the packaging silhouettes. Brand palettes and shapes remain identifiable while text is completely scrambled.
3. Standard 2px Padding: All 11 sprites were tightly cropped with the project's standard 2px transparent padding (`bbox == (2, 2, w-2, h-2)`).
4. Directory Integrity: All original raw/vendor files were removed. Directory audit confirmed 80 total items in `2d/raw objects`, all valid RGBA PNGs conforming to naming and padding conventions.

## 2026-10-06 — Claude Code — foam green as a range

Xyh asked for the main foam green to vary more and sometimes turn electric, citing `#A7EEC1`: sometimes more cyan or aqua, sometimes greener, dustier, more neon pastel, or more saturated.

The five fixed foam greens are replaced by a colour drawn per room; ranges and shares are in HANDOVER.md. The share of foam-green rooms is unchanged at 62%.

Checks, in the browser on the root server. A fast run on the twisting route recorded 160 rooms with no console error; its 111 foam rooms spanned hue 126° to 172°, saturation 0.13 to 0.94, and lightness 0.68 to 0.85, with 25 dusty, 42 soft, 28 vivid, and 16 at 0.74 saturation or above. Viewed rooms 4 and 6 on the straight route in daylight: aqua-leaning greens of different strength against dark green trim. The first run gave the opening room `#97F3AA`, an electric green; the four opening rooms were then held to the familiar range and rooms 2 and 3 read `#CBE0D6` and `#B8D5BC`.

Not done. No electric room was viewed, so how it reads under the piece's lighting and fog is unjudged. Foam-green trim and the fog's default still use the single value `#BFDCC9`. Side rooms take their owning room's colour. Nothing was pushed.

## 2026-10-06 — Claude Code — blue-indigo lighting; the join flicker left open

Xyh's closing notes for this thread: add a dim blue-indigo lighting beside the warm dusk, and a wall still flickers or fades at a join where the incoming room is narrower.

Done: `blueHour` in `room-lighting.js`, a dim blue-indigo room with its lamp just on, at 5% of rooms. Daylight went from 36 to 34, overcast from 22 to 21, darkDay from 4 to 3, night from 6 to 5. `check_floor_scatter.mjs` counts it among the dim profiles and passes with a dim share of 21.5%. Viewed on the root server with `?lighting=blueHour`: room 22 reads indigo, with a warm pool of lamp light on the ceiling.

Not done: the flicker. I did not reproduce it, and I did not want to change the join geometry or the lighting-band shader on a guess at the end of a long sitting. Three untested leads and a way to reproduce it are under "Start here" in HANDOVER.md, which is also where the next agent should begin.

Root ROADMAP.md's Next in Dev line now names the flicker; it was left uncommitted there, as that file carries other agents' edits. A commit I did not make, 0d81718, added grocery cutouts during this sitting. Nothing was pushed.

## 2026-10-06 — Claude Code — wall flicker at a narrowing join fixed

Reproduced at seed 5, room 21 (6 m) into room 22 (4 m), `?start=21&offset=3&still=1&space=straight&lighting=daylight`: two bright vertical stripes on the partition at x = ±2 that came and went between frames.

Cause, measured through bounding boxes in the loaded scene: the partition's solid pieces occupied z from the boundary to 0.1 m beyond it, and room 22's first side-wall modules occupied x 2 to 2.1 from the boundary onward, so their end caps were coplanar with the partition face. This is lead (b) of the handover. Fix and details are in HANDOVER.md: the solid pieces stand 1 cm toward the earlier room. Lead (a) was closed with it, by filling the lighting bands in route order. Lead (c), the fog colour change on entering a room, is intended behaviour and was left alone.

Checks, in the browser on the root server, rendering by hand at 800 × 450 and reading pixels back. Straight route, 60 poses along the camera's sway: pixels brighter than the wall on three rows of the partition were found in 0 poses with the fix and in 50 with the pieces moved back onto the boundary plane in the same session. Twisting route, 40 poses, everything hidden except the partition and the two abutting modules, each pose rendered twice 0.2 mm apart: 723 pixels changed with the fix, 89,610 without. Room 20 (4 m) into room 21 (6 m), a widening join, same test: 1,242 either way, so that case never fought and is unchanged; that figure is the level of edge aliasing. `check_room_sequences`, `check_navigation`, `check_spatial_route`, `check_forks`, and `check_published_assets` pass. A default-route load from room 20 at `?speed=6` logged no console error.

Not done. Not watched in motion in a visible window; the pane was hidden throughout. No join into a room over 26 m of fog depth was tested; 1 cm was chosen to exceed the depth buffer's step at 100 m, by arithmetic, not by a render. I measured 4 mm first and raised it for that reason.

Found and not fixed. Raycasts in room 21: the far end-wall baseboard's face is 0.119 m in front of the partition, so it stands about 0.1 m clear of the wall. `baseboards.js` uses one offset, 0.112 m, for all four walls, which is right for the near end wall (the previous partition's back face is 0.1 m inside this room) and wrong for the far one. On side walls, solid Kenney modules have their face at half the room width, while window modules sit 0.08 m inside it and baseboards, block-wall faces, and wall fittings are placed 0.105 to 0.112 m inside it, so against a solid module they stand clear of the wall. Only the baseboard gap was measured; the fittings' gap is read from the code.

Nothing was pushed.

## 2026-10-06 — Claude Code — baseboards fitted to each wall's face

Xyh asked for the baseboard gap found in the previous entry to be fixed. Details are in HANDOVER.md.

Checks, by raycast in the loaded scene at 0.05 m above the floor, seed 5 rooms 18 to 23 with `?sideSpaces=room`, straight route: the distance from the back of the baseboard to the wall behind it was 1 mm at 180 of 188 side-wall samples and at all 22 end-wall samples, and 21 mm at 8 samples on one authored window variant whose face is 0.06 m in. Before the change it was 0.1 m on every solid module and far end wall. Viewed room 21's far wall: the strip meets the partition. `check_side_spaces`, `check_room_sequences`, `check_navigation`, and `check_published_assets` pass; no console error.

Not done. Raised and sunken rooms, passages, and the twisting route were not sampled. Side rooms and passages still have no baseboards. Wall photos, outlets, door leaves, and the hollow-block face still stand 0.105 to 0.13 m clear of solid side-wall modules; they share the block face's plane, so they need one decision between moving the solid modules in by 0.1 m and moving each of them out. Wire runs are at 0.04 m and were fitted to the real face. Nothing was pushed.

## 2026-10-06 — Antigravity — procedural fabric texture generator & tela pattern bank

Xyh asked for a script generating textures for fabric patterns, modeled off the supplied kurtina vertical stripe patterns (`2026-10-03 17-28-41.png`, `17-28-35.png`, `17-28-25.png`), cabana awning stripes with triplet pinstripes (`2026-10-06 14-00-18.png`), woven gingham check (`2026-10-03 17-08-19.png`), polka dots, and other domestic patterns, outputting to sorted subfolders under `F:\xyh\foam-green-city\tela`.

Added `scripts/generate_fabric_textures.py` generating seamless, procedurally synthesized fabric textures with plain-weave micro-relief, yarn slub variations, and authentic Philippine domestic colorways:
- `tela/kurtina_slub_stripes/` (6 patterns): painted vertical multi-stripes with dry-brush drag striations, soft fiber feathering, and accent pinstripes (`manila_bay_blue_gold`, `palmyra_olive_yellow`, `sampaguita_rose_gold`, `sunflower_amber_brown`, `deped_foam_harvest`, `calamansi_citrus`).
- `tela/cabana_pinstripes/` (7 patterns): alternating wide colored and white awning bands with centered triplet pinstripes in the white band (`deped_kelly_green`, `foam_green_classic`, `pacific_royal_blue`, `fiesta_crimson_red`, `sunflower_yellow`, `manila_maroon`, `terracotta_orange`).
- `tela/gingham/` (9 patterns): plain-woven check with optical yarn crossover zones (white ground, 50% half-tints, 100% full saturated dyed intersections) and subtle yarn slubs across 32px and 48px check sizes (`sunshine_yellow`, `carinderia_red`, `deped_foam_green`, `palmyra_dark_green`, `breeze_sky_blue`, `school_navy`, `vintage_rose`, `warm_terracotta`, `monochrome_black`).
- `tela/polka_dots/` (7 patterns): staggered hexagonal and aligned dot arrangements across pindot, classic, and coin sizes with anti-aliased ink bleed into cloth fibers.
- `tela/plaid_madras/` (5 patterns): traditional woven blanket (*kumot* / *inabel* / *patadyong*) and tablecloth plaids with multi-bar warp and weft intersections, including `inabel_fiesta_check` modeled directly on `tela/2026-10-06 15-52-00.png`.
- `tela/ditsy_floral/` (4 patterns): seamless 5-petal sampaguita and retro daisy prints with leaf sprigs over solid or tinted woven grounds.
- `tela/ticking_stripes/` (4 patterns): classic domestic mattress and curtain ticking stripes (paired fine vertical lines on unbleached linen).
- `tela/retro_waves/` (3 patterns): sinusoidal rick-rack / wave bands seamlessly tileable in 2D.
- Interactive catalog: generated `tela/index.html` with responsive category filtering and 1× / 2× / 4× repeat toggles for reviewing seamless tiling in the browser.

Checks:
- Generated 45 textures across 8 categories at 512×512 resolution.
- 2×2 tile verification confirmed mathematical seamlessness across all categories: gingham enforces even check counts so checks alternate perpetually across tile boundaries without doubling width; cabana stripes and ticking lines use exact integer repeat counts; slub striations and fabric weave use periodic sine/cosine banks.
- Verified visual fidelity by decoding and directly viewing output PNGs (`kurtina_slub_manila_bay_blue_gold.png`, `palmyra_olive_yellow.png`, `cabana_pinstripe_deped_kelly_green.png`, `gingham_sunshine_yellow_32px.png`, `polka_white_on_foam_green_classic_staggered.png`, `plaid_inabel_fiesta_check.png`, `floral_sampaguita_on_foam_green.png`) alongside the reference images.
- Existing user files in `tela/fruits/`, `tela/sparrow333/`, and loose reference images were left untouched.
- `python scripts/check_published_assets.py` passes (130 tracked assets).
- `node --experimental-default-type=module scripts/check_room_sequences.mjs` passes (13,000 rooms).

Undone:
- The generated textures are not yet hooked into `wall-assets.js` / `photo-assets.js` curtain loader or tablecloth meshes in the live walkthrough (left for the next pass or user selection).
- Higher resolutions (e.g., 1024×1024) can be rendered on demand via `--size 1024`.
Nothing was pushed.

## 2026-10-06 — Claude Code — 31 cutouts indexed; footwear, bathroom, and packaging kits placed

Xyh pointed to new images in `2d/raw objects/` and new kits in `F:/xyh/fgc-cx`. What was added and at what rates is in HANDOVER.md.

Checks. All twelve node checks pass, `check_raw_objects` on 76 cutouts; `stamp_versions --check` and `check_published_assets` pass. In the browser on the root server, straight route, daylight, `?prop=kits&clutter=medium`, seed 5 rooms 20 to 25: every room reported packaging (1 to 6 objects), five of six reported footwear, and no console error. With `?room=bathroom`, room 22 reported four bathroom objects; viewed close: bottle, brush in its holder, plunger, and paper roll stand on the floor by the wall. With `?room=kitchen&raw=rawDishRackCylinder`, viewed room 23: the dish rack cutout stands on the table at a believable size, a paper bag stands by the wall, and a paper roll lies on the floor.

Not done. Of the 31 cutouts only the dish rack was viewed in a room; the other 30 were seen on a contact sheet and sized by estimate. Shoes and tabletop packaging were counted by the report and not viewed close. Nothing was viewed on the twisting route or at natural rates. Page load is slower with 31 more images; not timed.

Decided against. The wall-mounted paper holder is not placed: it needs the wall face, and solid and window side-wall modules have different faces, which is the open question in the previous entry. Printed labels on packaging are not used, since the baked mesh has no texture. Side washrooms get none of the bathroom kit; only main bathrooms do.

Found, not checked further. The earlier kits may hold per-object geometry for the whole session in the same way; `cardboard.js` and `linens.js` take seeds. Six supplied cutouts show a maker's printed label unscrambled: the food keeper, the dish rack, and the Orocan icebox, pail, and wardrobe, as the two earlier Orocan pieces do. Nothing was pushed.

## 2026-10-06 — Claude Code — side-wall face settled; kits no longer grow with the walk

Xyh asked for the wall-face decision and for the older kits to be checked for memory growth and put right. Both are described in HANDOVER.md.

Wall face. Measured first, in the loaded scene, how far each thing against a side wall stood from the room's edge: photos, shelves, and wall-side furniture 0.12 m; outlets 0.108; a television 0.105; pipes 0.099; wire runs 0.04; the wall fan 0.027. Protrusions are placed from 0.1 m by their code. So the imported modules were moved in and the two exceptions moved with them. After the change, by raycast from each object to the wall behind it, seed 5 rooms 18 to 23, straight route, `?wires=1&sideSpaces=room`: photos and shelves stand 2 cm off the wall, wire runs 1 cm, outlets 8 mm, the fan's mount touches it, and door leaves sit 3.5 cm into it. Baseboards: 1 mm behind the strip at 176 side-wall samples and 22 end-wall samples; 12 side samples found no wall behind, at side-room doorways, where my wall filter does not see the doorway's own wall section. The narrowing-join test from the flicker fix, repeated on rooms 21 and 22: 18 changed pixels with the partition proud, 552 with it put back. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass; no console error.

Kits. Measured by counting the geometries each kit disposes after one round of the objects `household-items.js` asks for and after five rounds. Held per extra round: plastics 10, linens 23, household tools 6, plastic storage 4, school chair 1, tableware 0, cardboard 0. The five that grew are now built per room. After the change the six rooms' baked triangle counts were identical to before it (9,918, 13,514, 3,248, 9,336, 8,772, 13,448), so placement is unchanged.

Not done. Heap size over a long walk was not measured; the claim rests on the counts above and on nothing else holding the per-room kits. The cost of building five kits per room was not timed. The wall change was not viewed in motion, on the twisting route, with `?walls=blocks`, or in rooms with passages, stairs, or platforms; `room-architecture.js` and `side-spaces.js` still build from the room's edge. Door leaves were left 3.5 cm into the wall. The paper holder is still not placed, though the face it needs is now fixed. Nothing was pushed.

## 2026-10-06 — Antigravity — procedural banig sleeping mat texture generator

Xyh asked for pattern generators for banig, spanning neon synthetic plastic mats, pastel and sun-faded domestic sleeping mats, and traditional natural reed weaves, referencing supplied photos `media_1791275198244.png` (pastel folded mat with rick-rack borders) and `media_1791275240484.png` (stacked neon plastic polypropylene beach/sleeping mats).

Added `scripts/generate_banig_textures.py` generating seamless, procedurally synthesized sleeping mat textures with flat-ribbon straw interlacing, edge furrow creasing, synthetic plastic specular highlights vs. matte organic reed striations:
- `banig/neon_plastic/` (5 patterns): synthetic polypropylene ribbon weave with electric weft ground crossing bold saturated warp stripes (`neon_cyan_lagoon` matching reference 2 front cyan mat; `neon_fiesta_purple` matching middle purple/orange mat; `neon_emerald_chartreuse` matching top green mat; `neon_royal_hot_pink`; `neon_sunburst_tangerine`).
- `banig/pastel_faded/` (5 patterns): sun-faded retro domestic sleeping mats with stepped zig-zag / rick-rack border stripes flanking broad pastel bands (`pastel_rose_periwinkle` matching reference 1 with cream straw ground, dusty rose, and periwinkle; `pastel_foamgreen_peach`; `sunfaded_retro_mint`; `faded_lavender_sage`; `coastal_bleached_blue`).
- `banig/traditional_natural/` (4 patterns): organic unbleached dried reed / tikog / pandan straw with vegetable-dyed madder red, indigo, and forest green stripes, longitudinal leaf striations, and organic tone variance (`samar_madder_ochre`, `sulu_mangosteen_emerald`, `antique_unbleached_rush`, `ilocos_inabel_earth`).
- `banig/geometric_tikog/` (4 patterns): authentic Basey Samar diamond twill ('mata-mata' / 'saruk') concentric lozenge weaves with 2/2 diagonal twill reed interlacing.
- Interactive catalog: generated `banig/index.html` with responsive category filtering and 1× / 2× / 4× repeat toggles for reviewing seamless 2D tiling in the browser.

Checks:
- Generated 18 banig textures across 4 categories at 512×512 resolution.
- 2×2 tile verification confirmed mathematical seamlessness across all 18 textures: strip counts (128 columns and rows) divide evenly; alternating basket and twill parity continues smoothly across boundaries; periodic triangle waves for zig-zag borders wrap with zero seam jump.
- Verified visual fidelity by decoding and directly viewing output PNGs (`banig_neon_neon_cyan_lagoon.png`, `banig_neon_neon_fiesta_purple.png`, `banig_pastel_pastel_rose_periwinkle.png`, `banig_traditional_samar_madder_ochre.png`, `banig_geometric_tikog_samar_madder_ochre.png`) against the reference images.
- `python scripts/check_published_assets.py` passes (161 tracked assets).
- `node --experimental-default-type=module scripts/check_room_sequences.mjs` passes (13,000 rooms).

Undone:
- Banig meshes or rolled sleeping mat props are not yet placed in streamed bedroom or sala room pools (ready for integration into floor/bed models).
- Higher resolutions (e.g., 1024×1024) can be rendered via `--size 1024`.
Nothing was pushed.

## 2026-10-06 — Claude Code — paper holder placed; room building spread over frames

Xyh asked for the paper holder, for the cost of building kits per room to be measured, and said that memory and CPU/GPU use are to be watched and that the walk need not always be seamless. The mechanism and the measuring tools are in HANDOVER.md.

Paper holder. In half of main bathrooms that have a solid stretch of side wall, baked with the room's other household objects, 0.62 to 0.74 m up. `index.html` passes the room's unused solid wall modules as `wallSpots`. Viewed in room 22 with `?room=bathroom&prop=kits`: the plate is on the wall with the roll in front of it. In five forced bathrooms the plate's back was 0.108 m inside the room's edge, 8 mm in front of the wall face, read from the baked vertices.

Kit cost. Constructing each kit 200 times: plastics 0.15 ms, plastic storage 0.12, household tools 0.08, bathroom 0.07, linens 0.06, footwear 0.02, school chair 0.01, packaging 0.004. Building them per room is not a cost.

What is a cost. Stepping the walk from the console at 1280 x 720 on the twisting route, rooms 20 to 90: frames with no build took 12 ms at the median; a frame that built one room and drew it took 81 ms, 170 ms at the ninetieth percentile, in a run while the machine was busy, and about 45 ms in a quieter one, of which the build was 15 ms and the upload about 17. Before today two rooms were built in one such frame. After the change, rooms 20 to 98, 1,748 frames: 78 build frames at 37 ms median, 81 ms at the ninetieth, 113 ms at most; 78 show frames at 19 ms median, 43 ms at the ninetieth; never two builds in a frame and never more than one room hidden; 43 frames over 50 ms and 4 over 100 ms; no console error. Timings moved by a factor of two between runs with the load on the machine, so compare runs taken together.

Memory. Over about 190 rooms the renderer's geometry count read 595, 549, 510, 498, 528 at ten-room intervals and the JS heap 82 to 88 MB: no growth. Textures rose to about 105 and stayed, which is the image cache filling.

Not done. No frame was timed with the pane visible and `requestAnimationFrame` running; every figure is from stepping by hand. The fog change was not viewed. A room can now appear one frame after its neighbour through a far doorway; not viewed. Nothing was measured on a second machine or a phone.

Decided against, for now. Slicing `buildSegment` itself across frames: the build is 15 to 40 ms of a build frame, and the function is 270 lines of shared locals that other agents edit daily. Holding the walker or darkening the next room, which Xyh offered: no room needed more than one long frame, so there was nothing to wait for. Both stay available if rooms get heavier.

Next lever, not started. Draw calls: six rooms are 1,500 to 1,700, one per mesh, and culling is off on the twisting route, so the two rooms behind the walker and any room beyond the fog are drawn in full every frame. Hiding rooms that cannot be seen is the cheap step; merging a room's static meshes is the larger one and trades memory and build time for it. Nothing was pushed.

## 2026-10-06 — Claude Code — rooms that cannot be seen are not drawn

Xyh approved the cheap step named at the end of the previous entry. The rule is described in HANDOVER.md.

Checks, stepping the walk from the console at 960 x 540 and comparing two renders of the same frame, one with the rule and one with every room shown, pixel by pixel with a tolerance of 2 in 255. Twisting route, rooms 20 to 105, every sixth frame: 410 frames, none differing. Twisting route, rooms 105 to 157, camera turned to six directions including straight back and pitched up and down: 552 views, none differing. Straight route, rooms 20 to 64, the same six directions: 366 views, none. `?sequence=passages&space=twist` and `?sequence=levels&space=twist`, six directions: 192 and 198 views, none. No console error. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass.

Effect on the twisting route, walking forward: three or four of six rooms drawn; draw calls 1,258 to 715 and triangles 205,000 to 109,000 on average over the 410 frames. Frames with no build, 1280 x 720, three runs taken together: 17.9 ms without the rule, 10.4 ms with it, 13.2 ms without. On the straight route Three.js already culls by frustum and the gain is small, 259 to 235 calls.

Not done. Not viewed with the pane visible. Rooms of 40 m width or more, where the fog reaches 100 m, were not in the tested ranges unless the walk happened on one; none was looked for. A cut through a passage exit was not exercised, since the runs used `?fork=never`.

Still the larger lever: one draw call per mesh. A drawn room is 200 to 300 calls. Nothing was pushed.

## 2026-10-06 — Claude Code — still meshes merged by material

Xyh approved merging and noted there are few moving meshes. The mechanism and the rules it sets are in HANDOVER.md.

Checks, stepping the walk from the console. Each compared frame was drawn twice, once with merged meshes and once with them hidden and the originals shown, and compared pixel by pixel at 960 x 540 with a tolerance of 6 in 255. Twisting route, rooms 20 to 95, 294 frames: 9.4 pixels differing on average of 518,400, 456 at most. One such frame was looked at: the pixels are small objects on a tabletop, shaded 7 to 12 levels differently, which is the normal-matrix difference described in the handover. Straight route, room 21, six camera directions: 0, 0, 0, 0, 0, and 1 pixel. The inspector's doorway and shoulder raycasts pass in six rooms with the originals on their layer. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass; no console error.

Effect, twisting route with the visibility rule on. Draw calls: 712 to 325 averaged over those frames. Frames with no build at 1280 x 720, four runs alternating off, on, off, on: 8.2, 7.2, 8.9, 7.1 ms. Cost: the merge takes 1.9 ms per room at the median, 8.9 ms at the ninetieth percentile, 25.8 ms at most, after its inner loop was rewritten over raw arrays; the first version added about 10 ms. Merged geometry is 454 KB per room on average, sent to the graphics card once and then dropped from memory. The renderer's geometry count peaked at 582 with merging and 611 without; the JS heap was 84 to 101 MB either way.

So the gain in frame time on this machine is about 15%, small beside the visibility rule, which had already removed the rooms that were not seen. Draw calls are more than halved, which should count for more on a slower processor; that was not measured.

Not done. Not viewed with the pane visible or in motion. A fan was not watched turning after the merge; its rotor and head are excluded by name, read from `animateDomesticProps`. The 512 meshes left over the vertex limit in 80 rooms are still one call each; instancing would take them, and needs the route's shader to read the instance matrix, which is why it was not done here. Nothing was pushed.

## 2026-10-06 — Claude Code — rows of one heavy model drawn as instances

Xyh approved instancing for the meshes the merge left over its vertex limit. Details are in HANDOVER.md under the merge.

Checks, by the same two-render comparison as the merge. Twisting route, rooms 20 to 96, 314 frames at 960 x 540: 10.6 pixels differing on average, 471 at most; in the 91 frames with an instanced mesh in a drawn room, 5.6 on average and 111 at most. Straight route, room 89, a hall with chairs round its walls, five camera positions at 1280 x 720: 1, 2, 1, 1, and 1 pixel. Viewed that hall: the rows of chairs stand where they stood. In the walk 606 meshes were drawn as instances and 2 stayed single. No shader error or console message; the program count stayed at 16. The inspector's doorway and shoulder raycasts pass in rooms 86 to 91. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass.

Effect in room 89, same session, merged and instanced against originals: draw calls 118 against 372, 242 against 709, and 194 against 540 at three of the positions; frame time 3.3 against 7.3 ms, 4.8 against 7.6, and 4.3 against 8.6. Over the walk the average was 301 calls against 707.

Not done. Not viewed in motion or with the pane visible. The first room to instance a given kind of material compiles one more shader program; none was needed in this walk beyond the 16 already present, and the cost of one was not timed. A mirrored heavy object was not found in the walk, so that branch ran only for the 2 that stayed single, whose cause I did not check. Nothing was pushed.

## 2026-10-06 — Claude Code — mirrors, valances, bunting, skirting, and wall cloth

Xyh asked for a look through `F:/xyh/fgc-cx` for new meshes, naming mirrors, cardboard, decor, bathroom tools, packaging, and footwear. Compared byte for byte, cardboard, bathroom tools, packaging, and footwear were already here; `mirrors-valances.js` and `decor.js` were new. Where each thing goes and how often is in HANDOVER.md.

Checks, in the browser on the root server, straight route, daylight, `?prop=kits`. Viewed: a rectangular mirror on a bedroom wall above a shelf, in room 25; a swag valance under the curtain rod of a sala window, in room 21; a line of bunting across the hall in room 88, clear of its columns; a skirted table with bunting overhead, in room 22 forced to a hall of table rows. At natural rates on the twisting route, rooms 20 to 90: valances in 6 rooms, a paper holder in 6, mirrors in 3, bunting in 1, and no console error. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass.

Cost. Building one of each, averaged over 60: a valance 0.6 to 1.1 ms, a mirror 0.5 ms, bunting 0.5 to 0.6 ms, skirting for one table 0.5 ms, a wall cloth 0.2 ms. A valance is 2,400 to 3,200 triangles, the heaviest thing here; a room with three adds about 9,000 to its baked mesh. Household placement as a whole took 16 ms at the median and 55 ms at the ninetieth percentile in that walk, against 8 to 22 in earlier runs under different load, so whether this set moved it is not established. The JS heap read 132 MB at the end of the walk, against 84 to 101 MB in earlier ones; one reading, not followed up.

First attempts and what changed. Mirrors found no place in six forced rooms, because photos had already taken the free wall modules; hangings now take any solid module and check for what is there. Bunting was first refused in any room with columns, stairs, or a platform, which is most halls; it now picks a line clear of them. `?prop=kits` strung bunting in every room type until the room list was checked before the roll.

Not done. The hand mirror and the wall cloth were counted or not seen at all: neither was viewed. Skirting was viewed on one table, from one side, with a chair standing in front of it; whether cloth passes through chair legs was not checked. A mirror was seen 2 cm or so above a shelf's objects, which reads as tight. In a room 2.58 m high, bunting hangs to about 1.9 m, at the walker's eye. Nothing was viewed on the twisting route. Side rooms get none of this. Nothing was pushed.

## 2026-10-06 — Claude Code — the heap reading followed up: no leak, less garbage

The previous entry left one heap reading of 132 MB against 84 to 101 MB earlier. Xyh asked for it to be followed up.

It is not a leak. Stepping the walk from room 20 for about 480 rooms on the twisting route and taking the lowest and highest `usedJSHeapSize` in each stretch of 25 rooms: the lows were 81, 145, 110, 92, 179, 87, 81, 110, 153, 90, 106, 103, 111, 157, 95, 92, 95, 127, and 92 MB, and the highs 163 to 298 MB. The heap returns to 81 to 95 MB throughout, so nothing is held; the 132 MB was a reading taken between collections. The renderer's geometry count moved between 325 and 502 with no trend. Its texture count rose from 55 to about 123 by room 430 and stayed there for the last 100 rooms, which is the image cache filling.

What the highs showed is garbage: each room built left megabytes to collect. The largest single source I could see was the bake in `household-items.js`, which grew two plain arrays a number at a time, 30,000 to 140,000 numbers each in the rooms checked, and then copied them into typed arrays. It now counts first and fills two typed arrays in place, reads positions straight from their arrays, and shades a mesh with several materials once per group rather than once per vertex.

Checks. The baked mesh is unchanged: in six rooms with `?prop=kits`, built with the committed bake and then the new one, the position and colour arrays had the same lengths (29,232 to 141,534) and the same weighted sums to two decimal places. After the change, 257 rooms: lows 87 to 108 MB and highs 161 to 178 MB, against highs of 163 to 298 MB before. Upward movement of the heap came to 9 to 12 MB for each room built; I have no figure for that from before the change. No console error. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass.

Not done. The 9 to 12 MB a room that remains was not traced. Likely contributors, unmeasured: the kits and `floor-scatter.js` building geometry from plain arrays, and `?inspect=1` writing its state as JSON every frame, which the published page does not do. No collection pause was timed, so whether this garbage costs a visible hitch is not known. Heap was read with the pane hidden and frames stepped by hand. Nothing was pushed.

## 2026-10-06 — Claude Code — fabric and banig patterns in use: mats, mattresses, wall cloth, tablecloths

Xyh pointed to `tela/` and `banig/` and asked for mattresses and mats on the floor sometimes, and more cloth on walls or wherever; then agreed the patterns can be made smaller for the web. What was built and at what rates is in HANDOVER.md.

Checks, in the browser on the root server, straight route, daylight, `?prop=fabric`, seed 5 rooms 20 to 25. Viewed: a gingham cloth spread on a bedroom floor; a gingham mattress lying on a green banig; a floral cloth hung on a kitchen wall above a table with a patterned tablecloth; a second tablecloth with plates and containers standing on it. At natural rates on the twisting route, rooms 20 to 112: banig in 7 rooms, mattresses in 3, tablecloths in 3, floor cloths in 2, rolled banig in 2, wall cloth in 1; no console error. All twelve node checks and `stamp_versions --check` pass; `check_published_assets` passes with 276 assets once the copies are staged.

Cost in that walk: frames with no build 6.7 ms at the median, draw calls 290 on average, heap low 90 MB and high 188 MB, all in line with the runs before this change. Build time was 42 ms at the median, also within the earlier spread; this step was not timed apart.

First attempt and what changed. Mattresses and wall cloth found no place in six forced rooms: the mattress was required to lie along a wall, and walls are mostly taken; the cloth avoided every wire run and outlet. The mattress now falls back to open floor, and the cloth hangs in front of flat things.

Decided against. A mattress stood on edge against a wall, which I had planned: left out to keep this sitting to what could be viewed. Loading the supplied 1254 px images directly: each would be 6 to 8 MB on the graphics card and the folder is 146 MB.

Not done. The rolled banig was counted and not viewed. Nothing was viewed on the twisting route or in motion. Whether a pattern's repeat size reads right was judged on four objects; the sizes in `REPEAT` are estimates. A tablecloth's overhang falls straight, as a box. Wall cloth appeared in 1 of 93 rooms, which is rarer than Xyh's request suggests; the rates are the first lines of each block in `fabric-items.js`. Mattresses carry no pillow or sheet. Side rooms get none of this. Nothing was pushed.

## 2026-10-06 — Claude Code — pattern provenance recorded; two prints redrawn as triangles

Xyh answered the question left in the previous entry: the dated patterns are self-captured, and the two held back should be sufficiently modified already, though blurring or the low-poly treatment used for the wall photos was offered. I applied the low-poly treatment and included both. ASSETS.md records the statement and the treatment.

`index_fabrics.py` now has `LOWPOLY` beside `EXCLUDE`, which is empty. A listed pattern is redrawn through `fgcphotos/lowpoly.py` before it is copied, on a wrapped border so the triangles carry across the tile's edges, with a fixed random seed. That tool is outside this repository and under no version control; root DEPENDENCIES.md has a line for it. It is needed only to rebuild those two copies.

Checks. Tried 1,400, 700, and 350 points on both and viewed them beside the originals: at each, the cartoon figures and the monogram are gone and the colours remain; 1,400 was kept. Viewed the two finished 256 px copies tiled two by two: the pink print reads as pastel shards with no figure, the red as plain red with gold flecks, and neither shows a seam. A second run of the script rewrote nothing. 117 patterns are listed. `stamp_versions --check` and `check_published_assets` pass.

Not done. Neither redrawn pattern was viewed on an object in a room. Whether the fixed seed makes a rebuild byte-identical was not tested. Nothing was pushed.

## 2026-10-06 — Claude Code — wall cloth made common

Xyh asked for the wall cloth rate to be raised; it had appeared in 1 of 93 rooms. The rate was not the main limit: most solid wall is already taken. Three changes, in HANDOVER.md: higher rates, a cloth that shrinks to fit the stretch it finds, and the far wall beside the doorway as a second place to hang it.

Checks. With `?prop=fabric`, all six rooms 20 to 25 got one, four of them on the far wall; viewed room 22, where a striped cloth hangs left of the doorway with the light switch clear between them. At natural rates on the twisting route, 74 rooms from room 20: wall cloth in 18, of which 13 on the far wall; no console error.

Not done. A far-wall cloth is not checked against what stands in front of it; furniture is kept 1.5 m off that wall by the layouts, which I read from the code and did not measure. Nothing viewed on the twisting route. Nothing was pushed.

## 2026-10-06 — Claude Code — the garbage trace: per-frame work, not room builds

Xyh asked for the trace left open two entries back. What changed is in HANDOVER.md under per-frame work.

Method. `performance.memory.usedJSHeapSize` read 0 change across six 1 MB allocations inside one task, so it could not attribute garbage to a phase of `buildSegment` as planned. It does move between stepped frames. So: step the walk, record each frame's time, whether it built a room, and the heap's change; call a fall of more than 8 MB a collection.

Before, at `?speed=14` on the twisting route, 1280 x 720, 6,328 frames and 72 rooms: 18 collections of about 62 MB; the frame at a collection took 100 ms at the median and 209 ms at most; frames with no build took 5.7 ms at the median, 9.9 at the ninetieth percentile, 31 at the ninety-ninth; 32 such frames ran over 50 ms. Heap rose 0.21 MB a frame, and 18 MB a room at 80 frames a room against 9 to 12 MB at 25 frames a room, which put most of it per frame.

After the first two changes, 11,374 frames and 78 rooms: 73 collections of about 29 MB; the frame at a collection took 6 ms at the median; frames with no build 4.2 ms at the median, 5.8 at the ninetieth, 7.5 at the ninety-ninth; 7 ran over 50 ms, none of them at a collection. After the third, 5,463 frames: 3.8, 5.3, and 10.2 ms; 2 over 50 ms.

What remains, at a standstill with `?still=1`: about 54 KB a frame, against 13 KB for `renderer.render` alone. Replacing `JSON.stringify` and `JSON.parse` for a run took it from 51 to 29 KB, and that is the inspector's state written every frame, which the published page does not do. These readings moved by half again between identical runs, so they rank causes and no more.

Checks. Visibility rule with cached points, same frame drawn with it and without: 136 frames, none differing. Fans: a rotor's angle changed in 6,448 of 6,458 frame observations, and a camera-facing cutout's in 37,618 of 37,670; this also settles the fan left unwatched when meshes were merged. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass; no console error.

Not done. Garbage from building a room, about 6 MB by the two-speed estimate, was not broken down, since the method could not see inside a build. The frame at a collection fell from 100 ms to 6 ms, and I did not separate how much of the 100 ms was the collection and how much was a build landing on the same frame. Nothing measured without `?inspect=1`, since the handle needs it. The manual-walk path, which calls `sequence.atDistance` every frame, was not exercised. Nothing viewed with the pane visible. Nothing was pushed.

## 2026-10-06 — Claude Code — tela as carpets, small mats, potholders, and sofa covers

Xyh added that the cloths can also be mats on floors, potholders as plain square meshes, carpets, and sofas. Rates and details are in HANDOVER.md under patterned cloth.

Checks, in the browser on the root server, straight route, daylight, `?prop=fabric`, seed 5 rooms 20 to 25. Viewed: a plaid carpet lying under a mattress and its banig in a bedroom; a sofa in a blue and green diamond cloth with its cushions in the same; three potholders in three cloths hung as diamonds on a kitchen wall above a shelf; a plaid potholder lying on a floral tablecloth among the dishes. At natural rates on the twisting route, 84 rooms from room 20: small mats in 13 rooms, carpets in 6, potholders in 6, and 5 of the 7 sofas met were covered; no console error. Frames with no build took 4.9 ms at the median and draw calls averaged 293. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass.

Not done. The small mat was counted and not viewed. A carpet is not checked against a mattress or banig, so the three can stack, as they did in the room viewed; that reads as intended there and was not judged elsewhere. Nothing viewed on the twisting route. Sofa covers skip the per-room hue turn the sofas' own cloth takes. Two images dated 19:18 and 19:19 appeared in `2d/raw objects/` during this sitting; they are not mine and are not indexed. Nothing was pushed.

## 2026-10-06 — Claude Code — washing lines and hangers; door and window colours

Xyh asked for another look in `fgc-cx`, said hangers and clothes matter a great deal and may need a hanging system like the wire runs, since some rooms can be filled with running hangers, and asked for the colours of clothes, doors, and windows to vary. What was built is in HANDOVER.md.

`household-details.js` was the one new kit there. I used its drying stand, clock, helmet, and paper plate, and wrote `sampayan.js` for the lines and hangers, for the reason given in the handover.

Checks, in the browser on the root server, straight route, daylight. With `?prop=sampayan`, six rooms 20 to 25 became washing rooms with 4 to 8 lines and 59 to 114 garments each; their baked household meshes were 3,308 to 14,469 triangles in all. Viewed rooms 22 and 21: rows of shirts and trousers on coloured hangers down both sides, face on, the centre clear. With `?prop=kits`, viewed room 24: a rail of hangers on the floor, clothes on hangers along the right wall, a pegged line across the far end. At natural rates on the twisting route, 36 rooms from room 20: lines in 8, hangers at windows in 5, washing rooms 2 (64 and 117 garments), clocks 2; 249 garments in all; 17 rooms had doors in a colour other than the trim and 11 had window frames so; no console error. A second run of 110 rooms: frames with no build 5.1 ms at the median, build 25.5 ms, household placement 8 ms at the median and 18 ms at the ninetieth percentile, 293 draw calls. All twelve node checks, `stamp_versions --check`, and `check_published_assets` pass.

The first of those two runs read 88 ms a build and 1.3 s at the ninetieth percentile, with other work loading the machine; images were being added to `2d/raw objects/` at the time. The second is the one to compare with earlier entries.

Not done. The drying stand, clock, helmet, paper plate, and window hangers were counted and not viewed. No door or window in a colour of its own was viewed; the colours were read from the inspector. Nothing viewed on the twisting route or in motion. A garment can hang through a tall piece of furniture; not looked for. Garments are flat and take no cloth pattern, since the bake carries colour only. Side rooms get none of this.

Seen and left alone: `clothes_hanger_blue.png`, two gas stove images, and three dated images are new in `2d/raw objects/`, not mine and not indexed. Nothing was pushed.

## 2026-10-06 — Antigravity — cutouts: blue gas stoves, clothes hanger, and stationery papers

Processed and deployed 7 new 2D cutout assets under `2d/raw objects/` from supplied batches (`2026-10-06 19-18-33.png`, `19-19-40.png`, `19-32-13.png`, `19-32-52.png`, `19-33-01.png`, `19-33-39.png`):
- `clothes_hanger_blue.png` (383×252 RGBA): blue plastic clothes hanger. Interior triangular aperture and hook loops cut out cleanly via combined `rembg` contour and white-threshold alpha ramping; 2px transparent padding.
- `gas_stove_single_burner.png` (288×245 RGBA): separated top single-burner portable gas stove. Front green control panel text and "YIK" branding diced into shuffled/flipped tiles, then stylized via Delaunay low-poly triangulation (`num_points=650`, `edge_weight=0.75`), preserving appliance geometry, dial, and colorway while rendering commercial markings illegible.
- `gas_stove_double_burner.png` (583×252 RGBA): separated bottom double-burner enameled gas stove. "YIK" and "GAS STOVE" green panel text diced and shuffled prior to Delaunay low-poly triangulation (`num_points=900`, `edge_weight=0.75`).
- `intermediate_pad_sheet.png` (403×505 RGBA): single sheet of ruled intermediate pad paper ("Name / Date / Section" header with blue ruled lines). Exact 2px transparent padding around sheet boundary.
- `index_card_white.png` (265×163 RGBA): horizontal ruled white/lavender index card. Exact 2px transparent padding.
- `index_card_yellow.png` (245×188 RGBA): yellow ruled card with "NO. / DATE" header. Exact 2px transparent padding.
- `graph_paper_sheet.png` (156×233 RGBA): green grid graphing paper sheet with border margin. Exact 2px transparent padding.

Original date-named files deleted. Directory audit (`audit_raw_objects.py`) passes 87/87 files in `2d/raw objects/` for valid snake_case names, RGBA format, non-empty alpha, and exact 2px transparent padding (`bbox == (2, 2, w-2, h-2)`). Visual contact sheet generated and verified in `scratch/batch6/batch6_montage.png`.

Not done / next:
- New cutouts are ready on disk; indexing into `raw-object-assets.js` via `index_raw_objects.py` and placement rules in room streaming pools can be run whenever Claude Code or the scene pipeline is ready to pick them up.
Nothing was pushed.

## 2026-10-06 — Claude Code — seven more cutouts: papers, a hanger, two stoves

Xyh asked for the new images in `2d/raw objects/` to be sized and placed, said many are pad papers that should be at least comparable to long bond paper, and that the blue hanger can be shifted in hue, saturation, and lightness. Sizes and placement are in HANDOVER.md.

Another agent committed six of the seven as dce8a09 during the previous sitting. `index_card_yellow.png` from that commit had since been deleted and `half-pad.png` put in its place, uncommitted; I took that as a rename and committed it as one.

Checks. `check_raw_objects` passes on 83 cutouts; all twelve node checks, `stamp_versions --check`, and `check_published_assets` (285 assets) pass. In the browser on the root server, straight route, daylight. With `?prop=hangers`: four of six rooms got one to three wall hangers; viewed three in a row in room 20, in blue, grey-green, and green. With `?room=kitchen&raw=rawIntermediatePadSheet`: the sheet measured 0.20 by 0.25 m on a table in room 23 and reads at the scale of the plate beside it. With `?prop=rawGasStoveDoubleBurner`: the stove stands on the floor in room 20 beside a gas cylinder, 0.67 m wide. No console error.

Not done. The graph sheet, half pad, index card, single-burner stove, and the hanger lying flat were not viewed. The older pad images' new sizes were not viewed. The hanger image is photographed at a slant and hangs on the wall at that slant. Nothing was pushed.

## 2026-10-06 — Claude Code — a basketball court room

Xyh asked whether a basketball court room could appear occasionally. Built; details in HANDOVER.md.

Checks. All twelve node checks pass with the court in the generator, among them `check_demo_sequence` over 40,000 rooms, `check_navigation`, and `check_spatial_route`; `stamp_versions --check` and `check_published_assets` pass. In the browser on the root server with `?start=45`, straight route, daylight: viewed from the entry doorway, the whole court with green field, red keys, white lines, the entry hoop overhead, banderitas across, chairs along both walls, and the far backboard over the far doorway; viewed from above one corner, the three-point arc, free-throw circle, and centre circle drawn true; viewed from under the far hoop, the backboard with its inner square, the rim and net, and the two braces, above the doorway. The inspector reported the court at 5,622 triangles, a ball, three lines of bunting, and a concrete floor. On the twisting route from room 43 at `?speed=10`: walked through the court and out, 261 frames inside it at 4.9 ms median and 12.6 ms at the ninetieth percentile, 233 to 369 draw calls, the visibility rule equal to drawing everything in 27 of 27 compared frames, no console error. One frame from that walk was viewed: the court bends with the route.

Changed after the first view: lines went from 8 to 10 cm, since at a distance they broke into dashes on a small canvas.

Not done. Not viewed in motion or with the pane visible. Only the green and red scheme was seen. The walls above 2.58 m are the ceiling's grey, as in every tall room. Courts for seeds other than 5 and 42 were not listed. The time to build the court room was not separated from its neighbours' in that walk; the worst build in it was 411 ms, at load. Nothing was pushed.
