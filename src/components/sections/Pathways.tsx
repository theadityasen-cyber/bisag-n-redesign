import { pathways } from '../../content/reach';
import { locations, org, team } from '../../content/site';
import { useReveal } from '../../lib/useReveal';
import { backdrops } from '../../content/imagery';
import { Backdrop } from '../ui/Backdrop';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Section 08 — exploration and contact.
 *
 * Three audiences arrive at this institute with genuinely different asks: a
 * state department wants a system built, a student wants to be taught, a company
 * wants access to the stack. One generic "contact us" would serve none of them,
 * so the close is split by intent rather than by channel.
 */
export function Pathways() {
  const ref = useReveal<HTMLElement>({ stagger: 70 });

  return (
    <section ref={ref} id="pathways" className="section section--pathways">
      <Backdrop image={backdrops.nightLights} placement="right" tone="ink" />
      <div className="shell">
        <SectionHeader
          index="08"
          label="Work/Learn with BISAG-N"
          title={<span className="serif pathways__thesis">{org.thesis}</span>}
          align="wide"
        />

        <ul className="pathways" data-reveal>
          {pathways.map((pathway) => (
            <li key={pathway.id} className="pathway">
              <p className="pathway__meta">
                <span className="mono pathway__index">{pathway.index}</span>
                <span className="label">{pathway.audience}</span>
              </p>
              <h3 className="pathway__title">{pathway.title}</h3>
              <p className="pathway__body">{pathway.body}</p>
              <a className="pathway__action" href={pathway.href}>
                {pathway.action}
              </a>
            </li>
          ))}
        </ul>

        <div id="team" className="locations team" data-reveal>
          <p className="label locations__legend">Meet Our Team</p>
          <ul className="locations__list">
            {team.map((member) => (
              <li key={member.name} className="location team__member">
                <h3 className="location__name">{member.name}</h3>
                <p className="team__designation">{member.designation}</p>
                {/* Published obfuscated by the institute; shown as published. */}
                <ul className="team__emails" aria-label={`Email for ${member.name}`}>
                  {member.emails.map((email) => (
                    <li key={email} className="location__coords mono" translate="no">
                      {/* Break opportunities before each bracket, so a long address
                          wraps between its parts instead of mid-word. */}
                      {email.split(/(?=\[)/).map((part, i) => (
                        <span key={i}>
                          {i > 0 && <wbr />}
                          {part}
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>

        <div id="contact" className="locations" data-reveal>
          <p className="label locations__legend">Offices</p>
          <ul className="locations__list">
            {locations.map((location) => (
              <li key={location.name} className="location">
                <p className="label">{location.role}</p>
                <h3 className="location__name">{location.name}</h3>
                <address className="location__address">
                  {location.lines.map((line) => (
                    <span key={line}>{line}</span>
                  ))}
                </address>
                <p className="location__coords mono">
                  {Math.abs(location.coords.lat).toFixed(4)}°N {Math.abs(location.coords.lon).toFixed(4)}°E
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
