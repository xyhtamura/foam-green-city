# Foam Green City v0.5

An autonomous browser-based 3D walkthrough of a procedurally arranged Filipino domestic interior. Foam-green walls, small family photos, modest furniture, and household objects recur along a slow, curving and twisting route. The core reference is a modernish lower-middle-income household; occasional larger or unusual rooms interrupt it.

## Try the demo

Serve this folder over HTTP, then open `index.html`. It is a static site with no build step. It requires WebGL and an internet connection to load Three.js r160 from unpkg.

```sh
python -m http.server 8141 --bind 127.0.0.1
```

Open [the local demo](http://127.0.0.1:8141/). Movement starts automatically. Use **WASD**, **Take control**, or click the scene to walk manually. Click the scene for mouse-look; dragging also works when mouse capture is unavailable. **Space** returns to the forward route and resumes automatic movement. **Pause** stops movement, **Restart** returns to the beginning, and **Fullscreen** fills the display. Reduced-motion preferences start playback paused. There is no sound, navigation objective, or win state.

## Procedural arrangement

Selected rafters and chopping boards use the supplied wood texture. Domestic rooms can also contain wood wall sections, short dividers, and loose boards. Preview with `?wood=all`, or force additional `walls`, `divider`, or `planks`; `wood=off` disables the added wood details while existing wooden objects retain their texture.

Most dead-end stairs use thin wooden treads with open risers and two sloping side supports. Occasional solid stairs remain. Use `stairs=wood` or `stairs=solid` to force the style in rooms containing stairs. These features are not climbable.

The default seed is `5`. Append `?seed=42` to choose another reproducible room sequence. The sequence is generated from integer hashes rather than independent random decisions each frame.

Each block contains six to eight rooms. Its last room is an exception, so consecutive exceptions are six to eight rooms apart. Domestic rooms are generally four to eight metres wide and six to twelve metres long. Most floors are bare. The opening establishes a sala, kitchen, bathroom, and bedroom before the first exception.

Most exceptions change proportions, ceiling height, furniture arrangement, or add a side passage or dead-end stairs. About one in eight exception blocks can instead produce a vast space: distant walls across an 80-metre-wide room, a broad low ceiling, a column field, a deep hall, a larger auditorium, or a narrow room with a 36-metre ceiling. The first two exception blocks stay modest; the first vast exception has distant walls. These are scale and orientation changes; true non-Euclidean reconnections are not implemented.

The camera remains locally upright as the route twists. The stream retains three batches of two rooms: previous, current, and next. Passing a batch boundary discards the distant batch and builds another. Going backward rebuilds discarded rooms deterministically; another seeded sequence extends behind the initial room. Furniture reserves the walking aisle, room ends, and architecture. Daylight, shade, and night profiles vary between rooms; tube lights and bare bulbs can be lit or unlit. Automatic movement follows the main route; manual movement can enter side rooms through open doors or plain openings, as well as short hallways and the larger side corridors. Returning to automatic movement finds a path back to the main route.

## Development page and previews

`development.html` preserves the preceding index entry point and its six-room evaluation route. It shares the JavaScript modules and assets with the demo; it is not a frozen copy of the entire project.

The continued local version adds occasional wall-mounted flat-screen TVs and short PVC pipe runs. Preview with `?start=3&tv=noSignalBlue&still=1` or `?start=2&pipes=stack&still=1`. `tv=0` and `pipes=0` disable them. Pipes currently use clear wall sections in rectangular, level-floor rooms with 2.58-metre ceilings.

Abstract household shapes collect on tables, furniture tops, framed-photo shelves, and floor edges. Stains and scuffs keep bare floors untiled. Occasional rooms expose timber rafters and corrugated metal roofing; `?roof=yero` forces that variation. Small static cockroach silhouettes sometimes appear near walls.

For inspection, `?start=7&offset=1&still=1&inspect=1` selects a room without forward movement. The inspection data is in hidden DOM reports. `?route=twist|reverse|unwind|sway|mixed` selects the spatial profile. `?fixture=bulb|tube` and `?lighting=daylight|overcast|shaded|darkDay|night` force visual variants. Separate `props-preview.html` and `windows-preview.html` pages inspect models and windows.

## Publish on GitHub Pages

Push this repository's `main` branch to your GitHub repository. In **Settings → Pages**, choose **Deploy from a branch**, select **main**, and use **/(root)**. All runtime asset paths are relative to this repository. The `.nojekyll` file keeps publication static. See [GitHub's publishing-source instructions](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

The local v0.5 demo is prepared for sampling. No remote repository, push, public Release, or DOI is created by this preparation. Release tags and publication remain separate actions.

## Checks and limits

```sh
node scripts/check_room_sequences.mjs
node scripts/check_spatial_route.mjs
node scripts/check_wire_runs.mjs
node scripts/check_raw_objects.mjs
node scripts/check_demo_sequence.mjs
node scripts/check_pipes.mjs
node scripts/check_navigation.mjs
```

Browser inspection checks placement and renders. The clearance reports use logical geometry and do not independently ray-test the GPU deformation. Lighting has no cast shadows; mirrors do not reflect. Upright object cutouts have no volume. Sustained performance and memory measurements across devices remain unfinished.

Manual walking uses floor regions, doorway limits, and furniture bounds with a small body radius. It follows floor elevation but does not climb decorative stairs or raised seating platforms. Mouse capture remains browser-dependent; drag-to-look is available. Descriptor distance prefixes remain cached while streamed GPU geometry is discarded.

See [CONCEPT.md](CONCEPT.md) for the concept, [NOTES.md](NOTES.md) for dated implementation and verification, and [ASSETS.md](ASSETS.md) for provenance.

## Licences

Project code and documentation: [MIT](LICENSE). Project artwork: [CC BY 4.0](LICENSE-ARTWORK.md). Third-party models and dependencies retain the licences in [THIRD_PARTY.md](THIRD_PARTY.md).


For side-space inspection, use `?sideSpaces=room` or `?sideSpaces=hallway`; `?sideSpaces=off` disables domestic side spaces while retaining unusual branch/cross rooms. Add `&sideStart=1&inspect=1&still=1` to begin inside a side room. Doors in this pass stand open and do not toggle. Some annexes are bedrooms with a single bed or daybed, bedding, plastic drawers, clothes, and a small family photo. Others contain storage shelves, cartons, floor stacks, drawers, and a bucket. Washrooms have a toilet, basin, small mirror, towel, nozzle shower with thin blue piping, low faucet, and bucket. Add `&sideRoom=bedroom`, `storage`, or `washroom` to force furnishings, or `&sideRoom=bare` for a shallow ledge.
