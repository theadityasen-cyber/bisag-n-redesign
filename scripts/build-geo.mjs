/**
 * build-geo.mjs
 *
 * Fetches authoritative public-domain boundary data, simplifies it, quantises it
 * and writes compact JSON into src/data/geo/.
 *
 * We check the *output* into the repo so the app has zero network dependencies and
 * no runtime topojson/geojson parsing cost. Re-run with `npm run geo` only when the
 * source data changes.
 *
 * Sources
 *   world      Natural Earth 110m, via world-atlas (public domain)
 *   states     geohacker/india — state-level boundaries
 *   districts  udit-001/india-maps-data — Gujarat district boundaries
 *
 * Output shape: every feature is a list of rings; every ring is a flat
 * [lon, lat, lon, lat, ...] Float array quantised to 3 decimals (~110 m).
 * Flat arrays keep the JSON small and map straight into a Float32Array at runtime.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'src/data/geo');

/* ------------------------------------------------------------------ fetch -- */

async function getJSON(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { redirect: 'follow' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === tries - 1) throw err;
      console.warn(`  retry ${i + 1} for ${url}: ${err.message}`);
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
}

/* --------------------------------------------------------------- topojson -- */

/** Minimal TopoJSON arc decoder — avoids pulling topojson-client in as a dep. */
function decodeArcs(topology) {
  const { scale: [sx, sy] = [1, 1], translate: [tx, ty] = [0, 0] } = topology.transform ?? {};
  return topology.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty];
    });
  });
}

/** Stitch an arc-index list into a single ring of [lon, lat] pairs. */
function ringFromArcs(indices, arcs) {
  const ring = [];
  for (const idx of indices) {
    const arc = idx < 0 ? arcs[~idx].slice().reverse() : arcs[idx];
    // The shared endpoint between consecutive arcs is duplicated — drop it.
    ring.push(...(ring.length ? arc.slice(1) : arc));
  }
  return ring;
}

function topoGeometryToRings(geometry, arcs) {
  if (geometry.type === 'Polygon') return geometry.arcs.map((r) => ringFromArcs(r, arcs));
  if (geometry.type === 'MultiPolygon')
    return geometry.arcs.flatMap((poly) => poly.map((r) => ringFromArcs(r, arcs)));
  return [];
}

/* ---------------------------------------------------------------- geojson -- */

function geoJSONToRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'Polygon') return geometry.coordinates.map((r) => r.map(([a, b]) => [a, b]));
  if (geometry.type === 'MultiPolygon')
    return geometry.coordinates.flatMap((poly) => poly.map((r) => r.map(([a, b]) => [a, b])));
  if (geometry.type === 'LineString') return [geometry.coordinates.map(([a, b]) => [a, b])];
  if (geometry.type === 'MultiLineString') return geometry.coordinates.map((l) => l.map(([a, b]) => [a, b]));
  return [];
}

/* ----------------------------------------------------------- simplify/pack -- */

