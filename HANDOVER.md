# Codex handover

[CONCEPT.md](CONCEPT.md) describes the artwork and its intended experience for writers and readers outside the development process. Use it when preparing descriptions; this handover records implementation state.

2026-10-03 — Codex

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
