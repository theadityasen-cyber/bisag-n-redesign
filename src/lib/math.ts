/** Small numeric helpers shared by the scene, the HUD and the DOM animation. */

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v);

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const invLerp = (a: number, b: number, v: number) => (b === a ? 0 : (v - a) / (b - a));

export const remap = (v: number, inA: number, inB: number, outA: number, outB: number) =>
  lerp(outA, outB, clamp(invLerp(inA, inB, v)));

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp(invLerp(edge0, edge1, x));
  return t * t * (3 - 2 * t);
};

/** Symmetric fade-in / fade-out window, used for stage copy and scene opacity. */
export const window01 = (x: number, from: number, to: number, feather = 0.04) =>
  smoothstep(from - feather, from + feather, x) * (1 - smoothstep(to - feather, to + feather, x));

/**
 * Frame-rate independent exponential smoothing.
 *
 * `lambda` is the decay rate: higher converges faster. Using this rather than a
 * fixed per-frame lerp is what keeps the journey feeling identical on a 60 Hz
 * laptop and a 144 Hz monitor.
 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

export const degToRad = (d: number) => (d * Math.PI) / 180;

/* ------------------------------------------------------- monotone spline -- */

/**
 * Monotone cubic Hermite interpolation (Fritsch–Carlson).
 *
 * Linear interpolation between keyframes produces a visible change of pace at
 * every keyframe — the camera appears to shift gear. A plain Catmull-Rom is
 * smooth but can overshoot, which on the zoom track would mean briefly zooming
 * the wrong way. Fritsch–Carlson gives C1 continuity *and* guarantees
 * monotonicity, which is exactly the pair of properties this needs.
 */
export class Spline {
  private xs: number[];
  private ys: number[];
  private ms: number[];

  constructor(points: [number, number][]) {
    const sorted = [...points].sort((a, b) => a[0] - b[0]);
    this.xs = sorted.map((p) => p[0]);
    this.ys = sorted.map((p) => p[1]);

    const n = this.xs.length;
    const dx: number[] = [];
    const secant: number[] = [];
    for (let i = 0; i < n - 1; i++) {
      dx.push(this.xs[i + 1] - this.xs[i]);
      secant.push((this.ys[i + 1] - this.ys[i]) / (this.xs[i + 1] - this.xs[i]));
    }

    const m: number[] = new Array(n);
    m[0] = secant[0] ?? 0;
    m[n - 1] = secant[n - 2] ?? 0;
    for (let i = 1; i < n - 1; i++) {
      m[i] = secant[i - 1] * secant[i] <= 0 ? 0 : (secant[i - 1] + secant[i]) / 2;
    }

    // Clamp tangents back onto the monotonicity-preserving circle of radius 3.
    for (let i = 0; i < n - 1; i++) {
      if (secant[i] === 0) {
        m[i] = 0;
        m[i + 1] = 0;
        continue;
      }
      const a = m[i] / secant[i];
      const b = m[i + 1] / secant[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * secant[i];
        m[i + 1] = t * b * secant[i];
      }
    }

    this.ms = m;
  }

  at(x: number): number {
    const { xs, ys, ms } = this;
    const n = xs.length;
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];

    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid;
    }

    const h = xs[hi] - xs[lo];
    const t = (x - xs[lo]) / h;
    const t2 = t * t;
    const t3 = t2 * t;

    return (
      (2 * t3 - 3 * t2 + 1) * ys[lo] +
      (t3 - 2 * t2 + t) * h * ms[lo] +
      (-2 * t3 + 3 * t2) * ys[hi] +
      (t3 - t2) * h * ms[hi]
    );
  }
}

/**
 * A spline fitted in log space. Zoom must be interpolated logarithmically: the
 * eye reads *ratio* of scale change, not difference, so constant scroll speed
 * should produce a constant multiplication factor per second.
 */
export class LogSpline {
  private spline: Spline;

  constructor(points: [number, number][]) {
    this.spline = new Spline(points.map(([x, y]) => [x, Math.log(y)] as [number, number]));
  }

  at(x: number): number {
    return Math.exp(this.spline.at(x));
  }
}

/* ------------------------------------------------------------ formatting -- */

/** Human-readable distance for the HUD altitude readout. */
export function formatAltitude(metres: number): { value: string; unit: string } {
  if (metres < 1000) return { value: metres.toFixed(metres < 100 ? 1 : 0), unit: 'm' };
  const km = metres / 1000;
  if (km < 100) return { value: km.toFixed(1), unit: 'km' };
  return { value: Math.round(km).toLocaleString('en-IN'), unit: 'km' };
}

/** Classic map scale denominator, assuming a ~0.35 m wide viewport. */
export function formatScale(frameWidthMetres: number): string {
  const denom = frameWidthMetres / 0.35;
  if (denom < 1000) return `1:${Math.round(denom)}`;
  if (denom < 1e6) return `1:${Math.round(denom / 1000)}K`;
  return `1:${(denom / 1e6).toFixed(denom < 1e7 ? 1 : 0)}M`;
}

export function formatCoord(value: number, axis: 'lat' | 'lon'): string {
  const hemi = axis === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
  return `${Math.abs(value).toFixed(4)}°${hemi}`;
}
