import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { achievements, profile, site } from './data/portfolio.js';
import Icon from './components/Icon.jsx';
import Reveal from './components/Reveal.jsx';
import HeroArtwork from './components/HeroArtwork.jsx';

const ModelViewer = lazy(() => import('./components/ModelViewer.jsx'));
const assetUrl = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;

class ViewerBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="viewer-placeholder" role="alert"><Icon name="cube" /><p>The 3D playground could not be opened.</p><button className="button button-primary" onClick={() => window.location.reload()}>Reload page</button></div>;
    return this.props.children;
  }
}

function Collection() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => !('IntersectionObserver' in window));
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="collection-mount">
    {visible ? <ViewerBoundary><Suspense fallback={<div className="viewer-placeholder"><span className="loading-orbit" /><p>Opening the 3D playground…</p></div>}><ModelViewer /></Suspense></ViewerBoundary> : <div className="viewer-placeholder"><Icon name="cube" /><p>An interactive 3D collection</p><button className="button button-secondary" onClick={() => setVisible(true)}>Explore collection <Icon /></button></div>}
  </div>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('about');
  const [copyStatus, setCopyStatus] = useState('');
  const contactDialogRef = useRef(null);
  const mailtoUrl = `mailto:${profile.email}`;
  const gmailUrl = `https://mail.google.com/mail/?extsrc=mailto&url=${encodeURIComponent(mailtoUrl)}`;
  const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(profile.email)}`;
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('error');
    }
  };
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-15% 0px -65% 0px' });
    site.navigation.forEach(item => { const el = document.getElementById(item.id); if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);
  return <><header className="site-header"><div className="header-inner">
    <a className="brand" href="#about" aria-label="Back to top"><span className="brand-mark">{profile.initials}</span><span>{profile.name}<span className="brand-dot">.</span></span></a>
    <button className="menu-toggle" aria-expanded={open} aria-controls="site-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button>
    <nav id="site-navigation" className={`navigation ${open ? 'is-open' : ''}`} aria-label="Main navigation">
      {site.navigation.map(item => <a key={item.id} className={active === item.id ? 'active' : ''} href={`#${item.id}`} aria-current={active === item.id ? 'location' : undefined} onClick={() => setOpen(false)}>{item.label}</a>)}
      {profile.email && <button className="nav-contact" type="button" aria-haspopup="dialog" aria-controls="contact-dialog" onClick={() => { setOpen(false); setCopyStatus(''); contactDialogRef.current?.showModal(); }}>Let's talk <Icon name="mail" /></button>}
    </nav>
  </div></header>
    {profile.email && <dialog id="contact-dialog" ref={contactDialogRef} className="contact-dialog" aria-labelledby="contact-title" onClose={() => setCopyStatus('')}>
      <div className="contact-dialog-top"><div><span className="section-number">GET IN TOUCH</span><h2 id="contact-title">Let's talk.</h2></div><button className="contact-close" type="button" aria-label="Close contact dialog" onClick={() => contactDialogRef.current?.close()}><Icon name="close" /></button></div>
      <p className="contact-intro">Copy my address or choose where to write.</p>
      <div className="contact-email-row"><span>{profile.email}</span><button type="button" aria-label="Copy email address" onClick={copyEmail}>{copyStatus === 'copied' ? 'Copied' : 'Copy'}</button></div>
      <p className="contact-copy-status" role="status">{copyStatus === 'copied' ? 'Email copied to clipboard.' : copyStatus === 'error' ? 'Copy failed. Please select the address above.' : ''}</p>
      <span className="contact-options-label">OPEN WITH</span>
      <div className="contact-options">
        <a href={mailtoUrl}>Default mail app <Icon name="diagonal" /></a>
        <a href={gmailUrl} target="_blank" rel="noopener noreferrer">Gmail <Icon name="diagonal" /></a>
        <a href={outlookUrl} target="_blank" rel="noopener noreferrer">Outlook Web <Icon name="diagonal" /></a>
      </div>
    </dialog>}
  </>;
}

