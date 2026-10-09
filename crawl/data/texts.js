// Authorial inspection texts for foam-green-crawl.
// Texts keyed by entity id across all layers (surfaces, objects, items, wall things, overheads).
// Supports template substitution:
//   [room]  -> room type name (e.g. sala, kusina, covered court, walkway)
//   [light] -> lighting profile (e.g. daylight, dawn, dusk, night, overcast)
//   [level] -> level descriptor (e.g. ground level, second level, level 2)
// Aligned with SPEC.md section 7 and Cornice whisper architecture.

export const TEXTS = {
  // --- Surfaces: Floors, Walls, Openings ---
  bare_cement: [
    'Smooth troweled cement floor, cool underfoot in the heat of [light].',
    'Porous grey slab with hairline drying cracks mapped across the surface.',
    'Bare concrete substrate on [level]. A few fine grains of swept dust gather near the wall base.',
    'Mineral floor holding the ambient temperature of the [room].',
  ],
  white_tile: [
    'Glazed ceramic floor tiles with grey cement grout. Wiped clean of water marks.',
    'Square ceramic finish reflecting diffuse [light] in the [room].',
    'Cool glazed floor underfoot. One corner tile has a shallow diagonal hairline fracture.',
    'Washed tile surface on [level], slick when wet.',
  ],
  linoleum: [
    'Sheet vinyl printed in a red-and-white checker pattern, worn through to the backing along the doorway threshold.',
    'Smooth synthetic floor finish softening the strike of footsteps across the [room].',
    'Linoleum rolled over concrete on [level], curling slightly along the baseboard seam.',
    'Waxy red surface dulling the [light] into a soft matte reflection.',
  ],
  foam_green_floor: [
    'Floor painted in the characteristic DepEd foam-green enamel, scuffed by chinelas along the main aisle.',
    'The signature hue of municipal classrooms and quiet interior salas on [level].',
    'Gloss green paint on cement, reflecting the calm [light] of the [room].',
    'Coated floorboards holding the muted green stillness that defines this sector.',
  ],
  airwell: [
    'A vertical opening straight down through the structure. Open air and rising heat.',
    'Unroofed void shaft bringing vertical ventilation and natural sky into the core of [level].',
    'An open shaft cutting between rooms. Looking down reveals concrete ledges and distant shadows.',
    'Vertical courtyard drop exposed to the [light] above and the depths below.',
  ],
  foam_green_wall: [
    'Interior wall coated in foam-green semi-gloss paint. Retains a clean, institutional calm.',
    'Painted concrete hollow block dividing the [room] under [light].',
    'Smooth pastel wall on [level]. Faint rectangular marks show where calendars once hung.',
    'The standard municipal green, quiet and non-committal.',
  ],
  yellow_wall: [
    'Warm yellow interior paint, catching the morning [light].',
    'Sun-warmed wall surface in the [room], dry to the touch.',
    'Soft yellow enamel brightening the shadow on [level].',
  ],
  concrete_wall: [
    'Unplastered concrete hollow blocks with rough mortar joints visible.',
    'Heavy mineral masonry shielding the [room] from the outside heat.',
    'Rough grey cinderblock wall on [level], cool and porous.',
  ],
  beige_wall: [
    'Soft neutral beige paint finish, calm and unadorned.',
    'Muted domestic wall finish absorbing the ambient glare on [level].',
    'Warm beige partition dividing the quiet interior of the [room].',
  ],
  offwhite_wall: [
    'Chalky off-white wall finish, bright and reflective in [light].',
    'Painted surface showing faint thumb marks near switch height on [level].',
    'Flat white paint brightening the perimeter of the [room].',
  ],
  doorway: [
    'An open interior threshold joining adjacent rooms.',
    'Clear passage between spaces. A gentle draft moves freely through.',
    'Unobstructed opening on [level], framing the transition into the next space.',
    'The lintel overhead is unadorned. Footsteps pass through without friction.',
  ],
  dark_doorway: [
    'An unlit threshold leading beyond the mapped floor. The draft smells of distant rain on another level.',
    'No frame and no light on the other side. Passing through cuts directly to an unfamiliar run of rooms.',
    'A doorway opening into pitch shadow. Stepping across breaks the continuity of the grid.',
    'A silent corridor exit on [level]. Whatever lies past does not share a wall with this room.',
    'A cold threshold in the [room]. The lintel is painted foam green, but nothing inside reflects [light].',
  ],
  jalousie: [
    'Louvred glass slats in an aluminum frame, cranked open to catch the evening cross-breeze.',
    'Adjustable glass louvres filtering the [light] outside.',
    'Horizontal glass panes tilted forty-five degrees, rattling faintly in the wind on [level].',
    'Frosted green glass slats diffusing the glare from the perimeter.',
  ],
  stair_up: [
    'Concrete steps ascending to the floor above. A welded pipe handrail runs along the side.',
    'Flight of stairs rising towards the next level from the [room].',
    'Solid poured concrete risers leading upward through the ceiling opening.',
  ],
  stair_down: [
    'Concrete steps descending into cooler air below.',
    'Flight of stairs leading downward from [level].',
    'Solid poured concrete treads leading to the level underneath.',
  ],
  court_floor: [
    'Hard painted gym floor marked for five-on-five play.',
    'Smooth playing surface under the high steel canopy of the covered court.',
    'Green and white court enamel worn down to the bare concrete near the free-throw line.',
    'The wide expanse of the playing court on [level], quiet under [light].',
  ],
  court_key: [
    'Rust-red painted free-throw lane, scuffed with rubber sneaker streaks.',
    'The painted key in front of the basket, clear and unobstructed under [light].',
    'High-traffic paint markings defining the three-second restricted area.',
  ],
  court_line: [
    'Crisp white boundary stripe painted directly onto the court floor.',
    'Five-centimeter boundary line separating in-bounds play from the spectator walkway.',
    'Painted perimeter demarcation cutting across the green surface of the court.',
  ],
  yero_floor: [
    'Interlocking corrugated iron sheets forming an elevated catwalk over the void.',
    'Galvanized metal walkway that rattles faintly under every step on [level].',
    'Narrow elevated path suspended over the open airwell under [light].',
    'Corrugated zinc floor with screwheads fastened into timber joists below.',
  ],
  wood_plank: [
    'Rough-sawn hardwood plank laid crosswise across the metal runners.',
    'Sturdy timber board bridging a narrow gap in the walkway floor on [level].',
    'A weathered wooden plank, grayed by rain and sun.',
  ],

  // --- Objects: Furniture & Household Equipment ---
  monobloc: [
    'White molded plastic, sun-bleached at the rim. Left at a slight angle to the table in the [room].',
    'Four legs splayed on [room] floor under [light]. Easily stacked when the room needs to become an empty hall.',
    'The standard chair of every barangay assembly and wake. It bears no weight right now.',
    'Lightweight polypropylene chair on [level]. Flexible backrest carrying the imprint of brief rest.',
  ],
  table: [
    'A rectangular dining table wiped down with a damp rag. A faint circular ring marks where a warm pot once rested.',
    'Low wooden frame occupying the middle of the [room]. Still holds the quiet geometry of household meals.',
    'A flat clearing in the [room] under [light]. Ready for plates or folded laundry.',
    'Sturdy four-legged table on [level], solid against the floor.',
  ],
  bed: [
    'Single foam mattress on a raised wooden bunk. The floral sheet is pulled taut across the corners.',
    'A quiet resting surface on [level]. In [light], the blanket retains the shallow hollow of a shoulder.',
    'Wooden bedframe tucked into the corner of the [room]. Peaceful and unmade.',
  ],
  sofa: [
    'Folded three-piece foam sofa upholstered in mossy corduroy. At night it unfolds directly onto the floor.',
    'Firm synthetic foam absorbing the ambient humidity of the [room].',
    'Low-backed lounge seat on [level], indented where someone sat to watch television.',
  ],
  drawers: [
    'Four-tier plastic organizer with translucent frosted bins. Colored folds of cotton blur together through the plastic.',
    'Lightweight plastic chest on [level]. The top drawer sticks slightly when pulled.',
    'Modular storage cabinet holding clothes and documents away from dust in the [room].',
  ],
  bucket: [
    'Red plastic timba filled to the brim with tap water, still settling after the morning pressure dropped.',
    'A plastic tabo floats inverted inside the bucket, bobbing gently under [light].',
    'Essential water reserve on [level], keeping the household prepared.',
  ],
  lpg: [
    'An eleven-kilogram steel cylinder resting beside the kitchen threshold. A rubber hose snakes behind the divider.',
    'Dull grey iron cylinder stamped with an inspection date three years past. The metal is cool to the touch on [level].',
    'Pressurized gas supply for the stove, standing upright in the [room].',
  ],
  fan: [
    'Desk fan humming on setting one, turning its plastic grille slowly across the empty [room].',
    'The oscillation lever is clicked down. Its three plastic blades stir the warm [light] without cooling it.',
    'Green plastic fan body on [level], vibrating rhythmically against the floor.',
  ],
  toilet: [
    'Manual-flush porcelain bowl tucked against the drainage wall. A plastic pail of water stands within arm\'s reach.',
    'Sanitary ceramic on [level], cooled by tile shadow.',
    'Simple gravity drainage fixture in the corner of the space.',
  ],
  column: [
    'A square concrete pillar wrapped in layers of peeled tape and school calendar pins.',
    'Structural reinforced column carrying the weight of the floor above. Painted foam green halfway up, bare grey cement above.',
    'Load-bearing concrete pier standing firm on [level].',
  ],
  cockroach: [
    'A reddish-brown periplaneta resting motionless along the floorboard seam, antennae tasting the draft from the doorway.',
    'It scurries two cells into shadow as your weight shifts on the floor.',
    'Quiet scavenger of the floorboards, thriving in the warm humidity of the [room].',
  ],
  hoop: [
    'Orange steel rim welded to a plywood backboard weathered gray by tropical rain.',
    'The chain-link net clinks softly in the draft passing through the open court.',
    'Regulation height hoop suspended above the court key on [level].',
  ],
  bleacher: [
    'Three tiers of wooden planks bolted to welded angle bars. Worn smooth by decades of neighborhood spectators.',
    'Spectator seating along the court margin under [light]. A dry peanut shell rests between the slats.',
    'Elevated benches overlooking the playing floor on [level].',
  ],
  post: [
    'Weathered timber post propping the walkway framing against open air.',
    'Salt-cured post supporting overhead wires above the void on [level].',
    'Vertical wood timber anchored into the catwalk subframe.',
  ],
  bench: [
    'Two planks smoothed by years of trousers and bare thighs under [light].',
    'Narrow wooden bangko pushed against the wall in [room]. Long enough for three people or one afternoon nap.',
    'Rough timber bench, stained dark by rain and palm sweat. Cool to the touch.',
    'Long outdoor seat facing the empty passage. A damp circle where a drinking glass was set down.',
    'Heavy mahogany plank resting on two cinderblocks on [level]. Stiff, unyielding, and always available.',
  ],

  // --- Items: Things Resting on Supports or Surfaces ---
  chair_on_table: [
    'A white plastic monobloc upended onto the table after sweeping. Its four rubber feet point at the ceiling.',
    'The floor was mopped earlier; the chair waits to be set back down on [level].',
    'Inverted chair legs resting squarely on the table surface in the [room].',
  ],
  pitcher: [
    'Clear plastic water pitcher with a blue snap-on lid, condensation beading on its sides in the [room].',
    'Cool drinking water waiting on the table under [light].',
    'Plastic container with a molded pouring spout, half-filled with clear water.',
  ],
  plate: [
    'Melamine floral plate resting near the center of the table.',
    'Durable synthetic dishware that survives accidental drops onto cement floors.',
    'Clean plate waiting in the [room] under [light].',
  ],
  basketball: [
    'Worn rubber ball with faded black ribs, resting near the three-point arc.',
    'Spalding rubber outdoor ball, pebbled surface smoothed down by asphalt and cement.',
    'Orange basketball resting motionless on the painted court floor on [level].',
  ],
  grass: [
    'Tuft of carabao grass finding root in a seam of wet rust and dirt.',
    'Ten green blades trembling in the open breeze between boards on [level].',
    'Persistent wild shoot thriving along the edge of the walkway.',
  ],

  // --- Wall Things: Wall Fixtures ---
  photo: [
    'Framed studio portrait behind glass. A high-school graduation sash over a formal barong tagalog.',
    'Oval wooden frame hung high on the [room] wall under [light]. The silver photographic emulsion has begun to bronze at the edges.',
    'Family portrait mounted on a concrete nail on [level].',
  ],
  outlet: [
    'Two-prong wall receptacle with a toggle switch, surface-mounted on concrete.',
    'Plastic faceplate screwed into an orange PVC junction box. A faint 60 Hz hum vibrates inside.',
    'Duplex electrical socket on the wall of the [room].',
  ],
  mirror: [
    'Frameless rectangular mirror fastened with four plastic clips. Reflects the opposite wall and a sliver of [light].',
    'The silvering has started to flake into black specks near the bottom corner.',
    'Glass pane reflecting the quiet interior of the [room] on [level].',
  ],
  wall_tv: [
    'Small flat-screen television bracketed high against the wall, its standby LED a steady amber pinhole in the [room].',
    'The dark glass screen mirrors the jalousie slats and the ceiling [light].',
    'Wall-mounted monitor on [level], cool and silent.',
  ],

  // --- Overheads: Ceilings, Lights, Fixtures ---
  tube_light: [
    'Thirty-six watt fluorescent tube buzzing faintly in its steel trough.',
    'Cool white illumination casting crisp square shadows across the [room].',
    'Overhead fluorescent fixture lighting the space on [level].',
  ],
  bulb: [
    'Bare incandescent bulb suspended by a twisted black cord from the ceiling rafters.',
    'Warm yellow glow pooling directly over the middle of the [room] on [level].',
    'Exposed filament bulb casting soft amber light across the floor.',
  ],
  sampayan: [
    'Nylon clothesline strung taut across the room, carrying wooden clothespins and the clean scent of laundry soap.',
    'Overhead cord zigzagging from pillar to window latch, swaying slightly in the draft.',
    'Indoor clothesline suspended above the walkway on [level].',
  ],
  truss: [
    'Welded angle-iron roof truss spanning twenty meters across the basketball court.',
    'Spiders have spun wide dusty webs between the steel diagonal struts high overhead.',
    'Heavy triangular steel rafter supporting the corrugated iron roof on [level].',
  ],
  yero_roof: [
    'Corrugated galvanized iron roofing panels, drumming softly when the sky shifts.',
    'Silver-grey corrugated canopy sheltering the walkway from sudden afternoon downpours.',
    'Overhead metal roof shielding [level] from direct tropical sun.',
  ],
  banderitas: [
    'Strings of triangular plastic bunting—red, yellow, and blue—left hanging across the rafters months after the fiesta.',
    'Colorful plastic flags rustling under the roof trusses whenever the breeze picks up.',
    'Celebratory plastic triangles strung high above the court floor.',
  ],
  wire_run: [
    'Black insulated power cables fastened along timber battens with bent wire nails.',
    'Overhead distribution line running between board boundaries on [level].',
    'Service drop wires suspended overhead, gently vibrating in the outdoor breeze.',
  ],
};

