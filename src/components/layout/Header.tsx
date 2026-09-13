import { useEffect, useRef, useState } from 'react';
import { nav, org } from '../../content/site';
import { Logo } from '../ui/Logo';

/**
 * Masthead.
 *
 * Transparent over the journey and opaque thereafter, because over the scene it
 * is chrome and over the document it is structure. It carries the institute's
 * own top-level destinations; getting back to the top of this long page is the
 * job of the separate back-to-top control, not of a section index up here.
 *
 * Below the width at which seven links fit on one line, the links move into a
 * disclosure panel rather than disappearing — these are real destinations, and
 * a phone user needs them as much as anyone.
 *
 * The institute's name and ministry are shown exactly once at any moment. Over
 * the journey they are the hero's own identity block; the instant the hero has
 * scrolled out from under the masthead, the masthead takes them over beside the
 * logo. Scrolling back reverses the hand-off.
 */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.6);
      const masthead = headerRef.current?.offsetHeight ?? 0;
      // Hand over when the hero's identity block itself passes under the
      // masthead, not when the whole hero has gone: the block sits at the top
      // of the hero, so waiting for the hero's foot would leave most of a
      // screen with the name shown nowhere.
      const identity = document.querySelector('.hero__identity');
      setPastHero(identity ? identity.getBoundingClientRect().bottom <= masthead : false);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    // The panel only exists at compact widths; widening the window past the
    // breakpoint should not leave it logically open behind the full nav.
    const wide = window.matchMedia('(min-width: 1181px)');
    const onWide = () => wide.matches && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWide);
    return () => {
      window.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWide);
    };
  }, [menuOpen]);

  const links = (
    <ul>
      {nav.map((link) => (
        <li key={link.label}>
          <a href={link.href} onClick={() => setMenuOpen(false)}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <header
      ref={headerRef}
      className={`masthead${scrolled || menuOpen ? ' masthead--solid' : ''}${pastHero ? ' masthead--past-hero' : ''}`}
    >
      <div className="masthead__inner shell">
        <a className="masthead__brand" href="#hero" aria-label={`${org.short} — home`}>
          <Logo className="masthead__logo" size="sm" />
          <span className="masthead__brand-text" aria-hidden="true">
            <span className="masthead__short">{org.full}</span>
            <span className="masthead__parent">
              {org.parent}, {org.government}
            </span>
          </span>
        </a>

        <nav className="masthead__nav" aria-label="Primary">
          {links}
        </nav>

        <div className="masthead__actions">
          <a className="masthead__cta" href="#pathways">
            Work with us
          </a>
          <button
            type="button"
            className="masthead__menu"
            aria-expanded={menuOpen}
            aria-controls="masthead-panel"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Menu'}</span>
            <span className="masthead__menu-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <nav id="masthead-panel" className="masthead__panel" aria-label="Primary" hidden={!menuOpen}>
        <div className="shell">
          {links}
          {/* On a phone the call to action gives its room to the name. */}
          <a className="masthead__panel-cta" href="#pathways" onClick={() => setMenuOpen(false)}>
            Work with us
          </a>
        </div>
      </nav>
    </header>
  );
}
