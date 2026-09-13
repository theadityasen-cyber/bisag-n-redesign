import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { stages } from '../../content/journey';
import { org } from '../../content/site';
import { setProgress } from '../../lib/journeyStore';
import { useCapability } from '../../lib/useCapability';
import { HeroStatic } from './HeroStatic';
import { JourneyHUD } from './JourneyHUD';
import { StageCopy } from './StageCopy';
import { StageRail } from './StageRail';
import './hero.css';

const JourneyCanvas = lazy(() => import('../../three/JourneyCanvas'));

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 01 — the spatial journey.
 *
 * Scroll is the camera. The section is six viewport-heights tall with a sticky
 * viewport inside it; ScrollTrigger reports normalised progress and nothing
 * else. All interpretation of that number happens in the scene and in the HUD,
 * which is why the DOM here stays this thin.
 *
 * Pinning via `position: sticky` rather than ScrollTrigger's pin: it survives
 * resize, address-bar collapse on mobile and browser find-in-page without a
 * refresh, and it leaves the scrollbar honest about document length.
 */
export function Hero() {
  const capability = useCapability();
  const containerRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const [engaged, setEngaged] = useState(false);

  /* -- Scroll → progress --------------------------------------------------- */

  useEffect(() => {
    const container = containerRef.current;
    if (!container || capability.reducedMotion || !capability.webgl) return;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => setProgress(self.progress),
    });

    setProgress(trigger.progress);
    return () => trigger.kill();
  }, [capability.reducedMotion, capability.webgl]);

  /* -- Render only while visible ------------------------------------------- */

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);

  /* -- Defer WebGL until the first frame has been painted ------------------ */

  useEffect(() => {
    if (!capability.webgl) return;

    // One frame of headroom so the type — the thing actually worth reading —
    // paints before the GPU work starts competing for the main thread. The
    // timeout is the fallback for a document that opens without painting at
    // all: a background tab fires no animation frames, and the scene would
    // otherwise never initialise there.
    const frame = requestAnimationFrame(() => setEngaged(true));
    const timeout = window.setTimeout(() => setEngaged(true), 300);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timeout);
    };
  }, [capability.webgl]);

  if (!capability.webgl || capability.reducedMotion) {
    return <HeroStatic capability={capability} />;
  }

  return (
    <section
      ref={containerRef}
      id="hero"
      className="hero"
      style={{ height: `${stages.length * 105}vh` }}
      aria-label="Spatial journey from the BISAG-N campus to orbit"
    >
      <div ref={viewportRef} className="hero__viewport">
        <div className="hero__canvas" aria-hidden="true">
          {engaged && (
            <Suspense fallback={null}>
              <JourneyCanvas capability={capability} active={active} />
            </Suspense>
          )}
        </div>

        {/* Vignette and a faint raster. Both sit above the canvas and below the
            type, and exist to seat the WebGL image into the page rather than to
            decorate it. */}
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

          <StageCopy />
          <StageRail containerRef={containerRef} />
          <JourneyHUD />
        </div>
      </div>

      {/* The journey's own narrative is delivered visually; this keeps it
          available to assistive technology and to search. */}
      <div className="sr-only">
        <h2>From the campus to orbit</h2>
        <ol>
          {stages.map((stage) => (
            <li key={stage.id}>
              <strong>{stage.title}</strong> {stage.body}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
