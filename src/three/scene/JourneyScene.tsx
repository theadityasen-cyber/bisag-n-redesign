import { Suspense } from 'react';
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import * as THREE from 'three';
import type { Capability } from '../../lib/capability';
import { journey } from '../../lib/journeyStore';
import { CameraRig } from './CameraRig';
import { GeoShell } from './GeoShell';
import { Lighting } from './Lighting';
import { LocalShell } from './LocalShell';
import { OriginMarker } from './OriginMarker';
import { SpaceShell } from './SpaceShell';

/**
 * Scene composition.
 *
 * Three shells, one camera:
 *   local   the building and its campus, modelled in metres
 *   geo     terrain, boundaries and the globe, under a morphing projection
 *   space   stars, orbits and the downlink
 *
 * They overlap in scroll rather than replacing one another, and the camera
 * never cuts between them. `CameraRig` is mounted first so it writes the frame's
 * damped progress before anything reads it.
 *
 * The geographic shell suspends on its data. Everything else renders
 * immediately, so the opening frame — the building — is on screen without
 * waiting for a quarter of a megabyte of coordinates.
 */

function Renderer({ capability }: { capability: Capability }) {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);
  const advance = useThree((state) => state.advance);

  // Dev-only handle. Debugging a camera that spans six orders of magnitude is
  // guesswork without being able to read its actual position, and `advance`
  // makes the sequence steppable frame by frame instead of only scrubbable.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    (window as unknown as Record<string, unknown>).__journey = {
      gl,
      scene,
      camera,
      advance,
      journey,
      /**
       * Park the journey at a normalised position and settle the scene there.
       *
       * Moves the document scroll as well as the store, because ScrollTrigger
       * owns `progress` and will overwrite anything written behind its back the
       * moment a scroll event lands.
       */
      seek(p: number, frames = 24) {
        const hero = document.getElementById('hero');
        if (hero) {
          const scrollable = hero.offsetHeight - window.innerHeight;
          window.scrollTo({ top: hero.offsetTop + scrollable * p, behavior: 'auto' });
        }
        journey.progress = p;
        journey.smoothed = p;
        journey.ready = true;
        let t = performance.now();
        for (let i = 0; i < frames; i++) {
          t += 16.7;
          journey.progress = p;
          advance(t, true);
        }
      },
    };
  }, [gl, scene, camera, advance]);

  useEffect(() => {
    // Neutral, not ACES. ACES rolls highlights off hard, which on a dark page
    // reads as filmic and on a light page turns white concrete and pale haze
    // into grey. Khronos PBR Neutral leaves base colours at their authored sRGB
    // values up to near-white, so the building sits in the same palette as the
    // page around it.
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 1.0;
    if (capability.shadows) {
      gl.shadowMap.enabled = true;
      gl.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    // Fog would have to span eleven orders of magnitude; atmospheric depth is
    // handled inside the terrain shader instead, where it can be scale-aware.
    scene.fog = null;
  }, [gl, scene, capability.shadows]);

  return null;
}

export function JourneyScene({ capability }: { capability: Capability }) {
  return (
    <>
      <CameraRig />
      <Renderer capability={capability} />
      <Lighting capability={capability} />

      <LocalShell capability={capability} />

      <Suspense fallback={null}>
        <GeoShell capability={capability} />
      </Suspense>

      <OriginMarker />
      <SpaceShell capability={capability} />
    </>
  );
}
