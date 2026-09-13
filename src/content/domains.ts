/** Section 03 — major domains and applications. */

export type Domain = {
  id: string;
  code: string;
  name: string;
  summary: string;
  applications: string[];
  /** Sensing and data inputs the domain leans on — shown as the "instruments" row. */
  instruments: string[];
};

export const domains: Domain[] = [
  {
    id: 'agriculture',
    code: 'AGR',
    name: 'Agriculture',
    summary:
      'Season-by-season visibility of what is sown, where it is stressed and what it will yield — at a resolution policy can act on.',
    applications: [
      'Crop inventory and sowing progress',
      'Yield estimation and crop-cutting support',
      'Irrigation command area performance',
      'Horticulture and plantation mapping',
    ],
    instruments: ['Optical EO', 'Multispectral', 'Field telemetry'],
  },
  {
    id: 'water',
    code: 'WTR',
    name: 'Water Resources',
    summary:
      'Surface and sub-surface water treated as one accounted system, from the ridge line down to the field channel.',
    applications: [
      'Watershed delineation and treatment planning',
      'Groundwater prospect and recharge mapping',
      'Canal network and command area mapping',
      'Reservoir and water body monitoring',
    ],
    instruments: ['DEM', 'Optical EO', 'Hydrological models'],
  },
  {
    id: 'forestry',
    code: 'FOR',
    name: 'Forestry & Ecology',
    summary:
      'Forest cover measured rather than estimated, with change detected between cycles instead of discovered after the fact.',
    applications: [
      'Forest cover and density change detection',
      'Fire mapping and burn-scar assessment',
      'Working plan and compartment mapping',
      'Wildlife corridor and habitat analysis',
    ],
    instruments: ['Optical EO', 'Thermal', 'Change detection'],
  },
  {
    id: 'disaster',
    code: 'DIS',
    name: 'Disaster Management',
    summary:
      'The same base map used for planning becomes the operational picture during an event — no handover, no reconciliation.',
    applications: [
      'Flood inundation mapping and damage assessment',
      'Cyclone track and storm-surge exposure',
      'Drought monitoring and declaration support',
      'Post-event recovery and compensation support',
    ],
    instruments: ['SAR', 'Optical EO', 'DEM', 'SATCOM'],
  },
  {
    id: 'land',
    code: 'LND',
    name: 'Land Records & Revenue',
    summary:
      'Cadastral records reconciled with ground truth, so that ownership, taxation and planning read from the same geometry.',
    applications: [
      'Cadastral and village map digitisation',
      'Survey reconciliation and parcel geo-referencing',
      'Property records and land use classification',
      'Revenue administration support systems',
    ],
    instruments: ['Photogrammetry', 'GNSS / DGPS', 'Cadastral survey'],
  },
  {
    id: 'urban',
    code: 'URB',
    name: 'Urban & Rural Planning',
    summary:
      'Development plans built on current, measured conditions rather than on the last decade’s survey drawing.',
    applications: [
      'Master plans and town planning schemes',
      'Gram panchayat development planning',
      'Urban growth and built-up change analysis',
      'Property tax and municipal asset mapping',
    ],
    instruments: ['High-res EO', 'Photogrammetry', 'Drone survey'],
  },
  {
    id: 'infrastructure',
    code: 'INF',
    name: 'Infrastructure & Logistics',
    summary:
      'Corridors planned across ministries on one map, so that a road, a pipeline and a transmission line stop surprising each other.',
    applications: [
      'Multimodal connectivity and corridor planning',
      'Alignment optioneering and clearance screening',
      'Utility network and right-of-way mapping',
      'Project monitoring against a spatial baseline',
    ],
    instruments: ['DEM', 'Optical EO', 'Network analysis'],
  },
  {
    id: 'education',
    code: 'EDU',
    name: 'Education & Outreach',
    summary:
      'Satellite bandwidth used to put a subject specialist in front of classrooms that cannot recruit one.',
    applications: [
      'Curriculum broadcast to school networks',
      'Teacher training and refresher programmes',
      'Interactive distance training for officials',
      'Extension programmes for farmers and field staff',
    ],
    instruments: ['SATCOM', 'DTH', 'Studio production'],
  },
  {
    id: 'health',
    code: 'HLT',
    name: 'Health',
    summary:
      'Service coverage expressed as geography — who is within reach of care, and who is demonstrably not.',
    applications: [
      'Facility catchment and access analysis',
      'Disease and outbreak mapping',
      'Cold-chain and logistics planning',
      'Programme coverage monitoring',
    ],
    instruments: ['Network analysis', 'Census integration', 'Field apps'],
  },
  {
    id: 'energy',
    code: 'ENR',
    name: 'Energy & Utilities',
    summary:
      'Generation, transmission and distribution planned against terrain, demand and land availability together.',
    applications: [
      'Solar and wind site suitability',
      'Transmission corridor planning',
      'Distribution network and consumer mapping',
      'Asset inventory and outage response',
    ],
    instruments: ['DEM', 'Solar radiation models', 'GNSS'],
  },
  {
    id: 'industry',
    code: 'IND',
    name: 'Industry & Mining',
    summary:
      'Concessions, estates and extraction monitored against their sanctioned footprint, cycle after cycle.',
    applications: [
      'Mineral concession and lease boundary mapping',
      'Industrial estate planning and land bank',
      'Extraction volume and change monitoring',
      'Environmental compliance screening',
    ],
    instruments: ['Optical EO', 'Photogrammetry', 'Change detection'],
  },
  {
    id: 'governance',
    code: 'GOV',
    name: 'Governance & Public Safety',
    summary:
      'Scheme delivery, grievances and emergency response placed on the map that everything else is already on.',
    applications: [
      'Scheme monitoring and delivery dashboards',
      'Online grievance redressal systems',
      'Emergency response and resource dispatch',
      'Inter-departmental data exchange',
    ],
    instruments: ['Web GIS', 'Dashboards', 'APIs'],
  },
];
