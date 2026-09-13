import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import {
  GLOBE_R,
  UNITS_PER_M,
  geoGroupTransform,
  lonLatToDir,
  projectionUniforms,
} from '../../lib/geo';
import { journey, tracks } from '../../lib/journeyStore';
import { clamp, smoothstep } from '../../lib/math';
import { ATMOSPHERE_FRAG, ATMOSPHERE_VERT, LINE_FRAG, LINE_VERT } from '../shaders/lines';
import { TERRAIN_FRAG, TERRAIN_VERT } from '../shaders/terrain';
import { useGeoAssets } from './geoAssets';
import type { Capability } from '../../lib/capability';

/**
 * Everything geographic: terrain, boundaries, graticule, atmosphere.
 *
 * All of it lives in one group whose transform puts the Gandhinagar surface
 * point on the world origin with the local normal pointing up, and all of it
 * goes through the same `geoProject()` in the vertex shader. Two consequences
 * worth stating, because they are the design:
 *
 *   1. The regional map and the globe are the same object under two
 *      projections, so "Gujarat unrolling into a planet" is a uniform sweep, not
 *      a transition between two scenes.
 *   2. Boundaries, graticule and terrain cannot drift apart, because they share
 *      one implementation of the projection rather than three.
 */

/** Vertical exaggeration. Real relief is invisible at globe scale; this is ×3. */
const RELIEF = 12_000 * UNITS_PER_M;
/** Lines ride just above the tallest displaced terrain so they never z-fight. */
const LINE_LIFT = RELIEF * 1.06;

/** Sun over the western Indian Ocean: India in afternoon light, terminator in the Pacific. */
const SUN_DIR = lonLatToDir(38, 14);

type BoundaryKey = 'worldBorders' | 'indiaStates' | 'gujaratDistricts' | 'gujaratOutline' | 'graticule';

