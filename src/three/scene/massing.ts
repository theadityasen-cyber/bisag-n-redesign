/**
 * Campus massing, in metres.
 *
 * Authored as data rather than as JSX so the building can be adjusted without
 * touching render code, and so every box that shares a material can be merged
 * into a single draw call at load.
 *
 * Coordinates: +X east, +Z south, +Y up. The world origin is the campus datum —
 * the exact point the entire journey pivots around — and the building sits just
 * north of it so the opening frame looks at the entrance elevation.
 *
 * `at` is the box's **base centre**, not its centre: floor levels read as the
 * numbers you would actually say out loud.
 */

export type Massing = {
  at: [x: number, y: number, z: number];
  size: [w: number, h: number, d: number];
  material:
    | 'concrete'
    | 'concreteDark'
    | 'glass'
    | 'accent'
    | 'metal'
    | 'dark'
    | 'ground'
    | 'road'
    | 'lawn'
    | 'dish';
  rotY?: number;
};

const FLOORS = [2.6, 6.8, 11.0];

/** Horizontal glazing bands wrapped around a block. */
function glazing(
  centre: [number, number],
  width: number,
  depth: number,
  levels: number[] = FLOORS,
  bandHeight = 1.9,
): Massing[] {
  return levels.map((y) => ({
    at: [centre[0], y, centre[1]] as [number, number, number],
    // Set 0.25 m proud of the wall so the band casts its own shadow line and
    // reads as a recessed opening rather than as a painted stripe. Any further
    // and the building stops being a mass with windows in it and becomes a
    // stack of slabs.
    size: [width + 0.25, bandHeight, depth + 0.25] as [number, number, number],
    material: 'glass' as const,
  }));
}

