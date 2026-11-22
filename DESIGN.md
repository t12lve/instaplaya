# Design — InstaPlaya Studio

## Direction contract

**THESIS** — Un poste de travail clair et tactile pour décortiquer un Reel. La scène vidéo 9:16 est le seul élément riche ; autour, le chrome reste silencieux. Refus du tableau de bord « console broadcast » noir, dense et monospace qui était en place.

**OWN-WORLD** — Papier chaud (#F6F6F3), surfaces blanches, encre (#17171B), filets à 8 % d'encre, un seul accent rouge signal (#E63450). Rayons 14 / 10 / 6. Une seule famille sans empattement (Manrope) et un mono pour les mesures (JetBrains Mono). Trois rôles de texte seulement. Aucun dégradé de teinte, aucun glow, aucune ombre colorée, aucun emoji.

**STORY** — On colle un lien, le Reel apparaît cadré comme dans le flux, on lit, on ralentit, on pose des repères. La barre latérale et le rail d'actions se comprennent avant qu'on remarque le style.

**FIRST VIEWPORT** — Rail gauche (marque + navigation) ; en haut une barre de lien pleine largeur avec action principale en encre ; au centre la scène 9:16 dans une carte arrondie avec rail d'actions à droite ; à droite le panneau Repères / Historique. Le bouton lecture est le seul disque plein de l'écran.

**FORM** — Interface Operate : structure issue de l'usage (rail, scène, transport, panneau), pas du monde visuel. Le monde n'apporte que type, palette, densité et un geste signature : la pulsation du repère quand on le pose.

**FINISH** — unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Tokens

| Rôle | Clair | Sombre |
|---|---|---|
| Fond | `#F6F6F3` | `#0E0E10` |
| Surface | `#FFFFFF` | `#18181B` |
| Surface secondaire | `#EFEFEB` | `#222226` |
| Encre | `#17171B` | `#F5F5F3` |
| Secondaire | `#6B6B70` | `#A1A1A6` |
| Muet | `#9A9A9E` | `#6E6E73` |
| Filet | `rgba(23,23,27,.09)` | `rgba(245,245,243,.10)` |
| Accent | `#E63450` | `#FF4D68` |

Espacements : grille de 4 px. 4 / 8 / 12 / 16 / 20 / 24 / 32.
Mouvement : une courbe `cubic-bezier(.2,.8,.2,1)`, 140 ms pour le retour d'action, 320 ms pour l'entrée unique.
