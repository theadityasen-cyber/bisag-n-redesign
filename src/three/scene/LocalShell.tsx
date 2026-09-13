import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { UNITS_PER_M } from '../../lib/geo';
import { journey, tracks } from '../../lib/journeyStore';
import type { Capability } from '../../lib/capability';
import { campus, teleportFootprint, type Massing } from './massing';
import { disposeObject } from './geometry';
import { Teleport } from './Teleport';

/**
 * The near-ground shell: the building, its campus and the ground it stands on.
 *
 * Modelled in **metres** and then scaled by `UNITS_PER_M` as a group, so the
 * geometry is authored in numbers a person can reason about (a 14 m parapet is
 * written as 14) while still sitting in the same world as a 100-unit planet.
 *
 * Massing is stylised rather than surveyed — a portrait of an institutional
 * building in clear daylight, not a claim about window positions. The light is
 * doing most of the work: a low warm key, a strong cool sky fill, and real
 * shadows, which is what separates architectural photography from a box render.
 */

/** Radius of the ground disc, in metres. */
const GROUND_RADIUS = 4200;

const PALETTE = {
  concrete: '#ebe7df',
  concreteDark: '#c9c2b6',
  glass: '#4d6d86',
  accent: '#0a84c6', // the logo blue, on the fins of the entrance block
  metal: '#a3aab2',
  dark: '#6b6f74',
  ground: '#e2ded4',
  road: '#c9cbce',
  lawn: '#cad6bb',
  tree: '#7f9a6f',
  dish: '#f2f3f1', // antenna white
} as const;

type MaterialKey = keyof typeof PALETTE;

function buildMaterials(): Record<MaterialKey, THREE.MeshStandardMaterial> {
  const make = (
    colour: string,
    roughness: number,
    metalness: number,
    extra: Partial<THREE.MeshStandardMaterialParameters> = {},
  ) =>
    new THREE.MeshStandardMaterial({
      color: new THREE.Color(colour),
      roughness,
      metalness,
      transparent: true,
      opacity: 1,
      ...extra,
    });

  return {
    concrete: make(PALETTE.concrete, 0.88, 0.02),
    concreteDark: make(PALETTE.concreteDark, 0.9, 0.02),
    // Glazing carries a low emissive so the building reads as occupied without
    // becoming a light source.
    // Glazing reflects the sky rather than glowing: in daylight a lit window
    // is the giveaway of a night render.
    glass: make(PALETTE.glass, 0.12, 0.55),
    accent: make(PALETTE.accent, 0.62, 0.1),
    metal: make(PALETTE.metal, 0.42, 0.85),
    dark: make(PALETTE.dark, 0.82, 0.1),
    // A horizontal surface under a 23° sun only ever receives a fraction of the
    // key light, so an honestly-lit ground lands a full tone below the page it
    // has to sit on. A low emissive lifts it to the page's value while leaving
    // the diffuse term — and therefore the shadows — intact.
    ground: make(PALETTE.ground, 0.98, 0, {
      emissive: new THREE.Color('#e9e6de'),
      emissiveIntensity: 0.42,
    }),
    road: make(PALETTE.road, 0.86, 0.04),
    lawn: make(PALETTE.lawn, 1, 0),
    tree: make(PALETTE.tree, 0.95, 0),
    // Reflectors are seen from both faces as the camera moves round them.
    dish: make(PALETTE.dish, 0.48, 0.08, { side: THREE.DoubleSide }),
  };
}

