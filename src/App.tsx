import { useMemo } from 'react';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ScrollTop } from './components/layout/ScrollTop';
import { Hero } from './components/hero/Hero';
import { Mandate } from './components/sections/Mandate';
import { Domains } from './components/sections/Domains';
import { Capabilities } from './components/sections/Capabilities';
import { Impact } from './components/sections/Impact';
import { Projects } from './components/sections/Projects';
import { Reach } from './components/sections/Reach';
import { Pathways } from './components/sections/Pathways';
import { NoticeBoard } from './components/sections/NoticeBoard';
import { detectCapability } from './lib/capability';
import { CapabilityContext } from './lib/useCapability';
import './styles/sections.css';

/**
 * Homepage composition.
 *
 * The order is the argument:
 *   01 the journey establishes scale and place
 *   02 what the institute is for
 *   03 where that applies
 *   04 how it is actually done
 *   05 what came of it        — paper ground, because this is the evidence
 *   06 the record             — paper ground
 *   07 where it came from
 *   08 what you can do about it, and who to reach
 *   09 what is open right now — the notice board
 *
 * Capability is detected once, here, and shared downward. Re-detecting in the
 * scene would risk the budget and the render disagreeing.
 */
export default function App() {
  const capability = useMemo(detectCapability, []);

  return (
    <CapabilityContext.Provider value={capability}>
      <a className="skip" href="#mandate">
        Skip the spatial journey
      </a>

      <Header />

      <main id="main">
        <Hero />
        <Mandate />
        <Domains />
        <Capabilities />
        <Impact />
        <Projects />
        <Reach />
        <Pathways />
        <NoticeBoard />
      </main>

      <Footer />
      <ScrollTop />
    </CapabilityContext.Provider>
  );
}
