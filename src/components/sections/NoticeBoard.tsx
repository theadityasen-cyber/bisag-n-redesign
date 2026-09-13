import { notices } from '../../content/site';
import { useReveal } from '../../lib/useReveal';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Section 09 — notice board.
 *
 * Deliberately small: a register of open calls, not a feature. It is a real
 * table, because the content is tabular — a reader scans down the closing-date
 * column — and on a phone each row becomes a labelled card rather than a table
 * that scrolls sideways.
 *
 * Status is derived from the closing time when the page renders, so a notice
 * reads as closed on the day after its deadline without anyone editing it.
 */

const IST = 'Asia/Kolkata';

const dateFormat = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: IST,
});

const timeFormat = new Intl.DateTimeFormat('en-IN', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
  timeZone: IST,
});

const DAY = 86_400_000;

function status(closes: Date, now: Date) {
  const remaining = closes.getTime() - now.getTime();
  if (remaining <= 0) return { state: 'closed', text: 'Closed' } as const;
  const days = Math.ceil(remaining / DAY);
  return {
    state: 'open',
    text: days <= 1 ? 'Open · last day' : `Open · ${days} days left`,
  } as const;
}

export function NoticeBoard() {
  const ref = useReveal<HTMLElement>({ stagger: 60 });
  const now = new Date();

  return (
    <section ref={ref} id="notice-board" className="section section--notices">
      <div className="shell">
        <SectionHeader
          index="09"
          label="Notice Board"
          title="Notices and openings."
          lead="Recruitment and public notices from the institute. Each links to the notice as published."
        />

        <div className="notices" data-reveal>
          <table className="notices__table">
            <caption className="sr-only">Current notices</caption>
            <thead>
              <tr>
                <th scope="col">Published</th>
                <th scope="col">Subject</th>
                <th scope="col">Last date</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="sr-only">Apply</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => {
                const published = new Date(`${notice.published}T00:00:00+05:30`);
                const closes = new Date(notice.closes);
                const current = status(closes, now);
                return (
                  <tr key={notice.id} data-state={current.state}>
                    <td data-label="Published" className="mono">
                      <time dateTime={notice.published}>{dateFormat.format(published)}</time>
                    </td>
                    <td data-label="Subject" className="notices__subject">
                      {/* One wrapper, so the cell has a single child when a phone
                          lays each cell out as a label/value pair. */}
                      <div>
                        <a href={notice.attachment} target="_blank" rel="noopener">
                          {notice.subject}
                          <span className="sr-only"> (opens the advertisement in a new tab)</span>
                        </a>
                        <span className="notices__detail">{notice.detail}</span>
                        <span className="notices__ref mono">Adv. {notice.reference}</span>
                      </div>
                    </td>
                    <td data-label="Last date" className="mono">
                      <time dateTime={notice.closes}>
                        {dateFormat.format(closes)}
                        <span className="notices__time">{timeFormat.format(closes)} IST</span>
                      </time>
                    </td>
                    <td data-label="Status">
                      <span className="notices__status" data-state={current.state}>
                        {current.text}
                      </span>
                    </td>
                    <td className="notices__action">
                      {current.state === 'open' && (
                        <a className="notices__apply" href={notice.apply.href}>
                          {notice.apply.label}
                          <span aria-hidden="true">→</span>
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