export function GeoShell({ capability }: { capability: Capability }) {
  const assets = useGeoAssets({
    sphereSegments: capability.sphereSegments,
    terrainSegments: capability.terrainSegments,
    maskSize: capability.tier === 'high' ? 2048 : 1024,
  });

  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const camLocal = useRef(new THREE.Vector3());

  const transform = useMemo(geoGroupTransform, []);

  /* -- Materials ----------------------------------------------------------- */

  const materials = useMemo(() => {
    const shared = {
      uMask: { value: assets.mask },
      uSunDir: { value: SUN_DIR.clone() },
      uRelief: { value: RELIEF },
      uOctaves: { value: capability.tier === 'low' ? 4 : 6 },
      uDetail: { value: 0 },
      uIndiaFocus: { value: 0 },
      uGujaratFocus: { value: 0 },
    };

    const terrain = (opacity: number) =>
      new THREE.ShaderMaterial({
        vertexShader: TERRAIN_VERT,
        fragmentShader: TERRAIN_FRAG,
        uniforms: {
          ...projectionUniforms(),
          ...Object.fromEntries(Object.entries(shared).map(([k, v]) => [k, { value: v.value }])),
          uOpacity: { value: opacity },
        },
        transparent: true,
        // Depth is written even while fading so the boundary lines above the
        // surface can depth-test against it instead of showing through the planet.
        depthWrite: true,
        side: THREE.FrontSide,
      });

    const line = (colour: string, opacity: number) =>
      new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        uniforms: {
          ...projectionUniforms(),
          uLift: { value: LINE_LIFT },
          uCamLocal: { value: new THREE.Vector3() },
          uColour: { value: new THREE.Color(colour) },
          uOpacity: { value: opacity },
          uProgress: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
      });

    const region = terrain(0);
    const globe = terrain(0);
    // Push the globe a hair behind the regional patch for the stretch where both
    // are drawn, so the overlap resolves consistently instead of shimmering.
    globe.polygonOffset = true;
    globe.polygonOffsetFactor = 1.4;
    globe.polygonOffsetUnits = 1.4;

    return {
      region,
      globe,
      lines: {
        // Ink on a light sheet: blue-greys for the reference layers, the logo
        // red for Gujarat, where the story is anchored.
        graticule: line('#6F97B8', 0),
        worldBorders: line('#8B95A0', 0),
        indiaStates: line('#4F6B86', 0),
        gujaratDistricts: line('#D98A80', 0),
        gujaratOutline: line('#EA0606', 0),
      } as Record<BoundaryKey, THREE.ShaderMaterial>,
      atmosphere: new THREE.ShaderMaterial({
        vertexShader: ATMOSPHERE_VERT,
        fragmentShader: ATMOSPHERE_FRAG,
        uniforms: {
          uColour: { value: new THREE.Color('#9FCDEE') },
          uSunDir: { value: SUN_DIR.clone() },
          uIntensity: { value: 0 },
          uPower: { value: 3.1 },
        },
        transparent: true,
        // Normal, not additive: additive light on a white page only ever
        // clips to white. A pale-blue limb composited over the ground reads as
        // atmosphere; the same colour added to it reads as nothing.
        blending: THREE.NormalBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    };
  }, [assets.mask, capability.tier]);

  /* -- Teardown ------------------------------------------------------------ */

  useEffect(() => {
    return () => {
      materials.region.dispose();
      materials.globe.dispose();
      materials.atmosphere.dispose();
      for (const m of Object.values(materials.lines)) m.dispose();
    };
  }, [materials]);

  const atmosphereGeometry = useMemo(
    () => new THREE.SphereGeometry(GLOBE_R * 1.028, capability.tier === 'low' ? 48 : 96, capability.tier === 'low' ? 24 : 48),
    [capability.tier],
  );
  useEffect(() => () => atmosphereGeometry.dispose(), [atmosphereGeometry]);

  /* -- Frame --------------------------------------------------------------- */

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const p = journey.smoothed;
    const morph = tracks.morph.at(p);
    const geoFade = tracks.geoFade.at(p);
    const indiaFocus = tracks.indiaFocus.at(p);
    const gujaratFocus = tracks.gujaratFocus.at(p);

    // Detail retires as the ground pulls away: contour banding at 13,000 km is
    // moiré, not information.
    const detail = 1 - smoothstep(1.2e6, 6.0e6, journey.frameWidth);

    // Camera in the group's local frame, for the limb fade on line materials.
    group.updateWorldMatrix(true, false);
    camLocal.current.copy(camera.position).applyMatrix4(
      new THREE.Matrix4().copy(group.matrixWorld).invert(),
    );

    const regionOpacity = geoFade * (1 - smoothstep(0.58, 0.7, p));
    const globeOpacity = smoothstep(0.5, 0.66, p);

    for (const [material, opacity] of [
      [materials.region, regionOpacity],
      [materials.globe, globeOpacity],
    ] as const) {
      const u = material.uniforms;
      u.uMorph.value = morph;
      u.uDetail.value = detail;
      u.uIndiaFocus.value = indiaFocus;
      u.uGujaratFocus.value = gujaratFocus;
      u.uOpacity.value = opacity;
      material.visible = opacity > 0.002;
    }

    // Boundary emphasis. Each layer is legible only in the band of scales where
    // it means something — district lines at planetary range are noise.
    const lineOpacity: Record<BoundaryKey, number> = {
      graticule: geoFade * 0.3 * (0.35 + 0.65 * morph),
      worldBorders: geoFade * 0.42 * smoothstep(0.48, 0.66, p),
      indiaStates: geoFade * 0.62 * indiaFocus,
      gujaratDistricts: geoFade * 0.5 * gujaratFocus * (1 - smoothstep(0.54, 0.64, p)),
      gujaratOutline: geoFade * clamp(gujaratFocus * 1.05 + indiaFocus * 0.35),
    };

    for (const key of Object.keys(materials.lines) as BoundaryKey[]) {
      const material = materials.lines[key];
      material.uniforms.uMorph.value = morph;
      material.uniforms.uCamLocal.value.copy(camLocal.current);
      material.uniforms.uOpacity.value = lineOpacity[key];
      material.visible = lineOpacity[key] > 0.004;
    }

    // Boundaries draw themselves on as the region resolves — feedback that the
    // data is arriving, rather than a fade that could be anything.
    materials.lines.gujaratOutline.uniforms.uProgress.value = smoothstep(0.34, 0.46, p);
    materials.lines.indiaStates.uniforms.uProgress.value = smoothstep(0.46, 0.58, p);

    if (capability.atmosphere) {
      materials.atmosphere.uniforms.uIntensity.value = morph * 0.7 * globeOpacity;
      materials.atmosphere.visible = materials.atmosphere.uniforms.uIntensity.value > 0.004;
    }
  });

  const boundaries: { key: BoundaryKey; geometry: THREE.BufferGeometry }[] = [
    { key: 'graticule', geometry: assets.graticule },
    { key: 'worldBorders', geometry: assets.worldBorders },
    { key: 'indiaStates', geometry: assets.indiaStates },
    { key: 'gujaratDistricts', geometry: assets.gujaratDistricts },
    { key: 'gujaratOutline', geometry: assets.gujaratOutline },
  ];

  return (
    <group ref={groupRef} quaternion={transform.quaternion} position={transform.position}>
      <mesh geometry={assets.surfaceRegion} material={materials.region} frustumCulled={false} renderOrder={1} />
      <mesh geometry={assets.surfaceGlobe} material={materials.globe} frustumCulled={false} renderOrder={0} />

      {boundaries.map(({ key, geometry }) => (
        <lineSegments
          key={key}
          geometry={geometry}
          material={materials.lines[key]}
          frustumCulled={false}
          renderOrder={4}
        />
      ))}

      {capability.atmosphere && (
        <mesh geometry={atmosphereGeometry} material={materials.atmosphere} renderOrder={6} />
      )}
    </group>
  );
}
