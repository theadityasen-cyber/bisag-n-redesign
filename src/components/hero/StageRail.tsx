import { useEffect, useState, type RefObject } from 'react';
import { stages } from '../../content/journey';
import { subscribe, journey } from '../../lib/journeyStore';

/**
 * The stage rail.
 *
 * Does two jobs at once, which is why it earns its place over a plain progress
 * bar: it tells you which of the six scales you are at, and it lets you go
 * straight to any of them. A six-viewport scroll without a way to jump is a
 * corridor; with one, it is a table of contents.
 *
 * It re-renders only when the stage index actually changes — six times across
 * the whole journey — so it can be ordinary React state.
 */
export function StageRail({ containerRef }: { containerRef: RefObject<HTMLElement> }) {
  const [active, setActive] = useState(journey.stage);

  useEffect(() => subscribe((state) => setActive(state.stage)), []);

  const goTo = (index: number) => {
    const container = containerRef.current;
    if (!container) return;

    const stage = stages[index];
    const scrollable = container.offsetHeight - window.innerHeight;
    // Land just inside the stage's window rather than on its boundary, so the
    // copy is fully resolved on arrival instead of mid-crossfade.
    const target = container.offsetTop + scrollable * Math.min(stage.from + 0.035, 0.995);

    window.scrollTo({
      top: target,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    });
  };

  return (
    <nav className="rail" aria-label="Journey stages">
      <ol className="rail__list">
        {stages.map((stage, index) => {
          const state = index === active ? 'current' : index < active ? 'past' : 'ahead';
          return (
            <li key={stage.id} className="rail__item" data-state={state}>
              <button
                type="button"
                className="rail__button"
                onClick={() => goTo(index)}
                aria-current={index === active ? 'step' : undefined}
              >
                <span className="rail__index">{stage.index}</span>
                <span className="rail__tick" aria-hidden="true" />
                <span className="rail__name">{stage.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
