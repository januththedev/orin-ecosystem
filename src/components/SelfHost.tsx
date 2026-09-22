import { Reveal } from './Reveal';

export function SelfHost() {
  return (
    <section className="block" aria-label="Self-host Orin Tools">
      <div className="wrap">
        <Reveal>
          <div className="sec-head">
            <p className="kicker">Open infrastructure</p>
            <h2>Run it yourself.</h2>
          </div>
        </Reveal>
        <Reveal>
          <p className="lead">
            Orin Tools is public software — public repo, production docs. Host the
            search engine, run the sandbox, keep everything on your metal.
          </p>
        </Reveal>
        <Reveal>
          <div className="tools-strip">
            <div>
              <div className="cmd"><span className="c"># your own search engine in one line</span></div>
              <div className="cmd" style={{ marginTop: 10 }}>
                <span className="k">$</span> docker run -d --restart unless-stopped -p 8080:8080 searxng/searxng
              </div>
              <div className="cmd" style={{ marginTop: 10 }}>
                <span className="k">$</span> git clone https://github.com/januththedev/orin-tools
              </div>
            </div>
            <div>
              <p className="lead" style={{ fontSize: 16 }}>
                Set <span className="mono">SEARXNG_URL</span> and the public layers
                become automatic backup. Weather forecasts, news and code execution
                stay free — fair use keeps it unlimited for life.
              </p>
              <p style={{ marginTop: 18 }}>
                <a className="p-cta" href="https://tools.orinai.org">Read the production docs <span aria-hidden="true">→</span></a>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