export const campus: Massing[] = [
  /* ----------------------------------------------------------- ground ---- */
  { at: [0, 0.02, 40], size: [110, 0.06, 78], material: 'road' }, // forecourt
  { at: [0, 0.02, 132], size: [13, 0.06, 122], material: 'road' }, // approach
  { at: [-96, 0.03, 34], size: [46, 0.05, 30], material: 'road' }, // parking west
  { at: [96, 0.03, 34], size: [46, 0.05, 30], material: 'road' }, // parking east
  { at: [0, 0.04, -96], size: [300, 0.04, 84], material: 'lawn' }, // rear lawn
  { at: [-132, 0.04, -10], size: [58, 0.04, 120], material: 'lawn' },
  { at: [132, 0.04, -10], size: [58, 0.04, 120], material: 'lawn' },

  /* perimeter service road */
  { at: [0, 0.05, 176], size: [372, 0.05, 9], material: 'road' },
  { at: [0, 0.05, -176], size: [372, 0.05, 9], material: 'road' },
  { at: [-181, 0.05, 0], size: [9, 0.05, 352], material: 'road' },
  { at: [181, 0.05, 0], size: [9, 0.05, 352], material: 'road' },

  /* boundary wall */
  { at: [0, 0, 196], size: [396, 2.3, 0.7], material: 'concreteDark' },
  { at: [0, 0, -196], size: [396, 2.3, 0.7], material: 'concreteDark' },
  { at: [-198, 0, 0], size: [0.7, 2.3, 392], material: 'concreteDark' },
  { at: [198, 0, 0], size: [0.7, 2.3, 392], material: 'concreteDark' },

  /* gate */
  { at: [-9, 0, 196], size: [3.4, 5.6, 3.4], material: 'concrete' },
  { at: [9, 0, 196], size: [3.4, 5.6, 3.4], material: 'concrete' },
  { at: [20, 0, 190], size: [7, 3.4, 6], material: 'concrete' },
  { at: [0, 5.6, 196], size: [21.4, 0.7, 1.6], material: 'accent' },

  /* --------------------------------------------------------- main block -- */
  { at: [0, 0, -31], size: [92, 1.4, 36], material: 'concreteDark' }, // plinth
  { at: [0, 1.4, -31.5], size: [76, 12.6, 19], material: 'concrete' },
  ...glazing([0, -31.5], 76, 19),
  { at: [0, 14, -31.5], size: [77, 1.2, 20], material: 'concreteDark' }, // parapet
  { at: [0, 14, -41], size: [77, 0.5, 0.9], material: 'accent' }, // roof edge line

  /* ------------------------------------------------------ entrance mass -- */
  { at: [0, 1.4, -24], size: [21, 17.6, 13], material: 'concrete' },
  { at: [0, 2.2, -23.4], size: [15.4, 14.2, 13.8], material: 'glass' },
  { at: [0, 19, -24], size: [22, 1.1, 14], material: 'concreteDark' },

  /* vertical fins — the one place the accent colour appears on the building */
  ...[-9.2, -4.6, 0, 4.6, 9.2].map(
    (x): Massing => ({ at: [x, 2.2, -17.2], size: [0.45, 15.6, 0.6], material: 'accent' }),
  ),

  /* entrance canopy and columns */
  { at: [0, 6.6, -12.2], size: [28, 0.75, 11], material: 'concreteDark' },
  ...[-12, -4, 4, 12].map(
    (x): Massing => ({ at: [x, 0, -8.6], size: [0.75, 6.6, 0.75], material: 'metal' }),
  ),
  { at: [0, 0, -14], size: [30, 0.9, 12], material: 'concreteDark' }, // entrance steps

  /* --------------------------------------------------------------- wings -- */
  { at: [45, 0, -54], size: [30, 1.4, 40], material: 'concreteDark' },
  { at: [45, 1.4, -54], size: [22, 10.6, 32], material: 'concrete' },
  ...glazing([45, -54], 22, 32, [2.6, 6.8], 2.4),
  { at: [45, 12, -54], size: [23, 1.1, 33], material: 'concreteDark' },

  { at: [-45, 0, -54], size: [30, 1.4, 40], material: 'concreteDark' },
  { at: [-45, 1.4, -54], size: [22, 10.6, 32], material: 'concrete' },
  ...glazing([-45, -54], 22, 32, [2.6, 6.8], 2.4),
  { at: [-45, 12, -54], size: [23, 1.1, 33], material: 'concreteDark' },

  /* ---------------------------------------------------------- roof plant -- */
  { at: [-14, 14, -34], size: [12, 2.8, 7], material: 'concreteDark' },
  { at: [-2, 14, -37], size: [6, 2.0, 5], material: 'metal' },
  { at: [6, 14, -28], size: [4.5, 1.6, 4.5], material: 'metal' },

  /* -------------------------------------------------- secondary buildings -- */
  { at: [-128, 0, -104], size: [34, 9.2, 20], material: 'concrete' },
  ...glazing([-128, -104], 34, 20, [2.2, 6.0], 2.2),
  { at: [-128, 9.2, -104], size: [35, 1, 21], material: 'concreteDark' },

  { at: [132, 0, -112], size: [28, 10.4, 18], material: 'concrete' },
  ...glazing([132, -112], 28, 18, [2.2, 6.0], 2.2),
  { at: [132, 10.4, -112], size: [29, 1, 19], material: 'concreteDark' },

  /* academy / training block, set behind the lawn */
  { at: [0, 0, -132], size: [54, 8.4, 22], material: 'concrete' },
  ...glazing([0, -132], 54, 22, [2.2, 5.6], 2.2),
  { at: [0, 8.4, -132], size: [55, 1, 23], material: 'concreteDark' },

  /* plant / utility */
  { at: [-140, 0, 96], size: [22, 5.4, 14], material: 'concreteDark' },
  { at: [146, 0, 104], size: [16, 4.6, 12], material: 'concreteDark' },
];

/* ----------------------------------------------------------- teleport ---- */

