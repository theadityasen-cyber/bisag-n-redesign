import { lazy, Suspense, useEffect, useState } from 'react';
import { stages } from '../../content/journey';
import { org } from '../../content/site';
import type { Capability } from '../../lib/capability';
import { journey } from '../../lib/journeyStore';
import './hero.css';

const JourneyCanvas = lazy(() => import('../../three/JourneyCanvas'));

/**
 * The hero without the journey.
 *
 * Served in two situations, and it matters that neither is treated as a
 * degraded experience:
 *
 *   - `prefers-reduced-motion`. The scene still renders — in WebGL, at full
 *     quality — but once, parked at a fixed frame, with the scroll binding
 *     removed entirely. The user gets the photograph instead of the film.
 *   - no WebGL. A drawn graticule stands in.
 *
 * In both cases the six stages become an editorial index. The narrative was
 * never in the motion; the motion was carrying it.
 */

/** Parked near the end of the ascent: the planet, lit, with the campus marked. */
const PARKED_PROGRESS = 0.86;

export function HeroStatic({ capability }: { capability: Capability }) {
  const [engaged, setEngaged] = useState(false);

  useEffect(() => {
    if (!capability.webgl) return;
    journey.progress = PARKED_PROGRESS;
    journey.smoothed = PARKED_PROGRESS;
    journey.ready = true;
    const id = requestAnimationFrame(() => setEngaged(true));
    return () => cancelAnimationFrame(id);
  }, [capability.webgl]);

  return (
    <section id="hero" className="hero hero--static" aria-label="Introduction">
      <div className="hero__viewport hero__viewport--static">
        <div className="hero__canvas" aria-hidden="true">
          {capability.webgl && engaged ? (
            <Suspense fallback={null}>
              <JourneyCanvas capability={capability} active={false} />
            </Suspense>
          ) : (
            <GraticulePoster />
          )}
        </div>
        <div className="hero__veil" aria-hidden="true" />

        <div className="hero__frame shell">
          {/* Institutional identity, over the journey. Once the reader leaves the
              hero it is carried by the masthead instead (see Header). */}
          <header className="hero__identity">
            <p className="label">
              {org.parent} · {org.government}
            </p>
            <h1 className="hero__wordmark">
              {/* The logo beside it already says BISAG-N; kept here for
                  assistive technology and search. */}
              <span className="sr-only">{org.short} — </span>
              <span className="hero__full">{org.full}</span>
            </h1>
          </header>

          <div className="hero__static-copy">
            <p className="hero__thesis serif">{org.thesis}</p>
          </div>
        </div>
      </div>

      <div className="shell hero__index">
        <p className="label">From the campus to orbit</p>
        <ol className="hero__index-list">
          {stages.map((stage) => (
            <li key={stage.id} className="hero__index-item">
              <span className="mono hero__index-num">{stage.index}</span>
              <div>
                <h2 className="hero__index-title">{stage.title}</h2>
                <p className="hero__index-place mono">{stage.place}</p>
                <p className="hero__index-body">{stage.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/**
 * Drawn fallback: a graticule sphere with the campus datum marked. Deliberately
 * a diagram rather than a picture of a globe — it says the same thing the scene
 * says, in the register the rest of the page uses.
 */
function GraticulePoster() {
  const meridians = [0, 1, 2, 3, 4, 5, 6].map((i) => -1 + (i / 3) * 1);
  const parallels = [-60, -40, -20, 0, 20, 40, 60];

  return (
    <svg className="poster" viewBox="-160 -160 320 320" role="presentation" focusable="false">
      <defs>
        <radialGradient id="poster-sky" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d6e4ef" />
        </radialGradient>
      </defs>

      <circle cx="0" cy="0" r="118" fill="url(#poster-sky)" stroke="rgba(0,112,173,0.35)" />

      <g fill="none" stroke="rgba(0,112,173,0.2)" strokeWidth="0.7">
        {meridians.map((k, i) => (
          <ellipse key={i} cx="0" cy="0" rx={Math.abs(k) * 118} ry="118" />
        ))}
        {parallels.map((lat) => {
          const y = -(lat / 90) * 118;
          const rx = Math.cos((lat * Math.PI) / 180) * 118;
          return <ellipse key={lat} cx="0" cy={y} rx={rx} ry={rx * 0.16} />;
        })}
      </g>

      {/* Campus datum, at roughly its place on the visible disc. */}
      <g transform="translate(22,-26)">
        <circle r="16" fill="none" stroke="#EA0606" strokeWidth="0.8" opacity="0.5" />
        <circle r="7" fill="none" stroke="#EA0606" strokeWidth="1.2" />
        <circle r="2" fill="#EA0606" />
      </g>
    </svg>
  );
}
