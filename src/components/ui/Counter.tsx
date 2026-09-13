import { useEffect, useRef } from 'react';

/**
 * A figure that counts up once, on entry.
 *
 * Counting is doing one job here: it makes the reader watch the number arrive,
 * which is worth a second of attention when the number is the argument. It runs
 * once, never on re-entry, and is skipped entirely under reduced motion — where
 * the final value is simply present from the start.
 */
export function Counter({
  value,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1400,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const format = (n: number) =>
      `${prefix}${n.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.textContent = format(value);
      return;
    }

    node.textContent = format(0);

    let frame = 0;
    let start = 0;

    const step = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / duration, 1);
      // Ease-out quart: most of the count happens early, so the reader sees the
      // magnitude before the last digits settle.
      const eased = 1 - Math.pow(1 - t, 4);
      node.textContent = format(value * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        frame = requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, prefix, suffix, decimals, duration]);

  return (
    <span ref={ref} className="tnum">
      {prefix}
      {value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
