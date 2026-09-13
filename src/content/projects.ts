/** Section 06 — major projects. */

export type Project = {
  id: string;
  index: string;
  name: string;
  partner: string;
  year: string;
  kind: 'Platform' | 'Network' | 'Programme' | 'Partnership';
  summary: string;
  detail: string;
  facts: { label: string; value: string }[];
};

export const projects: Project[] = [
  {
    id: 'gatishakti',
    index: '01',
    name: 'PM GatiShakti National Master Plan',
    partner: 'DPIIT, Ministry of Commerce & Industry',
    year: '2021',
    kind: 'Platform',
    summary:
      'The national digital master-planning tool for multimodal infrastructure — every ministry’s network on one dynamic GIS platform.',
    detail:
      'Built on open-source technology and hosted on MeghRaj, the Government of India cloud. Ministries maintain their own layers under their own credentials; the platform composes them into a single planning surface with ISRO imagery as the base. Planning, appraisal and monitoring happen against the same geometry.',
    facts: [
      { label: 'Ministries', value: '57' },
      { label: 'States & UTs', value: '36' },
      { label: 'Data layers', value: '1,700+' },
      { label: 'Hosting', value: 'MeghRaj (GoI cloud)' },
    ],
  },
  {
    id: 'dmp',
    index: '02',
    name: 'PM GatiShakti District Master Plan',
    partner: 'DPIIT with district administrations',
    year: '2023',
    kind: 'Platform',
    summary:
      'The national method re-cut for the district — the planning unit that most citizens actually experience.',
    detail:
      'Extends data-driven spatial planning below the state tier, giving district administrations the same layered base map, conflict detection and monitoring tools used for national corridors. Rolled out first across the aspirational districts programme.',
    facts: [
      { label: 'Districts mapped', value: '112' },
      { label: 'Planning unit', value: 'Village / block' },
      { label: 'Programme', value: 'Aspirational Districts' },
    ],
  },
  {
    id: 'ugi',
    index: '03',
    name: 'Unified Geospatial Interface',
    partner: 'Government of India',
    year: 'Ongoing',
    kind: 'Platform',
    summary:
      'A single window onto national geospatial datasets, so that finding the authoritative layer is no longer a research project.',
    detail:
      'Publishes curated datasets through a common interface and open service endpoints, alongside PM GatiShakti Public. The intent is to make the authoritative version of a layer the easiest one to obtain.',
    facts: [
      { label: 'Access', value: 'Public interface + APIs' },
      { label: 'Datasets', value: '230 via GatiShakti Public & UGI' },
    ],
  },
  {
    id: 'satcom',
    index: '04',
    name: 'SATCOM Interactive Network',
    partner: 'National facility',
    year: '1997 →',
    kind: 'Network',
    summary:
      'The institute’s founding capability: satellite bandwidth operated as a public facility for training, education and extension.',
    detail:
      'A one-way-video, two-way-audio network carried on Indian communication satellites, with the teleport and uplink earth stations on the Gandhinagar campus. Departments book time on it for statewide and nationwide interactive sessions.',
    facts: [
      { label: 'Carriage', value: 'GSAT-15, GSAT-30' },
      { label: 'Mode', value: '1-way video / 2-way audio' },
      { label: 'Ground segment', value: 'Gandhinagar teleport' },
    ],
  },
  {
    id: 'vande',
    index: '05',
    name: 'VANDE Gujarat',
    partner: 'Government of Gujarat',
    year: 'Ongoing',
    kind: 'Programme',
    summary:
      'Curriculum broadcast to schools across Gujarat over the satellite network, with classroom-grade continuity.',
    detail:
      'Multi-channel educational broadcast produced and uplinked from the campus studios, reaching schools whose connectivity would not otherwise support live instruction. The programme is the clearest demonstration of the institute’s original thesis: the ground segment that serves imagery can equally serve teaching.',
    facts: [
      { label: 'Audience', value: 'School education, Gujarat' },
      { label: 'Delivery', value: 'Multi-channel DTH broadcast' },
    ],
  },
  {
    id: 'swayam',
    index: '06',
    name: 'Swayam Prabha',
    partner: 'Ministry of Education',
    year: 'Ongoing',
    kind: 'Programme',
    summary:
      'National DTH education channels carried on the same satellite infrastructure.',
    detail:
      'Higher and school education content broadcast nationally over dedicated channels, supported by the institute’s uplink and transmission capability.',
    facts: [
      { label: 'Scope', value: 'National' },
      { label: 'Delivery', value: 'Dedicated DTH channels' },
    ],
  },
  {
    id: 'cag',
    index: '07',
    name: 'Geospatial audit with the CAG',
    partner: 'Comptroller and Auditor General of India',
    year: '2023',
    kind: 'Partnership',
    summary:
      'Remote sensing and GIS applied to public audit — verifying reported works against observed ground.',
    detail:
      'An agreement to bring geographic information systems and remote sensing into audit practice, so that a claimed asset can be checked against imagery rather than against a second document.',
    facts: [
      { label: 'Instrument', value: 'Memorandum of agreement' },
      { label: 'Application', value: 'Audit verification' },
    ],
  },
];