/** Merge every box that shares a material into one geometry — one draw call each. */
function mergeMassing(parts: Massing[]): Map<MaterialKey, THREE.BufferGeometry> {
  const byMaterial = new Map<MaterialKey, THREE.BufferGeometry[]>();

  for (const part of parts) {
    const [w, h, d] = part.size;
    const geometry = new THREE.BoxGeometry(w, h, d);
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(0, part.rotY ?? 0, 0),
    );
    // Boxes are authored by their base, not their centre: floor heights are the
    // number you actually have in your head when placing them.
    matrix.compose(
      new THREE.Vector3(part.at[0], part.at[1] + h / 2, part.at[2]),
      quaternion,
      new THREE.Vector3(1, 1, 1),
    );
    geometry.applyMatrix4(matrix);

    const list = byMaterial.get(part.material) ?? [];
    list.push(geometry);
    byMaterial.set(part.material, list);
  }

  const merged = new Map<MaterialKey, THREE.BufferGeometry>();
  for (const [key, list] of byMaterial) {
    const geometry = mergeGeometries(list, false);
    for (const g of list) g.dispose();
    if (geometry) merged.set(key, geometry);
  }
  return merged;
}

/* -------------------------------------------------------------- antennas -- */

/** A parabolic reflector: y = r² / 4f, revolved. */
/* ----------------------------------------------------------------- trees -- */

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Perimeter planting and courtyard clusters, deterministic across reloads. */
function treeTransforms(count: number) {
  const random = mulberry32(0x8154);
  const out: THREE.Matrix4[] = [];
  const matrix = new THREE.Matrix4();

  for (let i = 0; i < count; i++) {
    const onPerimeter = i % 3 !== 0;
    let x: number;
    let z: number;

    if (onPerimeter) {
      const t = random();
      const side = Math.floor(random() * 4);
      const span = 250;
      const edge = 168 + random() * 26;
      if (side === 0) [x, z] = [(t - 0.5) * span * 2, edge];
      else if (side === 1) [x, z] = [(t - 0.5) * span * 2, -edge];
      else if (side === 2) [x, z] = [edge, (t - 0.5) * span * 2];
      else [x, z] = [-edge, (t - 0.5) * span * 2];
    } else {
      // Clusters in the lawn bands either side of the building, never on the
      // forecourt or the footprint.
      x = (random() < 0.5 ? -1 : 1) * (106 + random() * 54);
      z = (random() - 0.5) * 250;
    }

    // Keep the teleport compound clear: nothing planted inside its fence or on
    // its access road, where a real earth station keeps a clean line of sight.
    const t = teleportFootprint;
    if (x > t.minX && x < t.maxX && z > t.minZ && z < t.maxZ) {
      i--;
      continue;
    }

    const scale = 0.72 + random() * 0.7;
    matrix.compose(
      new THREE.Vector3(x, 0, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), random() * Math.PI),
      new THREE.Vector3(scale, scale * (0.85 + random() * 0.4), scale),
    );
    out.push(matrix.clone());
  }
  return out;
}

/* ----------------------------------------------------------------- shell -- */

