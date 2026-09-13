/**
 * Device capability detection.
 *
 * The journey is the most expensive thing on the page, so what it costs is
 * decided once, up front, from what the device actually reports — not from a
 * user-agent guess. Everything downstream (segment counts, shadow maps,
 * atmosphere, pixel ratio) reads from this single tier.
 */

export type Tier = 'high' | 'medium' | 'low' | 'none';

export type Capability = {
  tier: Tier;
  webgl: boolean;
  /** Coarse pointer + touch — drives layout decisions, not just performance ones. */
  touch: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  dpr: number;
  /** Derived budgets, so components never re-derive them inconsistently. */
  sphereSegments: [number, number];
  terrainSegments: number;
  starCount: number;
  shadows: boolean;
  atmosphere: boolean;
  antialias: boolean;
};

function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) return false;
    // Release immediately — we only wanted to know whether a context is grantable.
    const lose = (gl as WebGLRenderingContext).getExtension('WEBGL_lose_context');
    lose?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function detectTier(webgl: boolean): Tier {
  if (!webgl) return 'none';
  if (typeof navigator === 'undefined') return 'medium';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const memory = nav.deviceMemory ?? 4;
  const coarse =
    typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches;

  let score = 0;
  score += cores >= 8 ? 2 : cores >= 4 ? 1 : 0;
  score += memory >= 8 ? 2 : memory >= 4 ? 1 : 0;
  // A coarse pointer usually means a thermally limited GPU sharing a small
  // memory bus; budget for the sustained frame rate, not the first ten seconds.
  score += coarse ? 0 : 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

export function detectCapability(): Capability {
  const webgl = detectWebGL();
  const tier = detectTier(webgl);

  const reducedMotion =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch =
    typeof matchMedia !== 'undefined' &&
    matchMedia('(pointer: coarse)').matches &&
    (navigator.maxTouchPoints ?? 0) > 0;

  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const saveData = Boolean(connection?.saveData);

  const rawDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const dprCap = tier === 'high' ? 2 : tier === 'medium' ? 1.6 : 1.25;

  const budgets: Record<Exclude<Tier, 'none'>, Omit<Capability, 'tier' | 'webgl' | 'touch' | 'reducedMotion' | 'saveData' | 'dpr'>> = {
    high: {
      sphereSegments: [220, 110],
      terrainSegments: 320,
      starCount: 2600,
      shadows: true,
      atmosphere: true,
      antialias: true,
    },
    medium: {
      sphereSegments: [160, 80],
      terrainSegments: 200,
      starCount: 1500,
      shadows: true,
      atmosphere: true,
      antialias: true,
    },
    low: {
      sphereSegments: [96, 48],
      terrainSegments: 110,
      starCount: 700,
      shadows: false,
      atmosphere: false,
      antialias: false,
    },
  };

  const budget = budgets[tier === 'none' ? 'low' : tier];

  return {
    tier,
    webgl,
    touch,
    reducedMotion,
    saveData,
    dpr: Math.min(rawDpr, dprCap),
    ...budget,
  };
}
