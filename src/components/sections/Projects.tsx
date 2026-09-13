import { useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import { projects } from '../../content/projects';
import { useHoverIntent } from '../../lib/useHoverIntent';
import { useReveal } from '../../lib/useReveal';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Section 06 — the project record.
 *
 * At rest the register is only names: seven lines that can be read in one
 * glance. Resting the pointer on a project opens it — what it is, who
 * commissioned it, when, and the hard facts — and moving to another project
 * moves the opening with it. Leaving the register returns it to names.
 *
 * Two details keep that from feeling unstable:
 *   - Opening waits for a short dwell, so sweeping across the list on the way
 *     elsewhere does not ripple it open and shut.
 *   - Only one project is open at a time, and whatever the reader is pointing at
 *     stays put. Opening a row collapses the previous one; when that one was
 *     above, everything below it would jump up by its height and the cursor
 *     would land on a different row — which would then open, and so on down
 *     the list. So the previous row closes without animation, and the scroll
 *     position is corrected in the same frame, before paint, so the new row's
 *     header does not move. It then expands downward under the cursor. Leaving
 *     the register at its foot does the same for the content below.
 *
 * Keyboard and touch use the row button as a plain toggle.
 */
export function Projects() {
  const ref = useReveal<HTMLElement>({ stagger: 40 });
  const [open, setOpen] = useState<string | null>(null);
  const hover = useHoverIntent();
  // Which project, if any, the pointer opened. A click on that row confirms
  // what the reader is already looking at rather than asking to close it.
  const hoverOpened = useRef<string | null>(null);

  const rows = useRef(new Map<string, HTMLLIElement>());
  const registerRef = useRef<HTMLDivElement>(null);
  // The element to hold still across the next open/close, and where it was.
  const anchor = useRef<{ element: Element; edge: 'top' | 'bottom'; at: number } | null>(null);

  const holdStill = (element: Element | null | undefined, edge: 'top' | 'bottom' = 'top') => {
    anchor.current = element ? { element, edge, at: element.getBoundingClientRect()[edge] } : null;
  };

  const openProject = (id: string | null, from?: Element | null, edge?: 'top' | 'bottom') => {
    holdStill(from, edge);
    setOpen(id);
  };

  useLayoutEffect(() => {
    const held = anchor.current;
    anchor.current = null;
    if (!held) return;
    const drift = held.element.getBoundingClientRect()[held.edge] - held.at;
    if (Math.abs(drift) > 0.5) window.scrollBy({ top: drift, behavior: 'instant' });
  }, [open]);

  const leaveRegister = (event: PointerEvent<HTMLDivElement>) => {
    const register = event.currentTarget;
    // Only an exit through the foot has content moving under the cursor.
    const exitedBelow = event.clientY >= register.getBoundingClientRect().bottom - 1;
    hover.schedule(
      event,
      () => {
        hoverOpened.current = null;
        openProject(null, exitedBelow ? registerRef.current : null, 'bottom');
      },
      240,
    );
  };

  return (
    <section ref={ref} id="projects" className="section section--projects on-paper">
      <div className="shell">
        <SectionHeader
          index="06"
          label="Projects"
          title="The record."
          lead="Selected platforms, networks and programmes built or operated by the institute."
        />

        <div ref={registerRef} className="register" data-reveal onPointerLeave={leaveRegister}>
          <ul className="register__list">
            {projects.map((project) => {
              const expanded = open === project.id;
              return (
                <li
                  key={project.id}
                  ref={(node) => {
                    if (node) rows.current.set(project.id, node);
                    else rows.current.delete(project.id);
                  }}
                  className="record"
                  data-open={expanded}
                  onPointerEnter={(event) =>
                    hover.schedule(event, () => {
                      hoverOpened.current = project.id;
                      if (open !== project.id) openProject(project.id, rows.current.get(project.id));
                    })
                  }
                >
                  <h3 className="record__heading">
                    <button
                      type="button"
                      className="record__row"
                      aria-expanded={expanded}
                      aria-controls={`project-${project.id}`}
                      onClick={(event) => {
                        const confirmsHover = event.detail > 0 && hoverOpened.current === project.id;
                        hoverOpened.current = null;
                        if (confirmsHover && expanded) return;
                        openProject(expanded ? null : project.id, rows.current.get(project.id));
                      }}
                    >
                      <span className="record__index mono">{project.index}</span>
                      <span className="record__name">{project.name}</span>
                      <span className="record__sign" aria-hidden="true" />
                    </button>
                  </h3>

                  <div id={`project-${project.id}`} className="record__detail">
                    <div className="record__detail-inner">
                      <p className="record__summary">{project.summary}</p>

                      <dl className="record__meta">
                        <div>
                          <dt className="label">Commissioned by</dt>
                          <dd>{project.partner}</dd>
                        </div>
                        <div>
                          <dt className="label">Year</dt>
                          <dd className="mono">{project.year}</dd>
                        </div>
                        <div>
                          <dt className="label">Type</dt>
                          <dd>{project.kind}</dd>
                        </div>
                      </dl>

                      <p className="record__prose">{project.detail}</p>

                      <dl className="record__facts">
                        {project.facts.map((fact) => (
                          <div key={fact.label} className="record__fact">
                            <dt className="label">{fact.label}</dt>
                            <dd className="mono">{fact.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
