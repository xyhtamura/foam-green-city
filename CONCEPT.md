# Foam Green City

Concept and description reference. Updated 2026-10-04.

*Foam Green City* (FGC) is a browser-based 3D artwork: an autonomous, procedurally arranged walkthrough of an apparently endless Filipino domestic interior. A slow camera passes through foam-green rooms containing familiar furniture, household objects, and small photographs. The route curves, rises, and twists, carrying the camera and the rooms through changing orientations.

This document can be shared on its own with a writer or an online chat AI. It describes the work's intended experience and distinguishes the implemented prototype from proposed directions. Development details belong in [NOTES.md](NOTES.md); asset sources and licences belong in [ASSETS.md](ASSETS.md).

## A short description

*Foam Green City* is an autonomous browser-based 3D walkthrough of a procedurally arranged Filipino domestic interior. Foam-green walls, jalousie windows, plastic chairs, household objects, and small family photographs recur along a slow, curving route. Floors, furnishings, and the camera share a local upright as the passage twists through changing orientations. The work seeks an eerie familiarity: recognizable rooms whose spatial relationships become difficult to reconcile.

## Domestic familiarity

The core reference is a modernish lower-middle-income Filipino household, following Xyh's household references. Modest tables, freestanding appliances, plastic storage, monobloc chairs, and ordinary working objects should establish this baseline. Fitted counters appear occasionally. This is an artistic reference, not a claim that one interior represents all households in that income range.

Very large rooms, rows of chairs, institutional or public spaces, and temporary shifts toward a middle-to-high-income household are permitted departures. Their contrast depends on first establishing the domestic baseline; adding more exceptional spaces is secondary to refining that core.

The rooms draw their character from ordinary domestic details: monobloc chairs, curtains, jalousie windows, buckets, plastic drawers, brooms, an LPG cylinder, kitchen objects, and worn furniture. These objects provide recognizable uses and scales. Small family photographs belong among those details rather than becoming large wall posters.

The intended atmosphere is liminal and eerie, with rooms suggesting habitation while the camera encounters no inhabitants. Repetition and slow movement allow small discrepancies to become noticeable. The work has no enemy, task, destination, or win state; its installation form allows it to run unattended.

Most spaces should retain domestic proportions. The v0.5 direction places an unusual room every six to eight rooms, with much rarer very large or extremely tall spaces. Some enclosed rooms can have walls far enough away to suggest an outdoor scale. Bare gray floors are an important part of the visual language; patterned floors should be occasional.

## The title and color

Foam green is the repeating color that connects the rooms. The early project notes associate the palette with Philippine public-school paint schemes and propose a narrative in which surplus institutional paint spreads into homes, fences, and small stores. This is a recorded conceptual premise, not a verified account of paint procurement or neighborhood history. Descriptions should preserve that distinction.

The artwork uses green walls as a deliberate stylization. It is not presented as a faithful reconstruction of a particular school, house, barangay, or official building specification.

## Spatial logic

The spatial twist should be fundamental to the journey. Nearby floors and objects establish an upright that the camera follows smoothly. Further along the passage, that upright changes. A room can appear tilted ahead and become locally upright as the camera enters it. The camera can pass through a global upside-down orientation while remaining aligned with its immediate surroundings.

The guiding design question is whether a journey can feel impossible while each nearby arrangement remains convincing. Familiar rooms give the viewer something stable to recognize as their relationships become uncertain. Curvature, elevation, and twisting develop gradually; frequent sharp maze turns and unrelated architectural spectacles would weaken that continuity.

Windows revealing differently oriented rooms, returns through unexpected surfaces, and connections that cannot be reconciled into one building are possible extensions. They are proposals, not implemented features. The prototype bends and twists an ordinary 3D route; it does not implement four-dimensional space or mathematically non-Euclidean topology.

## Image and movement

Low rendering resolution, nearest-filtered textures, restrained lighting, fog, and the mixture of photographic cutouts with 3D models are intentional. Their visible differences are part of the work's construction rather than something to eliminate through photorealism. Atmosphere is carried by the imagery, movement, repetition, and space.

The project began with the Windows 3D Maze screensaver as a reference for autonomous movement. Development discussions also invoked the Backrooms, Escherian architecture, and *Manifold Garden*. These locate the questions being explored; the project does not claim to reproduce those works or to have invented curved or impossible architecture.

## Implemented state on 2026-10-05

The v0.5 demo uses seeded blocks of six to eight rooms along a curved route with vertical undulation and a varying twist rate. Each block ends with an exception. Domestic lengths vary from six to twelve metres, mixing compact rooms with longer ones. Rare exceptions include an 80-metre-wide enclosed expanse, broad low ceilings, column fields, deep halls, larger auditoriums, and narrow rooms with 36-metre ceilings. Their walls can feel distant enough to suggest an outdoor space. The preceding six-room evaluation entry point remains in development.html.

The rooms include assembled kitchen work areas, a kitchen corner in a sala, and a smaller bathroom with a wall-mounted shower nozzle, toilet, sink, mirror, and bucket. Lighting varies between daylight, overcast, shaded daytime, dark daytime, and night. Daytime rooms have brighter patches toward one side; simple ceiling tubes and bare LED bulbs light the night rooms and remain off in daytime rooms. Other profiles offer a steady half-turn, reverse twisting, twisting that unwinds, and a swaying passage. The camera shares each profile's local frame and uses a fixed field of view.

The straight-route generator remains available. It includes variable room proportions, occasional unusual rooms, rare halls, raised and sunken floors, dead-end stairs, and side passages. Automatic movement stays on the main route. In the continued local version, WASD and mouse-look allow manual exploration, including side passages and backward travel; Space restores automatic movement. Three batches of two rooms surround the viewer, rebuilding discarded rooms from seeds when revisited. A separate seeded sequence extends behind the initial room. Fourteen converted Poly Haven models supplement the existing Kenney models, authored props, and photographic assets.

Folding foam sofas appear in salas with several fabric and pillow combinations. Short wire runs use transparent 2D strips attached to solid wall sections: straight strips connect at their mid-height and sagging strips connect at their top corners. Both share the room's spatial deformation.

Small wall photographs include eight additional coarse family portraits. Supplied object images appear as upright cutouts for pitchers, cookware, plastic drawers, and coolers, while writing pads lie flat on tables. These join the 3D objects without requiring every household detail to become a mesh.

Distant-room views, connected storeys, non-Euclidean reconnections, and pipes remain unfinished or deferred. Wiring has a first static texture implementation; dangling cables and animated wires are not implemented. Sustained performance evaluation across devices is also unfinished. The v0.5 demo implements the domestic-first exception rhythm, while development.html retains the earlier evaluation entry point.

The continued local version adds domestic accumulation: small framed photos and abstract containers, bundles, and stacks on shelves and other surfaces, plus occasional floor clutter. Bare floors show wear without becoming tiled. Some rooms expose timber rafters and corrugated metal roofing. Small, static cockroach silhouettes sometimes appear along the walls.

## Using this reference

Draw descriptions from the artwork's form, domestic details, color, and changing local upright. Keep intended effects separate from claims about viewers' actual responses. Treat the dated implementation section as the limit on present-tense feature claims. Further interpretation is welcome, but should be identified as interpretation rather than attributed to the artist as an established position.
