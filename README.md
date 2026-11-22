# InstaPlaya

Lecteur de précision pour Reels et vidéos Instagram sur ordinateur.

L'interface est une application React : lecture image par image, vitesse calibrée, boucle A-B et repères horodatés. Un court bandeau en haut rappelle le but de l'outil.

## Utiliser l'application

Trois façons de charger une vidéo :

1. **Importer un fichier** : bouton *Importer une vidéo*, ou glisser-déposer un MP4, WebM ou MOV sur la scène.
2. **Lien vidéo direct** : coller une URL se terminant par `.mp4`, `.webm`, `.ogg`, `.mov` ou `.m4v`, puis *Charger*.
3. **Lien Instagram** : coller `https://www.instagram.com/reel/…`. Cette option demande le serveur local (voir ci-dessous).

Les repères et l'historique sont conservés dans le navigateur.

## Fonctionnalités

- Navigation à l'image près (0,04 s à 25 fps), sauts ±1 s et ±5 s
- Vitesse de 0,10x à 3,00x (préréglages et curseur)
- Boucle A-B avec zone visible sur la timeline
- Repères annotés, sauvegardés par vidéo
- Zoom 1x à 3x, rotation 90°, mute, Picture-in-Picture, plein écran
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

## Développement local

Le backend Python fournit l'extraction Instagram et le téléchargement MP4.

```bash
cd frontend
npm install
npm run dev
```

Dans un autre terminal :

```bash
python app.py
```

L'application est alors disponible sur `http://localhost:8080`. Le serveur Vite (`http://localhost:3000`) proxifie `/api` vers le backend.

Construire les fichiers statiques dans `static/` :

```bash
cd frontend
npm run build
```

## GitHub Pages

Le site publié est l'application elle-même, en mode statique. Le workflow `.github/workflows/deploy.yml` construit `frontend/` et publie `static/` via l'action officielle GitHub Pages.

1. Créer le dépôt puis pousser sur `main`.
2. Dans *Settings → Pages → Build and deployment*, choisir **GitHub Actions**.
3. Attendre la fin du workflow *Deploy to GitHub Pages*.

Le chemin des assets est relatif (`base: './'`), donc l'application fonctionne aussi bien à la racine que sur `https://<utilisateur>.github.io/<dépôt>/`. Le fichier `.nojekyll` est copié dans `static/` pour éviter tout traitement Jekyll.

Sur Pages, l'extraction Instagram et le téléchargement MP4 ne sont pas disponibles : le bouton de téléchargement est masqué et le champ accepte un lien vidéo direct. En local avec `app.py`, ces deux fonctions restent actives.
