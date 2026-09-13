import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type * as THREE from 'three';
import { journey, tracks } from '../../lib/journeyStore';
import type { Capability } from '../../lib/capability';

/**
 * Light for the near-ground shell only — the geographic shell is lit inside its
 * own shader, by the sun direction fixed to the Earth's geography.
 *
 * Mid-morning key at about 23° elevation from the west-south-west: the
 * building's entrance elevation and its west flank are lit, shadows run long to
 * the east, and the massing reads in depth. The sky fill is strong and cool, as
 * it is on a clear Gujarat day, so shadows stay open on a light page instead of
 * becoming black shapes.
 *
 * Extents are in world units, where one metre is 1.57 × 10⁻⁵ — hence the very
 * small shadow-camera numbers. They are sized to the campus, not guessed.
 */

const M = 1.5696e-5; // metres → world units

export function Lighting({ capability }: { capability: Capability }) {
  const keyRef = useRef<THREE.DirectionalLight>(null);

  // Shadow rendering is the most expensive thing in the near shell. Once the
  // building is gone there is nothing left to cast, so stop paying for it.
  useFrame(() => {
    const key = keyRef.current;
    if (!key || !capability.shadows) return;
    key.castShadow = tracks.localFade.at(journey.smoothed) > 0.01;
  });

  return (
    <>
      <ambientLight intensity={0.5} color="#e4edf6" />
      <hemisphereLight args={['#cfe2f3', '#b7ab93', 1.05]} />

      <directionalLight
        ref={keyRef}
        position={[-400 * M, 280 * M, 480 * M]}
        intensity={2.5}
        color="#fff3e2"
        castShadow={capability.shadows}
        shadow-mapSize-width={capability.tier === 'high' ? 2048 : 1024}
        shadow-mapSize-height={capability.tier === 'high' ? 2048 : 1024}
        shadow-camera-left={-320 * M}
        shadow-camera-right={320 * M}
        shadow-camera-top={320 * M}
        shadow-camera-bottom={-320 * M}
        shadow-camera-near={40 * M}
        shadow-camera-far={1400 * M}
        shadow-bias={-8e-7}
        shadow-normalBias={3e-6}
      />

      {/* Cool bounce from the opposite quarter, so shadowed faces keep form. */}
      <directionalLight position={[520 * M, 200 * M, -420 * M]} intensity={0.7} color="#d6e6f5" />
    </>
  );
}
