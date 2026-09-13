import { PROJECTION_GLSL, UV_GLSL } from '../../lib/geo';
import { SIMPLEX_3D } from './noise';

/**
 * The cartographic surface.
 *
 * Used by both the regional patch and the globe — the same vertex and fragment
 * program, differing only in the extent of the grid handed to it. That is what
 * makes the hand-off between "map of Gujarat" and "planet" invisible: there is
 * no hand-off, only a change of camera distance and one morph uniform.
 *
 * The treatment is deliberately cartographic rather than photographic. A stock
 * blue-marble texture would read as a globe demo; hypsometric tints, contour
 * banding and printed-atlas water read as a survey sheet, which is the
 * institution this is for.
 *
 * Convention: `position.xy` carries longitude and latitude in **degrees**.
 */

export const TERRAIN_VERT = /* glsl */ `
  #define DEG2RAD 0.01745329251

  ${PROJECTION_GLSL}
  ${SIMPLEX_3D}

  ${UV_GLSL}

  uniform sampler2D uMask;
  uniform float uRelief;      // world units of vertical exaggeration
  uniform int   uOctaves;

  varying vec2  vLonLat;      // radians
  varying vec3  vGeoNormal;
  varying float vHeight;      // 0 .. 1 raw relief
  varying vec3  vViewPos;

  void main() {
    vec2 ll = position.xy * DEG2RAD;
    vLonLat = ll;

    vec3 dir = geoDir(ll);
    float h = terrainFbm(dir * 3.2, uOctaves);
    // Bias upward slightly and sharpen: broad low plains, occasional ranges.
    h = h * 0.5 + 0.5;
    h = pow(clamp(h, 0.0, 1.0), 1.35);
    vHeight = h;

    // Displace land only. Without this the oceans grow mountains, which is the
    // single quickest way to make a procedural globe look unserious.
    float land = texture2D(uMask, geoUV(ll)).r;
    vec3 pos = geoProject(ll, h * uRelief * smoothstep(0.3, 0.7, land));
    vGeoNormal = geoNormal(ll);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const TERRAIN_FRAG = /* glsl */ `
  precision highp float;

  ${UV_GLSL}

  uniform sampler2D uMask;
  uniform vec3  uSunDir;       // in the group's local frame
  uniform float uMorph;
  uniform float uDetail;       // 1 near the ground, 0 from orbit
  uniform float uIndiaFocus;
  uniform float uGujaratFocus;
  uniform float uOpacity;

  varying vec2  vLonLat;
  varying vec3  vGeoNormal;
  varying float vHeight;
  varying vec3  vViewPos;

  // Authored in sRGB, because that is how a cartographer specifies a palette;
  // the shader works in linear light and converts back on output.
  vec3 srgb(vec3 c) { return pow(c, vec3(2.2)); }

  // Hypsometric ramp — the tints of a printed physical atlas: pale plains
  // through sand to a warm stone for the ranges. The steps are close together
  // so that relief reads as texture and the coastline stays the strongest edge
  // on the sheet.
  vec3 landRamp(float h) {
    vec3 c0 = srgb(vec3(0.925, 0.914, 0.874));  // plain   #ECE9DF
    vec3 c1 = srgb(vec3(0.890, 0.867, 0.800));  // upland  #E3DDCC
    vec3 c2 = srgb(vec3(0.831, 0.796, 0.710));  // hill    #D4CBB5
    vec3 c3 = srgb(vec3(0.745, 0.698, 0.600));  // range   #BEB299
    vec3 c = mix(c0, c1, smoothstep(0.30, 0.52, h));
    c = mix(c, c2, smoothstep(0.52, 0.72, h));
    c = mix(c, c3, smoothstep(0.72, 0.92, h));
    return c;
  }

  void main() {
    vec2 uv = geoUV(vLonLat);
    vec3 mask = texture2D(uMask, uv).rgb;
    float land = smoothstep(0.35, 0.65, mask.r);
    float india = smoothstep(0.35, 0.65, mask.g) * land;
    float gujarat = smoothstep(0.35, 0.65, mask.b) * land;

    // --- Water ---------------------------------------------------------------
    // Atlas blue, derived from the logo's blue at low strength so the map and
    // the mark above it are visibly the same institution.
    vec3 deep = srgb(vec3(0.745, 0.847, 0.918));   // #BED8EA
    vec3 shelf = srgb(vec3(0.859, 0.918, 0.957));  // #DBEAF4
    // Fake bathymetry off the mask edge: the coast reads as a shelf, not a cliff.
    float coastal = 1.0 - smoothstep(0.0, 0.5, abs(mask.r - 0.5) * 2.0);
    vec3 water = mix(deep, shelf, coastal * 0.9);

    // --- Land ----------------------------------------------------------------
    vec3 ground = landRamp(vHeight);

    // Contour banding, printed rather than glowing: a faint darkening in a warm
    // brown. Only resolved when the camera is close enough for it to mean
    // something; at planetary range it would be moiré.
    float bands = abs(fract(vHeight * 17.0) - 0.5) * 2.0;
    float contour = (1.0 - smoothstep(0.0, 0.13, bands)) * 0.1 * uDetail * land;
    ground *= 1.0 - contour * vec3(0.8, 0.9, 1.0);

    // --- Regional emphasis ---------------------------------------------------
    // On a light sheet you cannot brighten the subject, so emphasis works the
    // other way: everything that is *not* the subject recedes toward a neutral
    // grey, and the subject keeps its colour. The crisp identification is still
    // carried by the vector outline above.
    float grey = dot(ground, vec3(0.2126, 0.7152, 0.0722));
    vec3 receded = mix(ground, vec3(grey) * 1.03, 0.7);
    ground = mix(ground, receded, (1.0 - india) * uIndiaFocus * 0.75);

    // Gujarat takes a wash of the logo's red — the same red as the datum pin.
    vec3 gujTint = srgb(vec3(0.957, 0.800, 0.765)); // #F4CCC3
    ground = mix(ground, ground * gujTint * 1.08, gujarat * uGujaratFocus * 0.85);

    vec3 base = mix(water, ground, land);

    // --- Light ---------------------------------------------------------------
    // Flat map is evenly lit like a printed sheet. The globe gets a terminator,
    // but a soft one: on a light page a black night side would read as a hole.
    float ndl = dot(normalize(vGeoNormal), normalize(uSunDir));
    float day = smoothstep(-0.3, 0.35, ndl);
    float lighting = mix(1.0, mix(0.5, 1.02, day), uMorph);

    // Slope shading from the relief gradient, so terrain reads before colour does.
    float slope = fwidth(vHeight) * 34.0;
    lighting *= 1.0 - clamp(slope, 0.0, 0.45) * 0.4 * land;

    vec3 colour = base * lighting;

    // The shaded hemisphere cools toward slate rather than going to black.
    colour = mix(colour, colour * srgb(vec3(0.80, 0.86, 0.94)), (1.0 - day) * uMorph);

    // --- Atmospheric depth ---------------------------------------------------
    // Grazing angles wash out toward a pale sky blue — aerial perspective, the
    // cue that sells curvature on a bright ground.
    vec3 viewDir = normalize(-vViewPos);
    float rim = 1.0 - abs(dot(normalize((viewMatrix * vec4(vGeoNormal, 0.0)).xyz), viewDir));
    float haze = pow(clamp(rim, 0.0, 1.0), 3.0) * 0.55 * uMorph;
    colour = mix(colour, srgb(vec3(0.86, 0.93, 0.98)), haze);

    gl_FragColor = vec4(colour, uOpacity);
    #include <colorspace_fragment>
  }
`;
