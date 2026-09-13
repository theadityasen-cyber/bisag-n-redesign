import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { chain } from '../../content/capabilities';
import { useReveal } from '../../lib/useReveal';
import { backdrops } from '../../content/imagery';
import { Backdrop } from '../ui/Backdrop';
import { SectionHeader } from '../ui/SectionHeader';

gsap.registerPlugin(ScrollTrigger);

/**
 * Section 04 — satellite and geospatial capabilities.
 *
 * The one section where motion carries an argument rather than an entrance.
 * Capability here is a *chain*: nothing at step three is possible without step
 * two having happened. So the connecting line draws downward, scrubbed to
 * scroll, and each step lights as the line reaches it. The reader's scroll is
 * literally tracing the causality.
 *
 * Under reduced motion the line is simply drawn in full and every step is lit:
 * the sequence is still readable as a numbered list, which is what it is.
 */
export function Capabilities() {
  const ref = useReveal<HTMLElement>({ stagger: 50 });
  const chainRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const list = chainRef.current;
    const line = lineRef.current;
    if (!list || !line) return;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      line.style.transform = 'scaleY(1)';
      for (const step of list.querySelectorAll<HTMLElement>('.chain__step')) {
        step.dataset.lit = 'true';
      }
      return;
    }

    const steps = Array.from(list.querySelectorAll<HTMLElement>('.chain__step'));

    const trigger = ScrollTrigger.create({
      trigger: list,
      start: 'top 72%',
      end: 'bottom 62%',
      scrub: 0.55,
      onUpdate: (self) => {
        line.style.transform = `scaleY(${self.progress})`;
        // A step lights once the line has reached its own position in the list,
        // so the order of illumination is the order of the process.
        const reached = self.progress * steps.length;
        steps.forEach((step, index) => {
          step.dataset.lit = reached > index + 0.35 ? 'true' : 'false';
        });
      },
    });

    return () => trigger.kill();
  }, []);

  return (
    <section ref={ref} id="capabilities" className="section section--capabilities">
      <Backdrop image={backdrops.gandhinagar} placement="right" tone="duotone" />
      <div className="shell">
        <SectionHeader
          index="04"
          label="Capabilities"
          title="Observation is not the product. A decision is."
          lead="Between a satellite pass and a signed file there are four stages, and the institute operates all of them. That is unusual, and it is the reason a ministry can commission an outcome rather than assemble one from vendors."
        />

        <div className="chain__wrap" data-reveal>
          <div className="chain__rail" aria-hidden="true">
            <div ref={lineRef} className="chain__line" />
          </div>

          <ol ref={chainRef} className="chain">
            {chain.map((step) => (
              <li key={step.id} className="chain__step" data-lit="false">
                <div className="chain__marker" aria-hidden="true">
                  <span className="chain__dot" />
                </div>

                <div className="chain__content">
                  <p className="chain__meta">
                    <span className="chain__index mono">{step.index}</span>
                    <span className="label">{step.verb}</span>
                  </p>
                  <h3 className="chain__name">{step.name}</h3>
                  <p className="chain__summary">{step.summary}</p>
                  <ul className="chain__items">
                    {step.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
