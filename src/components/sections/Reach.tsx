import { reach, timeline } from '../../content/reach';
import { useReveal } from '../../lib/useReveal';
import { IndiaMap } from '../ui/IndiaMap';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Section 07 — Gujarat and national impact.
 *
 * Closes the loop the hero opened. The journey began at a building in
 * Gandhinagar and ended in geostationary orbit; this section says why that
 * sequence is the institute's actual history and not a visual conceit.
 */
export function Reach() {
  const ref = useReveal<HTMLElement>({ stagger: 60 });

  return (
    <section ref={ref} id="reach" className="section section--reach">
      <div className="shell">
        <SectionHeader index="07" label="Reach" title={reach.title} lead={reach.kicker} />

        <div className="reach">
          <div className="reach__prose" data-reveal>
            {reach.body.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}

            <ol className="timeline">
              {timeline.map((milestone) => (
                <li key={milestone.year} className="timeline__item">
                  <p className="timeline__year mono">{milestone.year}</p>
                  <div>
                    <h3 className="timeline__title">{milestone.title}</h3>
                    <p className="timeline__note">{milestone.note}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="reach__map" data-reveal>
            <IndiaMap />
          </div>
        </div>
      </div>
    </section>
  );
}
