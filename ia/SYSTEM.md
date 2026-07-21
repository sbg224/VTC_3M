SYSTEM.md

AI Engineering System (AES)

Version : 1.2.0

Statut : 🔒 Gouvernance

Responsable : Développeur

Modification par un agent : Proposition uniquement (validation obligatoire)

Documents liés :

* RULES_OF_ENGAGEMENT.md
* AGENT.md
* WORKFLOW.md
* STANDARDS.md
* CHANGELOG.md
* DECISIONS.md
* AUDIT.md

⸻

1. Mission

L’AI Engineering System (AES) est un référentiel d’ingénierie destiné à encadrer la collaboration entre un développeur et un ou plusieurs agents d’intelligence artificielle.

Son objectif est de fournir une méthode de travail unique, reproductible et indépendante des outils utilisés afin de garantir la qualité, la cohérence et la maintenabilité de tous les projets.

⸻

2. Vision

L’intelligence artificielle est un accélérateur de développement.

Elle assiste le développeur dans l’analyse, la conception, l’implémentation, les tests, la documentation et les audits.

Le développeur reste responsable des décisions et conserve en permanence le contrôle du projet.

Le framework doit pouvoir être utilisé avec n’importe quel agent IA présent ou futur.

⸻

3. Principes fondamentaux

Le fonctionnement de l’AI Engineering System repose sur les principes suivants :

* Le développeur reste le décideur.
* Les agents assistent, analysent, proposent et expliquent.
* La qualité est prioritaire sur la vitesse.
* Le code, la documentation et les décisions évoluent ensemble.
* Les standards sont appliqués de manière systématique.
* Les agents sont interchangeables.

⸻

4. Gouvernance des documents

Le framework distingue trois catégories de documents. Cette taxonomie s’applique aux documents instanciés dans un projet, c’est-à-dire copiés depuis la racine du framework ou depuis `templates/` conformément à INSTALLATION.md.

L’organisation du dépôt reflète trois responsabilités distinctes :

* la racine (SYSTEM.md, CHANGELOG.md, DECISIONS.md, AUDIT.md) documente la gouvernance, l’historique et les décisions du framework AES lui-même (voir §11 « Auto-application ») ;
* `templates/` contient les gabarits copiés dans chaque projet utilisant AES, structurés selon la taxonomie ci-dessous ;
* `docs/` (PHILOSOPHY.md, INSTALLATION.md, UTILISATION.md) explique comment installer et utiliser AES ; ces documents décrivent le framework lui-même plutôt qu’un projet particulier et ne sont donc pas soumis à cette taxonomie.

🔒 Gouvernance

Définissent les règles fondamentales du framework.

Ils évoluent rarement.

Toute modification nécessite une validation du développeur.

🟡 Référence

Décrivent les standards, les méthodes et l’organisation du projet.

Les agents peuvent proposer des mises à jour lorsque cela est pertinent.

🟢 Vivants

Représentent l’état réel du projet.

Ils évoluent régulièrement.

Les agents doivent détecter les mises à jour nécessaires et les proposer au développeur.

Indépendamment de cette classification, quatre documents forment le socle du framework : SYSTEM.md, RULES_OF_ENGAGEMENT.md, WORKFLOW.md et AGENT.md. Ils sont chargés automatiquement dès le début d’une session, quel que soit l’agent (voir INSTALLATION.md §6). Les autres documents restent consultés sélectivement.

⸻

5. Référentiel des identifiants

Afin d’assurer une documentation cohérente et facilement maintenable, le framework utilise des identifiants uniques.

Ces identifiants permettent de référencer les règles, les standards, les audits et les décisions sans dupliquer leur contenu.

Conventions

Préfixe	Description
AES-R	Règle
AES-S	Standard
AES-A	Audit
AES-L	Apprentissage (voir LEARNING.md)
AES-D	Décision propre à la gouvernance du framework AES (voir DECISIONS.md à la racine)
ADR	Architecture Decision Record (décision propre à un projet utilisant AES)

Principes