export function LocalShell({ capability }: { capability: Capability }) {
  const groupRef = useRef<THREE.Group>(null);

  const { geometries, materials, trees } = useMemo(() => {
    const mats = buildMaterials();
    return {
      geometries: mergeMassing(campus),
      materials: mats,
      trees: treeTransforms(capability.tier === 'low' ? 70 : 190),
    };
  }, [capability.tier]);

  const trunkGeometry = useMemo(() => new THREE.CylinderGeometry(0.32, 0.44, 3.4, 5), []);
  const canopyGeometry = useMemo(
    () => new THREE.IcosahedronGeometry(2.9, capability.tier === 'low' ? 0 : 1),
    [capability.tier],
  );

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const canopyRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const trunk = trunkRef.current;
    const canopy = canopyRef.current;
    if (!trunk || !canopy) return;

    const lift = new THREE.Matrix4();
    trees.forEach((matrix, i) => {
      lift.makeTranslation(0, 1.7, 0);
      trunk.setMatrixAt(i, matrix.clone().multiply(lift));
      lift.makeTranslation(0, 5.2, 0);
      canopy.setMatrixAt(i, matrix.clone().multiply(lift));
    });
    trunk.instanceMatrix.needsUpdate = true;
    canopy.instanceMatrix.needsUpdate = true;
  }, [trees]);

  /* -- Teardown ------------------------------------------------------------ */

  useEffect(() => {
    const group = groupRef.current;
    return () => {
      for (const g of geometries.values()) g.dispose();
      for (const m of Object.values(materials)) m.dispose();
      if (group) disposeObject(group);
    };
  }, [geometries, materials]);

  useEffect(() => {
    return () => {
      trunkGeometry.dispose();
      canopyGeometry.dispose();
    };
  }, [trunkGeometry, canopyGeometry]);

  /* -- Frame --------------------------------------------------------------- */

  const { scene, camera } = useThree();

  // Daylight haze for the near shell. On a dark page the far edge of the ground
  // disc disappeared into the night; on a light one it draws a hard horizon line
  // straight through the headline. Fog dissolves it into the page ground, and
  // it is only installed while this shell is on screen — at planetary scale a
  // fog distance would have to span eleven orders of magnitude.
  const haze = useMemo(() => new THREE.Fog(new THREE.Color('#eef2f6'), 1, 2), []);
  useEffect(() => () => {
    if (scene.fog === haze) scene.fog = null;
  }, [scene, haze]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const fade = tracks.localFade.at(journey.smoothed);
    group.visible = fade > 0.004;
    if (!group.visible) {
      if (scene.fog === haze) scene.fog = null;
      return;
    }

    // Distances track the camera. Fog starts just beyond the site, so the campus
    // is never hazed at any altitude, and completes within a short run past it —
    // never later than the nearest line of sight to the disc edge (4.2 km out) —
    // so the surrounding ground dissolves into the page instead of ending.
    const dist = camera.position.length() / UNITS_PER_M;
    const near = dist + 220;
    const far = Math.max(
      Math.min(near + Math.max(dist * 1.6, 900), Math.hypot(dist, GROUND_RADIUS) * 0.92),
      near + 1, // from very high up the edge bound falls inside `near`; keep the range valid
    );
    haze.near = near * UNITS_PER_M;
    haze.far = far * UNITS_PER_M;
    scene.fog = haze;

    for (const material of Object.values(materials)) {
      material.opacity = fade;
      // Below full opacity the shell must stop writing depth, or the fade leaves
      // a hole in the terrain arriving behind it.
      material.depthWrite = fade > 0.985;
    }
  });

  const shadows = capability.shadows;

  return (
    <group ref={groupRef} scale={UNITS_PER_M}>
      {/* Ground disc, large enough that its edge never enters frame. */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow={shadows} material={materials.ground}>
        <circleGeometry args={[GROUND_RADIUS, 64]} />
      </mesh>

      {[...geometries.entries()].map(([key, geometry]) => (
        <mesh
          key={key}
          geometry={geometry}
          material={materials[key]}
          castShadow={shadows && key !== 'ground' && key !== 'road' && key !== 'lawn'}
          receiveShadow={shadows}
        />
      ))}

      {/* Uplink earth station on the east lawn. */}
      <Teleport materials={materials} shadows={shadows} segments={capability.tier === 'low' ? 20 : 40} />

      {/* Communication mast, standing clear of the west wing. */}
      <group position={[-72, 0, -20]}>
        <mesh material={materials.metal} position={[0, 15, 0]} castShadow={shadows}>
          <cylinderGeometry args={[0.28, 0.62, 30, 6]} />
        </mesh>
        <mesh material={materials.accent} position={[0, 30.4, 0]}>
          <sphereGeometry args={[0.5, 8, 6]} />
        </mesh>
      </group>

      <instancedMesh
        ref={trunkRef}
        args={[trunkGeometry, materials.dark, trees.length]}
        castShadow={shadows}
        frustumCulled={false}
      />
      <instancedMesh
        ref={canopyRef}
        args={[canopyGeometry, materials.tree, trees.length]}
        castShadow={shadows}
        frustumCulled={false}
      />
    </group>
  );
}
