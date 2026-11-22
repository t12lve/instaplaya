# InstaPlaya

Studio de lecture précise pour Reels et vidéos Instagram sur ordinateur.

Le dépôt contient deux choses :
- `frontend/` : l'application React, à lancer en local avec le serveur Python.
- `frontend/src/landing.jsx` : la page de présentation React publiée sur GitHub Pages. Les sections se dévoilent au scroll dans le même système visuel.

## GitHub Pages

https://t12lve.github.io/instaplaya/

Cette page présente le principe de l'outil. Elle est construite en React depuis `frontend/src/landing.jsx` et révèle chaque section au scroll. Elle ne contient pas l'application : l'extraction d'un Reel nécessite un serveur local. Le workflow `.github/workflows/deploy.yml` construit et publie `landing-dist/` à chaque push sur `main`.

## Lancer l'application

Sous Windows, double-cliquer sur `run.bat`. Le script installe les dépendances si besoin, construit l'application puis démarre le serveur sur http://localhost:8080.

En ligne de commande :

```bash
cd frontend
npm install
npm run build
cd ..
python app.py
```

Prérequis : Python avec FastAPI, yt-dlp, httpx et uvicorn, plus Node.js.

## Utilisation

Trois façons de charger une vidéo :

1. Importer un fichier MP4, WebM ou MOV, ou le glisser-déposer sur la scène.
2. Coller un lien vidéo direct se terminant par `.mp4`, `.webm`, `.ogg`, `.mov` ou `.m4v`.
3. Coller un lien Instagram `https://www.instagram.com/reel/…` avec le serveur local actif.

Les repères et l'historique sont conservés dans le navigateur.

## Fonctionnalités

- Navigation à l'image près (0,04 s à 25 fps), sauts ±1 s et ±5 s
- Vitesse de 0,10x à 3,00x, préréglages et curseur
- Boucle A-B avec zone visible sur la timeline
- Repères annotés, sauvegardés par vidéo
- Zoom 1x à 3x, rotation 90°, Picture-in-Picture, plein écran
- Thème clair et sombre, raccourcis clavier complets

## Raccourcis clavier

| Touche | Action |
|---|---|
| `Espace` ou `K` | Lecture / pause |
| `←` / `→` | Reculer / avancer de 5 s |
| `J` / `L` | Reculer / avancer de 1 s |
| `,` / `.` | Reculer / avancer d'une image |
| `[` / `]` | Vitesse − / + |
| `0` | Vitesse 1,0x |
| `A` / `B` | Points A / B de la boucle |
| `R` | Boucle A-B |
| `M` | Poser un repère |
| `P` | Picture-in-Picture |
| `F` | Plein écran |
| `?` | Aide |

## Dépôt

https://github.com/t12lve/instaplaya
