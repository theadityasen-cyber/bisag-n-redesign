import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { journey } from '../../lib/journeyStore';
import { smoothstep } from '../../lib/math';

/**
 * The datum marker at Gandhinagar.
 *
 * Orientation is the hardest problem in a zoom of this range: by the time the
 * camera is at 30,000 km, nothing on screen tells you where you started. This
 * holds the thread. It appears as the building hands over to the terrain and
 * stays to the end, and it is scaled every frame against camera distance so it
 * occupies a constant angle — the same trick a map scale bar uses, for the same
 * reason.
 *
 * It draws on top of the terrain deliberately: it is annotation, not scenery.
 */

const SCREEN_SIZE = 0.03;

export function OriginMarker() {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  const { geometries, material } = useMemo(() => {
    const accent = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#EA0606'),
      transparent: true,
      opacity: 0,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    return {
      geometries: {
        ring: new THREE.RingGeometry(0.9, 1.0, 64),
        halo: new THREE.RingGeometry(1.85, 1.9, 64),
        stem: new THREE.CylinderGeometry(0.018, 0.018, 2.6, 6),
        pip: new THREE.SphereGeometry(0.09, 10, 8),
      },
      material: accent,
    };
  }, []);

  useEffect(() => {
    return () => {
      for (const g of Object.values(geometries)) g.dispose();
      material.dispose();
    };
  }, [geometries, material]);

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;

    const p = journey.smoothed;
    // In before the campus has finished leaving, so the handover has something
    // continuous to hold on to; dimmed but never gone at planetary range.
    const opacity = smoothstep(0.26, 0.4, p) * (1 - 0.52 * smoothstep(0.8, 1, p));

    group.visible = opacity > 0.005;
    if (!group.visible) return;

    material.opacity = opacity;
    const scale = camera.position.length() * SCREEN_SIZE;
    group.scale.setScalar(scale);
  });

  const ticks = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];

  return (
    <group ref={groupRef} renderOrder={20}>
      <mesh geometry={geometries.ring} material={material} rotation-x={-Math.PI / 2} renderOrder={20} />
      <mesh geometry={geometries.halo} material={material} rotation-x={-Math.PI / 2} renderOrder={20} />
      <mesh geometry={geometries.stem} material={material} position={[0, 1.3, 0]} renderOrder={20} />
      <mesh geometry={geometries.pip} material={material} position={[0, 2.6, 0]} renderOrder={20} />

      {/* Cardinal ticks — they also make the graticule's rotation legible. */}
      {ticks.map((angle) => (
        <mesh
          key={angle}
          material={material}
          renderOrder={20}
          position={[Math.cos(angle) * 1.42, 0, Math.sin(angle) * 1.42]}
          rotation-y={-angle}
        >
          <boxGeometry args={[0.42, 0.012, 0.03]} />
        </mesh>
      ))}
    </group>
  );
}
