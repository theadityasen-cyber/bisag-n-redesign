import * as THREE from 'three';
import { buildMaskTexture, ringsToSegments, type Ring } from '../../lib/geo';
import { makeGeoGrid, makeGraticule } from './geometry';

/**
 * Geographic assets: boundary geometries and the land mask.
 *
 * Loaded through a dynamic import so ~250 kB of coordinates stays out of the
 * initial bundle — the document is readable long before the journey needs them —
 * and built exactly once per page, because rasterising the mask costs a few
 * milliseconds of main thread that nobody should pay twice.
 */

export type GeoAssets = {
  surfaceGlobe: THREE.BufferGeometry;
  surfaceRegion: THREE.BufferGeometry;
  graticule: THREE.BufferGeometry;
  worldBorders: THREE.BufferGeometry;
  indiaStates: THREE.BufferGeometry;
  gujaratDistricts: THREE.BufferGeometry;
  gujaratOutline: THREE.BufferGeometry;
  mask: THREE.CanvasTexture;
  dispose: () => void;
};

type Budget = {
  sphereSegments: [number, number];
  terrainSegments: number;
  maskSize: number;
};

let cache: { key: string; promise: Promise<GeoAssets> } | null = null;

async function build(budget: Budget): Promise<GeoAssets> {
  const [world, india, gujarat] = await Promise.all([
    import('../../data/geo/world.json'),
    import('../../data/geo/india.json'),
    import('../../data/geo/gujarat.json'),
  ]);

  const worldData = world.default as { land: Ring[]; borders: Ring[] };
  const indiaData = india.default as { states: Ring[] };
  const gujaratData = gujarat.default as { outline: Ring[]; districts: Ring[] };

  const [segX, segY] = budget.sphereSegments;

  const assets: GeoAssets = {
    surfaceGlobe: makeGeoGrid(-180, 180, -89.5, 89.5, segX, segY),
    // A ±16° patch around Gandhinagar, at the resolution the globe grid cannot
    // afford globally. It covers the frame from campus scale to national scale
    // and retires once the globe takes over.
    surfaceRegion: makeGeoGrid(
      72.6369 - 16,
      72.6369 + 16,
      23.2156 - 16,
      23.2156 + 16,
      budget.terrainSegments,
      budget.terrainSegments,
    ),
    graticule: makeGraticule(10, 2),
    worldBorders: ringsToSegments(worldData.borders),
    indiaStates: ringsToSegments(indiaData.states),
    gujaratDistricts: ringsToSegments(gujaratData.districts),
    gujaratOutline: ringsToSegments(gujaratData.outline),
    mask: buildMaskTexture(worldData.land, indiaData.states, gujaratData.outline, budget.maskSize),
    dispose: () => {},
  };

  assets.dispose = () => {
    assets.surfaceGlobe.dispose();
    assets.surfaceRegion.dispose();
    assets.graticule.dispose();
    assets.worldBorders.dispose();
    assets.indiaStates.dispose();
    assets.gujaratDistricts.dispose();
    assets.gujaratOutline.dispose();
    assets.mask.dispose();
  };

  return assets;
}

export function loadGeoAssets(budget: Budget): Promise<GeoAssets> {
  const key = `${budget.sphereSegments.join('x')}-${budget.terrainSegments}-${budget.maskSize}`;
  if (cache?.key !== key) {
    cache?.promise.then((prev) => prev.dispose());
    cache = { key, promise: build(budget) };
  }
  return cache.promise;
}

/** Suspense-compatible reader. */
export function useGeoAssets(budget: Budget): GeoAssets {
  const promise = loadGeoAssets(budget) as Promise<GeoAssets> & {
    status?: 'pending' | 'done' | 'error';
    value?: GeoAssets;
    reason?: unknown;
  };

  if (promise.status === 'done') return promise.value!;
  if (promise.status === 'error') throw promise.reason;

  if (!promise.status) {
    promise.status = 'pending';
    promise.then(
      (value) => {
        promise.status = 'done';
        promise.value = value;
      },
      (reason) => {
        promise.status = 'error';
        promise.reason = reason;
      },
    );
  }

  throw promise;
}
