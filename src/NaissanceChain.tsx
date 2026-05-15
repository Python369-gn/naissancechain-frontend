import { useState, useEffect, useRef } from "react";
import "./pages.css";
import "./NaissanceChain.css";
import { useApp } from "./App";

// Animated counter hook
function useCounter(target: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = target / (duration / 16);
    const id = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(id); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(id);
  }, [started, target, duration]);

  return { count, ref };
}

// SVG Icons
const IconEye = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#1A5C42' }}>
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const IconTree = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#FFFFFF" }}>
    <path d="M17 14l-5-5-5 5" /><path d="M12 3v18" />
  </svg>
);

const IconSpeed = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#0B3D2E' }}>
    <path d="M12 2a10 10 0 0 1 6.56 2.44" /><path d="M2 12h3M19 12h3M12 21v-3" />
    <circle cx="12" cy="12" r="1" /><path d="M12 12l4-4" />
  </svg>
);

const IconCloud = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /><line x1="4" y1="4" x2="20" y2="20" />
  </svg>
);

const IconFingerprint = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10" /><path d="M5 12c0-3.866 3.134-7 7-7" />
    <path d="M8 12a4 4 0 0 1 8 0" /><path d="M11 12v4" />
  </svg>
);

const IconNetwork = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
    <line x1="12" y1="7" x2="5" y2="17" /><line x1="12" y1="7" x2="19" y2="17" />
  </svg>
);

const IconShield = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const IconGlobe = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const IconBuilding = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" /><line x1="8" y1="3" x2="8" y2="21" />
    <line x1="16" y1="3" x2="16" y2="21" /><line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const IconShieldSm = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

