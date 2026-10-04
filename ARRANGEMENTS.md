# Object arrangements

This document records the implemented surface arrangements and planned extensions for Foam Green City. Tables, authored wall shelves, and selected cabinet tops use shared fitting rules. Upright monobloc chair seats also support small items. Open shelf interiors, room-level density, and unexplained arrangements remain planned.

The reference remains a modernish lower-middle-income Filipino household. Ordinary uses and recognizable object sizes should establish that baseline. Variation comes from which objects collect together, what supports them, and how much of a room stays empty.

## Existing starting point

`domestic-details.js` creates seeded clusters on tables, selected furniture tops, wall shelves, and floor edges. Its pool includes generic bottles, pitchers, boards and knives, paper stacks, folded clothing-like shapes, containers, and supplied cutouts. Tables, authored shelves, selected closed cabinets, and fridge tops use the bounds and reservations in `object-supports.js`. Each accepted item fits a free area and has measured contact with its support. Floor clusters and mops retain their room-bound, overlap, and doorway checks.

As of 2026-10-05, the walkthrough selects wall or tabletop mounting for flat-screen TVs. Tabletop placement uses the existing feet or pedestal from `led-tv.js` and the support bounds and reservations in `object-supports.js`. It fits a 32-inch TV on an upright monobloc or wooden table, rejects occupied or obstructed placements, and falls back to wall mounting when possible. Later clutter can occupy the remaining space beside the TV. Upright monobloc chair seats support compact clothing, paperwork, bags, and boxes. Supports within open racks remain planned.

## Implemented presets

`domestic-details.js` assembles four groups: food preparation (board, knife, ingredient-like shapes, and a bottle), paperwork (files, overlapping sheets, a supplied pad or envelope, and a small box), clothing (folded blocks beside a supplied flat garment), and storage (two lidded boxes with a bottle). A group reserves its whole footprint, including its internal gaps. Groups that cannot fit are rejected rather than split apart.

Selection is seeded and weighted by room use. Kitchen tables favor food preparation; bedrooms favor clothing and storage. Shelves and cabinet tops receive compact versions. Tables attempt two groups and one or two individual items, with limits of six tables, four cabinet tops, and two wall shelves per room. Floor clutter keeps its preceding placement rules.

Use `?arrangement=food`, `paperwork`, `clothing`, or `storage` to force a preset for inspection. The room inspector reports accepted preset IDs, footprints, measured contact gaps, and rejection reasons. These presets reuse authored primitive geometry and supplied images; they add no external assets.

## Chair seats

Upright, unstacked monobloc chairs standing on the floor can hold one clothing or paperwork group, an authored bag, or a small lidded box. The usable area stays inside the rounded seat edge, arm supports, and backrest. Seat height and obstruction bounds are preserved before the rendering mesh is merged. Items use shared footprint reservations and check the chair parts and nearby furniture.

A seeded 32% selection keeps most seats empty, with a maximum of three attempted occupied chairs per room. Stacked chairs, inverted chairs, chairs stored on tables, and imported chairs without support metadata are excluded. `?seats=mixed` forces attempts up to the cap; `clothing`, `paperwork`, `bag`, and `box` force a type. `?seats=off` disables seat objects. The inspector reports seat contact, bounds, and clearance from chair parts.

## Arrangement catalogue

| Situation | Possible objects and relationships | Variation |
| --- | --- | --- |
| Preparing food | A chopping board, knife, ingredients, condiment bottles, and a nearby pot | A few ingredients gathered at one edge; the knife laid diagonally; one bottle separated from the group |
| Drinking | A pitcher and cups on a table or shelf | One cup left out; mismatched cup colors; the pitcher offset from the center |
| Paperwork | Envelopes, pads, folders, loose sheets, and a small box | Unequal stack heights; an open folder; sheets partly overlapping within the support surface |
| Clothes left behind | A shirt over a chair, shorts on a seat, folded clothes on a shelf, or a small floor pile | One garment isolated; a tidy stack beside a loose pile; sleeves hanging over an edge |
| Storage | Shoeboxes, bags, bottles, nested cookware, or containers under a table | Uneven but supported stacks; a partly open box; mixed sizes and colors |
| Cleaning | A mop or broom near a bucket and cleaning bottles | A wall lean; bottles beside the bucket; the group tucked into a corner |
| Watching television | A flat-screen on a small table, cabinet, or shelf with chairs nearby | Tabletop feet or a pedestal; the set offset on its support; one chair turned away |
| Objects displaced | A chair holding a bag or appliance; a cupboard separated from the wall; a box used as a stand | Plausible temporary placement with clear walking space |
| Local accumulation | One crowded tabletop, shelf, wall edge, or corner | A dense group beside a nearly empty surface; repeated small objects with uneven spacing |
| Unexplained arrangement | Identical bottles in a row, chairs facing a blank wall, or one small object in a vast room | More exact spacing than domestic clutter; a deliberately isolated object; a shared orientation |

