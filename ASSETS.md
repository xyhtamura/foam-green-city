# Foam Green City — Asset Provenance

Visual and 3D assets used in the installation, with source and licence records.

## Supplied wood texture — 2026-10-05

`models/textures/wood.png` was supplied by Xyh for rafters, boards, dividers, and wall sections. It is covered by the user's supplied-image clearance and the project's CC BY 4.0 artwork licence. The runtime shares one texture with mipmap filtering; no external texture was added.

## v0.5 publication clearance — 2026-10-04

Xyh confirmed that all supplied images are owned or cleared for public redistribution, and selected MIT for code and CC BY 4.0 for project artwork. This covers the supplied photos, curtain patterns, raw object cutouts, wire textures, and prototype sprites included in the demo. The confirmation supersedes earlier publication holds in this development ledger; it records the publisher's assertion rather than an independent rights audit. Kenney and Poly Haven models retain CC0, and Three.js retains MIT. See [LICENSE-ARTWORK.md](LICENSE-ARTWORK.md) and [THIRD_PARTY.md](THIRD_PARTY.md).

---

## 3D Models

### Authored domestic props — 2026-10-03

- **Source**: Codex-authored procedural meshes in `domestic-props.js`, made for this project. No third-party images or model geometry.
- **Files**: `models/domestic/wallFan.glb`, `deskFan.glb`, `riceCooker.glb`, and `foodCover.glb`.
- **Use**: Project-authored assets; no additional third-party asset licence applies. No separate public licence was assigned.
- **Coordinates**: Metres, Y up, front facing +Z. Fans retain named `fan-head` and `fan-rotor` nodes. GLBs contain a neutral pose; the runtime supplies animation.
- **Rebuild**: Open `props-preview.html`, select an asset, click **Download GLB**, then follow the **Save** link. Put the export in `models/domestic/`. **Preview saved GLB** loads an existing file for a visual comparison.
- **Runtime**: Streamed rooms use the procedural prototypes directly. Kitchen tables can carry a rice cooker or food cover. Furniture and finish variants share cached geometry and materials, which survive segment culling.
- **Checked**: Rendered all four procedural props, exported each with Three.js `GLTFExporter`, and loaded and viewed each saved file with `GLTFLoader` on 2026-10-03.

