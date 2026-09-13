import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { GEO_STATION_LON, GLOBE_R, geoGroupTransform, originDir } from '../../lib/geo';
import { journey, tracks } from '../../lib/journeyStore';
import { smoothstep } from '../../lib/math';
import { makeOrbitArc } from './geometry';
import type { Capability } from '../../lib/capability';

/**
 * Orbital context: stars, the two orbit regimes the institute actually depends
 * on, and the downlink that closes the narrative.
 *
 * Radii are the real ones. Sun-synchronous sits at 1.13 R⊕ and is nearly polar,
 * which is why it can image the whole country on a repeat cycle; geostationary
 * sits at 6.62 R⊕ in the equatorial plane, which is why a dish on the roof at
 * Gandhinagar can be bolted down and never moved again. Drawing them to scale is
 * the point — a decorative ring at an arbitrary radius would say nothing.
 *
 * Honouring that scale has a consequence worth keeping rather than fixing: at
 * the vantage the journey ends on, the geostationary satellite parked over 83°E
 * is off the top of the frame, because 35,786 km is that far. What stays in
 * frame is its downlink — a single line entering from outside and terminating
 * on the Gandhinagar datum. The absence of the satellite is the scale statement;
 * moving it into shot would be the lie.
 */

const GEO_RADIUS = GLOBE_R * 6.616; // 35,786 km

/**
 * Low orbiters. Three regimes Indian Earth observation actually uses, each at
 * its real altitude and inclination, so the rings sit at different heights and
 * cross the planet at different angles rather than reading as one ring drawn
 * three times.
 *
 * Angular rates follow Kepler (ω ∝ r^-1.5) from a legible base pace, so the
 * lower orbit is visibly the quicker one. Phases are spread so the three are
 * never bunched on one side of the globe.
 */
type Orbit = {
  id: string;
  /** Orbit radius in world units (Earth = GLOBE_R). */
  radius: number;
  /** Tilt of the orbital plane from the equator, radians. */
  inclination: number;
  /** Rotation of the plane about the polar axis, radians. */
  node: number;
  phase: number;
};

const BASE_RATE = 0.14; // rad/s at the ~800 km reference orbit
const REFERENCE_RADIUS = GLOBE_R * 1.126;

const ORBITS: Orbit[] = [
  // Sun-synchronous, ~800 km, 98.4° — the Resourcesat / Oceansat family.
  { id: 'sso-800', radius: GLOBE_R * 1.126, inclination: Math.PI / 2 - 0.14, node: 0.6, phase: 0 },
  // Sun-synchronous, ~505 km, 97.5° — Cartosat's lower, sharper-eyed plane.
  { id: 'sso-505', radius: GLOBE_R * 1.079, inclination: Math.PI / 2 - 0.13, node: 2.25, phase: 2.1 },
  // Low inclination, ~867 km, 20° — Megha-Tropiques, which watches the tropics.
  { id: 'tropical-867', radius: GLOBE_R * 1.136, inclination: 0.35, node: -0.9, phase: 4.2 },
];

const rateFor = (radius: number) => BASE_RATE * Math.pow(REFERENCE_RADIUS / radius, 1.5);


/* ----------------------------------------------------------------- stars -- */

const STAR_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aTwinkle;
  uniform float uTime;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    vAlpha = uOpacity * (0.55 + 0.45 * sin(uTime * 0.6 + aTwinkle * 6.2831));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize;
  }
`;

const STAR_FRAG = /* glsl */ `
  precision mediump float;
  varying float vAlpha;

  void main() {
    // Round, soft-edged points. On a light ground these are not stars in a sky
    // but the dots of a celestial chart — printed ink, so dark and faint.
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d) * vAlpha;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vec3(0.16, 0.25, 0.36), a);
  }
