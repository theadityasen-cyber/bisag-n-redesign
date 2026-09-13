/**
 * Section backdrops — satellite and cartographic imagery.
 *
 * Everything here is Earth observation of the places the page is talking
 * about, from public sources, and each image sits behind the section whose
 * subject it shows. Images are pre-toned for the light page (see README) and
 * served at two widths.
 *
 *   gujarat      Terra MODIS true colour, 18 Jan 2024 — Kutch, Saurashtra, Khambhat
 *   india        Blue Marble shaded relief and bathymetry — the base map
 *   gandhinagar  HLS Sentinel-2, 27 Nov 2024, 30 m — the capital's sector grid
 *   nightLights  VIIRS Black Marble, lights only — where the people served are
 *
 * All retrieved through NASA GIBS (Global Imagery Browse Services).
 */

export type BackdropImage = {
  small: string;
  large: string;
  smallWidth: number;
  largeWidth: number;
  /** Intrinsic aspect, so the box is reserved before the file arrives. */
  width: number;
  height: number;
};

const image = (name: string, small: number, large: number, width: number, height: number): BackdropImage => ({
  small: `/imagery/${name}-${small}.webp`,
  large: `/imagery/${name}-${large}.webp`,
  smallWidth: small,
  largeWidth: large,
  width,
  height,
});

export const backdrops = {
  gujarat: image('gujarat-modis', 720, 1440, 1440, 960),
  india: image('india-blue-marble', 640, 1280, 1280, 1088),
  gandhinagar: image('gandhinagar-hls', 640, 1280, 1280, 914),
  nightLights: image('india-night-lights', 640, 1280, 1280, 1200),
} as const;

export const imageryCredit =
  'Imagery: NASA EOSDIS GIBS — Terra MODIS, Blue Marble, VIIRS Black Marble; HLS Sentinel-2 (contains modified Copernicus Sentinel data, 2024).';