### Kenney Furniture & Architecture Kit
- **Path**: `models/GLTF format/*.glb` (140 models)
- **Author**: Kenney ([kenney.nl](https://kenney.nl))
- **Licence**: **CC0 1.0 Universal** (Public Domain dedication)
- **Usage**: Architecture modular tiles (`wall`, `wallDoorway`, `wallHalf`) and furniture
  prototypes (`ceilingFan`, `loungeSofa`, `televisionVintage`, `kitchenFridge`, `kitchenStove`,
  `bedSingle`, `radio`, `pottedPlant`).
- **Checked**: 2026-08-04
- **Window use added 2026-10-03**: `wallWindow.glb` and `wallWindowSlide.glb` are included in the same kit and supply normal and sliding window tiles alongside jalousies.

### Authored chair and runner — 2026-10-03

- **Source**: Procedural meshes in `domestic-props.js`, authored by Codex for the project. No third-party imagery or model geometry.
- **Models**: `monoblocChair`, a cream plastic armchair with a rounded seat, slotted back, and splayed legs; `scallopedRunner`, a cream fabric runner with scalloped sides, eyelet holes, and draped ends sized for the 85 cm table.
- **Use**: Project-authored geometry; no additional third-party asset licence applies. No separate public licence was assigned.
- **Runtime**: Chairs replace the old monobloc sprite in sala and kitchen pools. Runners sit on sala and kitchen tables. Both models appear in `props-preview.html`.
- **Checked**: Inspected both procedural meshes in the browser on 2026-10-03. GLB export produced a Save link, but browser download attempts did not leave a file; no standalone GLBs or GLB reload verification are recorded for these two models.

### Authored tables and finish palette — 2026-10-03

- **Source**: `domestic-props.js`, authored by Codex for this project without third-party geometry or textures.
- **Models**: `monoblocTable`, with a rounded molded top and tapered legs; `woodTable`, with a rectangular top, straight legs, and apron.
- **Finishes**: Cream, beige, red, green, foam green, blue, yellow, and pink plastic colors; light and dark wood colors. These are color approximations with the same Lambert shading, not physical material simulations or wood-grain textures.
- **Use**: Project-authored geometry and palette; no additional third-party asset licence applies. No separate public licence was assigned. No standalone table GLBs have been saved.
- **Runtime**: `createFurnitureVariants()` shares geometry across chair and table clones and caches one material per finish. Sala and kitchen rooms each receive two tables with two chairs per table. Bedrooms and bare rooms receive an extra chair. Room seeds choose the colors, table types, and whether chairs match the table.
- **Preview**: `props-preview.html` has a furniture finish selector for the chair and both table models.
- **Checked**: Viewed a red monobloc table, foam green chair, and dark wood table in the preview; viewed pink tables and mixed-color chairs in a kitchen corridor. Browser logs reported no warnings or errors on 2026-10-03.

### Authored curtained windows — 2026-10-03

- **Source**: Procedural geometry in `jalousie.js`, authored by Codex for the project. No downloaded fabric texture or third-party geometry.
- **Variants**: Cream and dusty rose gathered curtains with ties; pale green café curtains across the lower window. Each style has five spawn openings: 0%, 25%, 50%, 75%, and 100%. Rods, brackets, folds, and hems are meshes attached to the jalousie wall tile.
- **Use**: Project-authored geometry; no additional third-party asset licence applies. No separate public licence was assigned.
- **Preview**: `windows-preview.html` shows all three variants with orbit controls and a continuous openness slider. `curtains.openness` and `setCurtainOpenness()` accept 0–1. Only change an unshared preview or prototype; streamed clones share its geometry. These variants run directly from the module; separate GLB exports have not been made.
- **Checked**: Inspected all three variants in the browser and viewed café curtains on the streamed corridor's left wall on 2026-10-03.

---

## 2D Billboard & Wall Sprites

Flat cutout sprites rendered with `MeshBasicMaterial`, `alphaTest: 0.5`, and `NearestFilter`
for the deliberate crunchy lo-fi aesthetic.

### Legacy Prototype Sprites
- **Path**: `models/bamboochair.png`, `models/curtain.png`, `models/monoblocchair.png`, `models/plant.png`, `models/uratex sofa.png`
- **Source**: Early project prototype captures / web cutouts.
- **Licence**: Unrecorded / unverified. Flagged in `NOTES.md` as prototype WIP assets.

### 2026-09-13 Philippine Domestic Flat Assets (Batch 1)
- **Source**: Route C — generated specifically for *Foam Green City* via image synthesis,
  isolated from studio backgrounds with custom threshold alpha cutouts via Python/Pillow,
  cropped to bounds, and color-profiled for the installation.
- **Licence**: Authored for the project / Dedicated to project use.
- **Files**:
  - `models/kutsarat_tinidor.png` (422×894) — Traditional giant carved wooden spoon and fork wall decor.
  - `models/stand_fan.png` (508×962) — Classic Philippine retro electric stand fan with bright teal plastic blades.
  - `models/wall_calendar.png` (510×797) — Chinese-Filipino commercial tear-off daily wall calendar with red/gold top. Withdrawn 2026-10-06: Xyh pointed out that single-day tear-off calendars are not what Philippine households hang. It also carries an airline's logo. The file is no longer used or published; the monthly `2d/wall hanging/photos/Calendar.png` takes its place.
  - `models/tabo_timba.png` (689×754) — Pastel blue plastic *timba* (pail) with *tabo* (water dipper).
  - `models/water_dispenser.png` (348×944) — Compact home water dispenser with inverted 5-gallon translucent blue jug.

---

## Textures

### Supplied wall photos and curtain patterns — 2026-10-03

Source: files supplied by Xyh in `2d/wall hanging/` for this integration. Original photographers, pattern authors, and redistribution licences were not provided or independently verified. This records the supplied files without assigning them an authored or open licence. Checked on 2026-10-03 by decoding all 19 images and inspecting a contact sheet.

Wall images are used directly as rectangular planes. Under `2d/wall hanging/photos/`:

| File | Use |
| --- | --- |
| `band_agadiers_coarse_420.png` | Group photo |
| `Calendar.png` | Calendar |
| `family_gathering_coarse_800.png` | Family gathering |
| `family_lowpoly_coarse_1200.png` | Family photo |
| `family_portrait_studio_coarse_850.png` | Studio portrait |
| `medals.png` | Framed medals |
| `wedding_portrait_coarse_750.png` | Wedding portrait |

Curtain images repeat 2 × 3 times across each panel, without cropping or seam correction. Under `2d/wall hanging/kurtina/`:

| File | Use |
| --- | --- |
| `2026-10-03 17-07-29.png` | Green sunflower pattern |
| `2026-10-03 17-07-38.png` | Blue sunflower pattern |
| `2026-10-03 17-07-58.png` | Green checks |
| `2026-10-03 17-08-12.png` | Blue checks |
| `2026-10-03 17-08-19.png` | Yellow checks |
| `2026-10-03 17-09-45.png` | Leaf pattern |
| `2026-10-03 17-27-53.png` | Green stars |
| `2026-10-03 17-28-04.png` | Mixed stripes and animal pattern |
| `2026-10-03 17-28-25.png` | Pink multicolor stripes |
| `2026-10-03 17-28-35.png` | Green multicolor stripes |
| `2026-10-03 17-28-41.png` | Blue multicolor stripes |
| `2026-10-03 17-28-47.png` | Orange multicolor stripes |

`wall-assets.js` indexes paths and aspect ratios. Regenerate it with `python scripts/index_wall_assets.py` after adding files. The script scans only `photos/` and `kurtina/`, excluding the copied `models/` subtree. `--contact-sheet wall-assets-preview.jpg` also creates an inspection sheet. Originals remain unchanged.

### 2026-09-13 Surface Maps (Batch 1)
- **Source**: Route C — synthesized seamless tiling textures authored for the project.
- **Licence**: Authored for the project / Dedicated to project use.
- **Files**:
  - `models/textures/floor_linoleum_red.png` (1024×1024) — Vintage Philippine red & cream checkered linoleum floor mat.
  - `models/textures/wall_foamgreen_plaster.png` (1024×1024) — Seamless concrete wall texture painted in DepEd mint foam green (`#BFDCC9`).


### Authored utility props — 2026-10-03

- **Source**: Codex-authored procedural geometry in `utility-props.js`, returned by `createDomesticProps()` in `domestic-props.js`. No third-party models, textures, or brand artwork.
- **Models**: Blue and pink hollow buckets with raised handles; a blue Gasul-style LPG cylinder with foot ring, valve, and protective collar; four-drawer plastic storage; walis tambo with a bamboo handle and grass fan; walis tingting with bundled palm-midrib geometry. These are stylized approximations, not dimensionally certified product models.
- **Use**: Project-authored geometry; no additional third-party asset licence applies. No separate public licence was assigned.
- **Runtime**: Metres, Y up. Streamed clones share geometry and materials. Broom rods are merged into one mesh per bundle. Utility placements use actual rotated bounds; existing shared prototypes survive room culling.
- **Preview**: All six variants appear in `props-preview.html`. Saved-GLB preview is disabled for these assets because no standalone files have been saved.
- **Checked**: Inspected all six rendered variants in the browser on 2026-10-03. Checked actual room-space bounding boxes for wall containment, central aisle clearance, and overlap against tagged floor props, furniture, sprites, and other utility objects. No GLB round-trip verification was performed.


### Integrated room assets — 2026-10-04

The additional laptop, books, lamps, kitchen appliances, bookcase, cabinets, drawer units, and mats come from the existing Kenney Furniture Kit under its recorded CC0 licence. No new third-party download was added. `doors.js` contains Codex-authored procedural door geometry. `floor-variants.js` contains Antigravity-authored procedural surfaces and uses the existing project linoleum texture; `furniture-layouts.js` contains Claude-authored placement data. No additional third-party asset licence applies to these authored modules.


### Authored room architecture — 2026-10-04

`room-architecture.js` contains Codex-authored procedural geometry for columns, stages, corridor branches, upper walls, stair flights, and landings. The `bare` floor is an untextured gray material matching the original project floor. No third-party models, textures, or fonts were added. Architecture geometry and materials belong to each streamed room and are disposed when it leaves the stream. Inspection PNGs are screenshots of the project and are not loaded by the walkthrough.

### Poly Haven household models — 2026-10-04

Eight user-supplied Blender files from `../3d/models/` were converted into browser assets in `models/polyhaven/`. The original files and 4K textures remain unchanged. Each source page below identifies the asset as CC0; these pages were checked on 2026-10-04.

| Model | Creator | Source |
| --- | --- | --- |
| Enamel pot | Kuutti Siitonen | [pot_enamel_01](https://polyhaven.com/a/pot_enamel_01) |
| Wooden spoon | Ronnie Barter | [wooden_spoon](https://polyhaven.com/a/wooden_spoon) |
| Plastic crate | PierreB3D | [plastic_crate_01](https://polyhaven.com/a/plastic_crate_01) |
| Worn bookshelf | Ulan Cabanilla | [wooden_bookshelf_worn](https://polyhaven.com/a/wooden_bookshelf_worn) |
| Vintage daybed | Aron Łyczek | [vintage_day_bed](https://polyhaven.com/a/vintage_day_bed) |
| Monobloc chair | Kuutti Siitonen | [plastic_monobloc_chair_01](https://polyhaven.com/a/plastic_monobloc_chair_01) |
| Apple | Oliver Harries | [food_apple_01](https://polyhaven.com/a/food_apple_01) |
| Throw pillows | Serhii Khromov | [throw_pillows_01](https://polyhaven.com/a/throw_pillows_01) |

`scripts/prepare_polyhaven.py` decimates each asset to at most 3,000 exported triangles, resizes diffuse textures to 512 pixels, and embeds JPEGs in GLBs. Normal, roughness, and metallic maps are omitted. `model-assets.js` uses Lambert materials and nearest texture filtering, normalizes the base to Y=0, and shares resources between room clones. `manifest.json` records source SHA-256 hashes, dimensions, exported triangle counts, and file sizes. All eight saved GLBs were loaded and visually inspected through `props-preview.html`.

### Additional Poly Haven models — 2026-10-04

Six more models from `../3d/models/` use the same conversion and runtime pipeline. Their official source pages identify them as CC0, checked on 2026-10-04.

| Model | Creator | Source |
| --- | --- | --- |
| Bananas | Alexander Shulha | [bananas](https://polyhaven.com/a/bananas) |
| Ginger | Oliver Harries | [food_ginger_01](https://polyhaven.com/a/food_ginger_01) |
| Sweet potato | Jan Martens | [sweet_potato](https://polyhaven.com/a/sweet_potato) |
| Notepads | Ulan Cabanilla | [office_notepads](https://polyhaven.com/a/office_notepads) |
| Plastic storage crate | Fabi_G | [plastic_crate_02](https://polyhaven.com/a/plastic_crate_02) |
| Worn metal rack | Luca B | [worn_metal_rack](https://polyhaven.com/a/worn_metal_rack) |

All six saved GLBs were viewed through the browser model preview. The 3,000-triangle export budget and 512-pixel diffuse limit remain in force. Ginger is reduced to 30% of its source scale; ginger and sweet potato are rotated to lie flat. Bananas and notepads retain the source's grouped arrangements, fitted to the tabletop footprint. The fourteen GLBs total about 2.28 MB. The manifest retains prior records when another batch is exported. Original source files remain unchanged.

### Assembled rooms and ceiling lights — 2026-10-04

Kitchen sinks, bathroom sinks and mirrors, showers, toilets, and square pendant fixtures come from the existing Kenney Furniture Kit under its recorded CC0 licence. The kitchen sets also use previously recorded Poly Haven cookware and produce. No new third-party assets were downloaded. `room-sets.js` contains Codex-authored arrangement code and simple tube-light housings and luminous panels. Authored light geometry and its materials belong to each streamed room; model clones retain shared prototype resources. `bathroom-preview.png` and `kitchen-set-preview.png` are inspection screenshots, not runtime textures.

## 2026-10-04 — authored shower nozzle and tube fixtures

The shower head and arm are authored primitive geometry in `room-sets.js`, as are the simple tube fixtures. They introduce no third-party assets. The Kenney shower enclosure, ceiling pendant, and toaster are no longer loaded or placed; their existing files and provenance records are retained.

## 2026-10-04 — folding sofas and supplied wire textures

- **Sofa source**: `../fgc-ag/uratex-sofa.js`, authored for FGC by Antigravity on 2026-10-04, according to that staging folder's HANDOFF.md. Copied unchanged to `uratex-sofa.js`. Meshes and fabric patterns are procedural; no third-party bitmap is imported. No separate public licence was assigned.
- **Wiring source**: Xyh supplied `../fgc-ag/wiring/wiresag.png` and `wireline.png`, copied unchanged to `2d/wiring/`. Both are transparent RGBA images, 768 × 257 and 768 × 259 respectively. Original authorship and redistribution licences have not been independently established. This integration is local; no publication was requested.
- **Placement code**: `wire-runs.js` is Codex-authored for this project. The strips follow Xyh's anchor specification. `wideline.png` was not present and is treated as a reference to `wireline.png`.

## 2026-10-04 — coarse family photos and raw household cutouts

Copied `familyphoto_01_coarse.png` through `familyphoto_08_coarse.png` unchanged from `../fgcphotos/` into `2d/wall hanging/photos/`. The source folder's README describes their originals as ChatGPT-generated family images and the coarse versions as triangulated low-resolution PNGs. This is the supplied provenance record, not independent licence verification. Original source files remain unchanged. All eight are indexed in wall-assets.js alongside the previous seven wall hangings.

Eleven files supplied by Xyh in `2d/raw objects/` are integrated unchanged. The full filename, placement size, image aspect ratio, and room eligibility for each is recorded in raw-object-assets.js. They depict two pitchers, a plastic drawer unit, a cooler, three covered pots, a frying pan, an intermediate pad, a pad cover, and a yellow pad. Original image authors and redistribution licences were not supplied or independently verified. No publication was requested. The raw-object contact sheet is an inspection artifact, not a replacement asset.

## 2026-10-04 — authored bare LED bulbs

The ceiling socket, tapered body, and diffuser are Codex-authored primitive geometry in room-sets.js. They use plain material colours and require no third-party mesh or image. Lit/unlit states come from the room lighting profile. The tube geometry remains available.

## Authored TV and modular pipes — 2026-10-04

`led-tv.js` is copied from Antigravity's authored procedural TV in `../fgc-ag/led-tv.js`. The integrated presets are off/standby, no signal, and colour bars; screens are drawn on canvas without external images. The source's other presets and tabletop mounts remain available in the module but are not selected by the walkthrough.

`pipe-runs.js` and `pipe-parts.js` are copied from Claude Code's authored procedural PVC kit in `../fgc-c/`. Meshes use shared unit geometries and solid materials, without downloaded textures. The integration uses blue water pipes and orange/grey drainage stacks. Project code uses MIT; authored visual assets remain within the project artwork licence. These copies are local snapshots, with no runtime dependency on either sibling folder.

## Abstract household clutter, wear, and exposed roofs — 2026-10-04

Codex-authored geometry and canvas marks in domestic-details.js, made for this project. Boxes, low-sided cylinders, and rounded shapes suggest containers, small bottles, bundles, and paper stacks. Shelves and photo-frame surrounds, corrugated roofing, timber rafters, and tiny cockroach silhouettes use authored meshes. Floor and wall wear is drawn on canvas. Framed photos reuse the already-cleared WALL_HANGINGS pool. No external images, models, or fonts were added. Code uses the project MIT licence; authored artwork uses CC BY 4.0.

## Tabletop stove, metal sink, and clutter skins — 2026-10-05

Codex-authored primitive geometry in room-sets.js creates the two-burner tabletop stove, supporting stand, open sink basin, faucet and drain. The user supplied a product photograph as a shape reference; the photograph, logo and brand are not included. Existing cleared pot models are reused. domestic-details.js adds authored lidded boxes with label panels and colour variations for fruit-like objects and wrapped sweets. No third-party mesh, texture or font was added. Code uses MIT; authored artwork uses CC BY 4.0.

## Renamed and expanded supplied cutouts — 2026-10-05

The user supplied and renamed the PNGs in 2d/raw objects. They remain covered by the user's confirmation that supplied images are theirs or cleared for redistribution, under the project's CC BY 4.0 artwork terms. raw-object-assets.js uses 45 files; the two electrical wall cutouts are stored but not selected. scripts/index_raw_objects.py records filenames and reads their original dimensions without editing the images. utility-props.js uses authored geometry revised from the user's broom reference; the reference photograph is not shipped.

## Hollow-block texture — 2026-10-05

models/textures/hollow-blocks.png is supplied by Xyh and covered by the standing confirmation that supplied images are theirs or cleared for redistribution. It is shipped unchanged under the project artwork terms and used on occasional solid wall sections. No reference image from an external site was fetched.

## Outlet and switch cutouts in use — 2026-10-06

`2d/raw objects/wall_outlet_duplex_white.png`, `receptacle_box_surface.png`, `wall_switch_single_white.png`, and `wall_switch_3gang_white.png` (re-cut on 2026-10-06 from `lightswitch.webp` and `lightswitch2.png`, which were removed) are supplied product images, now drawn on walls. Two carry marks that have not been removed: the duplex outlet shows a manufacturer's name on its plate, and the surface box shows a retailer's watermark and a maker's emblem. At the size they are drawn, 7 to 12 cm, neither is legible, but the published files contain them.

## Tools, storage, cardboard, and school chair — 2026-10-06

`household-tools.js`, `plastic-storage.js`, `cardboard.js`, and `school-chair.js` are procedural meshes authored for this project by Codex in `F:\xyh\fgc-cx` and copied here unchanged. Product photographs supplied by Xyh served as shape references only; no image, label, or brand is included. Code is MIT and the geometry is CC BY 4.0 under the project's artwork licence.

## Basketball — 2026-10-05

`basketball.js` is a procedural mesh authored for this project. It uses no model, image, or logo. Code is MIT and the geometry is CC BY 4.0 under the project's artwork licence.

## Tableware, plastics, and linens — 2026-10-05

`tableware.js`, `plastics.js`, and `linens.js` are procedural meshes authored for this project by Codex in `F:\xyh\fgc-cx` and copied here unchanged. They use no models, images, or fonts. Code is MIT and the geometry is CC BY 4.0 under the project's artwork licence.

## Household tools and generic bottles — 2026-10-05

Codex-authored geometry in domestic-details.js creates hollow pitchers, chopping boards, knives, folded clothing-like shapes, paper/file stacks, string mops and generic bottles. Caps and label bands use solid colours; no packaging image or new third-party model is included. The denser cutout groups reuse the already-cleared supplied PNGs. Code uses MIT; authored artwork uses CC BY 4.0.

## Yatra One title font and bundled Three.js — 2026-10-06

`fonts/YatraOne-Regular.ttf` and `fonts/YatraOne-OFL.txt` were downloaded from the [official Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/yatraone). Yatra One is under the SIL Open Font License 1.1, which permits bundling and web embedding. It replaces Permanent Marker for the title; the Permanent Marker file and its licence were removed from `fonts/`. The file is the full font, 276 KB, with its Devanagari glyphs; it was not subset.

`vendor/three/` holds Three.js r160 as published on npm, downloaded from `unpkg.com/three@0.160.0`: `build/three.module.js`, the add-ons `GLTFLoader`, `BufferGeometryUtils`, `OrbitControls`, `GLTFExporter`, and `TextureUtils`, and the MIT `LICENSE`. The files are unmodified. Every page's import map points to them, so nothing is fetched from another site at run time.

## Permanent Marker title font — 2026-10-05

Superseded on 2026-10-06; see the section above. Kept as history.


PermanentMarker-Regular.ttf and its Apache 2.0 licence are stored in fonts/. Both were downloaded from the [official Google Fonts repository](https://github.com/google/fonts/tree/main/apache/permanentmarker). The title uses the bundled font without a runtime Google Fonts request. HousePaint was considered first; its web embedding permission was not established, and Xyh authorized a Google Fonts alternative. HousePaint remains unused and excluded from Git.

## More cutouts and a third set of mesh kits — 2026-10-06

Thirty-one further PNGs in `2d/raw objects/` are in use, 76 in all; `raw-object-assets.js` lists each file. They are supplied by Xyh and covered by the confirmation above that supplied images are owned or cleared for redistribution, under the project's CC BY 4.0 artwork terms. Most branded packaging among them had its lettering scrambled before use; the food keeper, dish rack, and Orocan icebox, pail, and wardrobe show a maker's label as photographed.

`footwear.js`, `bathroom-tools.js`, and `packaging.js` are procedural meshes authored for this project by Codex in `F:/xyh/fgc-cx` and copied here unchanged. They use no models, images, or fonts. Code is MIT and the geometry is CC BY 4.0 under the project's artwork terms.