function AchievementCard({ item, index }) {
  const authorNames = profile.publicationNames ?? [profile.name];
  const organization = item.type === 'Publication'
    ? item.organization.split(/(,| and )/).map((author, authorIndex) => (
      authorNames.includes(author.trim()) ? <strong key={authorIndex}>{author}</strong> : author
    ))
    : item.organization;
  return <Reveal delay={index * 70}><article className="achievement-card">
    <div className="achievement-top"><span className={`achievement-icon icon-${item.icon}`}><Icon name={item.icon} /></span><span className="achievement-year">{item.year}</span></div>
    <div className="achievement-type">{item.type}{item.isPlaceholder && <span className="sample-badge">Sample content</span>}</div>
    <h3>{item.title}</h3><p className="achievement-organization">{organization}</p><p className="achievement-description">{item.description}</p>
    <div className="achievement-bottom"><div className="tags">{item.tags?.map(tag => <span key={tag}>{tag}</span>)}</div>{item.url && <a className="card-link" href={item.url} target="_blank" rel="noopener noreferrer" aria-label={`View ${item.title}`}><Icon name="diagonal" /></a>}</div>
  </article></Reveal>;
}

export default function App() {
  useEffect(() => {
    document.title = `${profile.name} — ${site.title}`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', site.description);
  }, []);
  return <>
    <a className="skip-link" href="#main">Skip to content</a>
    <Header />
    <main id="main">
      <section id="about" className="hero section-shell">
        <div className="hero-layout">
          <Reveal className="hero-copy">
            <div className="eyebrow"><span className="status-dot" /> PERSONAL PORTFOLIO <span className="eyebrow-line" /></div>
            <p className="hero-greeting">{profile.greeting} <strong>{profile.name}<span className="brand-dot">.</span></strong></p>
            <h1>{profile.headline[0]}<br /><span>{profile.headline[1]}</span></h1>
            <p className="hero-introduction">{profile.introduction}</p>
            <div className="hero-actions"><a className="button button-primary" href="#achievements">Explore my journey <Icon name="diagonal" /></a><a className="button button-text" href="#collection"><Icon name="cube" /> Enter the 3D playground</a></div>
            <div className="hero-meta"><span><Icon name="pin" />{profile.location}</span><span className="meta-divider" /><span>{profile.role}</span></div>
          </Reveal>
          <Reveal className="hero-visual" delay={120}>{profile.portrait ? <div className="portrait-card"><img src={assetUrl(profile.portrait)} alt={profile.portraitAlt} /></div> : <HeroArtwork />}</Reveal>
        </div>
        <Reveal><div className="about-strip"><div className="about-label"><span className="section-number">01 / ABOUT ME</span><span>Stay curious.<br />Keep creating.</span></div><div className="about-copy"><p>{profile.about}</p><div className="disciplines">{profile.disciplines.map(item => <span key={item}><span />{item}</span>)}</div></div><a className="scroll-cue" href="#achievements" aria-label="Scroll to achievements"><Icon name="down" /></a></div></Reveal>
      </section>

      <section id="achievements" className="achievements-section section-shell">
        <Reveal><div className="section-heading"><div><span className="section-number">02 / ACHIEVEMENTS</span><h2>Little steps.<span className="serif-word"> Lasting impact.</span></h2></div><p>Every milestone has a story. <br />Here are a few worth sharing.</p></div></Reveal>
        <div className="achievement-grid">{achievements.map((item, index) => <AchievementCard key={item.id} item={item} index={index} />)}</div>
      </section>

      <section id="collection" className="collection-section section-shell">
        <Reveal><div className="section-heading"><div><span className="section-number">03 / 3D PLAYGROUND</span><h2>A different<span className="serif-word"> perspective.</span></h2></div><p>Ideas you can explore from every angle. <br />Pick a model. Make it your own view.</p></div></Reveal>
        <Collection />
      </section>
    </main>
    <footer className="site-footer section-shell"><div className="footer-top"><div><span className="section-number">THE JOURNEY CONTINUES</span><p>See you at the next idea<span className="brand-dot">.</span></p></div><div className="footer-links">{profile.email && <a href={`mailto:${profile.email}`}>Let's connect <Icon name="diagonal" /></a>}{profile.resume && <a href={assetUrl(profile.resume)} download>Download resume <Icon name="download" /></a>}{profile.socials.map(link => <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">{link.label} <Icon name="diagonal" /></a>)}</div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} {profile.name}</span><span>Made with curiosity.</span><a href="#about">Back to top ↑</a></div></footer>
  </>;
}