/**
 * Resolves a text entry for a given entity id with deterministic picking and template substitutions.
 * Returns null if the entity has no authored text pool.
 */
export function resolveText(id, context = {}) {
  const pool = TEXTS[id];
  if (!pool || pool.length === 0) return null;

  const {
    seed = 0,
    bx = 0,
    by = 0,
    z = 0,
    x = 0,
    y = 0,
    layer = '',
    room = null,
  } = context;

  // Deterministic index using integer hashing across coordinates and layer
  const layerCode = layer ? layer.charCodeAt(0) : 0;
  const hashVal = Math.abs(
    (bx * 31337) ^
    (by * 7919) ^
    (z * 1013) ^
    (x * 101) ^
    (y * 13) ^
    (seed * 17) ^
    layerCode
  );

  const rawText = pool[hashVal % pool.length];

  // Friendly substitution values
  let roomName = 'corridor';
  if (room) {
    if (room.type === 'court') roomName = 'covered court';
    else if (room.type === 'yero_walkway') roomName = 'walkway';
    else roomName = room.type;
  }

  const lightName = (room && room.lighting) ? room.lighting : 'ambient daylight';

  let levelName = `level ${z}`;
  if (z === 0) levelName = 'ground level';
  else if (z === 1) levelName = 'second level';
  else if (z === 2) levelName = 'third level';
  else if (z < 0) levelName = `basement level ${Math.abs(z)}`;

  return rawText
    .replaceAll('[room]', roomName)
    .replaceAll('[light]', lightName)
    .replaceAll('[level]', levelName);
}
