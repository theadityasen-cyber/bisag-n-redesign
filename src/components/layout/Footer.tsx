import { footerLinks, org } from '../../content/site';
import { Logo } from '../ui/Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__top">
          <div className="footer__identity">
            <Logo className="footer__logo" size="lg" />
            <p className="footer__name">{org.full}</p>
            <p className="footer__status">{org.status}</p>
            {/* <p className="footer__vision serif">{org.vision}</p> */}
          </div>

          <nav className="footer__nav" aria-label="Footer">
            {footerLinks.map((group) => (
              <div key={group.heading} className="footer__group">
                <h2 className="label">{group.heading}</h2>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>
                      <a href="#main">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer__bottom mono">
          <p>
            {org.parent}, {org.government}
          </p>
          <p>
            Established {org.founded} · National institute since {org.nationalSince}
          </p>
          <p>Gandhinagar 382 007, Gujarat</p>
        </div>
        <p className="footer__credit">
          <span>Designed &amp; developed by Aditya Sen</span>
          <a href="mailto:theadityasen@gmail.com">
            <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <rect x="1.5" y="3.5" width="13" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="m2 4.5 6 4.5 6-4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="sr-only">Email: </span>
            theadityasen@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}