These are scene relationships, not fixed object lists. A missing cup or a different bottle should still leave a recognizable arrangement. Literal meshes and abstract forms can occupy the same roles.

## Supports and poses

The proposed system would describe each support by its local position, orientation, usable area, height, and occupied regions. Floors, tabletops, shelves, seats, cabinet tops, and wall mounting positions need different placement rules.

Objects would declare their allowed poses and contact area. Bottles and pitchers stand upright; pads and clothes can lie flat; framed photos can stand or hang; mops can lean; televisions need feet, a pedestal, or a wall bracket. Draped clothes need their own geometry or a suitable cutout pose rather than rotating an upright image arbitrarily.

After selecting an arrangement, the generator would fit the group to a compatible support. It would reserve the accepted area before placing another group. Stacks need supported contact between layers, and nested cookware needs compatible shapes. Reject or simplify a group when it cannot fit; floating objects and intersections should not be ordinary placement outcomes.

All positions would remain relative to the room or support so arrangements follow the existing curved and twisting route. A culled room must rebuild the same group when revisited.

## Variation within a group

Each object family would have its own size range. Ordinary variants could begin around 90–110% of their nominal size, subject to fitting on the support. Larger scale changes belong to occasional unusual arrangements. Keep bottle necks, TV feet, and chair seats coherent when changing proportions.

Use small position offsets and yaw changes for domestic clutter. Pitch and roll need a supported pose such as leaning, resting on a side, or draping. Repeated objects can share a color family with a few mismatches rather than selecting every color independently.

Vary the colors of plain mesh materials, caps, labels, fabrics, and box panels. Preserve the supplied photographic packaging and family-photo colors by default. Abstract rectangles can vary width, depth, thickness, and layer count to suggest files, trays, packages, books, or folded material.

## Density and exceptions

Choose density for the room before placing individual objects. Begin with a provisional mix of 60% ordinary rooms, 25% rooms with one concentrated mess, 10% sparse rooms, and 5% crowded rooms. These are tuning values to judge in a walkthrough, not measured household frequencies.

Within each room, select a few occupied surfaces and leave others clear. A crowded corner should not force every tabletop to be crowded. Keep doorway approaches, the automatic route, and manual walking space available. Institutional halls need their own density limits so rows of tables do not multiply clutter without a bound.

Unexplained arrangements should be occasional deviations from this pattern. Most objects still have a convincing support; an unusual room can change the relationship between a few objects without changing every object at once.

## Implementation order

1. Extend support descriptions to open shelf interiors. Preserve seeded color, size, and orientation choices per object family. Tabletop TVs, shared surface fitting, four surface presets, and upright monobloc seat supports are implemented.
2. Add room-level density choices and occasional unexplained arrangements. Judge their frequency in a sustained domestic walkthrough.

Manual navigation, hallway access, and streaming performance evaluation remain pending after this arrangement pass. Cross-room plumbing, exterior scenes, and connected storeys remain separate proposals.

## Acceptance checks

For the first implementation, inspect a tabletop TV, a paperwork group, a clothing group, a crowded corner, and a sparse room in the running page. Check support contact, bounds, object overlap, camera clearance, and appearance along the twisting route. Revisit a discarded room in both directions and compare its arrangement choices.

Measure draw calls and resource counts across repeated room-cull cycles with dense groups. Share primitive geometries and materials where practical, cap group counts, and release room-owned resources when their room is discarded. Record rejected placements and accepted arrangement IDs in the room inspector so an apparently empty support has an observable explanation.

The initial pass is complete when a TV can use a valid tabletop support and existing clutter can use the same support rules, with deterministic reconstruction and a rendered contact check. Later catalogue entries can then be added incrementally.