export default function NaissanceChain() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, agents: 0, prefectures: 0, coverage: 0 });
  const { setView } = useApp();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
        const [enregStats, agentsData, prefData] = await Promise.all([
          fetch(`${API_URL}/enregistrements/stats`).then(res => res.json()),
          fetch(`${API_URL}/agents`).then(res => res.json()),
          fetch(`${API_URL}/prefectures`).then(res => res.json())
        ]);
        
        setStats({
          total: enregStats.total || 0,
          agents: agentsData.length || 0,
          prefectures: prefData.length || 0,
          coverage: Math.round(prefData.reduce((acc: number, p: any) => acc + p.couverture, 0) / (prefData.length || 1))
        });
      } catch (err) {
        console.error("Failed to load landing stats", err);
      }
    };
    loadStats();
  }, []);

  const counter2 = useCounter(stats.coverage, 2000);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* MOBILE MENU OVERLAY */}
      <div className={`mobile-overlay ${mobileMenuOpen ? "active" : ""}`} onClick={() => setMobileMenuOpen(false)}></div>

      {/* NAVBAR */}
      <nav className={`nav ${scrolled ? "scrolled" : ""} ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <span className="nav-logo">
          <img src="/logo.jpg" alt="NaissanceChain Logo" className="nav-logo-img" />
          NaissanceChain
        </span>
        <ul className={`nav-links ${mobileMenuOpen ? "open" : ""}`}>
          <li><a href="#impact" onClick={() => setMobileMenuOpen(false)}>Impact</a></li>
          <li><a href="#technologie" onClick={() => setMobileMenuOpen(false)}>Technologie</a></li>
          <li><a href="#parcours" onClick={() => setMobileMenuOpen(false)}>Parcours</a></li>
          <li><a href="#partenaires" onClick={() => setMobileMenuOpen(false)}>Partenaires</a></li>
          <li className="mobile-only-action">
            <button className="nav-btn-enregistrement" onClick={() => { setView("enregistrement"); setMobileMenuOpen(false); }}>
              Enregistrement
            </button>
          </li>
        </ul>
        <div className="nav-actions">
          <button className="nav-btn-verif hide-mobile" onClick={() => setView("verification-portail")}>
            🔍 Vérifier
          </button>
          <button className="nav-btn-portail hide-mobile" onClick={() => setView("portail")}>
            ◆ Portail National
          </button>
          <button className="nav-btn-enregistrement hide-mobile" onClick={() => setView("enregistrement")}>
            Enregistrement
          </button>

          <button className="nav-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            <div className={`hamburger ${mobileMenuOpen ? "active" : ""}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>

          <div className="avatar hide-mobile">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          </div>
        </div>
      </nav>

      {/* LIVE SYSTEM INDICATOR */}
      <div className="live-banner">
        <div className="live-dot"></div>
        <span>Système actif</span>
        <span className="live-sep">·</span>
        <span>{stats.total} actes sécurisés</span>
        <span className="live-sep">·</span>
        <span>{stats.agents} agents déployés</span>
      </div>

      {/* HERO */}
      <section className="hero-premium">
        <div className="hero-container">
          <div className="hero-left">
            <div className="reveal">
              <span className="badge-premium">PROJET NATIONAL · RÉPUBLIQUE DE GUINÉE</span>
              <h1 className="hero-title-premium">
                Chaque enfant compte.<br />
                <span className="text-gradient">Bâtissons le registre de l'avenir.</span>
              </h1>
              <p className="hero-desc-premium">
                Une identité numérique souveraine sécurisée par la blockchain dès la naissance.
                Garantir les droits fondamentaux de chaque citoyen de demain, partout sur le territoire.
              </p>
              <div className="btn-group-hero">
                <button className="btn-hero-primary" onClick={() => setView("enregistrement")}>
                  Enregistrer une naissance
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12,5 19,12 12,19" /></svg>
                </button>
                <button className="btn-hero-secondary" onClick={() => setView("verification-portail")}>Vérifier un Acte</button>
                <button className="btn-hero-portail" onClick={() => setView("portail")}>
                  ◆ Portail National
                </button>
              </div>
            </div>
          </div>

          <div className="hero-right-premium">
            <div className="hero-visual reveal">
              <div className="hero-image-frame">
                <img src="/hero_impact.jpg" alt="Impact Social" className="hero-main-img" />
                <div className="hero-image-overlay"></div>
              </div>

              <div className="tech-card-floating card-1">
                <div className="t-card-icon"><IconShield /></div>
                <div className="t-card-info">
                  <span className="t-card-lbl">SÉCURITÉ</span>
                  <span className="t-card-val">Sovereign Ledger v2.0</span>
                </div>
              </div>

              <div className="tech-card-floating card-2">
                <div className="t-card-icon yellow"><IconNetwork /></div>
                <div className="t-card-info">
                  <span className="t-card-lbl">RÉSEAU</span>
                  <span className="t-card-val">99.9% Disponibilité</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="mouse"><div className="wheel"></div></div>
          <span>DÉCOUVRIR PLUS</span>
        </div>
      </section>

      {/* TRUST STATS — 4 cards */}
      <section className="trust-bar reveal">
        <div className="trust-grid">
          {[
            { icon: "👁️", num: "1.8M+", label: "Enfants sans acte de naissance en Guinée", color: "white" },
            { icon: "🎓", num: "35%", label: "Moins de chance d'accès à l'éducation", color: "green" },
            { icon: "📶", num: "100%", label: "Disponible même hors connexion", color: "white" },
            { icon: "🔐", num: "QR", label: "Vérification sécurisée par blockchain", color: "yellow" },
          ].map((t, i) => (
            <div key={i} className={`trust-card card-${t.color} reveal`} style={{ transitionDelay: `${i * 0.1}s` }}>
              <span className="trust-icon">{t.icon}</span>
              <div className="trust-num">{t.num}</div>
              <div className="trust-label">{t.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* STATS — L'Urgence de l'Invisibilité */}
      <section id="impact" className="stats-section">
        <div className="reveal">
          <h2 className="section-label">L'Urgence de l'Invisibilité</h2>
          <p className="section-sub">Sans acte de naissance, un enfant n'existe pas pour l'État.</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card white reveal">
            <div className="stat-icon"><IconEye /></div>
            <div className="stat-number">1.8M</div>
            <div className="stat-desc">Enfants non-enregistrés en Guinée, restants invisibles aux services publics.</div>
          </div>
          <div className="stat-card green reveal" style={{ transitionDelay: '0.1s' }}>
            <div className="stat-icon"><IconTree /></div>
            <div className="stat-number">40%</div>
            <div className="stat-desc" style={{ color: 'rgba(255,255,255,0.85)' }}>Des zones rurales n'ont aucun accès aux registres d'état civil traditionnels.</div>
          </div>
          <div className="stat-card yellow reveal" style={{ transitionDelay: '0.2s' }}>
            <div className="stat-icon"><IconSpeed /></div>
            <div className="stat-number">100%</div>
            <div className="stat-desc" style={{ color: '#0B3D2E' }}>Transparence et sécurité grâce à la technologie.</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — Timeline */}
      <section id="parcours" className="how-section">
        <div className="reveal">
          <span className="section-tag">COMMENT ÇA MARCHE</span>
          <h2 className="section-label">Le parcours d'une identité</h2>
          <p className="section-sub">De la déclaration à la vérification, un processus simple et sécurisé.</p>
        </div>

        <div className="how-timeline">
          {[
            { n: "01", title: "Déclaration", desc: "Un agent de santé ou d'état civil enregistre la naissance via l'application mobile, même sans connexion internet.", icon: "📱", color: "purple", bg: "white" },
            { n: "02", title: "Vérification", desc: "Les données sont vérifiées et validées par l'administration locale avant inscription sur le registre.", icon: "✅", color: "green", bg: "green" },
            { n: "03", title: "Identité Numérique", desc: "Un NIU unique et un QR code sécurisé sont générés et rattachés à l'acte de naissance sur la blockchain.", icon: "🆔", color: "violet", bg: "white" },
            { n: "04", title: "Vérification Nationale", desc: "L'acte peut être vérifié instantanément par toute institution habilitée sur le territoire national.", icon: "🔍", color: "blue", bg: "yellow" },
          ].map((s, i) => (
            <div key={s.n} className={`how-step step-${s.color} bg-${s.bg} reveal`} style={{ transitionDelay: `${i * 0.15}s` }}>
              <div className="how-step-num">{s.n}</div>
              <div className="how-step-icon-wrapper">
                <div className="how-step-icon">{s.icon}</div>
              </div>
              <h3 className="how-step-title">{s.title}</h3>
              <p className="how-step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TECHNOLOGIE */}
      <section id="technologie" className="tech-section">
        <div className="tech-left">
          {[
            { icon: <IconCloud />, name: "Mode Hors-ligne", color: "white" },
            { icon: <IconFingerprint />, name: "ID Biométrique", color: "green" },
            { icon: <IconNetwork />, name: "Sovereign Ledger", color: "white" },
            { icon: <IconShield />, name: "Encryption AES", color: "yellow" },
          ].map((f, i) => (
            <div key={f.name} className={`feature-card card-${f.color} reveal`} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-name">{f.name}</div>
            </div>
          ))}
        </div>

        <div className="tech-right">
          <h2 className="tech-title reveal">La Puissance du Ledger Souverain</h2>
          {[
            { n: "01", title: "Blockchain Immuable", desc: "Chaque naissance est enregistrée sur un registre décentralisé impossible à altérer ou à perdre, garantissant une existence légale à vie." },
            { n: "02", title: "Architecture Offline-First", desc: "Les agents de santé en zone reculée enregistrent les données sans internet. La synchronisation se fait automatiquement dès qu'une connexion est détectée." },
            { n: "03", title: "Respect de la Vie Privée", desc: "Zéro donnée personnelle stockée en clair. Seules les preuves cryptographiques sont conservées sur le registre distribué." },
          ].map((item) => (
            <div key={item.n} className="tech-item reveal">
              <div className="tech-num">{item.n}</div>
              <div>
                <div className="tech-item-title">{item.title}</div>
                <div className="tech-item-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* NATIONAL IMPACT */}
      <section className="impact-section">
        <div className="reveal">
          <span className="section-tag">IMPACT NATIONAL</span>
          <h2 className="section-label">Un acte de naissance change tout</h2>
          <p className="section-sub">L'identité légale ouvre les portes de la citoyenneté et de la protection.</p>
        </div>

        <div className="impact-grid">
          {[
            { icon: "🎓", title: "Éducation", desc: "Accès garanti à l'inscription scolaire et aux examens nationaux.", color: "white" },
            { icon: "🏥", title: "Santé", desc: "Suivi médical, vaccination et couverture sanitaire dès la naissance.", color: "green" },
            { icon: "🛡️", title: "Protection", desc: "Prévention du travail des enfants, mariages forcés et trafic.", color: "yellow" },
            { icon: "🌍", title: "Inclusion Rurale", desc: "Couverture des zones reculées grâce au mode hors-ligne.", color: "white" },
            { icon: "🏛️", title: "Services Publics", desc: "Accès aux programmes sociaux, aide alimentaire et bourses.", color: "green" },
            { icon: "📊", title: "Statistiques Fiables", desc: "Données démographiques précises pour la planification nationale.", color: "yellow" },
          ].map((c, i) => (
            <div key={i} className={`impact-card card-${c.color} reveal`} style={{ transitionDelay: `${i * 0.08}s` }}>
              <span className="impact-card-icon">{c.icon}</span>
              <h3 className="impact-card-title">{c.title}</h3>
              <p className="impact-card-desc">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE COVERAGE INDICATOR */}
      <section className="coverage-section reveal">
        <div className="coverage-inner">
          <div className="coverage-stat">
            <div className="coverage-number" ref={counter2.ref}>{counter2.count}%</div>
            <div className="coverage-label">Couverture Nationale</div>
            <div className="coverage-bar"><div className="coverage-fill" style={{ width: `${counter2.count}%` }}></div></div>
            <div className="coverage-goal">Objectif : 95% en 2028</div>
          </div>
          <div className="coverage-highlights">
            {[
              { val: stats.prefectures, label: "Préfectures connectées" },
              { val: stats.agents, label: "Agents déployés" },
              { val: "24/7", label: "Monitoring continu" },
            ].map((h, i) => (
              <div key={i} className="coverage-highlight">
                <div className="coverage-h-val">{h.val}</div>
                <div className="coverage-h-label">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section id="partenaires" className="cta-section">
        <div className="cta-box reveal">
          <h2 className="cta-title">Prêt à transformer l'avenir de la Guinée ?</h2>
          <p className="cta-desc">
            Nous recherchons des partenaires technologiques, financiers et institutionnels
            pour déployer NaissanceChain à l'échelle nationale.
          </p>
          <div className="cta-btns">
            <button className="btn-yellow" onClick={() => setView("portail")}>Accéder au Portail National</button>
            <button className="btn-yellow" onClick={() => setView("verification-portail")}>Vérifier un Acte</button>
            <button className="btn-outline-white" onClick={() => setView("enregistrement")}>Enregistrer une Naissance</button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">NaissanceChain</div>
            <p className="footer-desc">
              Plateforme souveraine de gestion d'identité numérique pour la République
              de Guinée. Sécurisé par la technologie Ledger Distribué.
            </p>
            <div className="footer-icons">
              <IconGlobe /><IconBuilding /><IconShieldSm />
            </div>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <div className="footer-col-title">Navigation</div>
              <ul>
                <li><a href="#impact">Impact</a></li>
                <li><a href="#technologie">Blockchain</a></li>
                <li><a href="#parcours">Parcours</a></li>
                <li><a href="#partenaires">Partenaires</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Légal</div>
              <ul>
                <li><a href="#privacy">Confidentialité</a></li>
                <li><a href="#governance">Gouvernance</a></li>
                <li><a href="#api">Accès API</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 NaissanceChain Guinée. Sécurisé par Sovereign Ledger.</span>
        </div>
      </footer>

      {/* STICKY FLOATING CTA */}
      <div className="sticky-cta">
        <button className="sticky-btn-dark" onClick={() => setView("verification-portail")}>VÉRIFICATION</button>
        <button className="sticky-btn-yellow" onClick={() => setView("enregistrement")}>ENREGISTREMENT</button>
      </div>
    </>
  );
}
