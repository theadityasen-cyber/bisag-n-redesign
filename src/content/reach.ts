/** Section 08 — Gujarat and national reach. */

export const reach = {
  kicker: 'One state, then the union',
  title: 'The method was proven in Gujarat before it was asked of the country.',
  body: [
    'The institute began in 1997 as the Remote Sensing and Communication Centre of the Government of Gujarat, and spent two decades doing the unglamorous work: building a state-wide base map, getting departments to agree on it, and keeping it current.',
    'In 2020 that became a national mandate. What transferred was not software — it was a working method for getting a federation of departments to plan on one geometry.',
  ],
} as const;

export type Milestone = { year: string; title: string; note: string };

export const timeline: Milestone[] = [
  {
    year: '1997',
    title: 'Remote Sensing and Communication Centre',
    note: 'Established by the Government of Gujarat — satellite communication and remote sensing under one roof.',
  },
  {
    year: '2003',
    title: 'BISAG constituted',
    note: 'Formalised as the Bhaskaracharya Institute for Space Applications and Geo-informatics, with an academy affiliated to Gujarat Technological University.',
  },
  {
    year: '2020',
    title: 'A national institute',
    note: 'Reconstituted as BISAG-N under MeitY, Government of India — an autonomous scientific society with a national mandate.',
  },
  {
    year: '2021',
    title: 'PM GatiShakti National Master Plan',
    note: 'The institute builds and operates the national multimodal infrastructure planning platform.',
  },
  {
    year: '2023',
    title: 'Delhi centre and district tier',
    note: 'An office-cum-training centre for PM GatiShakti opens in New Delhi; district master planning begins.',
  },
];

/** Selected reference points rendered on the national map. */
export const nodes = [
  { id: 'gnr', name: 'Gandhinagar', role: 'Headquarters', lat: 23.2156, lon: 72.6369, primary: true },
  { id: 'del', name: 'New Delhi', role: 'Ministry & GatiShakti centre', lat: 28.6139, lon: 77.209, primary: true },
  { id: 'ahm', name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { id: 'bom', name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { id: 'blr', name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  { id: 'hyd', name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { id: 'ccu', name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { id: 'maa', name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { id: 'ghy', name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
  { id: 'srx', name: 'Srinagar', lat: 34.0837, lon: 74.7973 },
  { id: 'tvm', name: 'Thiruvananthapuram', lat: 8.5241, lon: 76.9366 },
  { id: 'bbi', name: 'Bhubaneswar', lat: 20.2961, lon: 85.8245 },
  { id: 'jai', name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { id: 'luc', name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { id: 'ptn', name: 'Patna', lat: 25.5941, lon: 85.1376 },
  { id: 'ixc', name: 'Chandigarh', lat: 30.7333, lon: 76.7794 },
  { id: 'nag', name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
  { id: 'ixr', name: 'Ranchi', lat: 23.3441, lon: 85.3096 },
  { id: 'rpr', name: 'Raipur', lat: 21.2514, lon: 81.6296 },
  { id: 'idr', name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { id: 'deh', name: 'Dehradun', lat: 30.3165, lon: 78.0322 },
  { id: 'shl', name: 'Shillong', lat: 25.5788, lon: 91.8933 },
  { id: 'pnq', name: 'Port Blair', lat: 11.6234, lon: 92.7265 },
] as const;

import { OFFICIAL_SITE } from './site';

/* ------------------------------------------------------------------- CTA -- */

export const pathways = [
  {
    id: 'government',
    index: '01',
    audience: 'Ministries, states and districts',
    title: 'Commission a platform',
    body: 'Modular, project-based engagement: a scoped mandate, an open-source build, and a system your department operates rather than rents.',
    action: 'Start a project enquiry',
    href: '#contact',
  },
  {
    id: 'academia',
    index: '02',
    audience: 'Researchers and students',
    title: 'Train at the academy',
    body: 'Education, research and certification in geo-informatics through the Academy of Geo-informatics for Sustainable Development, alongside distance programmes over the satellite network.',
    action: 'See training programmes',
    href: '#contact',
  },
  {
    id: 'industry',
    index: '03',
    audience: 'Startups and industry',
    title: 'Build on the stack',
    body: 'Technology transfer, entrepreneurship support and access to open geospatial services for organisations building in the sector.',
    action: 'Explore BISAG-N Innovations',
    // The institute's own innovations page, the same destination as the header link.
    href: `${OFFICIAL_SITE}/innovations`,
  },
] as const;
