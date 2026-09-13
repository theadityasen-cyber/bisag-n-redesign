/**
 * The spatial journey: BUILDING → CAMPUS → GUJARAT → INDIA → EARTH → SPACE.
 *
 * This module is the single source of truth for the hero. The same tracks drive
 * the WebGL camera, the HUD readouts and the copy crossfade, which is what makes
 * the sequence read as one continuous camera move rather than six animations
 * that happen to be adjacent.
 *
 * Everything is keyed on `p` — normalised scroll progress through the pinned
 * hero, 0 at the top and 1 at the end.
 */

/** Gandhinagar campus — the fixed point the whole journey pivots around. */
export const ORIGIN = { lat: 23.2156, lon: 72.6369 } as const;

/**
 * Opening framing offset, in metres north and up from the campus datum.
 *
 * The journey pivots around a point on the ground, but the *opening frame* is a
 * portrait of a building standing north of it. Without this the camera opens
 * aimed at bare tarmac with the building cropped along the top edge. It decays
 * to zero by the campus stage, after which the datum is the only sensible thing
 * to look at.
 */
export const ENTRANCE_OFFSET = { up: 11, north: 22 } as const;

export type Stage = {
  id: string;
  index: string;
  /** Short name for the stage rail. */
  name: string;
  /** Scroll window in which this stage's copy is legible. */
  from: number;
  to: number;
  place: string;
  kicker: string;
  title: string;
  body: string;
};

export const stages: Stage[] = [
  {
    id: 'building',
    index: '01',
    name: 'Building',
    from: 0.0,
    to: 0.15,
    place: "CH '0' Circle · Gandhinagar",
    kicker: 'Origin',
    title: 'It starts in one building.',
    body: 'A teleport, a data centre and an academy under a single roof on the Gandhinagar–Ahmedabad highway. Every map layer and every satellite link begins here.',
  },
  {
    id: 'campus',
    index: '02',
    name: 'Campus',
    from: 0.15,
    to: 0.3,
    place: 'Ground segment · 23.2156°N 72.6369°E',
    kicker: 'Campus',
    title: 'The ground segment.',
    body: 'Uplink earth stations, broadcast studios and server halls — the physical end of a satellite network that reaches classrooms and control rooms across the country.',
  },
  {
    id: 'gujarat',
    index: '03',
    name: 'Gujarat',
    from: 0.3,
    to: 0.48,
    place: 'Gujarat · 196,024 km²',
    kicker: 'The proving ground',
    title: 'Where the mandate began.',
    body: 'Founded in 1997 as the Remote Sensing and Communication Centre of the Government of Gujarat. One state became the working proof that governance could be planned spatially.',
  },
  {
    id: 'india',
    index: '04',
    name: 'India',
    from: 0.48,
    to: 0.64,
    place: 'India · 3,287,263 km²',
    kicker: 'National mandate',
    title: 'A national instrument.',
    body: 'A national institute under MeitY since 2020, building the geospatial platforms that 57 central ministries and 36 states and union territories plan on.',
  },
  {
    id: 'earth',
    index: '05',
    name: 'Earth',
    from: 0.64,
    to: 0.83,
    place: 'Low Earth orbit · 700 km',
    kicker: 'Observation',
    title: 'Continuously measured.',
    body: 'Indian remote-sensing satellites revisit the subcontinent every few days. Every pixel returned is a measurement waiting to become a decision.',
  },
  {
    id: 'space',
    index: '06',
    name: 'Space',
    from: 0.83,
    to: 1.0,
    place: 'Geostationary arc · 35,786 km',
    kicker: 'Reach',
    title: 'From Gujarat to the planet.',
    body: 'Communication satellites hold station above the equator and carry the institute’s classrooms, broadcasts and data links back down to the ground it came from.',
  },
];

/* ---------------------------------------------------------------- tracks -- */

/** A keyframed track: `[p, value]` pairs, interpolated with a monotone spline. */
export type Track = [p: number, value: number][];

/**
 * Frame width in metres — how much ground the camera sees across the viewport.
 * Interpolated in log space, so a constant scroll speed produces a constant
 * *rate of zoom*: the perceptual requirement for a continuous dolly.
 *
 * 55 m (one façade) → 44,000 km (a hemisphere with room around it).
 */
export const frameWidthTrack: Track = [
  [0.0, 118],
  [0.14, 420],
  [0.28, 3_000],
  [0.4, 120_000],
  [0.5, 720_000],
  [0.62, 3_400_000],
  [0.78, 13_500_000],
  [0.9, 26_000_000],
  [1.0, 44_000_000],
];

/**
 * Camera elevation above the horizontal, in degrees.
 *
 * On the globe, pitch decides how far the campus sits from the centre of the
 * visible disc: at 21° it sat 93% of the way out to the upper limb and India read
 * as a sliver seen edge-on; at 42° it sits about 70% out. The closing stages hold the camera higher so the planet leans toward
 * the reader and the subcontinent faces them, while still keeping enough
 * horizon for the globe to read as a sphere rather than a map.
 */
export const pitchTrack: Track = [
  [0.0, 11],
  [0.14, 19],
  [0.3, 38],
  [0.46, 64],
  [0.6, 79],
  [0.72, 66],
  [0.86, 50],
  [1.0, 42],
];

/** Slow azimuthal drift, in degrees. Keeps the frame alive without spinning. */
export const azimuthTrack: Track = [
  [0.0, -30],
  [0.3, -13],
  [0.62, 0],
  [1.0, 24],
];

/**
 * Plane → sphere morph. The regional map and the globe are the same geometry;
 * this is the only thing that differs between them. The morph runs while the
 * camera is far enough out that the curvature is physically legible.
 */
export const morphTrack: Track = [
  [0.0, 0],
  [0.6, 0],
  [0.79, 1],
  [1.0, 1],
];

/** Opacity of the near-ground shell (building + campus). */
export const localFadeTrack: Track = [
  [0.0, 1],
  [0.26, 1],
  [0.35, 0],
  [1.0, 0],
];

/** Opacity of the geographic shell (terrain, boundaries, globe). */
export const geoFadeTrack: Track = [
  [0.0, 0],
  [0.27, 0],
  [0.38, 1],
  [1.0, 1],
];

/** Starfield and orbital hardware. */
export const spaceFadeTrack: Track = [
  [0.0, 0],
  [0.6, 0],
  [0.76, 1],
  [1.0, 1],
];

/** Regional emphasis: Gujarat highlight, then India, then neither. */
export const gujaratFocusTrack: Track = [
  [0.0, 0],
  [0.34, 0],
  [0.44, 1],
  [0.56, 1],
  [0.66, 0],
  [1.0, 0],
];

export const indiaFocusTrack: Track = [
  [0.0, 0],
  [0.4, 0],
  [0.52, 1],
  [0.74, 1],
  [0.86, 0.35],
  [1.0, 0.35],
];
