# Foam Green City v0.5

An autonomous browser-based 3D walkthrough of a procedurally arranged Filipino domestic interior. Foam-green walls, small family photos, modest furniture, and household objects recur along a slow, curving and twisting route. The core reference is a modernish lower-middle-income household; occasional larger or unusual rooms interrupt it.

## Try the demo

Serve this folder over HTTP, then open `index.html`. It is a static site with no build step. It requires WebGL and an internet connection to load Three.js r160 from unpkg.

```sh
python -m http.server 8141 --bind 127.0.0.1
```

Open [the local demo](http://127.0.0.1:8141/). Use **Pause** or the space bar to stop movement, **Restart** to return to the beginning, and **Fullscreen** to fill the display. Reduced-motion preferences start playback paused. There is no sound, navigation objective, or win state.

## Procedural arrangement

The default seed is `5`. Append `?seed=42` to choose another reproducible room sequence. The sequence is generated from integer hashes rather than independent random decisions each frame.

Each block contains six to eight rooms. Its last room is an exception, so consecutive exceptions are six to eight rooms apart. Domestic rooms are generally four to eight metres wide and six to twelve metres long. Most floors are bare. The opening establishes a sala, kitchen, bathroom, and bedroom before the first exception.

Most exceptions change proportions, ceiling height, furniture arrangement, or add a side passage or dead-end stairs. About one in eight exception blocks can instead produce a 24-metre ceiling, a 48-metre-wide enclosed space with an outdoor-like scale, or an auditorium. The first two exception blocks stay modest. These are scale and orientation changes; true non-Euclidean reconnections are not implemented.

The camera remains locally upright as the route twists. A bounded stream retains up to six room groups around it. Furniture reserves the walking aisle, room ends, and architecture. Daylight, shade, and night profiles vary between rooms; tube lights and bare bulbs can be lit or unlit. The camera passes through main doorways and does not enter side corridors.

## Development page and previews

`development.html` preserves the preceding index entry point and its six-room evaluation route. It shares the JavaScript modules and assets with the demo; it is not a frozen copy of the entire project.

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
```

Browser inspection checks placement and renders. The clearance reports use logical geometry and do not independently ray-test the GPU deformation. Lighting has no cast shadows; mirrors do not reflect. Upright object cutouts have no volume. Sustained performance and memory measurements across devices remain unfinished.

See [CONCEPT.md](CONCEPT.md) for the concept, [NOTES.md](NOTES.md) for dated implementation and verification, and [ASSETS.md](ASSETS.md) for provenance.

## Licences

Project code and documentation: [MIT](LICENSE). Project artwork: [CC BY 4.0](LICENSE-ARTWORK.md). Third-party models and dependencies retain the licences in [THIRD_PARTY.md](THIRD_PARTY.md).
