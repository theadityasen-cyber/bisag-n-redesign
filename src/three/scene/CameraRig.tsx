import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { ENTRANCE_OFFSET } from '../../content/journey';
import { GLOBE_R, M_PER_UNIT, UNITS_PER_M } from '../../lib/geo';
import { journey, tracks } from '../../lib/journeyStore';
import { clamp, damp, degToRad, smoothstep } from '../../lib/math';

/**
 * The camera.
 *
 * There is one camera and one continuous path. It never cuts, and no stage owns
 * it. Distance is solved from a target *ground frame width* rather than
 * authored directly, which is what lets six wildly different scales share one
 * curve: the zoom track says "show me 720 km of ground", and the rig works out
 * where to stand.
 *
 * Because frame width is interpolated logarithmically (see `LogSpline`), a
 * constant scroll speed produces a constant rate of magnification — the
 * perceptual condition for a move that feels like one dolly rather than six.
 *
 * This component also owns the telemetry the HUD reports. Altitude is measured,
 * not authored: it is the real distance from the camera to the ellipsoid.
 */

const EARTH_CENTRE = new THREE.Vector3(0, -GLOBE_R, 0);
const FOV = 38;

export function CameraRig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera;
    // Clamp dt so a dropped frame or a backgrounded tab cannot teleport the camera.
    const dt = Math.min(delta, 1 / 24);

    if (!journey.ready) {
      // Land on the right frame immediately when the page opens part-scrolled,
      // instead of flying there from the building.
      journey.smoothed = journey.progress;
      journey.ready = true;
    } else {
      journey.smoothed = damp(journey.smoothed, journey.progress, 5.2, dt);
    }

    const p = journey.smoothed;
    const aspect = size.width / Math.max(size.height, 1);

    // -- Distance ------------------------------------------------------------
    let frameWidth = tracks.frameWidth.at(p);
    // A portrait viewport would otherwise show the specified width across a very
    // narrow screen and an enormous amount of empty ground above and below it.
    // Pulling in keeps the subject the same apparent size on a phone.
    frameWidth *= clamp(aspect / 1.7, 0.48, 1);

    const verticalUnits = (frameWidth * UNITS_PER_M) / Math.max(aspect, 0.35);
    const distance = verticalUnits / (2 * Math.tan(degToRad(FOV) / 2));

    // -- Orientation ---------------------------------------------------------
    const pitch = degToRad(tracks.pitch.at(p));
    const azimuth = degToRad(tracks.azimuth.at(p));
    const cp = Math.cos(pitch);

    // World frame at the origin: +X east, −Z north, +Y up. Azimuth 0 puts the
    // camera due south of the campus, looking north.
    offset.current.set(cp * Math.sin(azimuth), Math.sin(pitch), cp * Math.cos(azimuth));

    // The look target travels twice over the journey. It starts on the building's
    // entrance elevation — the subject of the opening frame — drops to the campus
    // datum by the time the ground is what matters, and then descends toward the
    // planet's centre as the globe forms, so the Earth composes in frame instead
    // of sitting off the bottom edge.
    const approach = 1 - smoothstep(0, 0.22, p);
    const recentre = smoothstep(0.62, 0.96, p);
    target.current.set(
      0,
      -GLOBE_R * 0.86 * recentre + ENTRANCE_OFFSET.up * UNITS_PER_M * approach,
      -ENTRANCE_OFFSET.north * UNITS_PER_M * approach,
    );

    cam.position.copy(offset.current).multiplyScalar(distance).add(target.current);
    cam.lookAt(target.current);

    // -- Depth range ---------------------------------------------------------
    // Tracked to the visible shell. A fixed far plane large enough for the globe
    // would destroy depth precision at the building, where the whole scene is
    // fourteen thousandths of a world unit across.
    cam.fov = FOV;
    cam.near = Math.max(distance * 0.004, 1e-6);
    cam.far = distance * 60 + GLOBE_R * 6 * smoothstep(0.44, 0.56, p);
    cam.updateProjectionMatrix();

    // -- Telemetry -----------------------------------------------------------
    journey.altitude = Math.max((cam.position.distanceTo(EARTH_CENTRE) - GLOBE_R) * M_PER_UNIT, 0);
    journey.frameWidth = frameWidth;
  });

  return null;
}
