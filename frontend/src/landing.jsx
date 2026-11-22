import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import appUi from './assets/app-ui.png';
import './landing.css';

document.documentElement.classList.add('js');

const SPEEDS = ['0,25x', '0,50x', '0,75x', '1,00x', '1,25x', '1,50x', '2,00x', '3,00x'];

const LIMITS = [
  ['Pas de pas à pas', 'Le moindre mouvement se joue en 0,04 seconde.'],
  ['Pas de ralenti fin', 'Les vitesses disponibles s’arrêtent trop tôt.'],
  ['Pas de boucle ciblée', 'Revenir au bon endroit se fait à la main.'],
  ['Aucun repère', 'Rien ne permet de noter un instant précis.']
];

const SHORTCUTS = [
  ['Lecture, pause', ['Espace', 'K']],
  ['Image précédente, suivante', [',', '.']],
  ['Reculer, avancer d’une seconde', ['J', 'L']],
  ['Reculer, avancer de cinq secondes', ['←', '→']],
  ['Points A et B de la boucle', ['A', 'B']],
  ['Poser un repère', ['M']],
  ['Plein écran', ['F']],
  ['Aide', ['?']]
];

function useReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

function PlayMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none"><path d="M8 5.5 19 12 8 18.5Z" fill="currentColor" /></svg>
    </span>
  );
}

function Landing() {
  useReveal();

  return (
    <>
      <a className="skip-link" href="#main">Aller au contenu</a>

      <header className="site-head">
        <div className="wrap head-inner">
          <a className="brand" href="#top">
            <PlayMark />
            <span>
              <span className="brand-name">InstaPlaya</span>
              <span className="brand-sub">Studio de lecture précise</span>
            </span>
          </a>
          <nav className="head-nav" aria-label="Navigation principale">
            <a href="#principe">Le principe</a>
            <a href="#fonctions">Les fonctions</a>
            <a href="#clavier">Clavier</a>
          </nav>
          <a className="btn btn-primary head-action" href="#install">Démarrer</a>
        </div>
      </header>

      <main id="main">
        <section className="hero" id="top">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <h1>Le Reel, image par image.</h1>
              <p>InstaPlaya ralentit, boucle et marque chaque geste sur votre machine.</p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#install">Démarrer sur mon PC</a>
                <a className="btn btn-quiet" href="#principe">Voir le principe</a>
              </div>
            </div>
            <figure className="hero-visual">
              <img src={appUi} alt="L’interface d’InstaPlaya pendant l’analyse d’une vidéo" width="1440" height="900" />
            </figure>
          </div>
        </section>

        <section className="section" id="principe">
          <div className="wrap two-col">
            <div className="reveal">
              <h2>Instagram vous laisse regarder. Pas analyser.</h2>
              <p className="lede">Un geste rapide disparaît en une ou deux images. Sans outil adapté, on revient en arrière, on devine, on recommence.</p>
            </div>
            <ul className="limits reveal" style={{ transitionDelay: '80ms' }}>
              {LIMITS.map(([title, text]) => (
                <li key={title}>
                  <strong>{title}</strong>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section" id="fonctions">
          <div className="wrap">
            <div className="reveal">
              <h2>La précision se commande.</h2>
              <p className="lede narrow">Chaque action énonce son résultat : timecode, numéro d’image, vitesse. Aucun état implicite.</p>
            </div>
            <div className="transport-demo reveal" style={{ transitionDelay: '80ms' }} aria-label="Aperçu des commandes de lecture">
              <div className="demo-group">
                <span className="demo-btn">−1 img</span>
                <span className="demo-btn">−5 s</span>
              </div>
              <span className="demo-play" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none"><path d="M9 6.5 18 12 9 17.5Z" fill="currentColor" /></svg>
              </span>
              <div className="demo-group">
                <span className="demo-btn">+5 s</span>
                <span className="demo-btn">+1 img</span>
              </div>
              <div className="demo-readout">
                <span className="mono">00:02,23</span>
                <span className="mono small">image 55 / 75</span>
              </div>
            </div>
            <div className="speed-demo reveal" style={{ transitionDelay: '140ms' }}>
              <span className="demo-label">Vitesse</span>
              <div className="chips">
                {SPEEDS.map((speed) => (
                  <span key={speed} className={`chip ${speed === '0,50x' ? 'on' : ''}`}>{speed}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="boucle">
          <div className="wrap two-col">
            <div className="reveal">
              <h2>Un passage, isolé.</h2>
              <p className="lede">Posez le point A, posez le point B. InstaPlaya rejoue uniquement cet intervalle, à la vitesse que vous choisissez.</p>
              <div className="timeline-demo" role="img" aria-label="Exemple de boucle sur une timeline, entre les repères A et B">
                <div className="track">
                  <div className="loop-zone" />
                  <div className="needle" />
                </div>
                <div className="track-labels mono">
                  <span>A 00:02,40</span>
                  <span>B 00:05,80</span>
                </div>
                <span className="example-note">Exemple de boucle</span>
              </div>
            </div>
            <div className="cue-card reveal" style={{ transitionDelay: '80ms' }}>
              <div className="cue-head">
                <span>Instants enregistrés</span>
                <span className="mono">2</span>
              </div>
              <div className="cue-row">
                <span className="cue-time mono">00:02,40</span>
                <span className="cue-label">Départ du geste</span>
              </div>
              <div className="cue-row">
                <span className="cue-time mono">00:05,80</span>
                <span className="cue-label">Fin du geste</span>
              </div>
              <p className="cue-note">Exemple de feuille de repères</p>
            </div>
          </div>
        </section>

        <section className="section" id="clavier">
          <div className="wrap">
            <div className="reveal">
              <h2>Les mains ne quittent pas le clavier.</h2>
              <p className="lede narrow">Chaque commande a sa touche. La lecture devient un geste, pas une recherche dans un menu.</p>
            </div>
            <table className="keys reveal" style={{ transitionDelay: '80ms' }}>
              <tbody>
                {SHORTCUTS.map(([label, keys]) => (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td>{keys.map((key) => <kbd key={key}>{key}</kbd>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="section install" id="install">
          <div className="wrap install-grid">
            <div className="reveal">
              <h2>Chez vous, en trois gestes.</h2>
              <p className="lede">L’application tourne en local. Les vidéos et les repères restent sur votre machine.</p>
              <a className="btn btn-primary" href="https://github.com/t12lve/instaplaya">Voir le dépôt GitHub</a>
            </div>
            <ol className="steps reveal" style={{ transitionDelay: '80ms' }}>
              <li>
                <strong>Installer les dépendances</strong>
                <code>cd instaplaya/frontend &amp;&amp; npm install</code>
              </li>
              <li>
                <strong>Lancer l’application</strong>
                <code>cd .. &amp;&amp; python app.py</code>
              </li>
              <li>
                <strong>Ouvrir le studio</strong>
                <code>http://localhost:8080</code>
              </li>
            </ol>
            <p className="requirement reveal" style={{ transitionDelay: '140ms' }}>
              Python et Node.js sont nécessaires. Sous Windows, le fichier <code>run.bat</code> prépare et lance l’application.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-foot">
        <div className="wrap foot-inner">
          <span className="foot-brand">InstaPlaya</span>
          <span>Studio de lecture précise pour Reels Instagram</span>
          <a href="https://github.com/t12lve/instaplaya">Voir le code</a>
        </div>
      </footer>
    </>
  );
}

createRoot(document.getElementById('root')).render(<Landing />);
