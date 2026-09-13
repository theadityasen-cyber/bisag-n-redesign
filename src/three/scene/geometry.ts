import * as THREE from 'three';

/**
 * Geometry builders for the geographic shell.
 *
 * Every vertex stores longitude and latitude in `position.xy` (degrees) and
 * nothing else. All projection happens in the vertex shader, which means the
 * plane→sphere morph costs one uniform write per frame instead of rewriting
 * hundreds of thousands of vertices on the CPU.
 */

/** A lon/lat grid. `position.xy` = (lon°, lat°); `position.z` is unused. */
export function makeGeoGrid(
  lonMin: number,
  lonMax: number,
  latMin: number,
  latMax: number,
  segX: number,
  segY: number,
): THREE.BufferGeometry {
  const cols = segX + 1;
  const rows = segY + 1;
  const positions = new Float32Array(cols * rows * 3);

  let p = 0;
  for (let y = 0; y < rows; y++) {
    const lat = latMin + ((latMax - latMin) * y) / segY;
    for (let x = 0; x < cols; x++) {
      const lon = lonMin + ((lonMax - lonMin) * x) / segX;
      positions[p++] = lon;
      positions[p++] = lat;
      positions[p++] = 0;
    }
  }

  const indices: number[] = [];
  for (let y = 0; y < segY; y++) {
    for (let x = 0; x < segX; x++) {
      const a = y * cols + x;
      const b = a + 1; // +1 longitude
      const c = a + cols; // +1 latitude
      const d = c + 1;
      // Wound (+lon, +lat) so the face normal comes out along the outward
      // surface normal under *both* projections: up out of the tangent plane,
      // and away from the centre on the sphere. Reverse this and the whole
      // surface is back-face culled — silently, since the boundary lines that
      // sit above it are not.
      indices.push(a, b, c, b, d, c);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(cols * rows > 65535 ? new THREE.Uint32BufferAttribute(indices, 1) : new THREE.Uint16BufferAttribute(indices, 1));
  // The shader relocates every vertex, so the CPU-side bounds are meaningless.
  // A generous manual sphere keeps frustum culling from hiding the surface.
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e4);
  return geometry;
}

/**
 * Meridians and parallels. Present from the regional stage onward: it is the
 * clearest possible signal that the flat sheet and the globe are one object,
 * because you watch the grid itself bend.
 */
export function makeGraticule(stepDeg = 10, densify = 2): THREE.BufferGeometry {
  const verts: number[] = [];
  const along: number[] = [];

  const push = (lon0: number, lat0: number, lon1: number, lat1: number) => {
    verts.push(lon0, lat0, 0, lon1, lat1, 0);
    along.push(0, 0);
  };

  // Meridians, subdivided so they curve rather than chord across the sphere.
  for (let lon = -180; lon < 180; lon += stepDeg) {
    for (let lat = -80; lat < 80; lat += densify) {
      push(lon, lat, lon, lat + densify);
    }
  }
  // Parallels.
  for (let lat = -80; lat <= 80; lat += stepDeg) {
    for (let lon = -180; lon < 180; lon += densify) {
      push(lon, lat, lon + densify, lat);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geometry.setAttribute('aAlong', new THREE.Float32BufferAttribute(along, 1));
  geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 1e4);
  return geometry;
}

/**
 * An orbital arc in the equatorial plane, parameterised by longitude so it
 * lines up with the geographic frame: the point at longitude L sits directly
 * above longitude L on the globe. A full ring is just the 360° case.
 */
export function makeOrbitArc(
  radius: number,
  lonStartDeg = -180,
  lonEndDeg = 180,
  segments = 256,
): THREE.BufferGeometry {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const lon = ((lonStartDeg + ((lonEndDeg - lonStartDeg) * i) / segments) * Math.PI) / 180;
    points.push(new THREE.Vector3(Math.sin(lon) * radius, 0, Math.cos(lon) * radius));
  }
  return new THREE.BufferGeometry().setFromPoints(points);
}

/**
 * A paraboloid reflector opening along +Y, vertex at the origin.
 * `focal` is the focal length; the rim sits r²/4f above the vertex.
 */
export function dishGeometry(radius: number, focal: number, segments = 28) {
  const profile: THREE.Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const r = (i / 14) * radius;
    profile.push(new THREE.Vector2(r, (r * r) / (4 * focal)));
  }
  const geometry = new THREE.LatheGeometry(profile, segments);
  geometry.computeVertexNormals();
  return geometry;
}

/* --------------------------------------------------------------- dispose -- */

/**
 * Explicit teardown. R3F disposes geometries and materials it created from JSX,
 * but anything built imperatively — every geometry in this file, the mask canvas
 * texture, the shader materials — is ours to release, and a hero that leaks a
 * 2048² texture on every route change is a hero that gets blamed for the tab.
 */
export function disposeObject(root: THREE.Object3D) {
  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    mesh.geometry?.dispose?.();

    const material = mesh.material;
    if (!material) return;
    const materials = Array.isArray(material) ? material : [material];
    for (const m of materials) {
      for (const value of Object.values(m as unknown as Record<string, unknown>)) {
        if (value instanceof THREE.Texture) value.dispose();
      }
      const uniforms = (m as THREE.ShaderMaterial).uniforms;
      if (uniforms) {
        for (const u of Object.values(uniforms)) {
          if (u.value instanceof THREE.Texture) u.value.dispose();
        }
      }
      m.dispose();
    }
  });
}
