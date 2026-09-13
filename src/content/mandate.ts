/** Section 02 — what BISAG-N does. */

export const mandate = {
  statement:
    'BISAG-N builds the instruments a country uses to see itself: the satellite links, the map layers and the software that turn observation into administration.',
  body: [
    'The institute was set up to undertake technology development and management, research and development, national and international cooperation, capacity building, and technology transfer and entrepreneurship development in geo-spatial technology.',
    'It works through modular, project-based engagements with central ministries, state departments, public sector undertakings, educational institutions and research agencies — building to each mandate rather than selling a product.',
  ],
} as const;

export type Vertical = {
  id: string;
  index: string;
  name: string;
  summary: string;
  detail: string;
  points: string[];
};

export const verticals: Vertical[] = [
  {
    id: 'satcom',
    index: 'I',
    name: 'Satellite Communication',
    summary: 'Promotes and operates satellite broadcasting networks for distance training, education and extension.',
    detail:
      'A one-way-video, two-way-audio interactive network carried on Indian communication satellites, terminating in classrooms, training centres and district offices that terrestrial bandwidth has not reached.',
    points: [
      'Teleport and uplink earth stations at Gandhinagar',
      'Carriage on Indian satellites including GSAT-15 and GSAT-30',
      'Interactive distance training and extension programmes',
      'Studio production and multi-channel broadcast operations',
    ],
  },
  {
    id: 'geoinformatics',
    index: 'II',
    name: 'Geo-informatics',
    summary: 'Conceptualises, creates and organises multi-purpose common digital databases for sectoral and thematic applications.',
    detail:
      'Remote sensing, photogrammetry, GNSS and field survey brought into one authenticated, standardised spatial database that every department can plan on — instead of thirty departments each holding a partial and disagreeing map.',
    points: [
      'Remote sensing for resource inventory, planning and monitoring',
      'Digital photogrammetry, DEM generation and terrain characterisation',
      'GNSS, ground control and land survey for geo-referencing',
      'Cartographic production and standards-based database design',
    ],
  },
  {
    id: 'software',
    index: 'III',
    name: 'Software Development',
    summary: 'Delivers low-cost decision support systems and geo-informatics applications for wide adoption.',
    detail:
      'An open-source, interoperable platform customised to each ministry’s requirement, so that a planning tool built for one department can be re-fitted for the next without a new licence or a new vendor.',
    points: [
      'Desktop and web-based decision support systems',
      'Project monitoring, budgeting and service delivery systems',
      'Governance dashboards and online grievance redressal',
      'Open-source stack with no proprietary licence lock-in',
    ],
  },
];

export const centres = [
  { name: 'Centre for Geo-informatics Applications', note: 'Applied mapping, modelling and sectoral programmes' },
  { name: 'Centre for Informatics and Training', note: 'Platform engineering and capacity building' },
  { name: 'Academy of Geo-informatics for Sustainable Development', note: 'Education, research and certification' },
] as const;
