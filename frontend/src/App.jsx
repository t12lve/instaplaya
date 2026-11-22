import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play, Pause, RotateCw, Volume2, VolumeX, Download, Maximize2,
  PictureInPicture2, HelpCircle, X, Bookmark, Clock, Copy, Check, Trash2,
  Link2, Sun, Moon, Clapperboard, ListVideo, History, Keyboard, House,
  Repeat2, Film, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight,
  ArrowUpRight
} from 'lucide-react';

const FRAME_TIME = 0.04; // 1 frame at 25 fps = 0.04s
const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00.00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const centis = Math.floor((seconds % 1) * 100);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
}

function timeToFrames(seconds) {
  if (isNaN(seconds) || seconds < 0) return 0;
  return Math.floor(seconds / FRAME_TIME);
}

export default function App() {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const notifyTimer = useRef(null);
  const fileInputRef = useRef(null);

  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [videoData, setVideoData] = useState(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [isMuted, setIsMuted] = useState(true);

  // A-B cue loop
  const [loopA, setLoopA] = useState(null);
  const [loopB, setLoopB] = useState(null);
  const [isLoopActive, setIsLoopActive] = useState(false);

  // Viewport optics
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Cue sheet markers
  const [markers, setMarkers] = useState([]);

  // Interface
  const [activeTab, setActiveTab] = useState('cues'); // 'cues' | 'history'
  const [history, setHistory] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [copiedCueSheet, setCopiedCueSheet] = useState(false);
  const [statusNotification, setStatusNotification] = useState(null);
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem('instaplaya_theme') === 'dark'; } catch { return false; }
  });
  const [mobileView, setMobileView] = useState('studio'); // 'studio' | 'panel'
  const [markerPulse, setMarkerPulse] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(false);

  const notify = useCallback((msg) => {
    setStatusNotification(msg);
    clearTimeout(notifyTimer.current);
    notifyTimer.current = setTimeout(() => setStatusNotification(null), 1600);
  }, []);

  useEffect(() => () => clearTimeout(notifyTimer.current), []);

  useEffect(() => {
    let alive = true;
    fetch('/api/extract', { method: 'OPTIONS' })
      .then((r) => { if (alive) setBackendAvailable(r.ok || r.status === 405); })
      .catch(() => { if (alive) setBackendAvailable(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    return () => { delete document.documentElement.dataset.theme; };
  }, [dark]);

  useEffect(() => {
    try {
      const savedHistory = JSON.parse(localStorage.getItem('instaplaya_history') || '[]');
      setHistory(savedHistory);
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    if (!videoData?.id) return;
    try {
      const saved = JSON.parse(localStorage.getItem(`instaplaya_markers_${videoData.id}`) || '[]');
      setMarkers(saved);
    } catch {
      setMarkers([]);
    }
  }, [videoData?.id]);

  const updateMarkers = useCallback((newMarkers) => {
    setMarkers(newMarkers);
    if (videoData?.id) {
      localStorage.setItem(`instaplaya_markers_${videoData.id}`, JSON.stringify(newMarkers));
    }
  }, [videoData?.id]);

  const toggleTheme = () => {
    setDark((prev) => {
      const next = !prev;
      try { localStorage.setItem('instaplaya_theme', next ? 'dark' : 'light'); } catch { /* ignore */ }
      return next;
    });
  };

  const applyVideoData = (data, sourceUrl, saveHistory = true) => {
    setVideoData(data);
    setLoopA(null);
    setLoopB(null);
    setIsLoopActive(false);
    setZoomLevel(1);
    setRotation(0);
    setCurrentTime(0);
    setMobileView('studio');

    if (!saveHistory || sourceUrl.startsWith('blob:')) return;
    const newHistoryItem = {
      id: data.id,
      url: sourceUrl,
      title: data.title || 'Vidéo',
      uploader: data.uploader || 'source',
      thumbnail: data.thumbnail || '',
      date: new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    const updatedHistory = [newHistoryItem, ...history.filter(h => h.url !== sourceUrl)].slice(0, 30);
    setHistory(updatedHistory);
    try { localStorage.setItem('instaplaya_history', JSON.stringify(updatedHistory)); } catch { /* ignore */ }
  };

  const DIRECT_MEDIA = /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i;

  const handleDirectUrl = (clean) => {
    applyVideoData({
      success: true,
      id: `url-${Date.now()}`,
      title: clean.split('/').pop().split('?')[0] || 'Vidéo distante',
      uploader: 'lien direct',
      thumbnail: '',
      stream_url: clean,
      direct_url: clean
    }, clean);
    notify('Vidéo distante chargée');
  };

  const handleLocalFile = (file) => {
    if (!file || !file.type.startsWith('video/')) {
      setErrorMsg('Choisissez un fichier vidéo MP4, WebM ou MOV');
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    applyVideoData({
      success: true,
      id: `local-${Date.now()}`,
      title: file.name,
      uploader: 'fichier local',
      thumbnail: '',
      stream_url: objectUrl,
      direct_url: objectUrl,
      local: true
    }, objectUrl, false);
    setUrl('');
    setErrorMsg('');
    notify(`${file.name} chargée`);
  };

  // Source: local file, direct media URL, or backend extraction for Instagram
  const handleLoadVideo = async (targetUrl) => {
    const clean = (targetUrl || url).trim();
    if (!clean) return;

    if (clean.startsWith('blob:') || DIRECT_MEDIA.test(clean)) {
      handleDirectUrl(clean);
      return;
    }

    setErrorMsg('');

    if (!backendAvailable) {
      setErrorMsg('L’extraction Instagram demande le serveur local. Ici, importez un fichier vidéo ou collez un lien MP4 direct.');
      return;
    }

    setIsLoading(true);

    try {
      const resp = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean })
      });
      if (!resp.ok) throw new Error('backend indisponible');
      const data = await resp.json();
      if (!data.success) throw new Error(data.detail || 'Extraction impossible pour ce lien');

      applyVideoData(data, clean);
      notify(`Reel ${data.id} chargé`);
    } catch {
      setErrorMsg('L’extraction Instagram demande le serveur local. Sur GitHub Pages, importez un fichier vidéo ou collez un lien MP4 direct.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        if (text.includes('instagram.com') || DIRECT_MEDIA.test(text)) {
          handleLoadVideo(text);
        } else {
          notify('Lien collé');
        }
      }
    } catch {
      notify('Presse-papiers indisponible');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) handleLocalFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleLocalFile(file);
  };

  const togglePlayPause = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      v.play();
      setIsPlaying(true);
      notify('Lecture');
    } else {
      v.pause();
      setIsPlaying(false);
      notify('Pause');
    }
  };

  const seekRelative = (delta) => {
    const v = videoRef.current;
    if (!v) return;
    const nextTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + delta));
    v.currentTime = nextTime;
    setCurrentTime(nextTime);
    notify(`Saut ${delta > 0 ? '+' : ''}${delta.toFixed(1)} s`);
  };

  const stepFrame = (frames) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    setIsPlaying(false);
    const target = Math.max(0, Math.min(v.duration || 0, v.currentTime + frames * FRAME_TIME));
    v.currentTime = target;
    setCurrentTime(target);
    notify(`Image ${frames > 0 ? '+' : ''}${frames} à ${formatTime(target)}`);
  };

  const handleSpeedChange = (speed) => {
    const v = videoRef.current;
    if (!v) return;
    const s = Math.round(parseFloat(speed) * 100) / 100;
    v.playbackRate = s;
    setPlaybackSpeed(s);
    notify(`Vitesse ${s.toFixed(2)}x`);
  };

  const handleSetCueA = () => {
    const v = videoRef.current;
    if (!v) return;
    const a = v.currentTime;
    setLoopA(a);
    if (loopB !== null && a >= loopB) setLoopB(null);
    notify(`Début A à ${formatTime(a)}`);
  };

  const handleSetCueB = () => {
    const v = videoRef.current;
    if (!v) return;
    const b = v.currentTime;
    const a = loopA !== null ? loopA : 0;
    if (loopA === null) setLoopA(0);
    const finalB = b > a ? b : a + FRAME_TIME;
    setLoopB(finalB);
    setIsLoopActive(true);
    notify(`Fin B à ${formatTime(finalB)}`);
  };

  const toggleLoop = () => {
    if (loopA === null || loopB === null) {
      notify('Définissez d’abord A et B');
      return;
    }
    const next = !isLoopActive;
    setIsLoopActive(next);
    if (next && videoRef.current) videoRef.current.currentTime = loopA;
    notify(next ? 'Boucle active' : 'Boucle en pause');
  };

  const clearLoop = () => {
    setLoopA(null);
    setLoopB(null);
    setIsLoopActive(false);
    notify('Points A et B effacés');
  };

  const handleAddMarker = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    const newMarker = {
      id: Date.now(),
      time: t,
      frame: timeToFrames(t),
      label: `Repère ${String(markers.length + 1).padStart(2, '0')}`
    };
    updateMarkers([...markers, newMarker].sort((a, b) => a.time - b.time));
    setMarkerPulse(true);
    setTimeout(() => setMarkerPulse(false), 450);
    notify(`Repère posé à ${formatTime(t)}`);
  };

  const handleDeleteMarker = (id) => {
    updateMarkers(markers.filter(m => m.id !== id));
    notify('Repère supprimé');
  };

  const handleUpdateMarkerLabel = (id, label) => {
    updateMarkers(markers.map(m => m.id === id ? { ...m, label } : m));
  };

  const handleJumpToTime = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
      notify(`Saut à ${formatTime(time)}`);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      notify('Lien copié');
    } catch {
      notify('Copie indisponible');
    }
  };

  const handleCopyCueSheet = () => {
    if (markers.length === 0) return;
    const text = markers
      .map((m, idx) => `[${String(idx + 1).padStart(2, '0')}] ${formatTime(m.time)} (F:${timeToFrames(m.time)}) - ${m.label}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCueSheet(true);
    setTimeout(() => setCopiedCueSheet(false), 1600);
    notify('Feuille de repères copiée');
  };

  const handleTimelineClick = (e) => {
    if (!timelineRef.current || !videoRef.current || !duration) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const target = pos * duration;
    videoRef.current.currentTime = target;
    setCurrentTime(target);
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    setCurrentTime(t);
    if (isLoopActive && loopB !== null && t >= loopB) {
      v.currentTime = loopA !== null ? loopA : 0;
    }
  };

  const onLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const openTab = (tab) => {
    setActiveTab(tab);
    setMobileView('panel');
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
      switch (e.key) {
        case ' ': case 'k': case 'K': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowLeft': e.preventDefault(); seekRelative(-5); break;
        case 'ArrowRight': e.preventDefault(); seekRelative(5); break;
        case 'j': case 'J': e.preventDefault(); seekRelative(-1); break;
        case 'l': case 'L': e.preventDefault(); seekRelative(1); break;
        case ',': case '<': e.preventDefault(); stepFrame(-1); break;
        case '.': case '>': e.preventDefault(); stepFrame(1); break;
        case '[': e.preventDefault(); handleSpeedChange(Math.max(0.1, playbackSpeed - 0.1)); break;
        case ']': e.preventDefault(); handleSpeedChange(Math.min(3.0, playbackSpeed + 0.1)); break;
        case '0': e.preventDefault(); handleSpeedChange(1.0); break;
        case 'a': case 'A': e.preventDefault(); handleSetCueA(); break;
        case 'b': case 'B': e.preventDefault(); handleSetCueB(); break;
        case 'r': case 'R': e.preventDefault(); toggleLoop(); break;
        case 'm': case 'M': e.preventDefault(); handleAddMarker(); break;
        case 'p': case 'P':
          e.preventDefault();
          if (videoRef.current && document.pictureInPictureEnabled) {
            document.pictureInPictureElement
              ? document.exitPictureInPicture()
              : videoRef.current.requestPictureInPicture();
          }
          break;
        case 'f': case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            document.getElementById('consoleViewport')?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        case '?': e.preventDefault(); setShowShortcuts(prev => !prev); break;
        default: break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playbackSpeed, loopA, loopB, isLoopActive, markers, duration]);

  const currentFrame = timeToFrames(currentTime);
  const totalFrames = timeToFrames(duration);

  const navItems = [
    { key: 'studio', label: 'Studio', icon: House, onClick: () => setMobileView('studio'), active: mobileView === 'studio' },
    { key: 'cues', label: 'Repères', icon: ListVideo, onClick: () => openTab('cues'), active: activeTab === 'cues' && mobileView === 'panel', count: markers.length },
    { key: 'history', label: 'Historique', icon: History, onClick: () => openTab('history'), active: activeTab === 'history' && mobileView === 'panel', count: history.length },
    { key: 'shortcuts', label: 'Raccourcis', icon: Keyboard, onClick: () => setShowShortcuts(true), active: showShortcuts }
  ];

  return (
    <div className="app" data-theme={dark ? 'dark' : 'light'}>
      {/* Rail */}
      <aside className="rail">
        <div className="brand">
          <div className="brand-mark"><Play fill="currentColor" /></div>
          <div>
            <div className="brand-name">InstaPlaya</div>
            <div className="brand-sub">Studio de lecture précise</div>
          </div>
        </div>

        <nav className="nav">
          <div className="nav-label">Espace de travail</div>
          {navItems.map(({ key, label, icon: Icon, onClick, active, count }) => (
            <button key={key} className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
              <Icon />
              <span>{label}</span>
              {count !== undefined && <span className="nav-count">{count}</span>}
              {count === undefined && <span className="nav-dot" />}
            </button>
          ))}
        </nav>

        <div className="rail-foot">
          <div className="rail-tip">
            <strong>Espace</strong> pour lire ou mettre en pause.<br />
            <strong>M</strong> pour poser un repère à l’image près.
          </div>
          <div className="rail-version">v1.0, 25 fps</div>
        </div>
      </aside>

      <div className="shell">
        {/* Top bar */}
        <header className="topbar">
          <div className="url-field">
            <Link2 />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
              placeholder={backendAvailable ? 'https://www.instagram.com/reel/…' : 'Lien MP4 direct, ex. https://…/video.mp4'}
              aria-label={backendAvailable ? 'Lien du Reel Instagram' : 'Lien vidéo direct'}
            />
            <button className="btn btn-quiet" onClick={handlePasteClipboard} title="Coller depuis le presse-papiers">Coller</button>
            <button className="btn btn-primary" onClick={() => handleLoadVideo()} disabled={isLoading || !url.trim()}>
              {isLoading ? 'Extraction…' : 'Charger'}
            </button>
          </div>

          <div className="topbar-actions">
            {backendAvailable && videoData?.direct_url && (
              <a
                className="icon-btn"
                href={videoData.direct_url}
                download={`reel_${videoData.id}.mp4`}
                title="Télécharger le MP4"
              >
                <Download />
              </a>
            )}
            <button className="icon-btn" onClick={toggleTheme} title={dark ? 'Thème clair' : 'Thème sombre'}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <button className="icon-btn" onClick={() => setShowShortcuts(true)} title="Raccourcis clavier">
              <HelpCircle />
            </button>
          </div>
        </header>

        <section className="intro">
          <div className="intro-copy">
            <h1>Analysez un Reel, image par image.</h1>
            <p>InstaPlaya ralentit la lecture, boucle un passage et pose des repères horodatés. Importez un fichier vidéo ou collez un lien MP4 direct.</p>
          </div>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Film /> Importer une vidéo
          </button>
          <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileInput} hidden />
        </section>

        {errorMsg && (
          <div className="error-bar" role="alert">
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg('')}>Fermer</button>
          </div>
        )}

        {/* Workspace */}
        <main className="workspace">
          <div className="studio-column" data-view={mobileView}>
            {/* Stage */}
            <section className="card stage" id="consoleViewport">
              <div className="stage-head">
                <div className="stage-head-left">
                  <span className="rec-dot" />
                  <span className="stage-title">Lecture</span>
                  <span className="stage-time mono">{formatTime(currentTime)}</span>
                  <span className="stage-frame mono">image {currentFrame}</span>
                </div>
                <span className={`stage-badge ${isLoopActive ? 'live' : ''}`}>
                  {isLoopActive ? `Boucle de ${formatTime(loopA || 0)} à ${formatTime(loopB || 0)}` : `${playbackSpeed.toFixed(2)}x`}
                </span>
              </div>

              <div
                className={`stage-surface ${videoData ? 'has-video' : ''}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                {videoData ? (
                  <>
                    <video
                      ref={videoRef}
                      src={videoData.stream_url}
                      poster={videoData.thumbnail || undefined}
                      style={{ transform: `scale(${zoomLevel}) rotate(${rotation}deg)` }}
                      playsInline
                      autoPlay
                      muted={isMuted}
                      onClick={togglePlayPause}
                      onTimeUpdate={onTimeUpdate}
                      onLoadedMetadata={onLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    <span className="corner tl" /><span className="corner tr" />
                    <span className="corner bl" /><span className="corner br" />

                    <div className="stage-caption">
                      <strong>@{videoData.uploader || 'createur'}</strong>
                      <span>{videoData.width && videoData.height ? `${videoData.width} × ${videoData.height}, ` : ''}{formatTime(duration)}</span>
                    </div>

                    <div className="action-rail">
                      <button className={`rail-action ${markerPulse ? 'pop' : ''}`} onClick={handleAddMarker} title="Poser un repère (M)">
                        <Bookmark fill={markers.length ? 'currentColor' : 'none'} />
                        <span className="mono">{markers.length}</span>
                      </button>
                      <button className={`rail-action ${isLoopActive ? 'on' : ''}`} onClick={toggleLoop} title="Boucle A-B (R)">
                        <Repeat2 />
                        <span>Boucle</span>
                      </button>
                      <button className="rail-action" onClick={handleCopyLink} title="Copier le lien">
                        <Link2 />
                        <span>Lien</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="empty">
                    <div className="empty-icon"><Clapperboard /></div>
                    <h2>Votre vidéo, image par image.</h2>
                    <p>Importez un fichier MP4 ou collez un lien vidéo direct. Ralentissez un geste, bouclez un passage et posez des repères précis.</p>
                    <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
                      <Film /> Importer une vidéo
                    </button>
                  </div>
                )}
              </div>

              <div className="stage-foot">
                <div className="tool-group">
                  <span className="tool-label">Zoom</span>
                  {[1, 1.5, 2, 3].map((z) => (
                    <button
                      key={z}
                      className={`tool mono ${zoomLevel === z ? 'on' : ''}`}
                      onClick={() => { setZoomLevel(z); notify(`Zoom ${z}x`); }}
                    >{z}x</button>
                  ))}
                  <button className="tool" onClick={() => { setRotation(r => (r + 90) % 360); notify('Rotation 90°'); }} title="Pivoter de 90°">
                    <RotateCw />
                  </button>
                </div>
                <div className="tool-group">
                  <button className="tool" onClick={() => setIsMuted(m => !m)} title={isMuted ? 'Activer le son' : 'Couper le son'}>
                    {isMuted ? <VolumeX /> : <Volume2 />}
                  </button>
                  <button className="tool" onClick={() => {
                    if (videoRef.current && document.pictureInPictureEnabled) {
                      document.pictureInPictureElement
                        ? document.exitPictureInPicture()
                        : videoRef.current.requestPictureInPicture();
                    }
                  }} title="Picture-in-Picture (P)"><PictureInPicture2 /></button>
                  <button className="tool" onClick={() => {
                    if (!document.fullscreenElement) {
                      document.getElementById('consoleViewport')?.requestFullscreen();
                    } else {
                      document.exitFullscreen();
                    }
                  }} title="Plein écran (F)"><Maximize2 /></button>
                </div>
              </div>
            </section>

            {/* Transport */}
            <section className="card transport">
              <div className="transport-group">
                <button className="transport-btn" onClick={() => stepFrame(-1)} title="Image précédente (,)" disabled={!videoData}>
                  <ChevronLeft /> <span className="mono">−1 img</span>
                </button>
                <button className="transport-btn" onClick={() => seekRelative(-5)} title="Reculer de 5 s (←)" disabled={!videoData}>
                  <ChevronsLeft /> <span className="mono">−5 s</span>
                </button>
                <button className="transport-btn" onClick={() => seekRelative(-1)} title="Reculer de 1 s (J)" disabled={!videoData}>
                  <span className="mono">−1 s</span>
                </button>
              </div>

              <button className="play-btn" onClick={togglePlayPause} disabled={!videoData} title="Lecture / Pause (Espace)">
                {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
              </button>

              <div className="transport-group">
                <button className="transport-btn" onClick={() => seekRelative(1)} title="Avancer de 1 s (L)" disabled={!videoData}>
                  <span className="mono">+1 s</span>
                </button>
                <button className="transport-btn" onClick={() => seekRelative(5)} title="Avancer de 5 s (→)" disabled={!videoData}>
                  <span className="mono">+5 s</span> <ChevronsRight />
                </button>
                <button className="transport-btn" onClick={() => stepFrame(1)} title="Image suivante (.)" disabled={!videoData}>
                  <span className="mono">+1 img</span> <ChevronRight />
                </button>
              </div>

              <div className="transport-readout">
                <span className="big mono">{formatTime(currentTime)}</span>
                <span className="small mono">image {currentFrame} / {totalFrames}, {formatTime(duration)}</span>
              </div>
            </section>

            {/* Controls */}
            <section className="card controls">
              <div className="control-row">
                <span className="control-label">Timeline</span>
                <div className="timeline-wrap">
                  <div
                    ref={timelineRef}
                    className="timeline"
                    onClick={handleTimelineClick}
                    title="Cliquer pour positionner la tête de lecture"
                  >
                    {loopA !== null && loopB !== null && duration > 0 && (
                      <div
                        className="timeline-loop"
                        style={{ left: `${(loopA / duration) * 100}%`, width: `${Math.max(0.5, ((loopB - loopA) / duration) * 100)}%` }}
                      />
                    )}
                    <div className="timeline-fill" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                    <div className="timeline-needle" style={{ left: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
                    {markers.map((m) => (
                      <div
                        key={m.id}
                        className="timeline-marker"
                        style={{ left: `${duration ? (m.time / duration) * 100 : 0}%` }}
                        title={`${m.label}, ${formatTime(m.time)}`}
                        onClick={(e) => { e.stopPropagation(); handleJumpToTime(m.time); }}
                      />
                    ))}
                  </div>
                  <div className="timeline-labels mono">
                    <span>00:00</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
              </div>

              <div className="control-row">
                <span className="control-label">Vitesse</span>
                <div className="chips">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      className={`chip ${playbackSpeed === s ? 'on' : ''}`}
                      onClick={() => handleSpeedChange(s)}
                    >{s.toFixed(2)}x</button>
                  ))}
                </div>
                <div className="spacer" />
                <input
                  type="range" min="0.10" max="3.00" step="0.05"
                  value={playbackSpeed}
                  onChange={(e) => handleSpeedChange(e.target.value)}
                  className="speed-range"
                  aria-label="Vitesse de lecture"
                />
                <span className="speed-value">{playbackSpeed.toFixed(2)}x</span>
              </div>

              <div className="control-row">
                <span className="control-label">Boucle</span>
                <button className="cue-input" onClick={handleSetCueA} disabled={!videoData} title="Début de boucle (A)">
                  A {loopA !== null ? formatTime(loopA) : '--:--.--'}
                </button>
                <button className="cue-input" onClick={handleSetCueB} disabled={!videoData} title="Fin de boucle (B)">
                  B {loopB !== null ? formatTime(loopB) : '--:--.--'}
                </button>
                <button className={`btn ${isLoopActive ? 'btn-accent' : 'btn-quiet'}`} onClick={toggleLoop} disabled={!videoData}>
                  <Repeat2 /> {isLoopActive ? 'Boucle active' : 'Engager'}
                </button>
                <button className="btn btn-quiet" onClick={clearLoop} disabled={!videoData}>Réinitialiser</button>
              </div>
            </section>
          </div>

          {/* Side panel */}
          <aside className="side-panel" data-view={mobileView}>
            <div className="card panel">
              <div className="tabs">
                <button className={`tab ${activeTab === 'cues' ? 'on' : ''}`} onClick={() => setActiveTab('cues')}>
                  Repères <span className="mono">{markers.length}</span>
                </button>
                <button className={`tab ${activeTab === 'history' ? 'on' : ''}`} onClick={() => setActiveTab('history')}>
                  Historique <span className="mono">{history.length}</span>
                </button>
              </div>

              <div className="panel-body">
                {activeTab === 'cues' ? (
                  <>
                    <div className="panel-head">
                      <span>Instants enregistrés</span>
                      <button className="btn btn-quiet" onClick={handleAddMarker} disabled={!videoData} title="Poser un repère (M)">
                        <Bookmark /> Repère
                      </button>
                    </div>

                    <div className="panel-list">
                      {markers.length === 0 ? (
                        <div className="panel-empty">
                          <Bookmark />
                          <p>Aucun repère pour ce Reel</p>
                          <small>Appuyez sur M pendant la lecture</small>
                        </div>
                      ) : markers.map((m) => (
                        <div className="cue-row" key={m.id}>
                          <button className="cue-time" onClick={() => handleJumpToTime(m.time)} title="Aller à cet instant">
                            {formatTime(m.time)}
                          </button>
                          <input
                            className="cue-label"
                            value={m.label}
                            onChange={(e) => handleUpdateMarkerLabel(m.id, e.target.value)}
                            placeholder="Note…"
                            aria-label="Nom du repère"
                          />
                          <button className="cue-del" onClick={() => handleDeleteMarker(m.id)} title="Supprimer le repère">
                            <Trash2 />
                          </button>
                        </div>
                      ))}
                    </div>

                    {markers.length > 0 && (
                      <div className="panel-foot">
                        <button className="btn btn-quiet" onClick={handleCopyCueSheet}>
                          {copiedCueSheet ? <Check /> : <Copy />}
                          {copiedCueSheet ? 'Copié' : 'Copier la feuille'}
                        </button>
                        <button className="btn btn-quiet" onClick={() => updateMarkers([])}>Tout effacer</button>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="panel-head">
                      <span>Reels récents</span>
                      {history.length > 0 && (
                        <button
                          className="btn btn-quiet"
                          onClick={() => { setHistory([]); try { localStorage.removeItem('instaplaya_history'); } catch { /* ignore */ } }}
                        >Vider</button>
                      )}
                    </div>

                    <div className="panel-list">
                      {history.length === 0 ? (
                        <div className="panel-empty">
                          <Clock />
                          <p>Aucun Reel analysé</p>
                          <small>Les liens collés apparaîtront ici</small>
                        </div>
                      ) : history.map((h) => (
                        <div
                          className="history-row"
                          key={h.id || h.url}
                          onClick={() => { setUrl(h.url); handleLoadVideo(h.url); }}
                        >
                          <div className="history-thumb">
                            {h.thumbnail ? <img src={h.thumbnail} alt="" /> : <Film />}
                          </div>
                          <div className="history-meta">
                            <div className="history-title">{h.title}</div>
                            <div className="history-author">@{h.uploader}</div>
                            <div className="history-date">{h.date}</div>
                          </div>
                          <ArrowUpRight size={15} color="var(--ink-3)" />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>

      {/* Mobile tab bar */}
      <nav className="mobile-nav">
        {navItems.map(({ key, label, icon: Icon, onClick, active }) => (
          <button key={key} className={active ? 'on' : ''} onClick={onClick}>
            <Icon /> <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Toast */}
      {statusNotification && (
        <div className="toast" role="status">{statusNotification}</div>
      )}

      {/* Shortcuts modal */}
      {showShortcuts && (
        <div className="overlay" onClick={() => setShowShortcuts(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-label="Raccourcis clavier" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>Raccourcis clavier</h2>
              <button className="icon-btn" onClick={() => setShowShortcuts(false)} aria-label="Fermer"><X /></button>
            </div>
            <div className="modal-body">
              {[
                ['Lecture / pause', 'Espace ou K'],
                ['Image précédente / suivante', ', / .'],
                ['Reculer / avancer de 1 s', 'J / L'],
                ['Reculer / avancer de 5 s', '← / →'],
                ['Vitesse − / +', '[ / ]'],
                ['Vitesse 1,00x', '0'],
                ['Début A / fin B', 'A / B'],
                ['Boucle A et B', 'R'],
                ['Poser un repère', 'M'],
                ['Picture-in-Picture', 'P'],
                ['Plein écran', 'F'],
                ['Ouvrir cette aide', '?']
              ].map(([label, keys]) => (
                <div className="shortcut" key={label}>
                  <span>{label}</span>
                  <kbd>{keys}</kbd>
                </div>
              ))}
            </div>
            <div className="modal-foot">
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShowShortcuts(false)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
