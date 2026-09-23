import { useEffect, useRef } from 'react';
import { HeroScene } from '../three/hero';
import { Reveal } from './Reveal';

function useMagnetic<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(hover: none)').matches) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      el.style.transform = `translate(${x * 0.12}px, ${y * 0.16}px)`;
    };
    const leave = () => { el.style.transform = ''; };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, []);
  return ref;
}

export function Hero() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctaRef = useMagnetic<HTMLAnchorElement>();

  useEffect(() => {
    if (!canvasRef.current) return;
    // Dynamic import: WebGL never blocks first paint.
    let scene: HeroScene | null = null;
    let live = true;
    import('../three/hero').then((m) => {
      if (!live || !canvasRef.current) return;
      scene = new m.HeroScene(canvasRef.current!);
      if (!scene.init()) {
        canvasRef.current!.style.display = 'none';
      }
    });
    return () => {
      live = false;
      scene?.dispose();
    };
  }, []);

  return (
    <section className="hero" id="top" aria-label="Orin AI introduction">
      <canvas id="gl" ref={canvasRef} aria-hidden="true" />
      <div className="hero-inner">
        <Reveal>
          <p className="kicker">Orin AI — one ecosystem, five tools</p>
        </Reveal>
        <Reveal delay={90}>
          <h1>
            Intelligence,<br />
            built <span className="thin">to work.</span>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p className="lead hero-sub">
            Orin is an ecosystem of AI tools for people who build, create and
            automate — a chat workspace, a code editor, an autonomous agent
            and open infrastructure. Free, fast, and yours.
          </p>
        </Reveal>
        <Reveal delay={260}>
          <div className="hero-ctas">
            <a className="btn btn-solid" ref={ctaRef} href="https://chat.orinai.org">
              Explore Orin
            </a>
            <a className="btn btn-line" href="#products">View products</a>
          </div>
        </Reveal>
        <Reveal delay={340}>
          <div className="hero-meta" aria-label="Ecosystem facts">
            <span><b>07</b> products</span>
            <span><b>$0</b> forever</span>
            <span><b>03</b> languages</span>
            <span><b>100%</b> yours</span>
          </div>
        </Reveal>
      </div>
      <div className="scroll-hint" aria-hidden="true">Scroll</div>
    </section>
  );
}
