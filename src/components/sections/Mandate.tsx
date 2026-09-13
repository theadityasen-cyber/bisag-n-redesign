import { useRef, useState } from 'react';
import { centres, mandate, verticals } from '../../content/mandate';
import { org } from '../../content/site';
import { useHoverIntent } from '../../lib/useHoverIntent';
import { useReveal } from '../../lib/useReveal';
import { backdrops } from '../../content/imagery';
import { Backdrop } from '../ui/Backdrop';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Section 02 — what BISAG-N does.
 *
 * The three verticals are an accordion rather than three open columns. Each one
 * has a headline claim and a paragraph of substantiation; showing all three
 * paragraphs at once turns a structure into a wall. One open at a time keeps
 * the comparison — three names, three summaries — visible while the reader
 * drills into whichever they came for.
 *
 * With a mouse, resting on a vertical opens it — the same result as pressing its
 * toggle. The last one opened stays open when the pointer leaves: the columns
 * sit side by side, so nothing moves under the cursor, but collapsing on exit
 * would make the rest of the page jump every time the reader moved on.
 */
export function Mandate() {
  const ref = useReveal<HTMLElement>({ stagger: 60 });
  const [open, setOpen] = useState(verticals[0].id);
  const hover = useHoverIntent();
  // Which vertical, if any, the pointer opened. A click landing on that one is
  // the reader confirming what they are already looking at, not asking to close.
  const hoverOpened = useRef<string | null>(null);

  return (
    <section ref={ref} id="mandate" className="section section--mandate">
      <Backdrop image={backdrops.gujarat} placement="right" tone="plate" />
      <div className="shell">
        <SectionHeader
          index="02"
          label="Mandate"
          title={mandate.statement}
          lead={org.status}
        />

        <div className="mandate__body grid" data-reveal>
          {mandate.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="mandate__para">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="verticals" data-reveal>
          <p className="label verticals__legend">Three areas of practice</p>

          <div className="verticals__list">
            {verticals.map((vertical) => {
              const expanded = open === vertical.id;
              return (
                <article
                  key={vertical.id}
                  className="vertical"
                  data-open={expanded}
                  onPointerEnter={(event) =>
                    hover.schedule(event, () => {
                      hoverOpened.current = vertical.id;
                      setOpen(vertical.id);
                    })
                  }
                  onPointerLeave={hover.cancel}
                >
                  <h3 className="vertical__heading">
                    <button
                      type="button"
                      className="vertical__toggle"
                      aria-expanded={expanded}
                      aria-controls={`vertical-${vertical.id}`}
                      onClick={(event) => {
                        const confirmsHover = event.detail > 0 && hoverOpened.current === vertical.id;
                        hoverOpened.current = null;
                        if (confirmsHover && expanded) return;
                        setOpen(expanded ? '' : vertical.id);
                      }}
                    >
                      <span className="vertical__index mono">{vertical.index}</span>
                      <span className="vertical__name">{vertical.name}</span>
                      <span className="vertical__sign" aria-hidden="true" />
                    </button>
                  </h3>

                  <p className="vertical__summary">{vertical.summary}</p>

                  <div id={`vertical-${vertical.id}`} className="vertical__detail" hidden={!expanded}>
                    <p className="vertical__prose">{vertical.detail}</p>
                    <ul className="vertical__points">
                      {vertical.points.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="centres" data-reveal>
          <p className="label">Functional units</p>
          <ul className="centres__list">
            {centres.map((centre) => (
              <li key={centre.name} className="centre">
                <h3 className="centre__name">{centre.name}</h3>
                <p className="centre__note">{centre.note}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
