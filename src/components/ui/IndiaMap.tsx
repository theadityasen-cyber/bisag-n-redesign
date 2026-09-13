import { useEffect, useMemo, useState } from 'react';
import { nodes } from '../../content/reach';

/**
 * National reach, drawn from the same boundary data the journey uses.
 *
 * Rendered as SVG rather than WebGL: it is a diagram in a document, it must be
 * selectable, printable and legible at any zoom, and it costs nothing on a
 * device that has already spent its GPU budget on the hero. The coordinates are
 * fetched from the chunk the scene already loaded, so it is close to free.
 *
 * Equirectangular with a cosine correction at 22°N — the standard compromise
 * for a single-country reference map, and the same projection family the hero's
 * tangent plane uses, so the two never look like different countries.
 */

const LAT_MID = 22;
const K = 20;
const LON_0 = 67.5;
const LAT_0 = 37.8;

const project = (lon: number, lat: number): [number, number] => [
  (lon - LON_0) * Math.cos((LAT_MID * Math.PI) / 180) * K,
  (LAT_0 - lat) * K,
];

export function IndiaMap() {
  const [rings, setRings] = useState<number[][] | null>(null);

  useEffect(() => {
    let cancelled = false;
    import('../../data/geo/india.json')
      .then((module) => {
        if (!cancelled) setRings((module.default as { states: number[][] }).states);
      })
      // A map that fails to load should cost the reader nothing: the section's
      // argument is in the prose and the timeline beside it.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const path = useMemo(() => {
    if (!rings) return '';
    const parts: string[] = [];
    for (const ring of rings) {
      let d = '';
      for (let i = 0; i < ring.length; i += 2) {
        const [x, y] = project(ring[i], ring[i + 1]);
        d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      parts.push(`${d}Z`);
    }
    return parts.join('');
  }, [rings]);

  const width = (97.6 - LON_0) * Math.cos((LAT_MID * Math.PI) / 180) * K;
  const height = (LAT_0 - 6.4) * K;

  const [hqX, hqY] = project(72.6369, 23.2156);
  const [delX, delY] = project(77.209, 28.6139);

  return (
    <figure className="india" data-loaded={Boolean(rings)}>
      <svg
        viewBox={`-8 -8 ${width + 16} ${height + 16}`}
        className="india__svg"
        role="img"
        aria-label="Map of India showing BISAG-N's headquarters at Gandhinagar, its New Delhi offices, and state capitals reached by its platforms."
      >
        <defs>
          <radialGradient id="india-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(234,6,6,0.22)" />
            <stop offset="100%" stopColor="rgba(234,6,6,0)" />
          </radialGradient>
        </defs>

        {path && (
          <>
            <path
              className="india__land"
              d={path}
              fill="rgba(0,138,204,0.07)"
              stroke="rgba(0,112,173,0.38)"
              strokeWidth="0.5"
              strokeLinejoin="round"
            />

            {/* The institute's own axis: Gandhinagar to the ministry in Delhi. */}
            <path
              className="india__axis"
              d={`M${hqX} ${hqY} Q${(hqX + delX) / 2} ${Math.min(hqY, delY) - 42} ${delX} ${delY}`}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="0.9"
              strokeDasharray="3 3"
              opacity="0.72"
            />

            {nodes.map((node) => {
              const [x, y] = project(node.lon, node.lat);
              const primary = 'primary' in node && node.primary;
              return (
                <g key={node.id} className={`india__node${primary ? ' india__node--primary' : ''}`}>
                  {primary && <circle cx={x} cy={y} r="20" fill="url(#india-glow)" />}
                  <circle cx={x} cy={y} r={primary ? 3 : 1.6} />
                  {primary && (
                    <text x={x + 7} y={y + 2.5} className="india__label">
                      {node.name}
                    </text>
                  )}
                </g>
              );
            })}
          </>
        )}
      </svg>

      <figcaption className="india__caption mono">
        Gandhinagar headquarters and New Delhi offices, with reference points in the states and union
        territories onboarded to the institute's platforms.
      </figcaption>
    </figure>
  );
}
