import { useEffect, useRef } from 'react';
import { stages } from '../../content/journey';
import { journey } from '../../lib/journeyStore';
import { smoothstep } from '../../lib/math';

/** Asymmetric windows: the outgoing stage has left before the next arrives. */
const FADE = {
  out: (p: number, to: number) => 1 - smoothstep(to - 0.05, to - 0.012, p),
  in: (p: number, from: number) => smoothstep(from + 0.008, from + 0.046, p),
};

/**
 * Stage copy, crossfaded against scroll.
 *
 * Every stage is in the DOM at once and driven by one rAF loop that writes
 * inline styles directly. Routing a 60 Hz value through React state would
 * re-render six blocks of text sixty times a second to change two numbers; this
 * costs nothing and stays perfectly in step with the camera, which reads the
 * same damped progress.
 */
export function StageCopy() {
  const nodes = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    let frame = 0;

    const tick = () => {
      const p = journey.smoothed;

      for (let i = 0; i < stages.length; i++) {
        const node = nodes.current[i];
        if (!node) continue;

        // The first and last stages hold rather than fading at the extremes —
        // otherwise the copy dims as the user reaches either end of the scroll.
        const from = i === 0 ? -0.3 : stages[i].from;
        const to = i === stages.length - 1 ? 1.4 : stages[i].to;

        // Out before in, with a gap. Stage boundaries are shared (one stage's
        // `to` is the next one's `from`), so a symmetric crossfade would leave
        // two headlines at half opacity on top of each other — briefly, and
        // illegibly. The outgoing line clears before the incoming one starts.
        const raw = FADE.out(p, to) * FADE.in(p, from);
        const eased = raw * raw * (3 - 2 * raw);

        node.style.opacity = eased.toFixed(3);
        node.style.transform = `translate3d(0, ${((1 - eased) * 22).toFixed(2)}px, 0)`;
        node.style.visibility = eased > 0.008 ? 'visible' : 'hidden';
        // Only the legible stage is exposed to assistive technology; the full
        // narrative is available as ordered text elsewhere in the hero.
        node.setAttribute('aria-hidden', eased > 0.5 ? 'false' : 'true');
      }

      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="stage-copy">
      {stages.map((stage, i) => (
        <article
          key={stage.id}
          ref={(node) => {
            nodes.current[i] = node;
          }}
          className={`stage-copy__item${i === stages.length - 1 ? ' stage-copy__item--finale' : ''}`}
        >
          <p className="stage-copy__meta">
            <span className="stage-copy__index">{stage.index}</span>
            <span className="stage-copy__kicker">{stage.kicker}</span>
            <span className="stage-copy__place">{stage.place}</span>
          </p>
          <h2 className="stage-copy__title">{stage.title}</h2>
          <p className="stage-copy__body">{stage.body}</p>
        </article>
      ))}
    </div>
  );
}
