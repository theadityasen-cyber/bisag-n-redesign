import { useEffect, useState } from 'react';
import { useCapability } from '../../lib/useCapability';

/**
 * Back to top.
 *
 * Quiet by design: it appears only once the reader is well past the journey,
 * sits in the corner at the weight of a hairline, and goes away again near the
 * top. Under reduced motion the return is a jump, not a glide back through six
 * orders of magnitude of camera move.
 */
export function ScrollTop() {
  const { reducedMotion } = useCapability();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.5);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toTop = () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    // Keyboard users would otherwise be left focused on a control that has just
    // hidden itself, somewhere at the bottom of the document.
    document.querySelector<HTMLElement>('.masthead__brand')?.focus({ preventScroll: true });
  };

  return (
    <button
      type="button"
      className="scroll-top"
      data-visible={visible}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      onClick={toTop}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
        <path d="M7 12V2.5M2.5 6.5 7 2l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    </button>
  );
}
