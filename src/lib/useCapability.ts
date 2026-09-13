import { createContext, useContext } from 'react';
import type { Capability } from './capability';

/**
 * Capability is detected once at mount and shared by context. Components must
 * never re-detect: a second detection can disagree with the first (the user
 * changes their motion preference, a browser reports a different DPR after a
 * monitor switch) and leave the scene budgeted one way and rendered another.
 */
export const CapabilityContext = createContext<Capability | null>(null);

export function useCapability(): Capability {
  const value = useContext(CapabilityContext);
  if (!value) throw new Error('useCapability must be used inside <CapabilityProvider>');
  return value;
}