/** Douglas–Peucker, tolerance in degrees. Iterative to avoid deep recursion. */
function simplify(points, tolerance) {
  if (points.length < 3) return points;
  const sqTol = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];

  while (stack.length) {
    const [first, last] = stack.pop();
    let maxSq = 0;
    let index = -1;
    const [x1, y1] = points[first];
    const [x2, y2] = points[last];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = dx * dx + dy * dy;

    for (let i = first + 1; i < last; i++) {
      const [px, py] = points[i];
      let t = len > 0 ? ((px - x1) * dx + (py - y1) * dy) / len : 0;
      t = t < 0 ? 0 : t > 1 ? 1 : t;
      const ex = x1 + t * dx - px;
      const ey = y1 + t * dy - py;
      const sq = ex * ex + ey * ey;
      if (sq > maxSq) {
        maxSq = sq;
        index = i;
      }
    }

    if (maxSq > sqTol && index !== -1) {
      keep[index] = 1;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

/** Bounding-box diagonal of a ring, in degrees. */
function span(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return Math.hypot(maxX - minX, maxY - minY);
}

/** Simplify, quantise and flatten a set of rings; drops slivers. */
function pack(rings, { tolerance, minPoints = 4, minSpan = 0, closed = true }) {
  const out = [];
  for (const ring of rings) {
    // Offshore islets and administrative slivers cost as much as a whole state
    // once you count rings, and read as noise at every zoom the journey visits.
    if (minSpan > 0 && span(ring) < minSpan) continue;
    let pts = simplify(ring, tolerance);
    if (closed && pts.length >= 3) {
      const [fx, fy] = pts[0];
      const [lx, ly] = pts[pts.length - 1];
      if (fx !== lx || fy !== ly) pts = [...pts, [fx, fy]];
    }
    if (pts.length < minPoints) continue;
    const flat = [];
    for (const [lon, lat] of pts) {
      flat.push(Math.round(lon * 1000) / 1000, Math.round(lat * 1000) / 1000);
    }
    out.push(flat);
  }
  // Largest rings first: lets the renderer budget detail if it ever needs to.
  return out.sort((a, b) => b.length - a.length);
}

function stats(name, rings) {
  const pts = rings.reduce((n, r) => n + r.length / 2, 0);
  console.log(`  ${name.padEnd(12)} ${String(rings.length).padStart(5)} rings  ${String(pts).padStart(7)} points`);
}

/* ------------------------------------------------------------------ build -- */

async function build() {
  await mkdir(OUT, { recursive: true });

  /* --- World: land + country borders ------------------------------------- */
  console.log('world-atlas 110m …');
  const topo = await getJSON('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
  const arcs = decodeArcs(topo);
  const countries = topo.objects.countries.geometries;

  const landRings = [];
  for (const g of countries) landRings.push(...topoGeometryToRings(g, arcs));

  // Antarctica's clipped baseline draws as an ugly straight bar on a globe, and
  // it carries a disproportionate share of the vertex budget. Keep the coastline,
  // drop rings that sit entirely below 60°S.
  const usable = landRings.filter((r) => r.some(([, lat]) => lat > -60));

  const world = {
    land: pack(usable, { tolerance: 0.35, minPoints: 5, minSpan: 1.2 }),
    borders: pack(usable, { tolerance: 0.6, minPoints: 5, minSpan: 2.5 }),
  };
  stats('land', world.land);
  stats('borders', world.borders);

  /* --- India: state boundaries -------------------------------------------- */
  /* State level, not district level. The national stage of the journey shows
     states; 700-odd district outlines at that scale are a grey haze, not a map. */
  console.log('india states …');
  const stateFC = await getJSON(
    'https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson',
  );

  const nameOf = (f) =>
    String(
      f.properties?.ST_NM ??
        f.properties?.st_nm ??
        f.properties?.NAME_1 ??
        f.properties?.name ??
        '',
    );

  const stateRings = [];
  let gujaratFeature = null;
  for (const f of stateFC.features) {
    stateRings.push(...geoJSONToRings(f.geometry));
    if (/gujarat/i.test(nameOf(f))) gujaratFeature = f;
  }

  const india = {
    // State outlines drawn together also describe the national outline; keeping
    // one dataset means the two can never disagree along a shared edge.
    states: pack(stateRings, { tolerance: 0.045, minPoints: 6, minSpan: 0.35 }),
  };
  stats('states', india.states);

  /* --- Gujarat: state outline + districts --------------------------------- */
  console.log('gujarat districts …');
  let districtRings = [];
  try {
    const guj = await getJSON(
      'https://raw.githubusercontent.com/udit-001/india-maps-data/main/geojson/states/gujarat.geojson',
    );
    for (const f of guj.features) districtRings.push(...geoJSONToRings(f.geometry));
  } catch (err) {
    console.warn(`  districts unavailable (${err.message}) — falling back to state outline only`);
  }

  const gujarat = {
    outline: pack(geoJSONToRings(gujaratFeature?.geometry), {
      tolerance: 0.01,
      minPoints: 6,
      minSpan: 0.15,
    }),
    districts: pack(districtRings, { tolerance: 0.018, minPoints: 6, minSpan: 0.15 }),
  };
  stats('guj outline', gujarat.outline);
  stats('districts', gujarat.districts);

  /* --- Write -------------------------------------------------------------- */
  const files = [
    ['world.json', world],
    ['india.json', india],
    ['gujarat.json', gujarat],
  ];
  for (const [name, data] of files) {
    const json = JSON.stringify(data);
    await writeFile(resolve(OUT, name), json);
    console.log(`→ src/data/geo/${name}  ${(json.length / 1024).toFixed(1)} kB`);
  }
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
