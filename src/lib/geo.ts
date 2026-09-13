import * as THREE from 'three';
import { ORIGIN } from '../content/journey';

/**
 * Geographic frame for the journey.
 *
 * ---------------------------------------------------------------------------
 * The idea the whole hero rests on
 * ---------------------------------------------------------------------------
 * The regional map and the globe are not two scenes that cross-fade. They are
 * the *same geometry*, evaluated under two projections:
 *
 *   plane   the tangent plane touching the ellipsoid at Gandhinagar
 *   sphere  the ellipsoid itself
 *
 * A single `uMorph` uniform blends between them in the vertex shader. Near the
 * origin the two projections agree to within a pixel, so at Gujarat scale the
 * morph is invisible; as the camera climbs, the same vertices bend into a globe.
 * That is why the ascent reads as one camera move instead of a cut.
 *
 * The group is transformed so the Gandhinagar surface point lands on the world
 * origin with the local normal pointing along +Y. That gives an ordinary Y-up
 * scene: east is +X, north is −Z, "up" is up. Camera altitude is then literally
 * `camera.position.y`, which is what the HUD reports — no conversion, nothing to
 * disagree about.
 */

export const EARTH_RADIUS_M = 6_371_000;
/** Globe radius in world units. Large enough that Gujarat has room to breathe. */
export const GLOBE_R = 100;
export const M_PER_UNIT = EARTH_RADIUS_M / GLOBE_R;
export const UNITS_PER_M = GLOBE_R / EARTH_RADIUS_M;

const DEG = Math.PI / 180;

/** Unit direction for a lon/lat, in the group's local frame. */
export function lonLatToDir(lonDeg: number, latDeg: number, out = new THREE.Vector3()) {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const c = Math.cos(lat);
  return out.set(c * Math.sin(lon), Math.sin(lat), c * Math.cos(lon));
}

/* ---------------------------------------------------- geostationary link -- */

/**
 * GSAT-30's orbital slot, 83°E. The campus teleport's antennas are aimed at it
 * and the space stage parks its satellite there — one number, so the dishes on
 * the ground and the satellite in orbit cannot disagree.
 */
export const GEO_STATION_LON = 83;

/** Earth's equatorial radius over the geostationary orbit radius. */
const GEO_RADIUS_RATIO = 6378.137 / 42164.17;

/**
 * Look angles from a ground site to a geostationary satellite, in degrees:
 * azimuth clockwise from true north, elevation above the horizon.
 *
 * For Gandhinagar to 83°E this gives about 155° / 60° — south-south-east and
 * steep, which is why the teleport's dishes face the campus forecourt.
 */
export function geostationaryLookAngles(latDeg: number, lonDeg: number, satLonDeg: number) {
  const lat = latDeg * DEG;
  const dLon = (satLonDeg - lonDeg) * DEG;
  const cosCentral = Math.cos(lat) * Math.cos(dLon);
  const sinCentral = Math.sqrt(1 - cosCentral * cosCentral);
  return {
    azimuth: ((Math.atan2(Math.sin(dLon), -Math.sin(lat) * Math.cos(dLon)) / DEG) + 360) % 360,
    elevation: Math.atan2(cosCentral - GEO_RADIUS_RATIO, sinCentral) / DEG,
  };
}

/* -------------------------------------------------- origin tangent frame -- */

export const originDir = lonLatToDir(ORIGIN.lon, ORIGIN.lat);

/** East at the origin: cross(worldUp, normal), which reduces to (z, 0, −x). */
export const originEast = new THREE.Vector3(originDir.z, 0, -originDir.x).normalize();

/** North at the origin completes the right-handed tangent basis. */
export const originNorth = new THREE.Vector3().crossVectors(originDir, originEast).normalize();

/**
 * Transform placing the origin surface point at (0, 0, 0) with normal +Y.
 * Ry(−lon0) swings the meridian to the front; Rx(lat0 − 90°) tips the latitude
 * up to vertical.
 */
export function geoGroupTransform() {
  const q = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(1, 0, 0), ORIGIN.lat * DEG - Math.PI / 2)
    .multiply(
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -ORIGIN.lon * DEG),
    );
  return { quaternion: q, position: new THREE.Vector3(0, -GLOBE_R, 0) };
}

/** Uniform block shared by every object that participates in the morph. */
export function projectionUniforms() {
  return {
    uRadius: { value: GLOBE_R },
    uMorph: { value: 0 },
    uOrigin: { value: new THREE.Vector2(ORIGIN.lon * DEG, ORIGIN.lat * DEG) },
    uOriginDir: { value: originDir.clone() },
    uEast: { value: originEast.clone() },
    uNorth: { value: originNorth.clone() },
  };
}

/**
 * GLSL counterpart of the above. Injected into every material that draws
 * geographic data so the plane and the sphere can never drift apart — there is
 * exactly one implementation of the projection.
 */
