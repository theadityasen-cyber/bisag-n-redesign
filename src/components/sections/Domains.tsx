import { useRef, useState } from 'react';
import { domains } from '../../content/domains';
import { useReveal } from '../../lib/useReveal';
import { backdrops } from '../../content/imagery';
import { Backdrop } from '../ui/Backdrop';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Section 03 — major domains and applications.
 *
 * Twelve domains, each with four applications: forty-eight facts. Laid out flat
 * that is a specification, not a page. The index-and-panel arrangement lets the
 * reader hold all twelve in view — which is itself the message, that the
 * institute's remit is unusually broad — and open exactly the one that concerns
 * them.
 *
 * Built as a real tablist with roving tabindex: the interaction is a selection,
 * so it should behave like one for a keyboard as well as a mouse.
 */
export function Domains() {
  const ref = useReveal<HTMLElement>({ stagger: 45 });
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const move = (delta: number) => {
    const next = (active + delta + domains.length) % domains.length;
    setActive(next);
    tabs.current[next]?.focus();
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        move(-1);
        break;
      case 'Home':
        event.preventDefault();
        setActive(0);
        tabs.current[0]?.focus();
        break;
      case 'End':
        event.preventDefault();
        setActive(domains.length - 1);
        tabs.current[domains.length - 1]?.focus();
        break;
      default:
    }
  };

  const domain = domains[active];

  return (
    <section ref={ref} id="domains" className="section section--domains">
      <Backdrop image={backdrops.india} placement="left" tone="plate" />
      <div className="shell">
        <SectionHeader
          index="03"
          label="Domains"
          title="Twelve sectors, one base map."
          lead="The institute's applications share a single authenticated geospatial database. That is the whole economy of the model: the layer a revenue department needs is the layer a disaster cell already depends on."
        />

        <div className="domains" data-reveal>
          <div
            className="domains__index"
            role="tablist"
            aria-label="Application domains"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
          >
            {domains.map((item, index) => (
              <button
                key={item.id}
                ref={(node) => {
                  tabs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={`domain-tab-${item.id}`}
                aria-selected={index === active}
                aria-controls={`domain-panel-${item.id}`}
                tabIndex={index === active ? 0 : -1}
                className="domains__tab"
                onClick={() => setActive(index)}
                onMouseEnter={() => setActive(index)}
              >
                <span className="domains__code mono">{item.code}</span>
                <span className="domains__name">{item.name}</span>
                <span className="domains__arrow" aria-hidden="true">
                  →
                </span>
              </button>
            ))}
          </div>

          <div
            className="domains__panel"
            role="tabpanel"
            id={`domain-panel-${domain.id}`}
            aria-labelledby={`domain-tab-${domain.id}`}
            tabIndex={0}
            key={domain.id}
          >
            <p className="domains__panel-code mono">
              {domain.code} · {String(active + 1).padStart(2, '0')} of {domains.length}
            </p>
            <h3 className="domains__panel-title">{domain.name}</h3>
            <p className="domains__panel-summary lead">{domain.summary}</p>

            <div className="domains__panel-grid">
              <div>
                <p className="label">Applications</p>
                <ul className="domains__applications">
                  {domain.applications.map((application) => (
                    <li key={application}>{application}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="label">Principal inputs</p>
                <ul className="domains__instruments">
                  {domain.instruments.map((instrument) => (
                    <li key={instrument} className="tag">
                      {instrument}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
