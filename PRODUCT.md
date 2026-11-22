# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Créateurs, danseurs et monteurs qui analysent des Reels Instagram sur ordinateur : ils décortiquent un mouvement image par image, ralentissent un geste et bouclent un passage.

## Product Purpose

InstaPlaya extrait un Reel et offre une lecture de précision : navigation à l'image, vitesse calibrée, boucle A-B et repères horodatés. Le succès se mesure au temps gagné pour comprendre un mouvement.

## Positioning

Un lecteur de précision intégré à un flux de travail de création, avec repères persistants par vidéo et raccourcis clavier complets — pas un simple lecteur web.

## Operating Context

Utilisation à un bureau, en journée, sur navigateur. Les liens sont collés depuis le presse-papiers. Les repères et l'historique vivent dans le stockage local du navigateur. Le backend Python expose `/api/extract` et `/api/download`.

## Capabilities and Constraints

- Extraction d'un lien Instagram Reel via `/api/extract`
- Lecture, pause, saut ±1 s / ±5 s, pas à pas ±1 image (0,04 s à 25 fps)
- Vitesse de 0,10x à 3,00x (préréglages + curseur)
- Boucle A-B avec zones visibles sur la timeline
- Repères horodatés annotés, sauvegardés par identifiant de vidéo
- Zoom 1x–3x, rotation 90°, mute, Picture-in-Picture, plein écran
- Téléchargement MP4, historique local (30 entrées), raccourcis clavier
- Stack existante : React 19, Vite 6, Tailwind 4, lucide-react. Aucune dépendance à ajouter.

## Brand Commitments

Nom : InstaPlaya. Interface en français. Identité visuelle redéfinie dans DESIGN.md (décision de cette session).

## Evidence on Hand

README.md (fonctionnalités et raccourcis), `frontend/src/App.jsx` (comportement actuel), `app.py` (API backend).

## Product Principles

1. La précision d'abord : chaque action de lecture dit son résultat (timecode, image, vitesse).
2. Le geste minimal : coller, lire, marquer.
3. L'état toujours lisible : ce qui est actif, en boucle ou enregistré se voit immédiatement.
4. Rien ne se perd : repères et historique persistent localement.

## Accessibility & Inclusion

Raccourcis clavier documentés, focus visible, respect de `prefers-reduced-motion`, cibles tactiles ≥ 44 px sur mobile.

> Note : ce dossier est déduit du brief et du code existant. Aucune entrevue utilisateur n'a eu lieu car l'objectif de la session demande d'exécuter sans poser de question.