* Un identifiant est unique.
* Un identifiant n’est jamais renommé.
* Un identifiant n’est jamais réutilisé.
* Le contenu associé peut évoluer sans modifier son identifiant.

⸻

6. Définition de « Documents liés »

Chaque document du framework possède une section « Documents liés ».

Cette liste désigne les documents qu’il est recommandé de consulter afin de comprendre, utiliser, modifier ou faire évoluer correctement le document courant.

Elle constitue un parcours de lecture recommandé, pas un graphe de dépendances formel.

Elle n’implique aucune relation bidirectionnelle obligatoire. Un document peut être référencé par de nombreux autres documents sans devoir tous les référencer en retour.

La nature précise d’une relation (dépendance, impact potentiel, complémentarité), lorsqu’elle mérite d’être précisée, est explicitée en prose dans le document lui-même, pas dans l’intitulé de la liste.

⸻

7. Convention de version

SYSTEM.md porte l’unique numéro de version faisant autorité pour le framework, sous la forme « Version : X.Y.Z ».

Les documents de `templates/` n’ont pas de version propre. Ils portent un champ « Structure : issue d’AES vX.Y.Z », qui indique la version d’AES dont leur structure est originaire.

Ce champ énonce un fait historique, pas une compatibilité continue. Il reste vrai même après que le contenu d’un document vivant (CONTEXT.md, DECISIONS.md, AUDIT.md, LEARNING.md, CHANGELOG.md) a évolué au sein d’un projet et s’est éloigné de son état initial.

Toute évolution du numéro de version d’AES est consignée dans le CHANGELOG.md racine.

⸻

8. Frontière entre le framework et un projet

Une fois les documents copiés dans un projet conformément à INSTALLATION.md, ils appartiennent immédiatement et entièrement à ce projet.

AES ne conserve aucune autorité sur leur contenu après l’installation. Aucune synchronisation automatique n’existe entre un projet et les évolutions ultérieures du framework ; toute mise à jour relève d’une décision explicite du développeur.

Le champ « Structure : issue d’AES vX.Y.Z » (voir §7) constitue uniquement une information de traçabilité. Il permet de comparer, si le développeur le souhaite, l’origine structurelle d’un document à l’état courant du framework. Ce n’est jamais une obligation de mise à jour.

⸻

9. Principe de synchronisation

Le code, la documentation, les décisions techniques et les connaissances doivent évoluer ensemble.

Les agents sont responsables de détecter les impacts d’une modification sur le référentiel et de proposer les mises à jour nécessaires.

Aucune documentation n’est modifiée automatiquement.

Toute modification reste soumise à la validation du développeur.

⸻

10. Objectif du framework

L’AI Engineering System a pour objectif de permettre au développeur de :

* conserver la maîtrise de ses projets ;
* standardiser son processus de développement ;
* collaborer efficacement avec différents agents IA ;
* améliorer en continu la qualité de son code et de sa documentation ;
* développer progressivement son autonomie technique.

⸻

11. Auto-application

AES applique ses propres règles à sa propre gouvernance lorsque cela est pertinent.

Le framework tient, à sa racine, son propre CHANGELOG.md, DECISIONS.md et AUDIT.md, distincts des gabarits homonymes de `templates/` destinés aux projets qui utilisent AES.

Cette auto-application reste partielle. Elle ne s’applique qu’aux documents dont la nature correspond à celle d’un framework documentaire. CONTEXT.md, ARCHITECTURE.md, STACK.md et LEARNING.md ne sont pas dupliqués à la racine, car AES n’a ni contexte métier, ni architecture applicative, ni stack technique au sens où ces gabarits l’entendent.

⸻

12. Références

Ce document fonde la gouvernance du framework. Il est notamment complété par :

* RULES_OF_ENGAGEMENT.md
* AGENT.md
* WORKFLOW.md
* STANDARDS.md
* CHANGELOG.md
* DECISIONS.md
* AUDIT.md

⸻

13. Devise

Le développeur décide. Les agents assistent. Le framework garantit la cohérence.