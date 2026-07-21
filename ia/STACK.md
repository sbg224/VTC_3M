STACK.md

AI Engineering System (AES)

Structure : issue d’AES v1.1.0

Statut : 🟡 Référence

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* SYSTEM.md
* STANDARDS.md
* ARCHITECTURE.md
* CONTEXT.md
* DECISIONS.md

⸻

1. Objectif

Ce document recense l’ensemble des technologies, bibliothèques, frameworks, services et outils utilisés par le projet.

Il explique leur rôle, leur justification et leur périmètre d’utilisation.

Il constitue la référence technique de la stack du projet.

⸻

2. Organisation

Chaque technologie documentée suit la même structure.

Nom

Nom officiel de la technologie.

Catégorie

Exemples :

* Langage
* Framework
* Bibliothèque
* Base de données
* API
* Service
* Outil
* Infrastructure
* DevOps
* Tests

Rôle

Quel problème cette technologie résout-elle ?

Justification

Pourquoi ce choix a-t-il été retenu ?

Utilisation

Dans quelles parties du projet est-elle utilisée ?

Alternatives

Quelles solutions auraient pu être retenues ?

Documentation officielle

Lien vers la documentation officielle.

⸻

3. Règles

Chaque technologie utilisée dans le projet doit être documentée.

L’ajout d’une nouvelle dépendance doit entraîner une proposition de mise à jour de ce document.

Les technologies obsolètes doivent être retirées lorsqu’elles ne sont plus utilisées.

⸻

4. Contenu attendu

Le document peut notamment contenir :

* les langages ;
* les frameworks ;
* les bibliothèques ;
* les API externes ;
* les bases de données ;
* les outils de développement ;
* les outils DevOps ;
* les services cloud ;
* les solutions d’authentification ;
* les solutions de paiement ;
* les outils de tests ;
* les outils d’observabilité.

⸻

5. Exemple de fiche

Nom

TypeScript

Catégorie

Langage

Rôle

Ajouter un typage statique au projet.

Justification

Améliorer la robustesse du code, détecter les erreurs plus tôt et faciliter la maintenance.

Utilisation

Frontend et Backend.

Alternatives

JavaScript.

Documentation officielle

https://www.typescriptlang.org/

⸻

6. Références

Ce document s’appuie sur :

* SYSTEM.md
* STANDARDS.md
* ARCHITECTURE.md
* CONTEXT.md
* DECISIONS.md

Un choix de technologie découle souvent d’une décision documentée dans DECISIONS.md ; à l’inverse, une décision peut entraîner une mise à jour de ce document.

Il permet aux agents et aux développeurs de comprendre rapidement l’environnement technique du projet.