`;

function starGeometry(count: number, radius: number) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const twinkle = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Uniform on the sphere, not uniform in (θ, φ) — otherwise the poles clump.
    const u = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    positions[i * 3] = Math.cos(theta) * r * radius;
    positions[i * 3 + 1] = u * radius;
    positions[i * 3 + 2] = Math.sin(theta) * r * radius;

    // A realistic magnitude distribution: mostly faint, a few bright.
    const m = Math.pow(Math.random(), 3.4);
    sizes[i] = 0.7 + m * 2.9;
    twinkle[i] = Math.random();
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aTwinkle', new THREE.BufferAttribute(twinkle, 1));
  return geometry;
}

/* ------------------------------------------------------------- satellite -- */

function Satellite({ scale }: { scale: number }) {
  return (
    <group scale={scale}>
      <mesh>
        <boxGeometry args={[1, 0.85, 1.1]} />
        <meshBasicMaterial color="#7d8995" />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 1.9, 0, 0]}>
          <boxGeometry args={[2.4, 0.08, 0.9]} />
          <meshBasicMaterial color="#0a6ea8" />
        </mesh>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- shell --- */

export function SpaceShell({ capability }: { capability: Capability }) {
  const transform = useMemo(geoGroupTransform, []);

  const stars = useMemo(() => starGeometry(capability.starCount, 2600), [capability.starCount]);
  const starMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    [],
  );

  const orbitRings = useMemo(() => ORBITS.map((orbit) => makeOrbitArc(orbit.radius, -180, 180, 220)), []);

  const ringMaterials = useMemo(
    () => ({
      sso: new THREE.LineBasicMaterial({ color: '#0070AD', transparent: true, opacity: 0, depthWrite: false }),
      link: new THREE.LineBasicMaterial({ color: '#EA0606', transparent: true, opacity: 0, depthWrite: false }),
    }),
    [],
  );

  const starsRef = useRef<THREE.Points>(null);
  const orbiterRefs = useRef<(THREE.Group | null)[]>([]);
  const geoSatRef = useRef<THREE.Group>(null);

  /** The downlink: geostationary satellite to the campus it serves. */
  const linkGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
    return geometry;
  }, []);

  // THREE.Line has no clean intrinsic element in R3F's JSX namespace (`<line>`
  // collides with SVG), so the three line objects are built here and mounted
  // with <primitive>.
  const lines = useMemo(
    () => ({
      orbits: orbitRings.map((ring) => new THREE.Line(ring, ringMaterials.sso)),
      link: new THREE.Line(linkGeometry, ringMaterials.link),
    }),
    [orbitRings, linkGeometry, ringMaterials],
  );

  useEffect(() => {
    for (const line of [...lines.orbits, lines.link]) line.frustumCulled = false;
  }, [lines]);

  useEffect(() => {
    return () => {
      stars.dispose();
      starMaterial.dispose();
      for (const ring of orbitRings) ring.dispose();
      linkGeometry.dispose();
      for (const m of Object.values(ringMaterials)) m.dispose();
    };
  }, [stars, starMaterial, orbitRings, linkGeometry, ringMaterials]);

  useFrame((state) => {
    const p = journey.smoothed;
    const fade = tracks.spaceFade.at(p);
    const time = state.clock.elapsedTime;

    starMaterial.uniforms.uTime.value = time;
    starMaterial.uniforms.uOpacity.value = fade * 0.38;
    if (starsRef.current) starsRef.current.visible = fade > 0.004;

    // Orbital hardware arrives after the planet has read as a planet, so the
    // rings are understood as orbits rather than as graphics on a sphere.
    const hardware = fade * smoothstep(0.74, 0.88, p);
    // Three rings share one material; a little lighter than the single ring was,
    // so together they read as structure around the planet, not a cage.
    ringMaterials.sso.opacity = hardware * 0.42;

    // The low orbiters move; the geostationary one does not. That difference is
    // the entire reason both kinds exist, so it is worth showing rather than stating.
    ORBITS.forEach((orbit, i) => {
      const satellite = orbiterRefs.current[i];
      if (!satellite) return;
      const angle = orbit.phase + time * rateFor(orbit.radius);
      satellite.position.set(Math.sin(angle) * orbit.radius, 0, Math.cos(angle) * orbit.radius);
      satellite.visible = hardware > 0.02;
    });

    if (geoSatRef.current) {
      const lon = (GEO_STATION_LON * Math.PI) / 180;
      geoSatRef.current.position.set(Math.sin(lon) * GEO_RADIUS, 0, Math.cos(lon) * GEO_RADIUS);
      geoSatRef.current.visible = hardware > 0.02;
    }

    if (geoSatRef.current) {
      const positions = linkGeometry.getAttribute('position') as THREE.BufferAttribute;
      const sat = geoSatRef.current.position;
      positions.setXYZ(0, sat.x, sat.y, sat.z);
      // Terminates on the campus datum, in this group's local frame.
      positions.setXYZ(1, originDir.x * GLOBE_R, originDir.y * GLOBE_R, originDir.z * GLOBE_R);
      positions.needsUpdate = true;
      ringMaterials.link.opacity = hardware * 0.4 * (0.55 + 0.45 * Math.sin(time * 1.2));
      lines.link.visible = hardware > 0.04;
    }
  });

  return (
    <>
      <points ref={starsRef} geometry={stars} material={starMaterial} frustumCulled={false} />

      <group quaternion={transform.quaternion} position={transform.position}>
        {/* Low orbits: each plane is rotated about the pole (node), then tilted
            from the equator (inclination). */}
        {ORBITS.map((orbit, i) => (
          <group key={orbit.id} rotation={[0, orbit.node, 0]}>
            <group rotation={[orbit.inclination, 0, 0]}>
              <primitive object={lines.orbits[i]} />
              <group
                ref={(node) => {
                  orbiterRefs.current[i] = node;
                }}
              >
                <Satellite scale={GLOBE_R * 0.012} />
              </group>
            </group>
          </group>
        ))}

        {/* Geostationary: equatorial by definition, and off-frame by distance. */}
        <group>
          <group ref={geoSatRef}>
            <Satellite scale={GLOBE_R * 0.045} />
          </group>
          <primitive object={lines.link} />
        </group>
      </group>
    </>
  );
}
