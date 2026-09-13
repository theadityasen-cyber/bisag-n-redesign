# BISAG-N — Homepage

A new homepage for the **Bhaskaracharya National Institute for Space Applications and
Geo-informatics**, an autonomous scientific society under the Ministry of Electronics and
Information Technology, Government of India.

The organising idea:

> From Gujarat to the planet, BISAG-N turns geospatial and space technology into
> real-world intelligence.

```bash
npm install
npm run dev      # vite dev server
npm run build    # typecheck + production build
npm run geo      # regenerate boundary data (only when sources change)
```

---

## 1 · What the site argues

The institute is unusual in three ways, and the page is built to make those three things
land in order rather than to list services:

1. It began as one state's remote-sensing centre in 1997 and became a national institute
   in 2020 — so **scale is the story**, and the hero tells it literally.
2. It operates the *whole* chain, from satellite ground segment to the dashboard a
   district officer opens — so the capability section is a **chain**, not a grid.
3. Its claims are checkable — so the evidence sits on a different ground to the prose.

## 2 · Information architecture

| # | Section | Ground | Job |
|---|---------|--------|-----|
| 01 | Spatial journey | white | Establish place and scale |
| 02 | Mandate | white | What the institute is for — verticals open on hover |
| 03 | Domains | white | Where that applies — twelve sectors |
| 04 | Capabilities | white | How it is actually done — the signal chain |
| 05 | Impact | **paper** | What came of it, with sources |
| 06 | Projects | **paper** | The record — names at rest, detail on hover |
| 07 | Reach | white | Gujarat → the union |
| 08 | Work/Learn | white | What you can do about it; leadership and offices |
| 09 | Notice Board | sunken | What is open right now |

The masthead carries the institute's own top-level destinations (Home, Satellite
Communication, BISAG-N Innovations, Projects, FAQ, Media Library, Notice Board — the
official site's order). Projects and Notice Board resolve to sections on this page; the
others link to their pages on bisag-n.gov.in (`OFFICIAL_SITE` in `src/content/site.ts`).
Below 1180 px they move into a disclosure panel. Returning to the top is a separate,
quiet back-to-top control.

Leadership contacts and the notice are mirrored from the official site. Email addresses
are kept in the obfuscated form the institute publishes; notice status is computed from
the closing time at render.

The two paper sections are the page's spine. Everything above them is the institute
describing itself; those two are the institute being audited, and the change of ground
says so before a word is read.

## 3 · Visual system

- **Brand** — the official BISAG-N / MeitY logo, reproduced as supplied
  (`public/brand/`, pre-scaled to 2× its display height; `src/components/ui/Logo.tsx`).
  It is only ever scaled, and always sits on a light ground.