/**
 * The uplink earth station.
 *
 * BISAG-N's teleport works four uplink antennas — three 11-metre and one
 * 9.3-metre — for its DTH education channels. They are modelled at those sizes
 * on a fenced hardstanding on the east lawn, with the RF and baseband shelter
 * behind them and cable trays running out to each pedestal. The arrangement on
 * the ground is illustrative; the dish sizes and where they point are not.
 */
export const uplinkAntennas: { id: string; diameter: number; at: [x: number, z: number] }[] = [
  { id: 'uplink-1', diameter: 11, at: [80, -29] },
  { id: 'uplink-2', diameter: 11, at: [102, -29] },
  { id: 'uplink-3', diameter: 11, at: [124, -29] },
  { id: 'uplink-4', diameter: 9.3, at: [145, -29] },
];

/** Ground the teleport occupies, fence and access road included. Kept clear of trees. */
export const teleportFootprint = { minX: 56, maxX: 166, minZ: -78, maxZ: 22 } as const;

/** z of the equipment shelter's south face (centre −64, 13 m deep). */
const SHELTER_SOUTH_Z = -64 + 13 / 2;

const FENCE = { minX: 61, maxX: 161, minZ: -53, maxZ: -5, height: 2.2, gate: [104, 118] as const };

function fence(): Massing[] {
  const parts: Massing[] = [];
  const { minX, maxX, minZ, maxZ, height, gate } = FENCE;
  const post = (x: number, z: number): Massing => ({ at: [x, 0, z], size: [0.18, height, 0.18], material: 'metal' });
  const inGate = (x: number) => x > gate[0] && x < gate[1];

  for (let x = minX; x <= maxX; x += 6) {
    parts.push(post(x, minZ));
    if (!inGate(x)) parts.push(post(x, maxZ));
  }
  for (let z = minZ + 6; z < maxZ; z += 6) {
    parts.push(post(minX, z), post(maxX, z));
  }

  const w = maxX - minX;
  const d = maxZ - minZ;
  const rail = height - 0.1;
  parts.push(
    { at: [(minX + maxX) / 2, rail, minZ], size: [w, 0.1, 0.1], material: 'metal' },
    { at: [(minX + gate[0]) / 2, rail, maxZ], size: [gate[0] - minX, 0.1, 0.1], material: 'metal' },
    { at: [(gate[1] + maxX) / 2, rail, maxZ], size: [maxX - gate[1], 0.1, 0.1], material: 'metal' },
    { at: [minX, rail, (minZ + maxZ) / 2], size: [0.1, 0.1, d], material: 'metal' },
    { at: [maxX, rail, (minZ + maxZ) / 2], size: [0.1, 0.1, d], material: 'metal' },
  );
  return parts;
}

campus.push(
  // hardstanding and access road to the east car park
  { at: [111, 0.03, -29], size: [96, 0.06, 44], material: 'road' },
  { at: [111, 0.03, 7], size: [8, 0.06, 26], material: 'road' },

  // RF / baseband shelter
  { at: [111, 0, -64], size: [40, 4.8, 13], material: 'concrete' },
  { at: [111, 4.8, -64], size: [41, 0.6, 14], material: 'concreteDark' },
  { at: [99, 5.4, -65], size: [3.2, 1.4, 2.4], material: 'metal' },
  { at: [106, 5.4, -65], size: [3.2, 1.4, 2.4], material: 'metal' },
  { at: [120, 5.4, -63], size: [5, 1.1, 3.5], material: 'metal' },

  // foundations and cable trays, one per antenna
  ...uplinkAntennas.flatMap(({ diameter, at: [x, z] }): Massing[] => {
    const footing = diameter * 0.46;
    // Tray from the shelter's south face to the north edge of the footing.
    const from = SHELTER_SOUTH_Z;
    const to = z - footing / 2;
    return [
      { at: [x, 0, z], size: [footing, 0.8, footing], material: 'concreteDark' },
      { at: [x, 0.06, (from + to) / 2], size: [0.9, 0.35, to - from], material: 'metal' },
    ];
  }),

  ...fence(),
);
