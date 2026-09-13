/**
 * Journey state.
 *
 * Deliberately a plain mutable object rather than React state. Scroll progress
 * changes every frame; routing that through React would re-render the whole
 * hero sixty times a second for the sake of a few digits in the HUD. Instead:
 *
 *   - ScrollTrigger writes `progress`
 *   - the R3F frame loop reads it, damps it into `smoothed`, and writes back the
 *     derived telemetry (`altitude`, `frameWidth`, `lat`, `lon`)
 *   - the HUD runs its own rAF loop and writes text straight into DOM nodes
 *   - only genuinely discrete changes (the active stage) go through `subscribe`
 *     and cause a render
 */

import { LogSpline, Spline } from './math';
import {
  azimuthTrack,
  frameWidthTrack,
  geoFadeTrack,
  gujaratFocusTrack,
  indiaFocusTrack,
  localFadeTrack,
  morphTrack,
  ORIGIN,
  pitchTrack,
  spaceFadeTrack,
  stages,
} from '../content/journey';

export type JourneyState = {
  /** Raw normalised scroll through the pinned hero. */
  progress: number;
  /** Temporally damped progress — what the camera actually follows. */
  smoothed: number;
  /** Camera height above the ellipsoid, in metres. */
  altitude: number;
  /** Ground distance visible across the viewport, in metres. */
  frameWidth: number;
  lat: number;
  lon: number;
  /** Index into `stages`. */
  stage: number;
  /** True once the first frame has actually been drawn. */
  ready: boolean;
};

export const journey: JourneyState = {
  progress: 0,
  smoothed: 0,
  altitude: 8,
  frameWidth: frameWidthTrack[0][1],
  lat: ORIGIN.lat,
  lon: ORIGIN.lon,
  stage: 0,
  ready: false,
};

/* ------------------------------------------------------ compiled tracks -- */

export const tracks = {
  frameWidth: new LogSpline(frameWidthTrack),
  pitch: new Spline(pitchTrack),
  azimuth: new Spline(azimuthTrack),
  morph: new Spline(morphTrack),
  localFade: new Spline(localFadeTrack),
  geoFade: new Spline(geoFadeTrack),
  spaceFade: new Spline(spaceFadeTrack),
  gujaratFocus: new Spline(gujaratFocusTrack),
  indiaFocus: new Spline(indiaFocusTrack),
};

/** Which stage's copy should be showing at progress `p`. */
export function stageAt(p: number): number {
  for (let i = stages.length - 1; i >= 0; i--) {
    if (p >= stages[i].from) return i;
  }
  return 0;
}

/* ------------------------------------------------------------ subscribe -- */

type Listener = (state: JourneyState) => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() {
  for (const fn of listeners) fn(journey);
}

/** Call after writing `progress`. Only notifies when something discrete moved. */
export function commit(next: Partial<JourneyState>) {
  const prevStage = journey.stage;
  const prevReady = journey.ready;
  Object.assign(journey, next);
  if (journey.stage !== prevStage || journey.ready !== prevReady) emit();
}

export function setProgress(p: number) {
  journey.progress = p;
  const stage = stageAt(p);
  if (stage !== journey.stage) {
    journey.stage = stage;
    emit();
  }
}
