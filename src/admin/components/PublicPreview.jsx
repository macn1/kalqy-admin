import React, { useEffect, useRef } from 'react';

const safeUrl = (u) => (/^https:\/\//i.test(u || '') ? u : undefined);

/** Local, read-only rendering of how edited content could look on the public site. Never publishes anything. */
export default function PublicPreview({ content, active }) {
  const refs = useRef({});
  useEffect(() => { refs.current[active]?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' }); }, [active]);
  const mark = (k) => ({ ref: (el) => { refs.current[k] = el; }, style: active === k ? { outline: '3px solid #39A9F9', outlineOffset: -3 } : undefined });
  const c = content;
  return (
    <div className="site-preview" aria-label="Website preview">
      <section className="hero" {...mark('hero')}>
        <div>
          <div className="eyebrow">{c.hero.eyebrow}</div>
          <h2>{c.hero.title}</h2>
          <p style={{ marginTop: 8 }}>{c.hero.subtitle}</p>
          <span className="pbtn">{c.hero.cta}</span>
        </div>
        {c.hero.image && <img src={c.hero.image} alt="" style={{ width: '100%', borderRadius: 16 }} />}
      </section>
      <section className="alt" {...mark('about')}><h3>{c.about.title}</h3><p>{c.about.body}</p></section>
      <section {...mark('games')}>
        <h3>Choose Your AI Adventure</h3>
        <div className="cards">{c.games.map((g, i) => <div className="pcard" key={i}>{g.image && <img src={g.image} alt="" />}<b>{g.title}</b><div style={{ color: '#0f6fb8', fontSize: 12 }}>{g.tag}</div><p>{g.blurb}</p></div>)}</div>
      </section>
      <section className="alt" {...mark('benefits')}>
        <h3>Why KALQY</h3>
        <div className="cards">{c.benefits.map((b, i) => <div className="pcard" key={i}><b>{b.title}</b><p>{b.text}</p></div>)}</div>
      </section>
      <section {...mark('howItWorks')}>
        <h3>How It Works</h3>
        <div className="cards">{c.howItWorks.map((b, i) => <div className="pcard" key={i}><span style={{ color: '#0f6fb8', fontWeight: 800 }}>Step {i + 1}</span><br /><b>{b.title}</b><p>{b.text}</p></div>)}</div>
      </section>
      <section className="alt" {...mark('team')}>
        <h3>Meet Our Creators Team</h3>
        <div className="cards">{c.team.map((m, i) => <div className="pcard" key={i}>{m.image && <img src={m.image} alt="" style={{ objectFit: 'cover', height: 120 }} />}<b>{m.name}</b><div style={{ color: '#0f6fb8', fontSize: 12 }}>{m.role}</div><p>{m.bio}</p></div>)}</div>
      </section>
      <section {...mark('gallery')}>
        <h3>Gallery</h3>
        <div className="cards">{c.gallery.map((g, i) => <div className="pcard" key={i}>{g.image && <img src={g.image} alt={g.caption} />}<small>{g.caption}</small></div>)}</div>
      </section>
      <section className="cta" {...mark('demoCta')}><h3>{c.demoCta.title}</h3><p>{c.demoCta.text}</p><span className="pbtn">{c.demoCta.button}</span></section>
      <section className="alt" {...mark('downloads')}>
        <h3>Download KALQY</h3>
        <div className="cards">
          {[['Windows', c.downloads.windows], ['Mac · Apple Silicon (M series)', c.downloads.macAppleSilicon], ['Mac · Intel', c.downloads.macIntel]].map(([l, u]) => (
            <div className="pcard" key={l}><b>{l}</b><p style={{ overflowWrap: 'anywhere' }}>{safeUrl(u) ? <a href={safeUrl(u)} target="_blank" rel="noreferrer noopener" onClick={(e) => e.preventDefault()}>{u}</a> : <em>Invalid link</em>}</p></div>
          ))}
        </div>
      </section>
      <section {...mark('contact')}><h3>Contact</h3><p>{c.contact.email} · {c.contact.phone}</p><p>{c.contact.address}</p></section>
    </div>
  );
}
