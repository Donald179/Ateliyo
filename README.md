# Ateliyo

Application de démonstration statique pour la gestion d'un atelier de couture, réalisée en HTML, CSS et JavaScript. Chaque rubrique dispose de sa propre page HTML et peut être publiée avec GitHub Pages, sans PHP ni base de données.

## Lancer le projet

Ouvrez `index.html` dans un navigateur, ou publiez le dépôt avec GitHub Pages depuis **Settings → Pages** en choisissant la branche et le dossier racine.

Pages disponibles : `index.html`, `commandes.html`, `clients.html`, `mensurations.html`, `personnel.html`, `revenus.html`, `rapports.html` et `parametres.html`.

## Données de démonstration

Les exemples fictifs sont définis dans `demo-data.js` et chargés au premier lancement. Les ajouts et modifications sont conservés dans le stockage local du navigateur. Le bouton de réinitialisation recharge le jeu de données initial.

## Limites importantes

Cette version est conçue pour une démonstration et un usage local sur un seul navigateur. Elle ne fournit ni authentification, ni base de données partagée, ni sauvegarde en ligne. Ne saisissez pas de données personnelles ou confidentielles. Les utilisateurs d'un site public peuvent consulter le code et les données incluses dans le dépôt.

## Fonctionnalités

- Tableau de bord et indicateurs de l'atelier
- Gestion des clients, commandes, paiements et statuts
- Fiches de mensurations et gestion du personnel
- Mode sombre mémorisé sur les différentes pages
- Avancement des commandes : En attente → En coupe → En couture → Essayage → Livré
- Suivi des revenus, filtres et export CSV
- Paramètres de l'atelier sauvegardés localement
