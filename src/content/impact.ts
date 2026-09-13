/** Section 05 — real-world impact. Figures carry their source; none are decorative. */

export type Figure = {
  id: string;
  value: number;
  /** Rendered before / after the counted value. */
  prefix?: string;
  suffix?: string;
  decimals?: number;
  label: string;
  note: string;
};

export const figures: Figure[] = [
  {
    id: 'ministries',
    value: 57,
    label: 'Central ministries and departments',
    note: 'Planning on one integrated platform',
  },
  {
    id: 'states',
    value: 36,
    label: 'States and Union Territories',
    note: 'Onboarded with their own master plan portals',
  },
  {
    id: 'layers',
    value: 1700,
    suffix: '+',
    label: 'Data layers',
    note: 'Unified in the PM GatiShakti National Master Plan',
  },
  {
    id: 'projects',
    value: 352,
    label: 'Infrastructure projects appraised',
    note: 'Through the Network Planning Group mechanism',
  },
  {
    id: 'value',
    value: 16.1,
    decimals: 2,
    prefix: '₹',
    suffix: ' lakh cr',
    label: 'Project value evaluated',
    note: 'Cumulative value of appraised proposals',
  },
  {
    id: 'districts',
    value: 112,
    label: 'Aspirational districts mapped',
    note: 'Under the District Master Plan programme',
  },
];

export const figuresSource =
  'PM GatiShakti National Master Plan, as reported February 2026. Figures are cumulative since launch in October 2021.';
