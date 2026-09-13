import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ORIGIN } from '../../content/journey';
import { GEO_STATION_LON, geostationaryLookAngles } from '../../lib/geo';
import { dishGeometry } from './geometry';
import { uplinkAntennas } from './massing';

/**
 * The teleport's uplink antennas.
 *
 * Each is a Cassegrain reflector on an elevation-over-azimuth king-post mount,
 * built to its real diameter and aimed at the real look angle from Gandhinagar
 * to the geostationary slot the space stage ends on. Nothing here is animated:
 * an uplink dish that moves is a dish that has lost its satellite.
 *
 * Geometry is shared per diameter and merged per material, so the four
 * antennas cost six draw calls, not forty.
 */

const LOOK = geostationaryLookAngles(ORIGIN.lat, ORIGIN.lon, GEO_STATION_LON);
const DEG = Math.PI / 180;

type Materials = {
  dish: THREE.Material;
  metal: THREE.Material;
};

/** A cylinder spanning two points, for struts and axles. */
function strut(from: THREE.Vector3, to: THREE.Vector3, radius: number) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 6, 1);
  geometry.applyQuaternion(
    new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize()),
  );
  const middle = from.clone().add(to).multiplyScalar(0.5);
  geometry.translate(middle.x, middle.y, middle.z);
  return geometry;
}

/** Elevation axle height above the footing, in metres. */
const axleHeight = (d: number) => 0.5 * d + 0.6;
/** Reflector vertex sits this far in front of the elevation axle. */
const vertexOffset = (d: number) => 0.08 * d;

function buildAntenna(diameter: number, segments: number) {
  const r = diameter / 2;
  const focal = diameter * 0.34;
  const lift = vertexOffset(diameter);

  /* -- Reflector assembly, in the elevation frame (+Y = boresight) --------- */
  const reflector = dishGeometry(r, focal, segments);
  reflector.translate(0, lift, 0);

  const subY = lift + focal * 0.84;
  const subR = diameter * 0.055;
  const subreflector = new THREE.CylinderGeometry(subR * 0.55, subR, subR * 0.45, 16);
  subreflector.translate(0, subY, 0);

  const hornHeight = focal * 0.3;
  const horn = new THREE.CylinderGeometry(diameter * 0.03, diameter * 0.05, hornHeight, 12);
  horn.translate(0, lift + hornHeight / 2, 0);

  const struts = [0, 1, 2, 3].map((k) => {
    const angle = Math.PI / 4 + (k * Math.PI) / 2;
    const rr = r * 0.9;
    const rim = new THREE.Vector3(Math.cos(angle) * rr, lift + (rr * rr) / (4 * focal), Math.sin(angle) * rr);
    return strut(rim, new THREE.Vector3(0, subY - subR * 0.2, 0), diameter * 0.006);
  });

  const face = mergeGeometries([reflector, subreflector, horn, ...struts]);
  for (const g of [reflector, subreflector, horn, ...struts]) g.dispose();

  /* -- Back structure, elevation frame ------------------------------------- */
  const cone = new THREE.CylinderGeometry(diameter * 0.26, diameter * 0.09, lift, 16, 1, true);
  cone.translate(0, lift / 2, 0);
  const hub = new THREE.CylinderGeometry(diameter * 0.09, diameter * 0.09, diameter * 0.1, 16);
  hub.translate(0, -diameter * 0.02, 0);
  const back = mergeGeometries([cone, hub]);
  cone.dispose();
  hub.dispose();

  /* -- Mount, azimuth frame (origin on the footing top) -------------------- */
  const h = axleHeight(diameter);
  const turntableY = h - 0.24 * diameter;
  const post = new THREE.CylinderGeometry(diameter * 0.07, diameter * 0.09, turntableY, 16);
  post.translate(0, turntableY / 2, 0);
  const turntable = new THREE.CylinderGeometry(diameter * 0.12, diameter * 0.12, diameter * 0.06, 20);
  turntable.translate(0, turntableY + diameter * 0.03, 0);
  const arms = [-1, 1].map((side) => {
    const arm = new THREE.BoxGeometry(diameter * 0.04, h - turntableY, diameter * 0.16);
    arm.translate(side * diameter * 0.15, turntableY + (h - turntableY) / 2 + diameter * 0.03, 0);
    return arm;
  });
  const axle = strut(
    new THREE.Vector3(-diameter * 0.17, h, 0),
    new THREE.Vector3(diameter * 0.17, h, 0),
    diameter * 0.025,
  );
  const mount = mergeGeometries([post, turntable, ...arms, axle]);
  for (const g of [post, turntable, ...arms, axle]) g.dispose();

  return { face, back, mount, axleHeight: h };
}

export function Teleport({
  materials,
  shadows,
  segments,
}: {
  materials: Materials;
  shadows: boolean;
  segments: number;
}) {
  const kits = useMemo(() => {
    const byDiameter = new Map<number, ReturnType<typeof buildAntenna>>();
    for (const { diameter } of uplinkAntennas) {
      if (!byDiameter.has(diameter)) byDiameter.set(diameter, buildAntenna(diameter, segments));
    }
    return byDiameter;
  }, [segments]);

  useEffect(
    () => () => {
      for (const kit of kits.values()) {
        kit.face.dispose();
        kit.back.dispose();
        kit.mount.dispose();
      }
    },
    [kits],
  );

  // Azimuth is clockwise from north; the scene has north on −Z, so a yaw of
  // −azimuth turns local −Z onto the bearing. Elevation then tips the boresight
  // (+Y) forward from vertical.
  const yaw = -LOOK.azimuth * DEG;
  const tilt = -(90 - LOOK.elevation) * DEG;

  return (
    <group>
      {uplinkAntennas.map(({ id, diameter, at: [x, z] }) => {
        const kit = kits.get(diameter)!;
        return (
          <group key={id} position={[x, 0.8, z]} rotation={[0, yaw, 0]}>
            <mesh geometry={kit.mount} material={materials.dish} castShadow={shadows} receiveShadow={shadows} />
            <group position={[0, kit.axleHeight, 0]} rotation={[tilt, 0, 0]}>
              <mesh geometry={kit.back} material={materials.metal} castShadow={shadows} />
              <mesh geometry={kit.face} material={materials.dish} castShadow={shadows} receiveShadow={shadows} />
            </group>
          </group>
        );
      })}
    </group>
  );
}
