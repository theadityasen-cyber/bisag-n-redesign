import type { ReactNode } from 'react';

/**
 * The section masthead.
 *
 * A numbered rule, a label, a title and an optional lead — repeated exactly
 * across all eight sections. The repetition is the point: once the reader has
 * parsed it a second time, they can navigate the rest of the page by shape
 * alone, and any section that needed a different opening would be a section that
 * did not belong.
 */
export function SectionHeader({
  index,
  label,
  title,
  lead,
  align = 'start',
}: {
  index: string;
  label: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'start' | 'wide';
}) {
  return (
    <header className={`section-head section-head--${align}`} data-reveal>
      <p className="section-head__meta">
        <span className="section-head__index mono">{index}</span>
        <span className="label">{label}</span>
      </p>
      <h2 className="section-head__title">{title}</h2>
      {lead && <p className="section-head__lead lead">{lead}</p>}
    </header>
  );
}
