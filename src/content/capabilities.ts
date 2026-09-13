/** Section 04 — satellite and geospatial capabilities. */

export type ChainStep = {
  id: string;
  index: string;
  name: string;
  verb: string;
  summary: string;
  items: string[];
};

/**
 * The signal chain. This is the section's organising idea: capability is not a
 * list of technologies, it is a sequence in which each stage is only useful
 * because the previous one happened. The motion in this section traces that
 * causality downward — it is the one place on the page where animation is
 * carrying an argument rather than decorating one.
 */
export const chain: ChainStep[] = [
  {
    id: 'acquire',
    index: '01',
    name: 'Acquire',
    verb: 'Observation is collected',
    summary: 'Energy reflected or emitted from the ground is recorded — from orbit, from the air, and from the ground itself.',
    items: [
      'Optical and multispectral satellite imagery',
      'Microwave / SAR for cloud-penetrating observation',
      'Aerial and drone photogrammetric survey',
      'GNSS, DGPS and ground control survey',
      'Field telemetry and mobile data collection',
    ],
  },
  {
    id: 'process',
    index: '02',
    name: 'Process',
    verb: 'Observation becomes geometry',
    summary: 'Raw scenes are corrected, placed on the Earth and turned into measurable, comparable surfaces.',
    items: [
      'Radiometric and atmospheric correction',
      'Orthorectification and geo-referencing',
      'Digital Elevation and Surface Model generation',
      'Image classification and feature extraction',
      'Cartographic production to national standards',
    ],
  },
  {
    id: 'model',
    index: '03',
    name: 'Model',
    verb: 'Geometry becomes inference',
    summary: 'Layers are combined and interrogated — what changed, what is at risk, what should go where.',
    items: [
      'Change detection across observation cycles',
      'AI and machine learning feature extraction',
      'Hydrological, terrain and suitability modelling',
      'Spatial statistics and multi-criteria analysis',
      'Scenario comparison for planning decisions',
    ],
  },
  {
    id: 'deliver',
    index: '04',
    name: 'Deliver',
    verb: 'Inference becomes decision',
    summary: 'The result reaches the desk where it is acted on — as a portal, an API, a dashboard or a field application.',
    items: [
      'Web GIS portals and decision support systems',
      'Governance dashboards and monitoring systems',
      'Open geospatial services and APIs',
      'Mobile applications for field verification',
      'Interactive training over the satellite network',
    ],
  },
];
