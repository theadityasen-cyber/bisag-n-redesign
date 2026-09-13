import { PROJECTION_GLSL } from '../../lib/geo';

/**
 * Boundary and graticule lines.
 *
 * Drawn as GL_LINES at one device pixel. Thicker lines would need instanced
 * quads and would look like a stylistic choice; a true hairline looks like a
 * survey plot, holds at any pixel ratio, and costs nothing.
 *
 * Two things are handled here that ordinary line rendering gets wrong on a globe:
 *   - lines are lifted off the surface by `uLift`, so they never z-fight with
 *     the terrain they describe;
 *   - lines on the far limb are faded by facing ratio rather than relying on
 *     depth alone, which keeps the limb soft instead of showing a hard cut.
 */

export const LINE_VERT = /* glsl */ `
  #define DEG2RAD 0.01745329251

  ${PROJECTION_GLSL}

  uniform float uLift;
  uniform vec3  uCamLocal;   // camera position in this group's local space

  attribute float aAlong;

  varying float vFacing;
  varying float vAlong;

  void main() {
    vec2 ll = position.xy * DEG2RAD;
    vec3 pos = geoProject(ll, uLift);
    vec3 n = geoNormal(ll);

    vFacing = dot(n, normalize(uCamLocal - pos));
    vAlong = aAlong;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const LINE_FRAG = /* glsl */ `
  precision mediump float;

  uniform vec3  uColour;
  uniform float uOpacity;
  /** 0 draws nothing, 1 draws the whole ring — used to trace boundaries on. */
  uniform float uProgress;

  varying float vFacing;
  varying float vAlong;

  void main() {
    // Soften the limb: lines curving away fade out rather than terminating.
    float facing = smoothstep(-0.02, 0.26, vFacing);
    float draw = step(vAlong, uProgress);
    float alpha = uOpacity * facing * mix(1.0, draw, step(uProgress, 0.999));
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColour, alpha);
  }
`;

/* ---------------------------------------------------------------- glow -- */

/**
 * Atmospheric limb. A back-faced shell with an inverse-fresnel falloff, weighted
 * toward the lit side so the glow follows the terminator instead of ringing the
 * planet uniformly (which is the tell-tale of a decorative atmosphere).
 */
export const ATMOSPHERE_VERT = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  varying vec3 vViewPos;

  void main() {
    vLocalNormal = normalize(position);
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const ATMOSPHERE_FRAG = /* glsl */ `
  precision mediump float;

  uniform vec3  uColour;
  uniform vec3  uSunDir;
  uniform float uIntensity;
  uniform float uPower;

  varying vec3 vNormal;
  varying vec3 vLocalNormal;
  varying vec3 vViewPos;

  void main() {
    vec3 viewDir = normalize(-vViewPos);
    float fresnel = pow(clamp(1.0 - abs(dot(normalize(vNormal), viewDir)), 0.0, 1.0), uPower);

    float ndl = dot(vLocalNormal, normalize(uSunDir));
    float lit = smoothstep(-0.42, 0.34, ndl);

    float alpha = fresnel * uIntensity * mix(0.12, 1.0, lit);
    gl_FragColor = vec4(uColour, clamp(alpha, 0.0, 1.0));
  }
`;