export const PROJECTION_GLSL = /* glsl */ `
  uniform float uRadius;
  uniform float uMorph;
  uniform vec2  uOrigin;     // lon, lat in radians
  uniform vec3  uOriginDir;
  uniform vec3  uEast;
  uniform vec3  uNorth;

  vec3 geoDir(vec2 lonLat) {
    float c = cos(lonLat.y);
    return vec3(c * sin(lonLat.x), sin(lonLat.y), c * cos(lonLat.x));
  }

  // Tangent plane at the origin: offsets in radians become arc lengths on the
  // ground, so the plane and the sphere share a scale as well as a tangent point.
  vec3 geoPlane(vec2 lonLat, float elevation) {
    float dLon = lonLat.x - uOrigin.x;
    // Keep the shortest way round, so the far hemisphere does not wrap back.
    dLon = mod(dLon + 3.14159265, 6.28318531) - 3.14159265;
    float dLat = lonLat.y - uOrigin.y;
    vec3 p = uOriginDir * uRadius
           + uEast  * (uRadius * dLon * cos(uOrigin.y))
           + uNorth * (uRadius * dLat);
    return p + uOriginDir * elevation;
  }

  vec3 geoSphere(vec2 lonLat, float elevation) {
    vec3 dir = geoDir(lonLat);
    return dir * (uRadius + elevation);
  }

  // The one function everything geographic goes through.
  vec3 geoProject(vec2 lonLat, float elevation) {
    return mix(geoPlane(lonLat, elevation), geoSphere(lonLat, elevation), uMorph);
  }

  vec3 geoNormal(vec2 lonLat) {
    return normalize(mix(uOriginDir, geoDir(lonLat), uMorph));
  }
`;

/* ------------------------------------------------------------ ring utils -- */

export type Ring = number[]; // flat [lon, lat, lon, lat, ...]

/**
 * Longitudes are unwrapped so a ring that crosses the antimeridian stays
 * continuous instead of drawing a bar across the whole map.
 */
export function unwrapRing(ring: Ring): Ring {
  const out = ring.slice();
  for (let i = 2; i < out.length; i += 2) {
    let d = out[i] - out[i - 2];
    if (d > 180) out[i] -= 360;
    else if (d < -180) out[i] += 360;
  }
  return out;
}

/**
 * Flatten rings into a LineSegments position buffer carrying lon/lat in
 * (x, y). The vertex shader turns that into a position; the CPU never projects
 * anything, so a change of projection costs one uniform write.
 */
export function ringsToSegments(rings: Ring[]): THREE.BufferGeometry {
  let count = 0;
  for (const ring of rings) count += ring.length / 2 - 1;

  const positions = new Float32Array(count * 6);
  // Normalised distance along each ring — lets a material draw the boundary on
  // rather than popping it into existence.
  const along = new Float32Array(count * 2);

  let p = 0;
  let a = 0;
  for (const ring of rings) {
    const n = ring.length / 2;
    for (let i = 0; i < n - 1; i++) {
      positions[p++] = ring[i * 2];
      positions[p++] = ring[i * 2 + 1];
      positions[p++] = 0;
      positions[p++] = ring[(i + 1) * 2];
      positions[p++] = ring[(i + 1) * 2 + 1];
      positions[p++] = 0;
      const t0 = i / (n - 1);
      const t1 = (i + 1) / (n - 1);
      along[a++] = t0;
      along[a++] = t1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
  return geometry;
}

/* ------------------------------------------------------------- land mask -- */

/**
 * Rasterises the boundary data into a single equirectangular RGB mask:
 *
 *   R  world land
 *   G  India
 *   B  Gujarat
 *
 * Three masks in one texture rather than three textures: the globe material
 * needs all three in the same fragment, and this way it samples once.
 *
 * Generated at runtime from the same vector data the boundary lines use, so the
 * fill and the outline can never disagree — and so the build ships no raster.
 */
export function buildMaskTexture(
  world: Ring[],
  india: Ring[],
  gujarat: Ring[],
  width = 2048,
): THREE.CanvasTexture {
  const height = width / 2;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'lighter';

  const draw = (rings: Ring[], colour: string) => {
    ctx.fillStyle = colour;
    for (const raw of rings) {
      const ring = unwrapRing(raw);
      // Draw at three wraps so geometry straddling ±180° is complete on both
      // edges of the texture; the canvas clips what falls outside.
      for (const shift of [-360, 0, 360]) {
        ctx.beginPath();
        for (let i = 0; i < ring.length; i += 2) {
          const x = ((ring[i] + shift + 180) / 360) * width;
          const y = ((90 - ring[i + 1]) / 180) * height;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  };

  draw(world, 'rgb(255,0,0)');
  draw(india, 'rgb(0,255,0)');
  draw(gujarat, 'rgb(0,0,255)');

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.colorSpace = THREE.NoColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Equirectangular UV for a lon/lat — matches `buildMaskTexture`'s layout. */
export const UV_GLSL = /* glsl */ `
  vec2 geoUV(vec2 lonLat) {
    return vec2(lonLat.x / 6.28318531 + 0.5, lonLat.y / 3.14159265 + 0.5);
  }
`;

/* --------------------------------------------------------------- helpers -- */

/** Ground distance per degree of longitude at a latitude, in metres. */
export function metresPerDegLon(latDeg: number) {
  return (Math.PI / 180) * EARTH_RADIUS_M * Math.cos(latDeg * DEG);
}

/** Screen-space scale: how wide the frame is on the ground, in metres. */
export function frameWidthFromDistance(distance: number, fovDeg: number, aspect: number) {
  const vertical = 2 * distance * Math.tan((fovDeg * DEG) / 2);
  return vertical * aspect * M_PER_UNIT;
}

export function distanceForFrameWidth(frameWidthM: number, fovDeg: number, aspect: number) {
  const verticalUnits = frameWidthM * UNITS_PER_M / Math.max(aspect, 0.0001);
  return verticalUnits / (2 * Math.tan((fovDeg * DEG) / 2));
}
