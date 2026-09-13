/**
 * Institutional metadata, navigation and contact detail.
 *
 * All copy on the homepage lives under src/content so it can be handed to an
 * editor, translated, or swapped for a CMS payload without touching a component.
 */

export const org = {
  short: 'BISAG-N',
  full: 'Bhaskaracharya National Institute for Space Applications and Geo-informatics',
  parent: 'Ministry of Electronics and Information Technology',
  government: 'Government of India',
  status: 'Registered under the Societies Registration Act, 1860 by Autonomous Scientific Society under the MeitY, Government of India',
  vision: 'To empower and serve the nation through the development of space and geo-spatial technologies.',
  thesis: 'BISAG-N turns geospatial and space technology into real-world intelligence.',
  founded: 1997,
  nationalSince: 2020,
} as const;

/** The institute's existing site. Header destinations without a section on this page resolve there. */
export const OFFICIAL_SITE = 'https://bisag-n.gov.in';

export type NavLink = { label: string; href: string };

/**
 * Primary navigation — the institute's own top-level destinations, in the order
 * the official site uses. Two of them live on this page (the project record and
 * the notice board); the rest are standalone pages.
 */
export const nav: NavLink[] = [
  { label: 'Home', href: '#hero' },
  { label: 'Satellite Communication', href: `${OFFICIAL_SITE}/satellite-communication` },
  { label: 'BISAG-N Innovations', href: `${OFFICIAL_SITE}/innovations` },
  { label: 'Projects', href: '#projects' },
  { label: 'FAQ', href: `${OFFICIAL_SITE}/faq` },
  { label: 'Media Library', href: `${OFFICIAL_SITE}/media` },
  { label: 'Notice Board', href: '#notice-board' },
];

/**
 * Senior leadership — the first three rows of "Meet Our Team" on the official
 * site. Addresses are kept in the obfuscated form the institute publishes them
 * in ([at], [dot], [dash]); decoding them here would undo a deliberate
 * anti-harvesting measure on a public government page.
 */
export const team = [
  {
    name: 'Shri T. P. Singh',
    designation: 'Principal Advisor & Executive Vice Chairman, Governing Council',
    emails: ['prinadv[dash]bisag[at]digitalindia[dot]gov[dot]in'],
  },
  {
    name: 'Dr. Vinay Thakur',
    designation: 'Director General',
    emails: ['dg[dot]bisag[dash]n[at]digitalindia[dot]gov[dot]in', 'adg[dash]bisag[at]digitalindia[dot]gov[dot]in'],
  },
  {
    name: 'Ms Tulika Pandey',
    designation: 'Chief Vigilance Officer',
    emails: ['tulikapandey[at]gov[dot]in'],
  },
] as const;

export type Notice = {
  id: string;
  /** ISO date the notice was published. */
  published: string;
  subject: string;
  /** ISO timestamp, IST, after which applications close. */
  closes: string;
  reference: string;
  detail: string;
  /** The advertisement as published, served locally. */
  attachment: string;
  apply: { label: string; href: string };
};

/** Mirrors the notice board on the official site. */
export const notices: Notice[] = [
  {
    id: 'dba-2026',
    published: '2026-09-11',
    subject: 'Hiring of Database Administrator (DBA) for BISAG-N, Gandhinagar and Delhi Office',
    closes: '2026-09-25T17:00:00+05:30',
    reference: 'E-SOLUTION/ADV/002/2026',
    detail: '5 positions · PostgreSQL & MySQL · through the outsourcing agency of BISAG-N',
    attachment: '/notices/dba-advertisement-2026.jpg',
    apply: { label: 'Send CV', href: 'mailto:bisag.recruitment@esolglobal.com' },
  },
];

export const locations = [
  {
    role: 'Headquarters',
    name: 'Gandhinagar Campus',
    lines: [
      "Near CH '0' Circle, Indulal Yagnik Marg",
      'Gandhinagar–Ahmedabad Highway',
      'Gandhinagar 382 007, Gujarat',
    ],
    coords: { lat: 23.2156, lon: 72.6369 },
  },
  {
    role: 'Ministry office',
    name: 'Electronics Niketan',
    lines: ['MeitY, 6 CGO Complex', 'Lodhi Road, New Delhi 110 003'],
    coords: { lat: 28.5885, lon: 77.2265 },
  },
  {
    role: 'PM GatiShakti centre',
    name: 'CRA Building',
    lines: ['Air India Complex, Safdarjung Airport', 'New Delhi 110 003'],
    coords: { lat: 28.5836, lon: 77.2016 },
  },
] as const;

export const footerLinks = [
  {
    heading: 'Institute',
    items: ['About BISAG-N', 'Governing Council', 'Annual Reports', 'Careers', 'Tenders'],
  },
  {
    heading: 'Services',
    items: ['Geo-informatics', 'Satellite Communication', 'Software Development', 'Training & Academy'],
  },
  {
    heading: 'Transparency',
    items: ['Right to Information', 'Internal Complaints Committee', 'Notice Board', 'Public Grievances'],
  },
  {
    heading: 'Resources',
    items: ['Media Library', 'Publications', 'Frequently Asked Questions', 'Contact'],
  },
] as const;