- **Colour** — a light system taken from the mark. Survey white (`#F5F7FA`) for the page;
  warm archival paper for the two evidence sections, re-pointed through `.on-paper`.
  The two logo colours are split by job:
  **blue** (`#0070AD`, the logo's `#008ACC` darkened for text) for interaction and
  current state; **red** (`#CF0A0A`, from `#EA0606`) for reference marks — section
  numbers, the Gujarat datum, the origin pin and the downlink. Every text token clears
  WCAG AA (4.5:1) on every ground it is used on.
- **Type** — Archivo (display), Inter (body), IBM Plex Mono (labels, telemetry, data),
  Instrument Serif (two statements only: the journey's closing line and the CTA).
- **Rules and grids** — hairlines, numbered section mastheads, tabular figures. The page
  should read like a well-set technical document that happens to have a planet in it.

The campus includes the institute's uplink earth station: four antennas — three 11 m and
one 9.3 m, the sizes BISAG-N publishes — built to scale as Cassegrain reflectors on
king-post mounts and aimed at the computed look angle from Gandhinagar to GSAT-30 at 83°E
(azimuth ≈155°, elevation ≈60°). The same slot is where the space stage parks its
satellite, so the dishes and the orbit agree (`geostationaryLookAngles` in `src/lib/geo.ts`).

The hero follows the same palette: the scene is rendered as a printed atlas plate —
pale hypsometric tints, atlas-blue water, slate boundary ink, a red wash on Gujarat —
rather than a night-sky globe. Two consequences are handled explicitly: the near-ground
shell carries a camera-scaled daylight haze so the ground disc dissolves into the page
instead of drawing a horizon line, and the renderer uses Khronos PBR Neutral tone
mapping, because ACES turns white concrete grey.

### Section imagery

Four sections carry a backdrop of Earth observation showing their own subject, all
retrieved from NASA GIBS (WMS, EPSG:4326) and stored in `public/imagery/` at two widths:

| Section | Image | Layer · extent · date |
|---|---|---|
| 02 Mandate | Gujarat | `MODIS_Terra_CorrectedReflectance_TrueColor` · 67.5–75°E, 20–25°N · 2024-01-18 |
| 03 Domains | India | `BlueMarble_ShadedRelief_Bathymetry` · 60–100°E, 4–38°N |
| 04 Capabilities | Gandhinagar, 30 m | `HLS_S30_Nadir_BRDF_Adjusted_Reflectance` · 72.52–72.80°E, 23.10–23.30°N · 2024-11-27 |
| 08 Work/Learn | India at night | `VIIRS_Black_Marble` · 66–98°E, 6–36°N |

Processing: plates are partially desaturated; the Gandhinagar scene is a blue duotone; the
night-lights image keeps only the lights, as logo-blue ink on white. Each is multiplied
onto the page under a soft elliptical mask.

Their strength is budgeted against legibility rather than set by eye: the smallest text
(mono labels, blue links) has little contrast headroom, so an image may darken the ground
by only about 5% at its darkest. The strengths in `.backdrop--*` were verified by sampling
the composited ground under every text element in those sections, at desktop and phone
widths — the lowest ratio is 4.57:1. Credit is carried in the footer (HLS includes
modified Copernicus Sentinel data).

## 4 · The hero: one camera, six scales

`BUILDING → CAMPUS → GUJARAT → INDIA → EARTH → SPACE`, driven by scroll.

### The idea it rests on

The regional map and the globe are **not two scenes that cross-fade**. They are the same
geometry under two projections, blended by one uniform in the vertex shader:

- `geoPlane()` — the tangent plane touching the ellipsoid at Gandhinagar
- `geoSphere()` — the ellipsoid itself

Near the origin the two agree to within a pixel, so at Gujarat scale the morph is
invisible; as the camera climbs, the same vertices bend into a planet. Terrain, coastlines,
state boundaries and the graticule all go through one `geoProject()` in
`src/lib/geo.ts`, so they cannot drift apart — and you can watch the graticule itself curve,
which is the clearest possible statement that it is one object.

### Continuity of the move

The camera is never authored by position. `CameraRig` solves distance from a target
**ground frame width** — "show me 720 km of ground" — interpolated *logarithmically*
(`LogSpline`), because the eye reads ratio of scale change, not difference. Constant scroll
speed therefore produces a constant rate of magnification: the perceptual condition for one
dolly rather than six animations. Keyframes are fitted with a monotone cubic spline
(Fritsch–Carlson) so there is no change of pace at a keyframe and no overshoot.

The near-ground shell is modelled in metres and scaled by `UNITS_PER_M`; the globe is 100
world units. Camera near/far track the visible shell, because a far plane large enough for
a planet destroys depth precision at a building fourteen thousandths of a unit across.

### Telemetry

The HUD is measured, not authored: altitude is the real camera-to-ellipsoid distance, scale
is derived from the ground width actually in frame, and the projection readout reports the
morph uniform. If the camera and the numbers disagree, the numbers are the bug.

### Orientation

A datum marker sits on Gandhinagar from the campus stage to the end, scaled every frame
against camera distance so it holds a constant angular size. Over six orders of magnitude,
the user needs to be told where they started.

## 5 · Data

No raster assets ship. `scripts/build-geo.mjs` fetches public-domain boundary data,
simplifies it (Douglas–Peucker), drops slivers and quantises to ~110 m, writing compact
flat `[lon, lat, …]` arrays into `src/data/geo/`. At runtime the same vectors are
rasterised once into a single RGB mask — R world land, G India, B Gujarat — so the fill and
the outline can never disagree.

Sources: Natural Earth 110m via `world-atlas`; `geohacker/india` for state boundaries;
`udit-001/india-maps-data` for Gujarat districts.

## 6 · Performance and accessibility

- Capability is detected **once** (`src/lib/capability.ts`) and shared by context; segment
  counts, mask size, shadows, atmosphere, star count and DPR all derive from that one tier.
- three.js, R3F and the geodata are a dynamic import — the document is readable long before
  they land. Initial JS is the React runtime plus ~60 kB of app.
- Rendering stops when the hero leaves the viewport, and shadow casting stops when the
  building does.
- Scroll progress never passes through React state. ScrollTrigger writes a mutable store;
  the frame loop and the HUD read it and write to the DOM directly.
- Every imperatively-created geometry, material and texture is disposed.
- **Reduced motion** gets a genuinely different page, not a disabled one: the scene renders
  once at full quality, parked at the planetary vantage, with the scroll binding removed and
  the six stages presented as an editorial index. Without WebGL, a drawn graticule stands in.
- Domains are a real tablist with roving tabindex; disclosures use `aria-expanded`; the
  journey's narrative is available as ordered text; focus is never suppressed.

## 7 · Layout

```
src/
  content/     all copy and journey keyframes — no strings in components
  data/geo/    generated boundary data
  lib/         projection maths, splines, capability, scroll store
  three/
    shaders/   projection, terrain, lines, noise
    scene/     camera rig, geo shell, local shell, space shell, massing
  components/  layout, hero, sections, ui
  styles/      tokens, base, sections
```

Content is entirely separated from presentation: every section's copy, every figure and
every camera keyframe lives under `src/content` and can be handed to an editor or replaced
with a CMS payload without touching a component.

## 8 · Notes on the content

Copy is drawn from BISAG-N's public material and from reporting on PM GatiShakti. Figures
in section 05 carry their source and date inline; where the public record is thin, the
wording stays general rather than inventing specifics. The building is a stylised portrait
of an institutional block, not a survey of the actual elevation.
