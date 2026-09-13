import { Canvas } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import type { Capability } from '../lib/capability';
import { commit, journey } from '../lib/journeyStore';
import { JourneyScene } from './scene/JourneyScene';

/**
 * WebGL host for the spatial journey.
 *
 * Lazily imported by the hero, so three.js, the R3F runtime and the geographic
 * data are a separate chunk that the document never waits on.
 *
 * Two behaviours worth noting:
 *
 *   - Rendering stops when the hero leaves the viewport. The rest of the page is
 *     eight sections long; continuing to draw a globe behind it would cost the
 *     user battery for something they cannot see.
 *   - Under `prefers-reduced-motion` the scene renders on demand rather than
 *     continuously, and the hero parks it at a fixed frame. The composition is
 *     still there; the motion is not.
 */

export default function JourneyCanvas({
  capability,
  active,
  onReady,
}: {
  capability: Capability;
  active: boolean;
  onReady?: () => void;
}) {
  const [lost, setLost] = useState(false);

  useEffect(() => {
    if (!lost) return;
    // A lost context is not recoverable here without rebuilding every resource;
    // the hero falls back to its static composition instead of showing a blank.
    commit({ ready: false });
  }, [lost]);

  if (lost) return null;

  return (
    <Canvas
      dpr={capability.dpr}
      frameloop={capability.reducedMotion ? 'demand' : active ? 'always' : 'never'}
      gl={{
        antialias: capability.antialias,
        alpha: true,
        powerPreference: 'high-performance',
        // Depth ranges here span many orders of magnitude; stencil buys nothing
        // and costs bandwidth on tiled mobile GPUs.
        stencil: false,
      }}
      camera={{ fov: 38, near: 0.0001, far: 4000, position: [0, 0.0002, 0.0008] }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          setLost(true);
        });
        journey.ready = false;
        onReady?.();
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <JourneyScene capability={capability} />
    </Canvas>
  );
}
