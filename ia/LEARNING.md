LEARNING.md

AI Engineering System (AES)

Structure : issue d’AES v1.1.0

Statut : 🟢 Vivant

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* AUDIT.md
* DECISIONS.md
* CHANGELOG.md
* CONTEXT.md

⸻

1. Objectif

Ce document conserve les enseignements tirés du projet.

Il centralise les connaissances acquises au cours du développement afin d’améliorer les pratiques et d’éviter de reproduire les mêmes erreurs.

⸻

2. Organisation

Chaque apprentissage reçoit un identifiant unique.

Exemple :

* AES-L001
* AES-L002
* AES-L003

Les identifiants ne sont jamais réutilisés.

⸻

3. Structure d’un apprentissage

Chaque entrée doit contenir au minimum :

Identifiant

Exemple :

AES-L001

Date

Date et heure de validation, au format AAAA-MM-JJ HH:MM, pour identifier chaque apprentissage de façon unique et chronologique.

Contexte

Situation ayant conduit à cet apprentissage.

Observation

Ce qui a été constaté.

Enseignement

Ce qui a été appris.

Recommandation

Bonne pratique à appliquer à l’avenir.

Références

Documents, audits ou décisions associés lorsque cela est pertinent.

⸻

4. Bonnes pratiques

Les apprentissages doivent être :

* concrets ;
* vérifiables lorsque cela est possible ;
* utiles pour les développements futurs.

Ils ne doivent pas décrire un simple événement, mais une connaissance réutilisable.

⸻

5. Évolution

Les apprentissages restent conservés afin de constituer une mémoire du projet.

Si un enseignement devient obsolète, il est mis à jour ou complété plutôt que supprimé.

⸻

6. Références

Ce document s’appuie sur AUDIT.md, DECISIONS.md, CHANGELOG.md et CONTEXT.md.

Les apprentissages peuvent également provenir de :

* retours d’expérience ;
* incidents ;
* améliorations réalisées.

Ils peuvent conduire à des évolutions des standards, du workflow ou de l’architecture lorsque cela est justifié.

⸻

7. Apprentissages

AES-L001 — Cypress échoue depuis une session d’agent lancée dans VS Code

Date

2026-08-27 11:46

Contexte

Lors du chantier des modales légales, l’exécution de `npx cypress run` et `npx cypress verify` depuis la session d’agent a échoué, alors que la suite Cypress du projet est fonctionnelle.

Observation

Deux symptômes apparemment distincts : `bad option: --smoke-test` pour `verify`, et `Cannot find module '.../Cypress.app/Contents/MacOS/Contents/Resources/app/index.js'` — un chemin doublé — pour `run`.

Le binaire a d’abord été soupçonné d’être corrompu. L’examen l’a démenti : Mach-O arm64 valide lié à `Electron Framework`, signature vérifiée par `codesign -v --deep --strict`, et `Contents/Resources/app/index.js` bien présent. La chaîne « bad option » est absente du binaire : le message venait de Node, pas de Cypress.

La cause réelle est la variable `ELECTRON_RUN_AS_NODE=1`, absente de tout fichier de profil mais héritée de la chaîne de processus `Code` → `Code Helper (Plugin)` → `claude` → shell. VS Code la pose pour réutiliser son propre Electron comme runtime Node. Cypress étant une application Electron, son binaire démarre alors en Node simple : Node rejette les options Electron, et résout l’entrée de l’application relativement au répertoire courant.

Enseignement

Un outil peut être parfaitement installé et échouer à cause d’une variable d’environnement héritée, invisible dans les fichiers de configuration du projet comme dans ceux du shell. Un message d’erreur évoquant un fichier introuvable ne prouve pas que le fichier manque : ici il était présent, seul le chemin calculé était faux.

Recommandation

Avant de conclure à une installation corrompue et de relancer un téléchargement lourd, vérifier trois choses : que le fichier incriminé existe réellement, que le message d’erreur provient bien du binaire mis en cause (`strings`), et que l’environnement hérité ne contient pas de variable interférente (`env`, puis la chaîne des processus parents).

Pour ce projet, les scripts `cy:open`, `cy:run` et `test:e2e` de `frontend/package.json` sont préfixés par `env -u ELECTRON_RUN_AS_NODE`. Le contournement vaut pour tout outil Electron lancé depuis une session d’agent.

Références

Aucune décision ni audit associé.
