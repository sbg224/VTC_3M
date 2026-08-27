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

⸻

AES-L002 — Une copie périmée du dépôt a été prise pour la copie de travail

Date

2026-08-27 12:05

Contexte

Le chantier des modales légales a été implémenté en totalité dans `~/Documents/workespace/01_PROJECTS/AHADI-SERVICES/07-Site-Web/ahadi-vtc`, répertoire de travail de la session, avant de découvrir que la copie de travail réelle du projet est `~/Projects/ahadi-vtc`.

Observation

Les deux répertoires sont des dépôts Git distincts, sur la même branche `chore/env-supabase-migration`, avec le même `remote`. Rien dans le répertoire lui-même ne signalait qu’il était périmé : arborescence complète, `node_modules` installé, historique Git plausible. La copie `Documents` accusait 9 commits de retard et portait, sous forme de modifications non commitées, une version antérieure d’un travail déjà committé et poussé depuis l’autre copie.

L’écart n’est apparu qu’à l’étape 9 du WORKFLOW, lors du `git status` de clôture, qui a révélé 42 fichiers modifiés sans rapport avec la tâche en cours. Le `git log` de la copie périmée était cohérent avec lui-même : seule sa comparaison avec l’autre copie a permis de trancher.

C’est le deuxième incident du même type. Le premier avait conduit à une migration accidentelle sur Supabase.

Enseignement

Un répertoire de projet complet et un historique Git cohérent ne prouvent pas qu’il s’agit de la copie de travail courante. Le CLAUDE.md du poste énonce que le code source vit dans `~/Projects/` et que `01_PROJECTS` ne contient que notes et assets : l’information existait, mais n’a pas été confrontée au répertoire de travail effectif au démarrage.

Attendre la clôture pour faire ce constat coûte l’intégralité du travail d’implémentation.

Recommandation

En début de session, avant toute lecture de code orientée implémentation, exécuter systématiquement — pas seulement en cas de doute :

```
pwd
git log --oneline -3
git status -sb
```

et confronter le résultat à trois éléments : le chemin annoncé par le CLAUDE.md du poste, le dernier commit attendu par le développeur, et la propreté de l’arbre. Un arbre portant des modifications non commitées sans rapport avec la tâche demandée, ou un dernier commit antérieur à ce que le développeur décrit, doit interrompre la session et être signalé avant tout codage.

Références

Voir AES-L003, issu du même chantier.

⸻

AES-L003 — Une initiative hors du plan validé a introduit un défaut

Date

2026-08-27 12:05

Contexte

Le plan validé prévoyait que les liens légaux ouvrent une modale tout en restant des `<a href>` réels. Pendant l’implémentation, une garde non prévue a été ajoutée dans `LegalLink` : `if (pathname === doc.path) return;`, afin d’éviter d’afficher une modale par-dessus la page identique.

Observation

Cette garde rendait le lien inerte sur sa propre page. Le développeur, arrivé sur `/cgu`, a cliqué sur « CGU » dans le pied de page et n’a rien vu se produire, concluant que les CGU seules n’avaient pas reçu le traitement des deux autres documents.

Le défaut était en réalité symétrique : chaque document échouait sur sa propre page. Il a fallu une matrice de reproduction pour l’établir, et le diagnostic est parti d’une piste fausse.

La garde était documentée par un commentaire dans le code, mais n’avait jamais été soumise. Elle n’apparaissait ni dans le plan validé, ni dans le compte rendu d’implémentation. Les huit tests écrits pour le chantier ne la couvraient pas : ils partaient tous de l’accueil, jamais d’une page légale — un angle mort qui reproduit celui de l’implémentation, puisque le même agent a écrit les deux.

Enseignement

Une amélioration apparemment évidente et de portée locale reste une décision de comportement. Elle échappe à la revue précisément parce qu’elle paraît trop mineure pour être signalée, et le développeur ne peut pas la contester puisqu’il en ignore l’existence.

Le risque est aggravé lorsque l’agent écrit aussi les tests : une initiative non signalée produit un angle mort cohérent entre le code et sa vérification.

Recommandation

Le plan validé délimite le périmètre de l’implémentation. Toute addition qui n’y figure pas — y compris un ajustement de comportement de quelques lignes — est signalée avant application, et non documentée après coup. En cours d’implémentation, la formulation « tant qu’à faire, autant éviter que… » doit déclencher une demande de validation, pas un commit.

Lorsqu’un écart au plan est malgré tout jugé nécessaire, il figure explicitement dans le compte rendu de fin de tâche, au même titre que les modifications prévues.

Références

Voir AES-L002, issu du même chantier. Cet apprentissage a donné lieu à la règle AES-R015 (RULES_OF_ENGAGEMENT.md).
