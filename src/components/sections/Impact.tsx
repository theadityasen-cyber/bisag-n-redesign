import { figures, figuresSource } from '../../content/impact';
import { useReveal } from '../../lib/useReveal';
import { Counter } from '../ui/Counter';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Section 05 — real-world impact. First of two sections on the paper ground.
 *
 * The ground change is structural, not decorative. Everything above this point
 * is the institute describing itself; from here to the end of the project record
 * it is the institute being audited. Evidence belongs on paper — and the
 * inversion gives a long page a spine the reader can feel.
 *
 * Every figure carries its provenance. A number on a government page without a
 * source and a date is decoration, and the whole argument of the section is that
 * these are not decoration.
 */
export function Impact() {
  const ref = useReveal<HTMLElement>({ stagger: 70 });

  return (
    <section ref={ref} id="impact" className="section section--impact on-paper">
      <div className="shell">
        <SectionHeader
          index="05"
          label="Impact"
          title="What a shared base map is worth, stated in figures."
          lead="One platform, built once, in use across the whole of the union government's infrastructure planning."
        />

        <ul className="figures" data-reveal>
          {figures.map((figure) => (
            <li key={figure.id} className="figure">
              <p className="figure__value">
                <Counter
                  value={figure.value}
                  prefix={figure.prefix}
                  suffix={figure.suffix}
                  decimals={figure.decimals}
                />
              </p>
              <h3 className="figure__label">{figure.label}</h3>
              <p className="figure__note">{figure.note}</p>
            </li>
          ))}
        </ul>

        <p className="figures__source mono" data-reveal>
          Source · {figuresSource}
        </p>
      </div>
    </section>
  );
}
