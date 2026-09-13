import { useEffect, useRef } from 'react';

/**
 * Entrance reveal via IntersectionObserver.
 *
 * Sets `data-revealed` on the element and on any `[data-reveal]` descendants,
 * staggered. Deliberately one-shot: content that re-animates every time it
 * re-enters the viewport is noise, and on a long document the user scrolls back
 * up often.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(options?: {
  stagger?: number;
  threshold?: number;
  rootMargin?: string;
}) {
  const ref = useRef<T>(null);
  // Threshold 0 by design. A ratio-based threshold cannot fire for an element
  // taller than the viewport — a 4,600 px section on a 740 px screen can never
  // reach 15% visible — and those are exactly the sections that matter most.
  // The entry point is expressed as a rootMargin instead, which is independent
  // of how tall the section happens to be.
  const { stagger = 70, threshold = 0, rootMargin = '0px 0px -10% 0px' } = options ?? {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.matches('[data-reveal]')
      ? [el, ...Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))]
      : Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'));

    if (!targets.length) return;

    const show = () => {
      targets.forEach((node, i) => {
        node.style.setProperty('--reveal-delay', `${i * stagger}ms`);
        node.dataset.revealed = 'true';
      });
    };

    // Reduced motion: no entrance choreography, but the content must still be
    // visible — reveal it immediately rather than leaving it at opacity 0.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            show();
            observer.disconnect();
            return;
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [stagger, threshold, rootMargin]);

  return ref;
}
