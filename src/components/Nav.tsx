import { useEffect, useState } from 'react';

const LINKS = [
  { href: 'https://chat.orinai.org', label: 'Orin Chat' },
  { href: 'https://code.orinai.org', label: 'Orin Code' },
  { href: 'https://agent.orinai.org', label: 'Orin Agent' },
  { href: 'https://tools.orinai.org', label: 'Orin Tools' }
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open ]);

  return (
    <>
      <a className="skip-link" href="#products">Skip to products</a>
      <header className={`nav${scrolled ? ' scrolled' : ''}`}>
        <nav className="nav-inner" aria-label="Primary">
          <a className="brand" href="#top" aria-label="Orin AI home">
            <span className="dot" aria-hidden="true" />
            ORIN&nbsp;AI
          </a>
          <div className="nav-links">
            <a href="#products">Products</a>
            {LINKS.map((l) => (
              <a key={l.href} href={l.href}>{l.label}</a>
            ))}
            <a className="nav-cta" href="https://chat.orinai.org">Get Started</a>
          </div>
          <button className="menu-btn" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>
            Menu
          </button>
        </nav>
      </header>
      <div className={`mobile-nav${open ? ' open' : ''}`} role="dialog" aria-label="Site navigation">
        <button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close menu">Close</button>
        <a href="#products" onClick={() => setOpen(false)}><small>01</small>Products</a>
        {LINKS.map((l, i) => (
          <a key={l.href} href={l.href} style={{ transitionDelay: `${(i + 1) * 60}ms` }}>
            <small>{`0${i + 2}`}</small>{l.label}
          </a>
        ))}
      </div>
    </>
  );
}
