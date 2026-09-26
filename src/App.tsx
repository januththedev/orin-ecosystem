import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { RouterStatus } from './components/RouterStatus';
import { Products } from './components/Products';
import { SelfHost } from './components/SelfHost';
import { Footer } from './components/Footer';
import { Cursor } from './components/Cursor';

export default function App() {
  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Nav />
      <main>
        <Hero />
        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            <span><b>$0</b> forever</span><span>chat · code · agent · tools</span><span>no keys</span><span>self-hostable</span><span>open source</span>
            <span><b>$0</b> forever</span><span>chat · code · agent · tools</span><span>no keys</span><span>self-hostable</span><span>open source</span>
          </div>
        </div>
        <RouterStatus />
        <Products />
        <SelfHost />
      </main>
      <Footer />
      <Cursor />
    </>
  );
}
