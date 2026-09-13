import { useCallback, useEffect, useRef } from 'react';
import type { PointerEvent } from 'react';

/**
 * Hover intent for disclosures.
 *
 * Opening on raw `pointerenter` makes a panel flicker open and shut as the
 * cursor merely crosses it on the way somewhere else. A short dwell before
 * committing — long enough to ignore a pass-through, short enough to feel
 * immediate — removes that without making the reader wait.
 *
 * Only mouse pointers count. On touch there is no hover, and a synthetic
 * `pointerenter` before the tap would open the panel only for the tap's click
 * to act on it a second time.
 */
export function useHoverIntent(delay = 110) {
  const timer = useRef<number>();

  const cancel = useCallback(() => window.clearTimeout(timer.current), []);

  const schedule = useCallback(
    (event: PointerEvent, action: () => void, wait = delay) => {
      if (event.pointerType !== 'mouse') return;
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(action, wait);
    },
    [delay],
  );

  useEffect(() => cancel, [cancel]);

  return { schedule, cancel };
}
